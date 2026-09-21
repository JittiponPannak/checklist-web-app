"use server";

import { getServices } from "../services/container";
import { RefrigeratorConfig } from "../services/RefrigeratorService";

export type { RefrigeratorConfig };

export async function getRefrigeratorsAction(
  userId: string
): Promise<{ success: boolean; data?: RefrigeratorConfig[]; error?: string }> {
  const services = getServices();
  return await services.refrigerator.getRefrigerators(userId);
}

export async function createRefrigeratorAction(params: {
  userId: string;
  name: string;
  targetTemperature: number;
  disableCheck: boolean;
}): Promise<{ success: boolean; data?: RefrigeratorConfig; error?: string }> {
  const services = getServices();
  return await services.refrigerator.createRefrigerator(params);
}

export async function updateRefrigeratorAction(params: {
  id: string;
  name: string;
  targetTemperature: number;
  disableCheck: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const services = getServices();
  return await services.refrigerator.updateRefrigerator(params);
}
