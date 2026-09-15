"use server";

import { db } from "../db";
import { tasks, taskWork, shiftSession, users, branches } from "../db/schema";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { ShiftType } from "../types";

export interface ManagerShiftSummary {
  id: string;
  userId: string;
  userName: string;
  userPosition?: string;
  taskRole?: "cashier" | "stock" | "manager_assistant";
  shift: ShiftType;
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  doneItems: number;
  isAllDone: boolean;
  assistantApproved: boolean;
  managerApproved: boolean;
  assistantApproveTime?: string | null;
  managerApproveTime?: string | null;
  items: Array<{
    id: string;
    label: string;
    category?: string;
    completedAt: string | null;
    taskWorkId?: string;
    assistantApproved: boolean;
    managerApproved: boolean;
  }>;
  branchName?: string;
}

function mapDbShiftToUi(dbShift: "morning" | "afternoon" | "morning_afternoon"): ShiftType {
  if (dbShift === "morning") return "morning";
  if (dbShift === "afternoon") return "afternoon";
  return "both";
}

function mapTaskRoleToTitle(role: "cashier" | "stock" | "manager_assistant"): string {
  if (role === "cashier") return "แคชเชียร์";
  if (role === "stock") return "พนักงานสต็อก/จัดเรียง";
  return "ผู้ช่วยผู้จัดการร้าน";
}

/**
 * Fetch shift sessions from Supabase PostgreSQL for Manager Dashboard
 */
export async function getManagerShiftSessionsAction(filterDate?: string): Promise<{
  success: boolean;
  sessions?: ManagerShiftSummary[];
  hasAssistantLoggedInToday?: boolean;
  error?: string;
}> {
  try {
    const today = filterDate ? new Date(filterDate) : new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Fetch shift sessions
    const dbSessions = await db
      .select()
      .from(shiftSession)
      .where(
        and(
          gte(shiftSession.start, startOfDay),
          lte(shiftSession.start, endOfDay)
        )
      )
      .orderBy(desc(shiftSession.start));

    // Check if any manager_assistant logged in today
    const [assistantLoggedIn] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.role, "manager_assistant"),
          gte(users.last_login, startOfDay),
          lte(users.last_login, endOfDay)
        )
      )
      .limit(1);

    const hasAssistantLoggedInToday = !!assistantLoggedIn;

    if (dbSessions.length === 0) {
      return { success: true, sessions: [], hasAssistantLoggedInToday };
    }

    const sessionIds = dbSessions.map((s) => s.id);
    const userIds = Array.from(new Set(dbSessions.map((s) => s.user)));

    // Fetch users for these sessions
    const dbUsers = userIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];

    // Fetch task_work entries
    const dbWorks = await db
      .select()
      .from(taskWork)
      .where(inArray(taskWork.shift_session, sessionIds));

    // Fetch task definitions
    const taskIds = Array.from(new Set(dbWorks.map((w) => w.task)));
    const allTasks = taskIds.length > 0
      ? await db.select().from(tasks).where(inArray(tasks.id, taskIds))
      : [];

    // Fetch branch names
    const branchIds = Array.from(new Set(dbSessions.map((s) => s.branch).filter(Boolean)));
    const dbBranches = branchIds.length > 0
      ? await db.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, branchIds))
      : [];

    const summaries: ManagerShiftSummary[] = dbSessions.map((sess) => {
      const user = dbUsers.find((u) => u.id === sess.user);
      const sessionWorks = dbWorks.filter((w) => w.shift_session === sess.id);

      const items = sessionWorks.map((work) => {
        const t = allTasks.find((item) => item.id === work.task);
        const timeRange = t?.start && t?.end ? `${t.start.slice(0, 5)} - ${t.end.slice(0, 5)}` : undefined;
        return {
          id: work.task,
          label: t ? t.name : "รายการงาน",
          category: timeRange ? `ช่วงเวลา ${timeRange}` : undefined,
          completedAt: work.timestamp ? new Date(work.timestamp).toISOString() : null,
          taskWorkId: work.id,
          assistantApproved: work.manager_assistance_approve_timestamp !== null,
          managerApproved: work.manager_approve_timestamp !== null,
        };
      });

      const totalItems = items.length;
      const doneItems = items.filter((i) => i.completedAt !== null).length;
      const isAllDone = totalItems > 0 && doneItems === totalItems;

      const assistantApproved =
        sessionWorks.length > 0 &&
        sessionWorks.every((w) => w.manager_assistance_approve_timestamp !== null);

      const managerApproved =
        sessionWorks.length > 0 &&
        sessionWorks.every((w) => w.manager_approve_timestamp !== null);

      const latestAsstTime = sessionWorks
        .map((w) => w.manager_assistance_approve_timestamp)
        .filter((t): t is Date => t !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const latestMgrTime = sessionWorks
        .map((w) => w.manager_approve_timestamp)
        .filter((t): t is Date => t !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        id: sess.id,
        userId: sess.user,
        userName: user ? user.name : "พนักงานสาขา",
        userPosition: mapTaskRoleToTitle(sess.task_role),
        taskRole: sess.task_role,
        shift: mapDbShiftToUi(sess.shift),
        startedAt: new Date(sess.start).toISOString(),
        completedAt: sess.end ? new Date(sess.end).toISOString() : null,
        totalItems,
        doneItems,
        isAllDone,
        assistantApproved,
        managerApproved,
        assistantApproveTime: latestAsstTime ? latestAsstTime.toISOString() : null,
        managerApproveTime: latestMgrTime ? latestMgrTime.toISOString() : null,
        items,
        branchName: dbBranches.find((b) => b.id === sess.branch)?.name,
      };
    });

    return { success: true, sessions: summaries, hasAssistantLoggedInToday };
  } catch (err: any) {
    console.error("getManagerShiftSessionsAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับผู้จัดการ" };
  }
}

/**
 * Approve a shift session in Supabase PostgreSQL
 */
export async function approveShiftSessionAction(params: {
  shiftSessionId: string;
  role: "manager" | "manager_assistant" | "committee" | "general_manager";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { shiftSessionId, role } = params;

    // Check if session belongs to a manager assistant
    const [targetSession] = await db
      .select({ task_role: shiftSession.task_role })
      .from(shiftSession)
      .where(eq(shiftSession.id, shiftSessionId))
      .limit(1);

    if (targetSession?.task_role === "manager_assistant" && role === "manager_assistant") {
      return {
        success: false,
        error: "ผู้ที่จะอนุมัติงานของผู้ช่วยผู้จัดการร้านได้จะต้องเป็นตำแหน่งผู้จัดการร้าน (Manager) หรือสูงกว่าเท่านั้น",
      };
    }

    const now = new Date();

    if (role === "manager_assistant") {
      await db
        .update(taskWork)
        .set({ manager_assistance_approve_timestamp: now })
        .where(eq(taskWork.shift_session, shiftSessionId));
    } else {
      // manager, committee, or general_manager
      await db
        .update(taskWork)
        .set({ manager_approve_timestamp: now })
        .where(eq(taskWork.shift_session, shiftSessionId));
    }

    // Update branch last_update
    const [sess] = await db
      .select({ branch: shiftSession.branch })
      .from(shiftSession)
      .where(eq(shiftSession.id, shiftSessionId))
      .limit(1);

    if (sess && sess.branch) {
      const { branches } = await import("../db/schema");
      await db
        .update(branches)
        .set({ last_update: new Date() })
        .where(eq(branches.id, sess.branch));
    }

    return { success: true };
  } catch (err: any) {
    console.error("approveShiftSessionAction error:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการรับรองผลงาน" };
  }
}

