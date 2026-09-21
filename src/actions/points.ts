"use server";

import { getServices } from "../services/container";
import { PointTransaction, LeaderboardEntry } from "../types";

export async function getUserPointsAction(userId: string): Promise<{
  success: boolean;
  points?: number;
  streak?: number;
  streakType?: "none" | "flawed" | "perfect";
  longestStreak?: number;
  transactions?: PointTransaction[];
  error?: string;
}> {
  try {
    const services = getServices();
    return await services.points.getUserPointDetails(userId);
  } catch (err: any) {
    console.error("getUserPointsAction error:", err);
    return { success: false, error: err?.message };
  }
}

export async function getLeaderboardAction(branchId?: string): Promise<{
  success: boolean;
  leaderboard?: LeaderboardEntry[];
  error?: string;
}> {
  try {
    const services = getServices();
    return await services.points.getLeaderboard(branchId);
  } catch (err: any) {
    console.error("getLeaderboardAction error:", err);
    return { success: false, error: err?.message };
  }
}

export async function awardPointsAction(params: {
  userId: string;
  points: number;
  type: string;
  shiftSessionId?: string;
  description: string;
}): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    const services = getServices();
    return await services.points.awardPoints(params);
  } catch (err: any) {
    console.error("awardPointsAction error:", err);
    return { success: false, error: err?.message };
  }
}
