"use server";

import { getServices } from "../services/container";
import { Role, LeaveType, EmployeeLeave } from "../types";
import { ManagerShiftSummary } from "../services/ManagerService";
import { BranchEmployeeStatus } from "../services/types";

export type { ManagerShiftSummary, BranchEmployeeStatus, EmployeeLeave, LeaveType };

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
  isException?: boolean;
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

export async function processShiftAttendanceAlertsAction(params?: {
  dateStr?: string;
}) {
  const services = getServices();
  return await services.manager.processShiftAttendanceAlerts(params);
}

export async function markEmployeeLeaveAction(params: {
  userId: string;
  branchId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  preserveStreak?: boolean;
  recordedBy: string;
}): Promise<{ success: boolean; leave?: EmployeeLeave; error?: string }> {
  const services = getServices();
  return await services.manager.markEmployeeLeave(params);
}

export async function getBranchLeavesAction(params: {
  branchId: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; leaves?: EmployeeLeave[]; error?: string }> {
  const services = getServices();
  return await services.manager.getBranchLeaves(params);
}

export async function cancelEmployeeLeaveAction(params: {
  leaveId: string;
  cancelledBy: string;
}): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.manager.cancelEmployeeLeave(params);
}


