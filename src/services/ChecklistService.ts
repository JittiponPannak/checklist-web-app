import { eq, and, gte, lte, desc, asc, inArray, sql } from "drizzle-orm";
import { tasks, taskWork, shiftSession, users, branches } from "../db/schema";
import { IChecklistService, INotificationService } from "./types";
import { ShiftSession, ShiftType, ChecklistItem } from "../types";

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

function getThaiStartAndEndOfDay(baseDate = new Date()) {
  const yElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric" }).format(baseDate);
  const mElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", month: "2-digit" }).format(baseDate);
  const dElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", day: "2-digit" }).format(baseDate);

  const startStr = `${yElement}-${mElement}-${dElement}T00:00:00+07:00`;
  const endStr = `${yElement}-${mElement}-${dElement}T23:59:59.999+07:00`;

  return {
    startOfDay: new Date(startStr),
    endOfDay: new Date(endStr),
  };
}

export class ChecklistService implements IChecklistService {
  constructor(private db: any, private notificationService?: INotificationService) {}

  async getOrCreateShiftSession(params: {
    userId: string;
    userName: string;
    position: string;
    shift: ShiftType;
  }): Promise<{ success: boolean; session?: ShiftSession; error?: string }> {
    try {
      const { userId, userName, position, shift } = params;
      const taskRole = mapPositionToTaskRole(position);
      const dbShift = mapShiftToDbShift(shift);

      let validUserId = userId;
      if (!isValidUuid(userId)) {
        const targetRole = taskRole === "manager_assistant" ? "manager_assistant" : "employee";
        const [foundUser] = await this.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, targetRole))
          .limit(1);
        if (foundUser) {
          validUserId = foundUser.id;
        } else {
          const [anyUser] = await this.db.select({ id: users.id }).from(users).limit(1);
          if (anyUser) validUserId = anyUser.id;
          else return { success: false, error: "ไม่พบบัญชีผู้ใช้ในฐานข้อมูล" };
        }
      }

      const { startOfDay, endOfDay } = getThaiStartAndEndOfDay();

      const branchForUser = await this.db
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
        const [anyBranch] = await this.db
          .select({ id: branches.id, name: branches.name, tasks: branches.tasks })
          .from(branches)
          .limit(1);
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

      let dbTasks = await this.db
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

      if (branchTaskIds.length > 0) {
        dbTasks = dbTasks.filter((t: any) => branchTaskIds.includes(t.id));
      } else {
        dbTasks = [];
      }

      const [existingSession] = await this.db
        .select()
        .from(shiftSession)
        .where(
          and(
            eq(shiftSession.task_role, taskRole),
            eq(shiftSession.shift, dbShift),
            gte(shiftSession.start, startOfDay),
            lte(shiftSession.start, endOfDay),
            eq(shiftSession.branch, branchId),
            eq(shiftSession.user, validUserId)
          )
        )
        .orderBy(desc(shiftSession.start))
        .limit(1);

      let activeDbSession = existingSession;
      let workRows: any[] = [];

      if (!activeDbSession) {
        const [newSession] = await this.db
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

        if (dbTasks.length > 0) {
          const inserts = dbTasks.map((t: any) => ({
            task: t.id,
            shift_session: newSession.id,
            timestamp: null,
          }));
          workRows = await this.db.insert(taskWork).values(inserts).returning();
        }
      } else {
        workRows = await this.db
          .select()
          .from(taskWork)
          .where(eq(taskWork.shift_session, activeDbSession.id));

        const existingTaskIds = new Set(workRows.map((w: any) => w.task));
        const missingTasks = dbTasks.filter((t: any) => !existingTaskIds.has(t.id));
        if (missingTasks.length > 0) {
          const missingInserts = missingTasks.map((t: any) => ({
            task: t.id,
            shift_session: activeDbSession.id,
            timestamp: null,
          }));
          const addedWorks = await this.db.insert(taskWork).values(missingInserts).returning();
          workRows = [...workRows, ...addedWorks];
        }
      }

      const items: ChecklistItem[] = dbTasks.map((t: any) => {
        const work = workRows.find((w: any) => w.task === t.id);
        const timeRange = t.start && t.end ? `${t.start.slice(0, 5)} - ${t.end.slice(0, 5)}` : undefined;
        let isLate = false;
        if (work?.timestamp && t.end) {
          const completedDate = new Date(work.timestamp);
          const [endHour, endMinute] = t.end.split(":").map(Number);
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
      console.error("ChecklistService.getOrCreateShiftSession error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลเช็คลิสต์" };
    }
  }

  async toggleTaskWork(params: {
    taskWorkId?: string;
    shiftSessionId?: string;
    taskId?: string;
    completed: boolean;
  }): Promise<{ success: boolean; completedAt?: string | null; error?: string }> {
    try {
      const { taskWorkId, shiftSessionId, taskId, completed } = params;
      const completedAt = completed ? new Date() : null;

      let targetShiftSessionId = shiftSessionId;

      if (taskWorkId && isValidUuid(taskWorkId)) {
        await this.db
          .update(taskWork)
          .set({ timestamp: completedAt })
          .where(eq(taskWork.id, taskWorkId));

        if (!targetShiftSessionId) {
          const [work] = await this.db
            .select({ shift_session: taskWork.shift_session })
            .from(taskWork)
            .where(eq(taskWork.id, taskWorkId))
            .limit(1);
          if (work) {
            targetShiftSessionId = work.shift_session;
          }
        }
      } else if (shiftSessionId && taskId && isValidUuid(shiftSessionId) && isValidUuid(taskId)) {
        const [existing] = await this.db
          .select({ id: taskWork.id })
          .from(taskWork)
          .where(and(eq(taskWork.shift_session, shiftSessionId), eq(taskWork.task, taskId)))
          .limit(1);

        if (existing) {
          await this.db
            .update(taskWork)
            .set({ timestamp: completedAt })
            .where(eq(taskWork.id, existing.id));
        } else {
          await this.db.insert(taskWork).values({
            shift_session: shiftSessionId,
            task: taskId,
            timestamp: completedAt,
          });
        }
      } else {
        return { success: false, error: "ข้อมูลระบุรายการไม่ถูกต้อง" };
      }

      if (targetShiftSessionId && isValidUuid(targetShiftSessionId)) {
        const [sess] = await this.db
          .select({ branch: shiftSession.branch, user: shiftSession.user, shift: shiftSession.shift })
          .from(shiftSession)
          .where(eq(shiftSession.id, targetShiftSessionId))
          .limit(1);

        if (sess && sess.branch) {
          await this.db
            .update(branches)
            .set({ last_update: new Date() })
            .where(eq(branches.id, sess.branch));

          // Check if all tasks for session are now completed to trigger notification
          if (completed && this.notificationService) {
            const works = await this.db
              .select()
              .from(taskWork)
              .where(eq(taskWork.shift_session, targetShiftSessionId));

            const allDone = works.length > 0 && works.every((w: any) => w.timestamp !== null);
            if (allDone) {
              const [userObj] = await this.db
                .select({ name: users.name })
                .from(users)
                .where(eq(users.id, sess.user))
                .limit(1);

              const shiftName = sess.shift === "morning" ? "กะเช้า" : sess.shift === "afternoon" ? "กะบ่าย" : "กะเช้า-บ่าย";
              await this.notificationService.createNotification({
                branchId: sess.branch,
                recipientRole: "manager",
                title: `📋 ส่งงานสำเร็จ: ${shiftName}`,
                message: `${userObj?.name || "พนักงาน"} ได้เช็ครายการงานครบทุกข้อแล้ว กรุณาตรวจสอบและอนุมัติ`,
                type: "shift_submitted",
                shiftSessionId: targetShiftSessionId,
              });
            }
          }
        }
      }

      return { success: true, completedAt: completedAt ? completedAt.toISOString() : null };
    } catch (err: any) {
      console.error("ChecklistService.toggleTaskWork error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการบันทึกสถานะงาน" };
    }
  }

  async endShiftSession(shiftSessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isValidUuid(shiftSessionId)) {
        return { success: false, error: "ID ของกะไม่ถูกต้อง" };
      }

      await this.db
        .update(shiftSession)
        .set({
          end: new Date(),
        })
        .where(eq(shiftSession.id, shiftSessionId));

      return { success: true };
    } catch (err: any) {
      console.error("ChecklistService.endShiftSession error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการจบกะ" };
    }
  }

  async getPositionShiftsStatus(position: string): Promise<{
    success: boolean;
    statuses?: Record<ShiftType, { status: "completed" | "incomplete" | "none"; total: number; done: number }>;
    error?: string;
  }> {
    try {
      const taskRole = mapPositionToTaskRole(position);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todaySessions = await this.db
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

      const sessionIds = todaySessions.map((s: any) => s.id) as string[];
      let allWorks: any[] = [];
      if (sessionIds.length > 0) {
        allWorks = await this.db
          .select()
          .from(taskWork)
          .where(inArray(taskWork.shift_session, sessionIds));
      }

      for (const [dbShift, uiShift] of Object.entries(shiftMap) as Array<
        ["morning" | "afternoon" | "morning_afternoon", ShiftType]
      >) {
        const sess = todaySessions.find((s: any) => s.shift === dbShift);
        if (!sess) continue;

        const works = allWorks.filter((w: any) => w.shift_session === sess.id);
        const total = works.length;
        const done = works.filter((w: any) => w.timestamp !== null).length;
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
      console.error("ChecklistService.getPositionShiftsStatus error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการโหลดสถานะกะ" };
    }
  }

  async resetTodayChecklistData(position?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const conditions = [gte(shiftSession.start, startOfDay), lte(shiftSession.start, endOfDay)];

      if (position) {
        const taskRole = mapPositionToTaskRole(position);
        conditions.push(eq(shiftSession.task_role, taskRole));
      }

      const sessionsToDelete = await this.db
        .select({ id: shiftSession.id })
        .from(shiftSession)
        .where(and(...conditions));

      const sessionIds = sessionsToDelete.map((s: any) => s.id) as string[];

      if (sessionIds.length > 0) {
        await this.db.delete(taskWork).where(inArray(taskWork.shift_session, sessionIds));
        await this.db.delete(shiftSession).where(inArray(shiftSession.id, sessionIds));
      }

      return { success: true };
    } catch (err: any) {
      console.error("ChecklistService.resetTodayChecklistData error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล" };
    }
  }
}
