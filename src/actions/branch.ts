"use server";

import { getServices } from "../services/container";
import { DashboardBranch } from "../services/BranchService";

export type { DashboardBranch };

export async function getBranchesAction(): Promise<{
  success: boolean;
  branches?: DashboardBranch[];
  error?: string;
}> {
  const services = getServices();
  return await services.branch.getBranches();
}

export async function createBranchAction(name: string): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.branch.createBranch(name);
}

export async function assignStaffToBranchAction(
  branchId: string,
  userIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.branch.assignStaffToBranch(branchId, userIds);
}

export async function assignTasksToBranchAction(
  branchId: string,
  taskIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.branch.assignTasksToBranch(branchId, taskIds);
}
