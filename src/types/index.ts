export type Role = "employee" | "manager" | "manager_assistant" | "committee" | "general_manager" | "admin";
export type ShiftType = "morning" | "afternoon" | "both";

export interface Position {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  position?: string;
  branchName?: string;
  branchId?: string;
  point?: number;
  pointStreak?: number;
  pointStreakType?: "none" | "flawed" | "perfect";
  longestStreak?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category?: string;
  completedAt: string | null;
  taskWorkId?: string;
  isLate?: boolean;
}

export interface ShiftSession {
  id: string;
  userId: string;
  userName: string;
  userPosition?: string;
  taskRole?: "cashier" | "stock" | "manager_assistant";
  shift: ShiftType;
  startedAt: string;
  completedAt: string | null;
  items: ChecklistItem[];
  notified: boolean;
  branchName?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "shift_submitted" | "shift_approved" | "point_awarded" | "refrigerator_alert" | "system" | string;
  shiftSessionId?: string;
  userName?: string;
  userPosition?: string;
  shift?: ShiftType;
  completedAt?: string;
  createdAt: string;
  read: boolean;
  branchName?: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  type: "shift_completion" | "on_time_bonus" | "perfect_shift" | "streak_bonus" | "manager_award" | string;
  shiftSessionId?: string;
  description: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  role: Role;
  position?: string;
  branchName?: string;
  point: number;
  pointStreak: number;
  pointStreakType: "none" | "flawed" | "perfect";
}

export const STAFF_POSITIONS = [
  "แคชเชียร์",
  "พนักงานสต็อก/จัดเรียง",
];

export const MANAGEMENT_POSITIONS = [
  "ผู้ช่วยผู้จัดการร้าน",
  "ผู้จัดการร้าน",
  "กรรมการ",
];

export const DEFAULT_POSITIONS: Position[] = [
  { id: "pos-1", name: "แคชเชียร์" },
  { id: "pos-2", name: "พนักงานสต็อก/จัดเรียง" },
  { id: "pos-3", name: "ผู้ช่วยผู้จัดการร้าน" },
  { id: "pos-4", name: "ผู้จัดการร้าน" },
  { id: "pos-5", name: "กรรมการ" },
];
