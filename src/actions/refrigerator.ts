"use server";

import { getServices } from "../services/container";
import { RefrigeratorConfig } from "../services/RefrigeratorService";

export type { RefrigeratorConfig };
export type { RefrigeratorTaskItem } from "../services/types";

export async function getRefrigeratorsAction(
  userId: string
): Promise<{ success: boolean; data?: RefrigeratorConfig[]; error?: string }> {
  const services = getServices();
  return await services.refrigerator.getRefrigerators(userId);
}

export async function createRefrigeratorAction(params: {
  userId: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
  disableCheck: boolean;
}): Promise<{ success: boolean; data?: RefrigeratorConfig; error?: string }> {
  const services = getServices();
  return await services.refrigerator.createRefrigerator(params);
}

export async function updateRefrigeratorAction(params: {
  id: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
  disableCheck: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.refrigerator.updateRefrigerator(params);
}

export async function getBranchRefrigeratorTasksAction(params: {
  userId?: string;
  branchId?: string;
  dateStr?: string;
}) {
  const services = getServices();
  return await services.refrigerator.getBranchRefrigeratorTasks(params);
}

export async function updateRefrigeratorTaskAction(params: {
  taskId: string;
  userId: string;
  completed: boolean;
  temperature?: number;
  isOkay?: boolean;
  comment?: string;
  shiftSessionId?: string;
  shift?: any;
}) {
  const services = getServices();
  return await services.refrigerator.updateRefrigeratorTask(params);
}

export async function ensureDailyRefrigeratorTasksAction(branchId: string, dateStr?: string) {
  const services = getServices();
  return await services.refrigerator.ensureDailyRefrigeratorTasks(branchId, dateStr);
}
