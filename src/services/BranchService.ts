import { eq } from "drizzle-orm";
import { branches, users } from "../db/schema";
import { IBranchService } from "./types";

export interface DashboardBranch {
  id: string;
  code: string;
  name: string;
  location: string;
  managerName: string;
  staffCount: number;
  status: "active" | "maintenance" | "standby";
  todayCompletionRate: number;
  members: string[];
  tasks: string[];
}

export class BranchService implements IBranchService {
  constructor(private db: any) {}

  async getBranches(): Promise<{
    success: boolean;
    branches?: DashboardBranch[];
    error?: string;
  }> {
    try {
      const allBranches = await this.db.select().from(branches);
      const allUsers = await this.db.select().from(users);

      const formattedBranches: DashboardBranch[] = allBranches.map((b: any) => {
        const branchUsers = allUsers.filter((u: any) => b.members.includes(u.id));
        const manager = branchUsers.find((u: any) => u.role === "manager" || u.role === "general_manager");
        const managerName = manager ? manager.name : "กำลังสรรหา";

        return {
          id: b.id,
          code: b.name.substring(0, 7).toUpperCase(),
          name: b.name,
          location: "-",
          managerName,
          staffCount: branchUsers.length,
          status: "active",
          todayCompletionRate: 0,
          members: b.members || [],
          tasks: b.tasks || [],
        };
      });

      return { success: true, branches: formattedBranches };
    } catch (err: any) {
      console.error("BranchService.getBranches error:", err);
      return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขา" };
    }
  }

  async createBranch(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!name.trim()) return { success: false, error: "กรุณาระบุชื่อสาขา" };

      await this.db.insert(branches).values({
        name: name.trim(),
        members: [],
        tasks: [],
        last_update: new Date(),
      });

      return { success: true };
    } catch (err: any) {
      console.error("BranchService.createBranch error:", err);
      return { success: false, error: "ไม่สามารถสร้างสาขาได้" };
    }
  }

  async assignStaffToBranch(branchId: string, userIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db
        .update(branches)
        .set({
          members: userIds,
          last_update: new Date(),
        })
        .where(eq(branches.id, branchId));

      return { success: true };
    } catch (err: any) {
      console.error("BranchService.assignStaffToBranch error:", err);
      return { success: false, error: "ไม่สามารถปรับปรุงพนักงานในสาขาได้" };
    }
  }

  async assignTasksToBranch(branchId: string, taskIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!branchId || typeof branchId !== "string") {
        return { success: false, error: "ID ของสาขาไม่ถูกต้อง" };
      }

      await this.db
        .update(branches)
        .set({
          tasks: taskIds,
          last_update: new Date(),
        })
        .where(eq(branches.id, branchId));

      return { success: true };
    } catch (err: any) {
      console.error("BranchService.assignTasksToBranch error:", err);
      return { success: false, error: "ไม่สามารถปรับปรุงงานของสาขาได้" };
    }
  }
}
