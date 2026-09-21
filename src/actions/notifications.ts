"use server";

import { getServices } from "../services/container";
import { Notification, Role } from "../types";

export async function getNotificationsAction(params: {
  userId: string;
  role?: Role;
  branchId?: string;
}): Promise<{ success: boolean; notifications?: Notification[]; unreadCount?: number; error?: string }> {
  try {
    const services = getServices();
    const res = await services.notifications.getNotificationsForUser(params);
    return res;
  } catch (err: any) {
    console.error("getNotificationsAction error:", err);
    return { success: false, error: err?.message || "Failed to fetch notifications" };
  }
}

export async function markNotificationReadAction(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const services = getServices();
    return await services.notifications.markAsRead(notificationId, userId);
  } catch (err: any) {
    console.error("markNotificationReadAction error:", err);
    return { success: false, error: err?.message };
  }
}

export async function markAllNotificationsReadAction(
  userId: string,
  role?: Role,
  branchId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const services = getServices();
    return await services.notifications.markAllAsRead(userId, role, branchId);
  } catch (err: any) {
    console.error("markAllNotificationsReadAction error:", err);
    return { success: false, error: err?.message };
  }
}

export async function createSystemNotificationAction(params: {
  recipientId?: string;
  recipientRole?: Role;
  branchId?: string;
  title: string;
  message: string;
  type?: string;
  shiftSessionId?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const services = getServices();
    return await services.notifications.createNotification(params);
  } catch (err: any) {
    console.error("createSystemNotificationAction error:", err);
    return { success: false, error: err?.message };
  }
}
