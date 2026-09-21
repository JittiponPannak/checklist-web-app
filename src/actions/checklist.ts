"use server";

import { getServices } from "../services/container";
import { ShiftSession, ShiftType } from "../types";

export async function getOrCreateShiftSessionAction(params: {
  userId: string;
  userName: string;
  position: string;
  shift: ShiftType;
}): Promise<{ success: boolean; session?: ShiftSession; error?: string }> {
  const services = getServices();
  return await services.checklist.getOrCreateShiftSession(params);
}

export async function toggleTaskWorkAction(params: {
  taskWorkId?: string;
  shiftSessionId?: string;
  taskId?: string;
  completed: boolean;
}): Promise<{ success: boolean; completedAt?: string | null; error?: string }> {
  const services = getServices();
  return await services.checklist.toggleTaskWork(params);
}

export async function endShiftSessionAction(shiftSessionId: string): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.checklist.endShiftSession(shiftSessionId);
}

export async function getPositionShiftsStatusAction(position: string, userId?: string): Promise<{
  success: boolean;
  statuses?: Record<ShiftType, { status: "completed" | "incomplete" | "none"; total: number; done: number }>;
  error?: string;
}> {
  const services = getServices();
  return await services.checklist.getPositionShiftsStatus(position, userId);
}

export async function resetTodayChecklistDataAction(position?: string): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.checklist.resetTodayChecklistData(position);
}
