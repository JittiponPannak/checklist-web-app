"use server";

import { db } from "../db";
import { branches, users } from "../db/schema";
import { eq, sql } from "drizzle-orm";

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

export async function getBranchesAction(): Promise<{
    success: boolean;
    branches?: DashboardBranch[];
    error?: string;
}> {
    try {
        const allBranches = await db.select().from(branches);
        const allUsers = await db.select().from(users);

        const formattedBranches: DashboardBranch[] = allBranches.map((b) => {
            // Find members from users table based on IDs in b.members
            const branchUsers = allUsers.filter((u) => b.members.includes(u.id));

            // Find the manager
            const manager = branchUsers.find((u) => u.role === "manager" || u.role === "general_manager");
            const managerName = manager ? manager.name : "กำลังสรรหา";

            // Since we don't have code/location in the schema, we map fallback strings.
            // E.g. we can extract it if the name is formatted as "[CODE] Name - Location" 
            // but without that let's just make fallback
            return {
                id: b.id,
                code: b.name.substring(0, 7).toUpperCase(), // Mocking code for UI formatting
                name: b.name,
                location: "-", // not in schema
                managerName: managerName,
                staffCount: branchUsers.length,
                status: "active",
                todayCompletionRate: 0, // Should be computed dynamically for real use case
                members: b.members, // Send DB strings
                tasks: b.tasks
            };
        });

        return { success: true, branches: formattedBranches };
    } catch (err: any) {
        console.error("getBranchesAction error:", err);
        return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลสาขา" };
    }
}

export async function createBranchAction(name: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!name.trim()) return { success: false, error: "กรุณาระบุชื่อสาขา" };

        await db.insert(branches).values({
            name: name.trim(),
            members: [],
            tasks: [],
            last_update: new Date()
        });

        return { success: true };
    } catch (err: any) {
        console.error("createBranchAction error:", err);
        return { success: false, error: "ไม่สามารถสร้างสาขาได้" };
    }
}

export async function assignStaffToBranchAction(branchId: string, userIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        // Note: Drizzle Postgres might handle Arrays differently, this overwrites the entire members array
        await db
            .update(branches)
            .set({
                members: userIds,
                last_update: new Date(),
            })
            .where(eq(branches.id, branchId));

        return { success: true };
    } catch (err: any) {
        console.error("assignStaffToBranchAction error:", err);
        return { success: false, error: "ไม่สามารถปรับปรุงพนักงานในสาขาได้" };
    }
}

export async function assignTasksToBranchAction(branchId: string, taskIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (!branchId || typeof branchId !== 'string') {
        return { success: false, error: "ID ของสาขาไม่ถูกต้อง" };
    }
    try {
        await db
            .update(branches)
            .set({
                tasks: taskIds,
                last_update: new Date(),
            })
            .where(eq(branches.id, branchId));

        return { success: true };
    } catch (err: any) {
        console.error("assignTasksToBranchAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการกำหนดงาน" };
    }
}
