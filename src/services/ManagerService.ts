import { eq, and, gte, lte, desc, inArray, sql } from "drizzle-orm";
import { tasks, taskWork, shiftSession, users, branches } from "../db/schema";
import { IManagerService, IPointService, INotificationService, BranchEmployeeStatus } from "./types";
import { ShiftType, Role } from "../types";

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
    isLate?: boolean;
    comment?: string | null;
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

export class ManagerService implements IManagerService {
  constructor(
    private db: any,
    private pointService?: IPointService,
    private notificationService?: INotificationService
  ) {}

  async getManagerShiftSessions(filterDate?: string): Promise<{
    success: boolean;
    sessions?: ManagerShiftSummary[];
    hasAssistantLoggedInToday?: boolean;
    error?: string;
  }> {
    try {
      const today = filterDate ? new Date(filterDate) : new Date();
      const { startOfDay, endOfDay } = getThaiStartAndEndOfDay(today);

      const dbSessions = await this.db
        .select()
        .from(shiftSession)
        .where(and(gte(shiftSession.start, startOfDay), lte(shiftSession.start, endOfDay)))
        .orderBy(desc(shiftSession.start));

      const [assistantLoggedIn] = await this.db
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

      const sessionIds = dbSessions.map((s: any) => s.id) as string[];
      const userIds = Array.from(new Set(dbSessions.map((s: any) => s.user))) as string[];

      const dbUsers =
        userIds.length > 0
          ? await this.db.select().from(users).where(inArray(users.id, userIds))
          : [];

      const dbWorks =
        sessionIds.length > 0
          ? await this.db
              .select()
              .from(taskWork)
              .where(inArray(taskWork.shift_session, sessionIds))
          : [];

      const taskIds = Array.from(new Set(dbWorks.map((w: any) => w.task))) as string[];
      const allTasks =
        taskIds.length > 0
          ? await this.db.select().from(tasks).where(inArray(tasks.id, taskIds))
          : [];

      const branchIds = Array.from(new Set(dbSessions.map((s: any) => s.branch).filter(Boolean))) as string[];
      const dbBranches =
        branchIds.length > 0
          ? await this.db.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, branchIds))
          : [];

      const summaries: ManagerShiftSummary[] = dbSessions.map((sess: any) => {
        const user = dbUsers.find((u: any) => u.id === sess.user);
        const sessionWorks = dbWorks.filter((w: any) => w.shift_session === sess.id);

        const managerApproved = sess.manager_approve_timestamp !== null;
        const assistantApproved =
          managerApproved || sess.manager_assistance_approve_timestamp !== null;

        const items = sessionWorks.map((work: any) => {
          const t = allTasks.find((item: any) => item.id === work.task);
          const timeRange = t?.start && t?.end ? `${t.start.slice(0, 5)} - ${t.end.slice(0, 5)}` : undefined;
          let isLate = false;

          if (work.timestamp && t?.end) {
            const completedDate = new Date(work.timestamp);
            const [endHour, endMinute] = t.end.split(":").map(Number);
            const deadlineDate = new Date(sess.start);
            deadlineDate.setHours(endHour, endMinute, 0, 0);

            if (completedDate > deadlineDate) {
              isLate = true;
            }
          }

          return {
            id: work.task,
            label: t ? t.name : "รายการงาน",
            category: timeRange ? `ช่วงเวลา ${timeRange}` : undefined,
            completedAt: work.timestamp ? new Date(work.timestamp).toISOString() : null,
            taskWorkId: work.id,
            assistantApproved,
            managerApproved,
            isLate,
            comment: work.comment ?? null,
          };
        });

        const totalItems = items.length;
        const doneItems = items.filter((i: any) => i.completedAt !== null).length;
        const isAllDone = totalItems > 0 && doneItems === totalItems;

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
          assistantApproveTime: sess.manager_assistance_approve_timestamp
            ? new Date(sess.manager_assistance_approve_timestamp).toISOString()
            : null,
          managerApproveTime: sess.manager_approve_timestamp
            ? new Date(sess.manager_approve_timestamp).toISOString()
            : null,
          items,
          branchName: dbBranches.find((b: any) => b.id === sess.branch)?.name,
        };
      });

      return { success: true, sessions: summaries, hasAssistantLoggedInToday };
    } catch (err: any) {
      console.error("ManagerService.getManagerShiftSessions error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสำหรับผู้จัดการ" };
    }
  }

  async getHistoryShiftSessions(
    daysOffset: number = 14,
    specificDate?: string
  ): Promise<{
    success: boolean;
    sessions?: ManagerShiftSummary[];
    error?: string;
  }> {
    try {
      const today = new Date();
      const { endOfDay: todayEndOfDay } = getThaiStartAndEndOfDay(today);

      let queryStart: Date;
      let queryEnd: Date;

      if (specificDate) {
        const targetDate = new Date(specificDate);
        const bounds = getThaiStartAndEndOfDay(targetDate);
        queryStart = bounds.startOfDay;
        queryEnd = bounds.endOfDay;
      } else {
        const boundaryDate = new Date(today.getTime());
        boundaryDate.setDate(boundaryDate.getDate() - daysOffset);
        const { startOfDay: startOfBoundary } = getThaiStartAndEndOfDay(boundaryDate);
        queryStart = startOfBoundary;
        queryEnd = todayEndOfDay;
      }

      const dbSessions = await this.db
        .select()
        .from(shiftSession)
        .where(and(gte(shiftSession.start, queryStart), lte(shiftSession.start, queryEnd)))
        .orderBy(desc(shiftSession.start));

      const dbUsers = await this.db.select({ id: users.id, name: users.name }).from(users);

      const historySessionIds = dbSessions.map((s: any) => s.id) as string[];
      const dbWorks =
        historySessionIds.length > 0
          ? await this.db
              .select()
              .from(taskWork)
              .where(inArray(taskWork.shift_session, historySessionIds))
          : [];

      const taskIds = Array.from(new Set(dbWorks.map((w: any) => w.task))) as string[];
      const allTasks =
        taskIds.length > 0
          ? await this.db.select().from(tasks).where(inArray(tasks.id, taskIds))
          : [];

      const branchIds = Array.from(new Set(dbSessions.map((s: any) => s.branch).filter(Boolean))) as string[];
      const dbBranches =
        branchIds.length > 0
          ? await this.db.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, branchIds))
          : [];

      const summaries: ManagerShiftSummary[] = dbSessions.map((sess: any) => {
        const user = dbUsers.find((u: any) => u.id === sess.user);
        const sessionWorks = dbWorks.filter((w: any) => w.shift_session === sess.id);

        const items = sessionWorks.map((work: any) => {
          const t = allTasks.find((item: any) => item.id === work.task);
          const timeRange = t?.start && t?.end ? `${t.start.slice(0, 5)} - ${t.end.slice(0, 5)}` : undefined;
          let isLate = false;

          if (work.timestamp && t?.end) {
            const completedDate = new Date(work.timestamp);
            const [endHour, endMinute] = t.end.split(":").map(Number);
            const deadlineDate = new Date(sess.start);
            deadlineDate.setHours(endHour, endMinute, 0, 0);

            if (completedDate > deadlineDate) {
              isLate = true;
            }
          }

          return {
            id: work.task,
            label: t ? t.name : "รายการงาน",
            category: timeRange ? `ช่วงเวลา ${timeRange}` : undefined,
            completedAt: work.timestamp ? new Date(work.timestamp).toISOString() : null,
            taskWorkId: work.id,
            assistantApproved: work.manager_assistance_approve_timestamp !== null,
            managerApproved: work.manager_approve_timestamp !== null,
            isLate,
            comment: work.comment ?? null,
          };
        });

        const totalItems = items.length;
        const doneItems = items.filter((i: any) => i.completedAt !== null).length;
        const isAllDone = totalItems > 0 && doneItems === totalItems;

        const managerApproved = sess.manager_approve_timestamp !== null;
        const assistantApproved =
          managerApproved || sess.manager_assistance_approve_timestamp !== null;

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
          assistantApproveTime: sess.manager_assistance_approve_timestamp
            ? new Date(sess.manager_assistance_approve_timestamp).toISOString()
            : null,
          managerApproveTime: sess.manager_approve_timestamp
            ? new Date(sess.manager_approve_timestamp).toISOString()
            : null,
          items,
          branchName: dbBranches.find((b: any) => b.id === sess.branch)?.name,
        };
      });

      return { success: true, sessions: summaries };
    } catch (err: any) {
      console.error("ManagerService.getHistoryShiftSessions error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ" };
    }
  }

  async approveShiftSession(params: {
    shiftSessionId: string;
    role: "manager" | "manager_assistant" | "committee" | "general_manager" | Role;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { shiftSessionId, role } = params;

      const [targetSession] = await this.db
        .select({
          task_role: shiftSession.task_role,
          start: shiftSession.start,
          user: shiftSession.user,
          branch: shiftSession.branch,
          manager_assistance_approve_timestamp: shiftSession.manager_assistance_approve_timestamp,
          manager_approve_timestamp: shiftSession.manager_approve_timestamp,
        })
        .from(shiftSession)
        .where(eq(shiftSession.id, shiftSessionId))
        .limit(1);

      if (!targetSession) {
        return { success: false, error: "ไม่พบข้อมูลกะนี้" };
      }

      if (targetSession.task_role === "manager_assistant" && role === "manager_assistant") {
        return {
          success: false,
          error: "ผู้ที่จะอนุมัติงานของผู้ช่วยผู้จัดการร้านได้จะต้องเป็นตำแหน่งผู้จัดการร้าน (Manager) หรือสูงกว่าเท่านั้น",
        };
      }

      const wasFullyApproved = targetSession.manager_approve_timestamp !== null;
      const now = new Date();

      if (role === "manager_assistant") {
        await this.db
          .update(shiftSession)
          .set({ manager_assistance_approve_timestamp: now })
          .where(eq(shiftSession.id, shiftSessionId));
      } else {
        // Manager or higher approval: approve manager level, and also fulfill assistant approval if missing
        const assistantTimestamp = targetSession.manager_assistance_approve_timestamp || now;
        await this.db
          .update(shiftSession)
          .set({
            manager_approve_timestamp: now,
            manager_assistance_approve_timestamp: assistantTimestamp,
          })
          .where(eq(shiftSession.id, shiftSessionId));
      }

      const isNowFullyApproved = role !== "manager_assistant";

      // Transition to fully approved -> Trigger PointService to award points and streak!
      if (!wasFullyApproved && isNowFullyApproved && this.pointService) {
        await this.pointService.evaluateShiftSession(shiftSessionId);
      }

      // Notify employee and manager about approval
      if (this.notificationService && targetSession.user) {
        const [empUser] = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, targetSession.user))
          .limit(1);

        const empName = empUser?.name || "พนักงาน";
        const roleLabel = role === "manager_assistant" ? "ผู้ช่วยผู้จัดการร้าน" : "ผู้จัดการร้าน";

        // 1. Notify Employee
        await this.notificationService.createNotification({
          recipientId: targetSession.user,
          title: isNowFullyApproved ? "🏆 กะงานได้รับการอนุมัติสมบูรณ์" : `📝 ${roleLabel}ตรวจรับรองงานแล้ว`,
          message: isNowFullyApproved
            ? `ผู้จัดการร้านได้อนุมัติการปฏิบัติงานกะของคุณเรียบร้อยแล้ว!`
            : `${roleLabel}ได้ตรวจสอบรายการงานกะของคุณแล้ว และบันทึกผลการรับรอง`,
          type: "shift_approved",
          shiftSessionId: shiftSessionId,
          branchId: targetSession.branch,
        });

        // 2. If Assistant Manager approved, notify the Store Manager
        if (role === "manager_assistant") {
          await this.notificationService.createNotification({
            branchId: targetSession.branch,
            recipientRole: "manager",
            title: `📋 ผู้ช่วยผู้จัดการตรวจรับรองงานแล้ว`,
            message: `ผู้ช่วยผู้จัดการได้ตรวจรับรองรายการงานของ ${empName} เรียบร้อยแล้ว กรุณาตรวจสอบเพื่ออนุมัติขั้นสุดท้าย`,
            type: "shift_submitted",
            shiftSessionId: shiftSessionId,
          });
        }
      }

      // Update branch last_update
      if (targetSession.branch) {
        await this.db
          .update(branches)
          .set({ last_update: new Date() })
          .where(eq(branches.id, targetSession.branch));
      }

      return { success: true };
    } catch (err: any) {
      console.error("ManagerService.approveShiftSession error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการรับรองผลงาน" };
    }
  }

  async getBranchStaffStatus(branchId?: string): Promise<{
    success: boolean;
    employees?: BranchEmployeeStatus[];
    branches?: Array<{ id: string; name: string }>;
    selectedBranchId?: string;
    error?: string;
  }> {
    try {
      // 1. Fetch all branches
      const allBranches = await this.db
        .select({ id: branches.id, name: branches.name, members: branches.members })
        .from(branches);

      if (allBranches.length === 0) {
        return { success: true, employees: [], branches: [] };
      }

      const activeBranch = branchId 
        ? allBranches.find((b: any) => b.id === branchId) || allBranches[0]
        : allBranches[0];

      const activeBranchId = activeBranch.id;
      const branchMemberIds: string[] = activeBranch.members || [];

      // 2. Fetch users who belong to this branch, or if members array is empty, all staff
      let candidateUsers: any[] = [];
      if (branchMemberIds.length > 0) {
        candidateUsers = await this.db
          .select()
          .from(users)
          .where(inArray(users.id, branchMemberIds));
      } else {
        candidateUsers = await this.db
          .select()
          .from(users)
          .where(inArray(users.role, ["employee", "manager_assistant"]));
      }

      // 3. Today's time boundary (Asia/Bangkok)
      const { startOfDay, endOfDay } = getThaiStartAndEndOfDay(new Date());

      // 4. Fetch all shift sessions for today across candidate users
      const todaySessions = candidateUsers.length > 0
        ? await this.db
            .select()
            .from(shiftSession)
            .where(
              and(
                inArray(shiftSession.user, candidateUsers.map(u => u.id)),
                gte(shiftSession.start, startOfDay),
                lte(shiftSession.start, endOfDay)
              )
            )
            .orderBy(desc(shiftSession.start))
        : [];

      // 5. Total shifts worked count and last shift per user across all time
      const totalShiftCounts = candidateUsers.length > 0
        ? await this.db
            .select({
              userId: shiftSession.user,
              totalCount: sql<number>`count(*)::int`,
              lastShift: sql<Date | string>`max(${shiftSession.start})`,
            })
            .from(shiftSession)
            .where(inArray(shiftSession.user, candidateUsers.map(u => u.id)))
            .groupBy(shiftSession.user)
        : [];

      // 6. For currently active shifts (end IS NULL), fetch their task works to calculate checklist progress
      const activeSessions = todaySessions.filter((s: any) => s.end === null);
      const activeSessionIds = activeSessions.map((s: any) => s.id);

      const activeWorks = activeSessionIds.length > 0
        ? await this.db
            .select()
            .from(taskWork)
            .where(inArray(taskWork.shift_session, activeSessionIds))
        : [];

      // 7. Assemble BranchEmployeeStatus array
      const employees: BranchEmployeeStatus[] = candidateUsers.map((u: any) => {
        const userTodaySessions = todaySessions.filter((s: any) => s.user === u.id);
        const todayShiftsCount = userTodaySessions.length;

        // Current active shift (end is null)
        const currentActiveSession = userTodaySessions.find((s: any) => s.end === null);
        const isOnDuty = Boolean(currentActiveSession);

        let activeShift: BranchEmployeeStatus["activeShift"] | undefined = undefined;
        if (currentActiveSession) {
          const works = activeWorks.filter((w: any) => w.shift_session === currentActiveSession.id);
          const totalTasks = works.length;
          const completedTasks = works.filter((w: any) => w.timestamp !== null).length;
          const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const startedAtDate = new Date(currentActiveSession.start);
          const durationMinutes = Math.max(0, Math.round((Date.now() - startedAtDate.getTime()) / 60000));

          activeShift = {
            sessionId: currentActiveSession.id,
            shift: mapDbShiftToUi(currentActiveSession.shift),
            taskRole: currentActiveSession.task_role,
            taskRoleTitle: mapTaskRoleToTitle(currentActiveSession.task_role),
            startedAt: startedAtDate.toISOString(),
            durationMinutes,
            totalTasks,
            completedTasks,
            completionPercentage,
          };
        }

        const totalStats = totalShiftCounts.find((tc: any) => tc.userId === u.id);
        const totalShiftsWorked = totalStats ? Number(totalStats.totalCount) : todayShiftsCount;
        const lastShiftAt = totalStats?.lastShift 
          ? new Date(totalStats.lastShift).toISOString() 
          : (currentActiveSession ? new Date(currentActiveSession.start).toISOString() : null);

        let position = u.role === "manager_assistant" ? "ผู้ช่วยผู้จัดการร้าน" : "พนักงานประจำสาขา";
        if (currentActiveSession) {
          position = mapTaskRoleToTitle(currentActiveSession.task_role);
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          position,
          branchId: activeBranchId,
          branchName: activeBranch.name,
          isOnDuty,
          activeShift,
          todayShiftsCount,
          totalShiftsWorked,
          lastShiftAt,
          point: u.point ?? 0,
          pointStreak: u.point_streak ?? 0,
          pointStreakType: u.point_streak_type ?? "none",
        };
      });

      // Sort: On-duty first, then by name
      employees.sort((a, b) => {
        if (a.isOnDuty && !b.isOnDuty) return -1;
        if (!a.isOnDuty && b.isOnDuty) return 1;
        return a.name.localeCompare(b.name, "th");
      });

      return {
        success: true,
        employees,
        branches: allBranches.map((b: any) => ({ id: b.id, name: b.name })),
        selectedBranchId: activeBranchId,
      };
    } catch (err: any) {
      console.error("ManagerService.getBranchStaffStatus error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการโหลดสถานะพนักงาน" };
    }
  }
}
