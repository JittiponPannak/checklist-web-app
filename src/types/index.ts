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
}

export interface ChecklistItem {
  id: string;
  label: string;
  category?: string;
  completedAt: string | null;
  taskWorkId?: string;
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
  shiftSessionId: string;
  userName: string;
  userPosition?: string;
  shift: ShiftType;
  completedAt: string;
  read: boolean;
}
