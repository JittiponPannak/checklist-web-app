"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Notification, Position, ShiftSession, ShiftType, User } from "../types";
import { STAFF_POSITIONS } from "../types";
import {
  ensureDefaultManager,
  getActiveSession,
  getCurrentUser,
  getSelectedShift,
  getSessions,
  getUsers,
  saveActiveSession,
  saveCurrentUser,
  saveSelectedShift,
  saveSessions,
  saveUsers,
  uid,
} from "../data/storage";
import {
  getOrCreateShiftSessionAction,
  toggleTaskWorkAction,
  endShiftSessionAction,
} from "../actions/checklist";
import { secureGetItem, secureSetItem, secureRemoveItem } from "../utils/crypto";

interface AppContextType {
  currentUser: User | null;
  selectedShift: ShiftType | null;

  activeSession: ShiftSession | null;
  sessions: ShiftSession[];
  isReady: boolean;
  login: (user: User, shift?: ShiftType, redirectPath?: string) => void;
  logout: (redirectTo?: string) => void;
  selectShift: (shift: ShiftType) => void;
  selectPosition: (position: string) => void;
  updateSession: (updated: ShiftSession) => void;
  endShift: (continueNextShift?: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedShift: (shift: ShiftType | null) => void;

  setActiveSession: (session: ShiftSession | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [selectedShift, setSelectedShiftState] = useState<ShiftType | null>(null);

  const [activeSession, setActiveSessionState] = useState<ShiftSession | null>(null);
  const [sessions, setSessionsState] = useState<ShiftSession[]>([]);

  useEffect(() => {
    ensureDefaultManager();
    const storedUser = getCurrentUser();
    const storedShift = getSelectedShift();

    const storedSession = getActiveSession();
    const storedSessions = getSessions();

    if (storedUser) setCurrentUserState(storedUser);
    if (storedShift) setSelectedShiftState(storedShift);

    if (storedSession) setActiveSessionState(storedSession);
    setSessionsState(storedSessions);

    setIsReady(true);
  }, []);

  // Keep currentUser synced if position gets updated in storage
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      const users = getUsers();
      const fresh = users.find((u) => u.id === currentUser.id);
      if (fresh && fresh.position !== currentUser.position) {
        const updatedUser = { ...fresh, branchName: currentUser.branchName };
        setCurrentUserState(updatedUser);
        saveCurrentUser(updatedUser);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  function setCurrentUser(user: User | null) {
    setCurrentUserState(user);
    saveCurrentUser(user);
  }

  function setSelectedShift(shift: ShiftType | null) {
    setSelectedShiftState(shift);
    saveSelectedShift(shift);
  }



  function setActiveSession(session: ShiftSession | null) {
    setActiveSessionState(session);
    saveActiveSession(session);
  }

  function login(user: User, shift?: ShiftType, redirectPath?: unknown) {
    const targetPath = typeof redirectPath === "string" ? redirectPath : null;

    // Role verification for branch association
    const requiresBranch = user.role === "employee" || user.role === "manager_assistant" || user.role === "manager";
    if (requiresBranch && !user.branchName) {
      setCurrentUser(user);
      startTransition(() => {
        router.push("/awaiting-assignment");
      });
      return;
    }

    if (targetPath) {
      setCurrentUser(user);
      startTransition(() => {
        router.push(targetPath);
      });
      return;
    }

    if (user.role === "admin" || user.role === "committee" || user.role === "general_manager") {
      setCurrentUser(user);
      startTransition(() => {
        router.push("/admin/dashboard");
      });
    } else if (user.role === "manager" || user.role === "manager_assistant") {
      setCurrentUser(user);
      startTransition(() => {
        router.push("/manager/dashboard");
      });
    } else {
      const staffUser: User = { ...user, position: undefined };
      setCurrentUser(staffUser);
      startTransition(() => {
        router.push("/position");
      });
    }
  }

  function logout(redirectTo?: unknown) {
    const targetUrl = typeof redirectTo === "string" ? redirectTo : null;
    const prevRole = currentUser?.role;

    // Clear all persistent local caches when changing users
    secureRemoveItem("app_sessions");
    secureRemoveItem("app_manager_read_notifs");
    secureRemoveItem("app_queue_afternoon");
    secureRemoveItem("app_active_session");
    secureRemoveItem("app_selected_shift");
    secureRemoveItem("app_current_user");

    setSessionsState([]);
    setCurrentUser(null);
    setSelectedShift(null);
    setActiveSession(null);

    startTransition(() => {
      if (targetUrl) {
        router.push(targetUrl);
      } else if (prevRole === "admin" || prevRole === "committee" || prevRole === "general_manager") {
        router.push("/admin");
      } else if (prevRole === "manager" || prevRole === "manager_assistant") {
        router.push("/login/executive");
      } else {
        router.push("/login/staff");
      }
    });
  }

  function selectPosition(position: string) {
    if (!currentUser) return;

    let activeUser = currentUser;
    if (position !== activeUser.position) {
      activeUser = { ...activeUser, position };
      setCurrentUser(activeUser);
      const users = getUsers().map((u) => (u.id === activeUser.id ? { ...u, position } : u));
      saveUsers(users);
    }

    startTransition(() => {
      router.push("/shift");
    });
  }

  async function selectShift(shift: ShiftType) {
    if (!currentUser) return;
    setSelectedShift(shift);

    const position = currentUser.position || STAFF_POSITIONS[0];

    // Attempt to fetch or create session from Supabase DB
    try {
      const res = await getOrCreateShiftSessionAction({
        userId: currentUser.id,
        userName: currentUser.name,
        position,
        shift,
      });

      if (res.success && res.session) {
        const session = res.session;
        const allSessions = getSessions();
        const existingIdx = allSessions.findIndex((s) => s.id === session.id);
        const next =
          existingIdx >= 0
            ? allSessions.map((s) => (s.id === session.id ? session : s))
            : [...allSessions, session];
        saveSessions(next);
        setSessionsState(next);
        setActiveSession(session);

        startTransition(() => {
          router.push(currentUser.role === "manager" ? "/admin/dashboard" : "/checklist");
        });
        return;
        return;
      } else {
        alert("ดึงข้อมูลจากฐานข้อมูลไม่สำเร็จ: " + (res.error || ""));
      }
    } catch (err) {
      console.warn("Could not sync shift session from DB:", err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบ กรุณาลองใหม่อีกครั้ง");
    }
  }

  function updateSession(updated: ShiftSession) {
    const allSessions = getSessions();
    const hasSess = allSessions.some((s) => s.id === updated.id);
    const next = hasSess
      ? allSessions.map((s) => (s.id === updated.id ? updated : s))
      : [...allSessions, updated];
    saveSessions(next);
    setSessionsState(next);

    // Sync toggle status with Supabase task_work
    const changedItem = updated.items.find((item) => {
      const prev = activeSession?.items.find((p) => p.id === item.id);
      return prev ? prev.completedAt !== item.completedAt : false;
    });

    if (changedItem) {
      toggleTaskWorkAction({
        taskWorkId: changedItem.taskWorkId,
        shiftSessionId: updated.id,
        taskId: changedItem.id,
        completed: Boolean(changedItem.completedAt),
      }).catch((err) => console.error("Failed to sync toggle to DB:", err));
    }

    setActiveSession(updated);
  }

  function endShift(continueNextShift?: boolean) {
    if (activeSession) {
      const endedAt = new Date().toISOString();
      const updated: ShiftSession = {
        ...activeSession,
        completedAt: activeSession.completedAt || endedAt,
      };
      const allSessions = getSessions();
      const hasSess = allSessions.some((s) => s.id === updated.id);
      const next = hasSess
        ? allSessions.map((s) => (s.id === updated.id ? updated : s))
        : [...allSessions, updated];
      saveSessions(next);
      setSessionsState(next);

      // Record shift end in Supabase shift_session
      endShiftSessionAction(activeSession.id).catch((err) =>
        console.error("Failed to end shift in DB:", err)
      );
    }
    const wasManager = currentUser?.role === "manager";
    const currentShift = activeSession?.shift || selectedShift;
    const nextShiftToRun = currentShift === "morning" ? "afternoon" : null;

    const hadAfternoonQueue =
      continueNextShift ||
      (typeof window !== "undefined" && secureGetItem("app_queue_afternoon") === "true");
    if (typeof window !== "undefined") {
      secureRemoveItem("app_queue_afternoon");
    }

    setActiveSession(null);
    setSelectedShift(null);

    if (hadAfternoonQueue && !wasManager && nextShiftToRun) {
      selectShift(nextShiftToRun);
      return;
    }

    startTransition(() => {
      if (wasManager) {
        router.push("/admin/dashboard");
      } else {
        router.push("/shift");
      }
    });
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        selectedShift,

        activeSession,
        sessions,
        isReady,
        login,
        logout,
        selectShift,
        selectPosition,
        updateSession,
        endShift,
        setCurrentUser,
        setSelectedShift,
        setActiveSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
