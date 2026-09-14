"use server";

import { db } from "../db";
import { tasks } from "../db/schema";
import { asc } from "drizzle-orm";

export async function getAllTasksAction(): Promise<{ success: boolean; tasks?: any[]; error?: string }> {
    try {
        const allTasks = await db.select().from(tasks).orderBy(asc(tasks.name));
        return { success: true, tasks: allTasks };
    } catch (err: any) {
        console.error("getAllTasksAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลงาน" };
    }
}

export interface CreateTaskParams {
    name: string;
    task_role: "manager_assistant" | "cashier" | "stock";
    shift: "morning" | "afternoon" | "morning_afternoon";
    start: string;
    end: string;
    disabled?: boolean;
}

export async function createTaskAction(params: CreateTaskParams): Promise<{ success: boolean; error?: string }> {
    try {
        await db.insert(tasks).values({
            name: params.name,
            task_role: params.task_role,
            shift: params.shift,
            start: params.start || "00:00:00",
            end: params.end || "00:00:00",
            disabled: params.disabled ?? false,
        });
        return { success: true };
    } catch (err: any) {
        console.error("createTaskAction error:", err);
        return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการสร้างงานใหม่" };
    }
}

