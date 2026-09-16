"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Notification, Position, ShiftSession, ShiftType, User } from "../types";
import { getChecklistTemplate, STAFF_POSITIONS } from "../data/checklists";
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

interface AppContextType {
  currentUser: User | null;
  selectedShift: ShiftType | null;
  selectedShifts: ShiftType[];
  activeSession: ShiftSession | null;
  sessions: ShiftSession[];
  isReady: boolean;
  login: (user: User, shift?: ShiftType, redirectPath?: string) => void;
  logout: (redirectTo?: string) => void;
  selectShift: (shift: ShiftType, chosenShifts?: ShiftType[]) => void;
  selectPosition: (position: string) => void;
  updateSession: (updated: ShiftSession) => void;
  endShift: (continueNextShift?: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedShift: (shift: ShiftType | null) => void;
  setSelectedShifts: (shifts: ShiftType[]) => void;
  setActiveSession: (session: ShiftSession | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [selectedShift, setSelectedShiftState] = useState<ShiftType | null>(null);
  const [selectedShifts, setSelectedShiftsState] = useState<ShiftType[]>([]);
  const [activeSession, setActiveSessionState] = useState<ShiftSession | null>(null);
  const [sessions, setSessionsState] = useState<ShiftSession[]>([]);

  useEffect(() => {
    ensureDefaultManager();
    const storedUser = getCurrentUser();
    const storedShift = getSelectedShift();
    const storedShifts = typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("app_selected_shifts") || "[]") as ShiftType[]) : [];
    const storedSession = getActiveSession();
    const storedSessions = getSessions();

    if (storedUser) setCurrentUserState(storedUser);
    if (storedShift) setSelectedShiftState(storedShift);
    setSelectedShiftsState(storedShifts);
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

  function setSelectedShifts(shifts: ShiftType[]) {
    setSelectedShiftsState(shifts);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_selected_shifts", JSON.stringify(shifts));
    }
  }

  function setActiveSession(session: ShiftSession | null) {
    setActiveSessionState(session);
    saveActiveSession(session);
  }

  function login(user: User, shift?: ShiftType, redirectPath?: unknown) {
    const targetPath = typeof redirectPath === "string" ? redirectPath : null;
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
    setCurrentUser(null);
    setSelectedShift(null);
    setActiveSession(null);

    startTransition(() => {
      if (targetUrl) {
        router.push(targetUrl);
      } else if (prevRole === "admin" || prevRole === "committee" || prevRole === "general_manager") {
        router.push("/admin");
      } else if (prevRole === "manager" || prevRole === "manager_assistant") {
        router.push("/manager");
      } else {
        router.push("/");
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

  async function selectShift(shift: ShiftType, chosenShifts?: ShiftType[]) {
    if (!currentUser) return;
    setSelectedShift(shift);
    if (chosenShifts && chosenShifts.length > 0) {
      setSelectedShifts(chosenShifts);
    }

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
      }
    } catch (err) {
      console.warn("Could not sync shift session from DB, fallback to local:", err);
    }

    // Local fallback
    const allSessions = getSessions();
    const todayStr = new Date().toDateString();

    const existingIndex = allSessions.findIndex(
      (s) =>
        s.shift === shift &&
        s.userPosition?.trim() === position.trim() &&
        (new Date(s.startedAt).toDateString() === todayStr ||
          (s.completedAt ? new Date(s.completedAt).toDateString() === todayStr : false))
    );

    let session: ShiftSession;
    if (existingIndex >= 0) {
      session = {
        ...allSessions[existingIndex],
        completedAt: allSessions[existingIndex].items.every((i) => i.completedAt !== null)
          ? allSessions[existingIndex].completedAt
          : null,
      };
      setActiveSession(session);
    } else {
      const template = getChecklistTemplate(position, shift);
      session = {
        id: uid(),
        userId: currentUser.id,
        userName: currentUser.name,
        userPosition: position,
        shift: shift,
        startedAt: new Date().toISOString(),
        completedAt: null,
        items: template.map((i) => ({ ...i, completedAt: null })),
        notified: false,
      };
      const next = [...allSessions, session];
      saveSessions(next);
      setSessionsState(next);
      setActiveSession(session);
    }

    startTransition(() => {
      router.push(currentUser.role === "manager" ? "/admin/dashboard" : "/checklist");
    });
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
        userId: updated.userId,
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
      (typeof window !== "undefined" && localStorage.getItem("app_queue_afternoon") === "true");
    if (typeof window !== "undefined") {
      localStorage.removeItem("app_queue_afternoon");
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
        selectedShifts,
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
        setSelectedShifts,
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
