import { eq, sql, inArray } from "drizzle-orm";
import { refrigerators, branches } from "../db/schema";
import { IRefrigeratorService } from "./types";

export interface RefrigeratorConfig {
  id: string;
  name: string;
  target_temperature: number;
  disable_check: boolean;
}

export class RefrigeratorService implements IRefrigeratorService {
  constructor(private db: any) {}

  private async getBranchForUser(userId: string) {
    const [branch] = await this.db
      .select({ id: branches.id, refrigerators: branches.refrigerators })
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
        .set({ refrigerators: [...currentRefs, newRef.id] })
        .where(eq(branches.id, branch.id));

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

      return { success: true };
    } catch (err: any) {
      console.error("RefrigeratorService.updateRefrigerator error:", err);
      return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการอัปเดตตู้แช่" };
    }
  }
}
