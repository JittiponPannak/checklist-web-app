"use server";

import { db } from "../db";
import { refrigerators, branches } from "../db/schema";
import { eq, sql, inArray } from "drizzle-orm";

export interface RefrigeratorConfig {
    id: string;
    name: string;
    target_temperature: number;
    disable_check: boolean;
}

async function getBranchForUser(userId: string) {
    const [branch] = await db
        .select({ id: branches.id, refrigerators: branches.refrigerators })
        .from(branches)
        .where(sql`${userId} = ANY(${branches.members})`)
        .limit(1);

    return branch;
}

/**
 * Fetch all refrigerators for a specific branch via user context
 */
export async function getRefrigeratorsAction(userId: string): Promise<{ success: boolean; data?: RefrigeratorConfig[]; error?: string }> {
    try {
        const branch = await getBranchForUser(userId);

        if (!branch || !branch.refrigerators || branch.refrigerators.length === 0) {
            return { success: true, data: [] };
        }

        const refs = await db.select().from(refrigerators).where(inArray(refrigerators.id, branch.refrigerators));

        return { success: true, data: refs.map(r => ({ ...r, disable_check: r.disable_check })) };
    } catch (err: any) {
        console.error("getRefrigeratorsAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตู้แช่" };
    }
}

/**
 * Create a new refrigerator and link it to the branch
 */
export async function createRefrigeratorAction(params: {
    userId: string;
    name: string;
    targetTemperature: number;
    disableCheck: boolean;
}): Promise<{ success: boolean; data?: RefrigeratorConfig; error?: string }> {
    try {
        const { userId, name, targetTemperature, disableCheck } = params;

        const branch = await getBranchForUser(userId);
        if (!branch) {
            return { success: false, error: "ไม่พบสาขาของผู้ใช้นี้" };
        }

        // Insert new refrigerator
        const [newRef] = await db.insert(refrigerators).values({
            name,
            target_temperature: targetTemperature,
            disable_check: disableCheck,
        }).returning();

        const currentRefs = branch.refrigerators || [];
        await db.update(branches).set({ refrigerators: [...currentRefs, newRef.id] }).where(eq(branches.id, branch.id));

        return { success: true, data: newRef };
    } catch (err: any) {
        console.error("createRefrigeratorAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการเพิ่มตู้แช่" };
    }
}

/**
 * Update an existing refrigerator
 */
export async function updateRefrigeratorAction(params: {
    id: string;
    name: string;
    targetTemperature: number;
    disableCheck: boolean;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { id, name, targetTemperature, disableCheck } = params;

        await db.update(refrigerators).set({
            name,
            target_temperature: targetTemperature,
            disable_check: disableCheck,
        }).where(eq(refrigerators.id, id));

        return { success: true };
    } catch (err: any) {
        console.error("updateRefrigeratorAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการอัปเดตตู้แช่" };
    }
}
