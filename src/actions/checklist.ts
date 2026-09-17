"use server";

import { db } from "../db";
import { tasks, taskWork, shiftSession, users, branches } from "../db/schema";
import { eq, and, gte, lte, desc, asc, inArray, sql } from "drizzle-orm";
import { ShiftSession, ShiftType, ChecklistItem } from "../types";

// Helper functions (internal to this file, not exported)
function mapPositionToTaskRole(pos: string): "cashier" | "stock" | "manager_assistant" {
  if (pos.includes("แคชเชียร์") || pos.includes("cashier")) return "cashier";
  if (pos.includes("สต็อก") || pos.includes("stock")) return "stock";
  if (pos.includes("ผู้ช่วย") || pos.includes("assistant")) return "manager_assistant";
  return "cashier";
}

function mapShiftToDbShift(shift: ShiftType): "morning" | "afternoon" | "morning_afternoon" {
  if (shift === "morning") return "morning";
  if (shift === "afternoon") return "afternoon";
  return "morning_afternoon";
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Get or create a shift session in Supabase PostgreSQL
 */
export async function getOrCreateShiftSessionAction(params: {
  userId: string;
  userName: string;
  position: string;
  shift: ShiftType;
}): Promise<{ success: boolean; session?: ShiftSession; error?: string }> {
  try {
    const { userId, userName, position, shift } = params;
    const taskRole = mapPositionToTaskRole(position);
    const dbShift = mapShiftToDbShift(shift);

    // Ensure valid user ID from DB
    let validUserId = userId;
    if (!isValidUuid(userId)) {
      const targetRole = taskRole === "manager_assistant" ? "manager_assistant" : "employee";
      const [foundUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, targetRole))
        .limit(1);
      if (foundUser) {
        validUserId = foundUser.id;
      } else {
        const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
        if (anyUser) validUserId = anyUser.id;
        else return { success: false, error: "ไม่พบบัญชีผู้ใช้ในฐานข้อมูล" };
      }
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Find branch and its authorized tasks for this user
    const branchForUser = await db
      .select({ id: branches.id, name: branches.name, tasks: branches.tasks })
      .from(branches)
      .where(sql`${validUserId} = ANY(${branches.members})`)
      .limit(1);

    let branchId: string;
    let branchNameForSession: string;
    let branchTaskIds: string[] = [];

    if (branchForUser.length > 0) {
      branchId = branchForUser[0].id;
      branchNameForSession = branchForUser[0].name;
      branchTaskIds = branchForUser[0].tasks || [];
    } else {
      const [anyBranch] = await db.select({ id: branches.id, name: branches.name, tasks: branches.tasks }).from(branches).limit(1);
      if (anyBranch) {
        branchId = anyBranch.id;
        branchNameForSession = anyBranch.name;
        branchTaskIds = anyBranch.tasks || [];
      } else {
        return { success: false, error: "กรุณาสร้างสาขาอย่างน้อย 1 สาขาก่อนเริ่มกะ" };
      }
    }

    const allowedShifts: ("morning" | "afternoon" | "morning_afternoon")[] =
      dbShift === "morning_afternoon"
        ? ["morning", "afternoon", "morning_afternoon"]
        : [dbShift, "morning_afternoon"];

    let dbTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.task_role, taskRole),
          inArray(tasks.shift, allowedShifts),
          eq(tasks.disabled, false)
        )
      )
      .orderBy(asc(tasks.start));

    // Apply branch task filter
    if (branchTaskIds.length > 0) {
      dbTasks = dbTasks.filter((t) => branchTaskIds.includes(t.id));
    } else {
      dbTasks = [];
    }

    // Check if session already exists today for this role and shift
    const [existingSession] = await db
      .select()
      .from(shiftSession)
      .where(
        and(
          eq(shiftSession.task_role, taskRole),
          eq(shiftSession.shift, dbShift),
          gte(shiftSession.start, startOfDay),
          lte(shiftSession.start, endOfDay)
        )
      )
      .orderBy(desc(shiftSession.start))
      .limit(1);

    let activeDbSession = existingSession;
    let workRows: Array<typeof taskWork.$inferSelect> = [];

    if (!activeDbSession) {
      // branchId is already acquired above
      // Create new shift_session
      const [newSession] = await db
        .insert(shiftSession)
        .values({
          user: validUserId,
          branch: branchId,
          task_role: taskRole,
          shift: dbShift,
          start: new Date(),
        })
        .returning();

      activeDbSession = newSession;

      // Create task_work rows for each task
      if (dbTasks.length > 0) {
        const inserts = dbTasks.map((t) => ({
          task: t.id,
          user: validUserId,
          shift_session: newSession.id,
          timestamp: null,
        }));
        workRows = await db.insert(taskWork).values(inserts).returning();
      }
    } else {
      // Fetch existing task_work rows
      workRows = await db
        .select()
        .from(taskWork)
        .where(eq(taskWork.shift_session, activeDbSession.id));

      // If any task is missing from task_work, insert it
      const existingTaskIds = new Set(workRows.map((w) => w.task));
      const missingTasks = dbTasks.filter((t) => !existingTaskIds.has(t.id));
      if (missingTasks.length > 0) {
        const missingInserts = missingTasks.map((t) => ({
          task: t.id,
          user: validUserId,
          shift_session: activeDbSession.id,
          timestamp: null,
        }));
        const addedWorks = await db.insert(taskWork).values(missingInserts).returning();
        workRows = [...workRows, ...addedWorks];
      }
    }

    // Build ChecklistItems
    const items: ChecklistItem[] = dbTasks.map((t) => {
      const work = workRows.find((w) => w.task === t.id);
      const timeRange = t.start && t.end ? `${t.start.slice(0, 5)} - ${t.end.slice(0, 5)}` : undefined;
      let isLate = false;
      if (work?.timestamp && t.end) {
        const completedDate = new Date(work.timestamp);
        const [endHour, endMinute] = t.end.split(':').map(Number);

        // Use activeDbSession.start as the reference day to determine if it was done on the same shift day.
        const deadlineDate = new Date(activeDbSession!.start);
        deadlineDate.setHours(endHour, endMinute, 0, 0);

        if (completedDate > deadlineDate) {
          isLate = true;
        }
      }

      return {
        id: t.id,
        label: t.name,
        category: timeRange ? `ช่วงเวลา ${timeRange}` : undefined,
        completedAt: work?.timestamp ? new Date(work.timestamp).toISOString() : null,
        taskWorkId: work?.id,
        isLate,
      };
    });

    const isAllComplete = items.length > 0 && items.every((i) => i.completedAt !== null);

    const sessionObj: ShiftSession = {
      id: activeDbSession.id,
      userId: validUserId,
      userName: userName,
      userPosition: position,
      shift: shift,
      startedAt: new Date(activeDbSession.start).toISOString(),
      completedAt: activeDbSession.end ? new Date(activeDbSession.end).toISOString() : null,
      items,
      notified: isAllComplete,
      branchName: branchNameForSession,
    };

    return { success: true, session: sessionObj };
  } catch (err: any) {
    console.error("getOrCreateShiftSessionAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลเช็คลิสต์" };
  }
}

export async function toggleTaskWorkAction(params: {
  taskWorkId?: string;
  shiftSessionId?: string;
  taskId?: string;
  userId?: string;
  completed: boolean;
}): Promise<{ success: boolean; completedAt?: string | null; error?: string }> {
  try {
    const { taskWorkId, shiftSessionId, taskId, userId, completed } = params;
    const completedAt = completed ? new Date() : null;

    let targetShiftSessionId = shiftSessionId;

    if (taskWorkId && isValidUuid(taskWorkId)) {
      await db
        .update(taskWork)
        .set({ timestamp: completedAt })
        .where(eq(taskWork.id, taskWorkId));

      if (!targetShiftSessionId) {
        const [work] = await db.select({ shift_session: taskWork.shift_session }).from(taskWork).where(eq(taskWork.id, taskWorkId)).limit(1);
        if (work) {
          targetShiftSessionId = work.shift_session;
        }
      }
    } else if (shiftSessionId && taskId && isValidUuid(shiftSessionId) && isValidUuid(taskId)) {
      const [existing] = await db
        .select({ id: taskWork.id })
        .from(taskWork)
        .where(
          and(
            eq(taskWork.shift_session, shiftSessionId),
            eq(taskWork.task, taskId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(taskWork)
          .set({ timestamp: completedAt })
          .where(eq(taskWork.id, existing.id));
      } else if (userId && isValidUuid(userId)) {
        await db.insert(taskWork).values({
          shift_session: shiftSessionId,
          task: taskId,
          user: userId,
          timestamp: completedAt,
        });
      }
    } else {
      return { success: false, error: "ข้อมูลระบุรายการไม่ถูกต้อง" };
    }

    if (targetShiftSessionId && isValidUuid(targetShiftSessionId)) {
      // Find branch and update last_update
      const [sess] = await db.select({ branch: shiftSession.branch }).from(shiftSession).where(eq(shiftSession.id, targetShiftSessionId)).limit(1);
      if (sess && sess.branch) {
        await db.update(branches).set({ last_update: new Date() }).where(eq(branches.id, sess.branch));
      }
    }

    return { success: true, completedAt: completedAt ? completedAt.toISOString() : null };
  } catch (err: any) {
    console.error("toggleTaskWorkAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการบันทึกสถานะงาน" };
  }
}

/**
 * End a shift session in Supabase (sets end_timestamp)
 */
export async function endShiftSessionAction(shiftSessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidUuid(shiftSessionId)) {
      return { success: false, error: "ID ของกะไม่ถูกต้อง" };
    }

    await db
      .update(shiftSession)
      .set({
        end: new Date(),
      })
      .where(eq(shiftSession.id, shiftSessionId));

    return { success: true };
  } catch (err: any) {
    console.error("endShiftSessionAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการจบกะ" };
  }
}

/**
 * Get shift statuses for a specific position today from Supabase PostgreSQL
 */
export async function getPositionShiftsStatusAction(position: string): Promise<{
  success: boolean;
  statuses?: Record<ShiftType, { status: "completed" | "incomplete" | "none"; total: number; done: number }>;
  error?: string;
}> {
  try {
    const taskRole = mapPositionToTaskRole(position);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Fetch today's sessions for this taskRole
    const todaySessions = await db
      .select()
      .from(shiftSession)
      .where(
        and(
          eq(shiftSession.task_role, taskRole),
          gte(shiftSession.start, startOfDay),
          lte(shiftSession.start, endOfDay)
        )
      )
      .orderBy(desc(shiftSession.start));

    const result: Record<ShiftType, { status: "completed" | "incomplete" | "none"; total: number; done: number }> = {
      morning: { status: "none", total: 0, done: 0 },
      afternoon: { status: "none", total: 0, done: 0 },
      both: { status: "none", total: 0, done: 0 },
    };

    const shiftMap: Record<"morning" | "afternoon" | "morning_afternoon", ShiftType> = {
      morning: "morning",
      afternoon: "afternoon",
      morning_afternoon: "both",
    };

    const sessionIds = todaySessions.map((s) => s.id);
    let allWorks: Array<typeof taskWork.$inferSelect> = [];
    if (sessionIds.length > 0) {
      allWorks = await db
        .select()
        .from(taskWork)
        .where(inArray(taskWork.shift_session, sessionIds));
    }

    for (const [dbShift, uiShift] of Object.entries(shiftMap) as Array<["morning" | "afternoon" | "morning_afternoon", ShiftType]>) {
      const sess = todaySessions.find((s) => s.shift === dbShift);
      if (!sess) continue;

      const works = allWorks.filter((w) => w.shift_session === sess.id);
      const total = works.length;
      const done = works.filter((w) => w.timestamp !== null).length;
      const isAllDone = total > 0 && done === total;
      const hasActivity = done > 0 || sess.end !== null;

      result[uiShift] = {
        status: !hasActivity ? "none" : isAllDone ? "completed" : "incomplete",
        total,
        done,
      };
    }

    return { success: true, statuses: result };
  } catch (err: any) {
    console.error("getPositionShiftsStatusAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการโหลดสถานะกะ" };
  }
}

/**
 * Reset today's shift_session and task_work rows from Supabase DB for testing
 */
export async function resetTodayChecklistDataAction(position?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const conditions = [
      gte(shiftSession.start, startOfDay),
      lte(shiftSession.start, endOfDay),
    ];

    if (position) {
      const taskRole = mapPositionToTaskRole(position);
      conditions.push(eq(shiftSession.task_role, taskRole));
    }

    const sessionsToDelete = await db
      .select({ id: shiftSession.id })
      .from(shiftSession)
      .where(and(...conditions));

    const sessionIds = sessionsToDelete.map((s) => s.id);

    if (sessionIds.length > 0) {
      await db.delete(taskWork).where(inArray(taskWork.shift_session, sessionIds));
      await db.delete(shiftSession).where(inArray(shiftSession.id, sessionIds));
    }

    return { success: true };
  } catch (err: any) {
    console.error("resetTodayChecklistDataAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล" };
  }
}
