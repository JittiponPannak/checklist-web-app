import { eq, and, sql, inArray } from "drizzle-orm";
import { refrigerators, branches, refrigeratorTasks, users } from "../db/schema";
import { IRefrigeratorService, RefrigeratorTaskItem } from "./types";
import { ShiftType } from "../types";

export interface RefrigeratorConfig {
  id: string;
  name: string;
  target_temperature: number;
  disable_check: boolean;
}

function getThaiDateString(baseDate = new Date()): string {
  const y = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric" }).format(baseDate);
  const m = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", month: "2-digit" }).format(baseDate);
  const d = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", day: "2-digit" }).format(baseDate);
  return `${y}-${m}-${d}`;
}

export class RefrigeratorService implements IRefrigeratorService {
  constructor(private db: any) {}

  private async getBranchForUser(userId: string) {
    const [branch] = await this.db
      .select({ id: branches.id, name: branches.name, refrigerators: branches.refrigerators })
      .from(branches)
      .where(sql`${userId} = ANY(${branches.members})`)
      .limit(1);

    return branch;
  }

  async getRefrigerators(userId: string): Promise<{ success: boolean; data?: RefrigeratorConfig[]; error?: string }> {
    try {
      const branch = await this.getBranchForUser(userId);

      if (!branch || !branch.refrigerators || branch.refrigerators.length === 0) {
        return { success: true, data: [] };
      }

      const refs = await this.db
        .select()
        .from(refrigerators)
        .where(inArray(refrigerators.id, branch.refrigerators as string[]));

      return { success: true, data: refs.map((r: any) => ({ ...r, disable_check: r.disable_check })) };
    } catch (err: any) {
      console.error("RefrigeratorService.getRefrigerators error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตู้แช่" };
    }
  }

  async createRefrigerator(params: {
    userId: string;
    name: string;
    targetTemperature: number;
    disableCheck: boolean;
  }): Promise<{ success: boolean; data?: RefrigeratorConfig; error?: string }> {
    try {
      const { userId, name, targetTemperature, disableCheck } = params;

      const branch = await this.getBranchForUser(userId);
      if (!branch) {
        return { success: false, error: "ไม่พบสาขาของผู้ใช้นี้" };
      }

      const [newRef] = await this.db
        .insert(refrigerators)
        .values({
          name,
          target_temperature: targetTemperature,
          disable_check: disableCheck,
        })
        .returning();

      const currentRefs = branch.refrigerators || [];
      await this.db
        .update(branches)
        .set({
          refrigerators: [...currentRefs, newRef.id],
          last_update: new Date(),
        })
        .where(eq(branches.id, branch.id));

      if (!disableCheck) {
        await this.ensureDailyRefrigeratorTasks(branch.id);
      }

      return { success: true, data: newRef };
    } catch (err: any) {
      console.error("RefrigeratorService.createRefrigerator error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการเพิ่มตู้แช่" };
    }
  }

  async updateRefrigerator(params: {
    id: string;
    name: string;
    targetTemperature: number;
    disableCheck: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { id, name, targetTemperature, disableCheck } = params;

      await this.db
        .update(refrigerators)
        .set({
          name,
          target_temperature: targetTemperature,
          disable_check: disableCheck,
        })
        .where(eq(refrigerators.id, id));

      // Find branch containing this refrigerator and sync today's tasks
      const [branch] = await this.db
        .select({ id: branches.id })
        .from(branches)
        .where(sql`${id} = ANY(${branches.refrigerators})`)
        .limit(1);

      const targetDate = getThaiDateString();

      if (disableCheck) {
        // If disabled, delete incomplete tasks for today so it disappears live
        await this.db
          .delete(refrigeratorTasks)
          .where(
            and(
              eq(refrigeratorTasks.refrigerator_id, id),
              eq(refrigeratorTasks.task_date, targetDate),
              sql`${refrigeratorTasks.completed_at} IS NULL`
            )
          );
      } else if (branch) {
        // If re-enabled, ensure daily task is created right now
        await this.ensureDailyRefrigeratorTasks(branch.id, targetDate);
      }

      if (branch) {
        await this.db
          .update(branches)
          .set({ last_update: new Date() })
          .where(eq(branches.id, branch.id));
      }

      return { success: true };
    } catch (err: any) {
      console.error("RefrigeratorService.updateRefrigerator error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการอัปเดตตู้แช่" };
    }
  }

  async ensureDailyRefrigeratorTasks(branchId: string, dateStr?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const targetDate = dateStr || getThaiDateString();

      const [branch] = await this.db
        .select({ id: branches.id, refrigerators: branches.refrigerators })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (!branch || !branch.refrigerators || branch.refrigerators.length === 0) {
        return { success: true };
      }

      const refIds = branch.refrigerators as string[];
      const activeRefs = await this.db
        .select({ id: refrigerators.id })
        .from(refrigerators)
        .where(
          and(
            inArray(refrigerators.id, refIds),
            eq(refrigerators.disable_check, false)
          )
        );

      if (activeRefs.length === 0) {
        return { success: true };
      }

      const existingTasks = await this.db
        .select({ id: refrigeratorTasks.id, refrigerator_id: refrigeratorTasks.refrigerator_id })
        .from(refrigeratorTasks)
        .where(
          and(
            eq(refrigeratorTasks.branch_id, branchId),
            eq(refrigeratorTasks.task_date, targetDate)
          )
        );

      const existingRefIds = new Set(existingTasks.map((t: any) => t.refrigerator_id));
      const missingRefs = activeRefs.filter((r: any) => !existingRefIds.has(r.id));

      if (missingRefs.length > 0) {
        const insertRows = missingRefs.map((r: any) => ({
          branch_id: branchId,
          refrigerator_id: r.id,
          task_date: targetDate,
          is_okay: true,
        }));
        await this.db.insert(refrigeratorTasks).values(insertRows);
      }

      // Also clean up any uncompleted tasks for refrigerators that are now disabled or removed from branch
      const activeRefIdSet = new Set(activeRefs.map((r: any) => r.id));
      const staleTasks = existingTasks.filter((t: any) => !activeRefIdSet.has(t.refrigerator_id));
      if (staleTasks.length > 0) {
        const staleIds = staleTasks.map((t: any) => t.id);
        await this.db
          .delete(refrigeratorTasks)
          .where(
            and(
              inArray(refrigeratorTasks.id, staleIds),
              sql`${refrigeratorTasks.completed_at} IS NULL`
            )
          );
      }

      return { success: true };
    } catch (err: any) {
      console.error("RefrigeratorService.ensureDailyRefrigeratorTasks error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการเริ่มต้นรายการตู้แช่" };
    }
  }

  async getBranchRefrigeratorTasks(params: {
    userId?: string;
    branchId?: string;
    dateStr?: string;
  }): Promise<{ success: boolean; data?: RefrigeratorTaskItem[]; branchName?: string; error?: string }> {
    try {
      const { userId, branchId: propBranchId, dateStr } = params;
      const targetDate = dateStr || getThaiDateString();

      let targetBranchId = propBranchId;
      let branchName = "";

      if (!targetBranchId && userId) {
        const branch = await this.getBranchForUser(userId);
        if (branch) {
          targetBranchId = branch.id;
          branchName = branch.name;
        }
      }

      if (!targetBranchId) {
        const [anyBranch] = await this.db
          .select({ id: branches.id, name: branches.name })
          .from(branches)
          .limit(1);
        if (anyBranch) {
          targetBranchId = anyBranch.id;
          branchName = anyBranch.name;
        } else {
          return { success: true, data: [], branchName: "" };
        }
      } else if (!branchName) {
        const [b] = await this.db
          .select({ name: branches.name })
          .from(branches)
          .where(eq(branches.id, targetBranchId))
          .limit(1);
        if (b) branchName = b.name;
      }

      if (!targetBranchId) {
        return { success: true, data: [], branchName: "" };
      }

      // Automatically ensure initial tasks exist for today
      await this.ensureDailyRefrigeratorTasks(targetBranchId, targetDate);

      // Fetch tasks for this branch on targetDate
      const tasksRows = await this.db
        .select()
        .from(refrigeratorTasks)
        .where(
          and(
            eq(refrigeratorTasks.branch_id, targetBranchId),
            eq(refrigeratorTasks.task_date, targetDate)
          )
        );

      if (tasksRows.length === 0) {
        return { success: true, data: [], branchName };
      }

      const refIds = tasksRows.map((t: any) => t.refrigerator_id);
      const userIds = tasksRows.map((t: any) => t.completed_by).filter(Boolean);

      const refConfigs = await this.db
        .select()
        .from(refrigerators)
        .where(inArray(refrigerators.id, refIds));

      const refMap = new Map<string, any>(refConfigs.map((r: any) => [r.id, r]));

      // Filter out tasks for refrigerators that are disabled and uncompleted
      const activeTasksRows = tasksRows.filter((t: any) => {
        const ref = refMap.get(t.refrigerator_id);
        if (!ref) return false;
        if (ref.disable_check && !t.completed_at) return false;
        return true;
      });

      let userMap = new Map<string, string>();
      if (userIds.length > 0) {
        const userRows = await this.db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, userIds));
        userMap = new Map(userRows.map((u: any) => [u.id, u.name]));
      }

      const items: RefrigeratorTaskItem[] = activeTasksRows.map((t: any) => {
        const ref = refMap.get(t.refrigerator_id) as any;
        const completed = Boolean(t.completed_at);
        const completedByName = t.completed_by ? userMap.get(t.completed_by) || "พนักงาน" : null;

        return {
          taskId: t.id,
          refrigeratorId: t.refrigerator_id,
          name: ref?.name || "ตู้แช่",
          targetTemperature: ref?.target_temperature ?? 4,
          taskDate: t.task_date,
          completed,
          completedAt: t.completed_at ? new Date(t.completed_at).toISOString() : null,
          completedByUserId: t.completed_by || null,
          completedByUserName: completedByName,
          temperature: t.temperature !== null ? t.temperature : null,
          isOkay: t.is_okay ?? true,
          comment: t.comment || null,
        };
      });

      // Sort alphabetically by refrigerator name
      items.sort((a, b) => a.name.localeCompare(b.name, "th"));

      return { success: true, data: items, branchName };
    } catch (err: any) {
      console.error("RefrigeratorService.getBranchRefrigeratorTasks error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงรายการตรวจตู้แช่" };
    }
  }

  async updateRefrigeratorTask(params: {
    taskId: string;
    userId: string;
    completed: boolean;
    temperature?: number;
    isOkay?: boolean;
    comment?: string;
    shiftSessionId?: string;
    shift?: ShiftType;
  }): Promise<{ success: boolean; data?: RefrigeratorTaskItem; error?: string }> {
    try {
      const { taskId, userId, completed, temperature, isOkay, comment, shiftSessionId, shift } = params;

      const [existingTask] = await this.db
        .select()
        .from(refrigeratorTasks)
        .where(eq(refrigeratorTasks.id, taskId))
        .limit(1);

      if (!existingTask) {
        return { success: false, error: "ไม่พบรายการงานตู้แช่ที่ระบุ" };
      }

      const completedAt = completed ? new Date() : null;

      const [updatedTask] = await this.db
        .update(refrigeratorTasks)
        .set({
          completed_by: completed ? userId : null,
          completed_at: completedAt,
          temperature: completed && temperature !== undefined ? temperature : null,
          is_okay: completed && isOkay !== undefined ? isOkay : true,
          comment: completed && comment !== undefined ? comment : null,
          shift_session_id: completed && shiftSessionId ? shiftSessionId : null,
          shift: completed && shift ? (shift === "both" ? "morning_afternoon" : shift) : null,
        })
        .where(eq(refrigeratorTasks.id, taskId))
        .returning();

      // Update branch last_update for reactivity
      await this.db
        .update(branches)
        .set({ last_update: new Date() })
        .where(eq(branches.id, existingTask.branch_id));

      const [ref] = await this.db
        .select()
        .from(refrigerators)
        .where(eq(refrigerators.id, updatedTask.refrigerator_id))
        .limit(1);

      let userName: string | null = null;
      if (updatedTask.completed_by) {
        const [u] = await this.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, updatedTask.completed_by))
          .limit(1);
        userName = u?.name || null;
      }

      const resultItem: RefrigeratorTaskItem = {
        taskId: updatedTask.id,
        refrigeratorId: updatedTask.refrigerator_id,
        name: ref?.name || "ตู้แช่",
        targetTemperature: ref?.target_temperature ?? 4,
        taskDate: updatedTask.task_date,
        completed: Boolean(updatedTask.completed_at),
        completedAt: updatedTask.completed_at ? new Date(updatedTask.completed_at).toISOString() : null,
        completedByUserId: updatedTask.completed_by,
        completedByUserName: userName,
        temperature: updatedTask.temperature,
        isOkay: updatedTask.is_okay ?? true,
        comment: updatedTask.comment,
      };

      return { success: true, data: resultItem };
    } catch (err: any) {
      console.error("RefrigeratorService.updateRefrigeratorTask error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการบันทึกผลการตรวจตู้แช่" };
    }
  }
}
