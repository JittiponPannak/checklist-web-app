"use server";

import { getServices } from "../services/container";
import { Role } from "../types";
import { ManagerShiftSummary } from "../services/ManagerService";
import { BranchEmployeeStatus } from "../services/types";

export type { ManagerShiftSummary, BranchEmployeeStatus };

export async function getManagerShiftSessionsAction(filterDate?: string): Promise<{
  success: boolean;
  sessions?: ManagerShiftSummary[];
  hasAssistantLoggedInToday?: boolean;
  error?: string;
}> {
  const services = getServices();
  return await services.manager.getManagerShiftSessions(filterDate);
}

export async function getHistoryShiftSessionsAction(
  daysOffset: number = 14,
  specificDate?: string
): Promise<{
  success: boolean;
  sessions?: ManagerShiftSummary[];
  error?: string;
}> {
  const services = getServices();
  return await services.manager.getHistoryShiftSessions(daysOffset, specificDate);
}

export async function approveShiftSessionAction(params: {
  shiftSessionId: string;
  role: "manager" | "manager_assistant" | "committee" | "general_manager" | Role;
}): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.manager.approveShiftSession(params);
}

export async function getBranchStaffStatusAction(branchId?: string): Promise<{
  success: boolean;
  employees?: BranchEmployeeStatus[];
  branches?: Array<{ id: string; name: string }>;
  selectedBranchId?: string;
  error?: string;
}> {
  const services = getServices();
  return await services.manager.getBranchStaffStatus(branchId);
}

