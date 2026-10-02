"use client";

import React, { createContext, useContext, useEffect, useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShiftSession, ShiftType, User } from "../types";
import { STAFF_POSITIONS } from "../types";
import {
  getActiveSession,
  getCurrentUser,
  getSelectedShift,
  getSessions,
  saveActiveSession,
  saveCurrentUser,
  saveSelectedShift,
  saveSessions,
  getThaiDateString,
  isTodayThai,
  evictDailyCache,
} from "../data/storage";
import {
  getOrCreateShiftSessionAction,
  toggleTaskWorkAction,
  endShiftSessionAction,
} from "../actions/checklist";
import { getUserByIdAction, syncOAuthUserAction } from "../actions/auth";
import { createClient } from "../db/supabase/client";
import { secureGetItem, secureRemoveItem } from "../utils/crypto";
import { invalidateBranchCache } from "../utils/cache";
import { useLoading } from "./LoadingContext";

interface AppContextType {
  currentUser: User | null;
  selectedShift: ShiftType | null;
  activeSession: ShiftSession | null;
  sessions: ShiftSession[];
  isReady: boolean;
  login: (user: User, shift?: ShiftType, redirectPath?: string) => void;
  logout: (redirectTo?: string) => void;
  selectShift: (shift: ShiftType) => Promise<void>;
  selectPosition: (position: string) => void;
  updateSession: (updated: ShiftSession) => void;
  endShift: (continueNextShift?: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedShift: (shift: ShiftType | null) => void;
  setActiveSession: (session: ShiftSession | null) => void;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { startLoading, withLoading } = useLoading();
  const [, startTransition] = useTransition();
  const [isReady, setIsReady] = useState(false);

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return getCurrentUser();
  });

  const [activeSession, setActiveSessionState] = useState<ShiftSession | null>(() => {
    if (typeof window === "undefined") return null;
    const storedUser = getCurrentUser();
    const storedSession = getActiveSession();
    if (storedSession && storedUser && storedSession.userId === storedUser.id) {
      return storedSession;
    }
    if (storedSession && isTodayThai(storedSession.startedAt)) {
      return storedSession;
    }
    return null;
  });

  const [selectedShift, setSelectedShiftState] = useState<ShiftType | null>(() => {
    if (typeof window === "undefined") return null;
    const storedSession = getActiveSession();
    return storedSession ? getSelectedShift() : null;
  });

  const [sessions, setSessionsState] = useState<ShiftSession[]>(() => {
    if (typeof window === "undefined") return [];
    const storedUser = getCurrentUser();
    const storedSessions = getSessions();
    if (storedSessions && storedUser) {
      return storedSessions.filter((s) => s.userId === storedUser.id);
    }
    return [];
  });

  // Keep stable refs to avoid re-triggering effects and callbacks
  const routerRef = useRef(router);
  const activeSessionRef = useRef(activeSession);
  const currentUserRef = useRef(currentUser);
  const checkDateRolloverRef = useRef<() => void>(() => {});

  const refreshUserData = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user?.id) return;
    try {
      const res = await getUserByIdAction(user.id);
      if (res.success && res.user) {
        setCurrentUserState(res.user);
        saveCurrentUser(res.user);
      }
    } catch (err) {
      console.warn("Failed to refresh user data:", err);
    }
  }, []);

  const checkDateRollover = useCallback(() => {
    if (typeof window === "undefined") return;
    const currentThaiDate = getThaiDateString();
    const lastVisit = localStorage.getItem("app_last_visit_date");
    const currentSession = activeSessionRef.current;

    // Condition 1: Recorded date is different from today's Thai date
    // Condition 2: Active session exists in state but started on a past day
    const isPastSession = currentSession?.startedAt && !isTodayThai(currentSession.startedAt);
    const dateChanged = Boolean(lastVisit && lastVisit !== currentThaiDate);

    if (dateChanged || isPastSession) {
      console.info("Daily cache rollover triggered. Purging previous day's operational cache...");
      localStorage.setItem("app_last_visit_date", currentThaiDate);
      evictDailyCache();
      invalidateBranchCache();

      setActiveSessionState(null);
      setSelectedShiftState(null);
      setSessionsState([]);

      window.dispatchEvent(new CustomEvent("app:date-rollover", { detail: { date: currentThaiDate } }));

      if (window.location.pathname.includes("/checklist")) {
        routerRef.current.replace("/shift");
      }
    }
  }, []);

  useEffect(() => {
    routerRef.current = router;
    activeSessionRef.current = activeSession;
    currentUserRef.current = currentUser;
    checkDateRolloverRef.current = checkDateRollover;
  });

  useEffect(() => {
    // Check if the last time the user visited the site is a different day
    if (typeof window !== "undefined") {
      try {
        const todayDateStr = getThaiDateString();
        const lastVisit = localStorage.getItem("app_last_visit_date");
        if (!lastVisit || lastVisit !== todayDateStr) {
          // Different day or first init: evict operational cache data
          evictDailyCache();
          invalidateBranchCache();
        }
        localStorage.setItem("app_last_visit_date", todayDateStr);
      } catch (err) {
        console.warn("Failed to check daily visit date:", err);
      }
    }

    const storedSession = getActiveSession();
    if (storedSession && !isTodayThai(storedSession.startedAt)) {
      secureRemoveItem("app_active_session");
      secureRemoveItem("app_selected_shift");
    }

    // Set up real-time listener for tab focus, visibility change, and heartbeat
    const onActivity = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        checkDateRolloverRef.current();
      }
    };

    window.addEventListener("focus", onActivity);
    document.addEventListener("visibilitychange", onActivity);
    const interval = setInterval(() => {
      checkDateRolloverRef.current();
    }, 30000);

    // Check Supabase Auth state for OAuth logins
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const authUser = data.user;
        const username =
          authUser.user_metadata?.user_name ||
          authUser.email?.split("@")[0]?.toLowerCase() ||
          `user_${authUser.id.substring(0, 6)}`;

        const name =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          username;

        syncOAuthUserAction({
          id: authUser.id,
          username,
          name,
        }).then((syncRes) => {
          if (syncRes.success && syncRes.user) {
            setCurrentUserState(syncRes.user);
            saveCurrentUser(syncRes.user);
          }
        }).catch(console.error);
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);

    return () => {
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
      clearInterval(interval);
    };
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    saveCurrentUser(user);
  }, []);

  const setSelectedShift = useCallback((shift: ShiftType | null) => {
    setSelectedShiftState(shift);
    saveSelectedShift(shift);
  }, []);

  const setActiveSession = useCallback((session: ShiftSession | null) => {
    setActiveSessionState(session);
    saveActiveSession(session);
  }, []);

  function login(user: User, shift?: ShiftType, redirectPath?: unknown) {
    startLoading("กำลังเข้าสู่ระบบ...", true);
    const targetPath = typeof redirectPath === "string" ? redirectPath : null;

    // Role verification for branch association
    const requiresBranch =
      user.role === "employee" || user.role === "manager_assistant" || user.role === "manager";
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

    // Reset previous user's active session and queue if user changed
    const prevUser = getCurrentUser();
    if (prevUser && prevUser.id !== user.id) {
      secureRemoveItem("app_sessions");
      secureRemoveItem("app_active_session");
      secureRemoveItem("app_selected_shift");
      secureRemoveItem("app_queue_afternoon");
      setSessionsState([]);
      setActiveSession(null);
      setSelectedShift(null);
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
      // Clear any leftover session when an employee logs in so they always start clean
      setActiveSession(null);
      setSelectedShift(null);
      secureRemoveItem("app_active_session");
      secureRemoveItem("app_selected_shift");

      const staffUser: User = { ...user, position: undefined };
      setCurrentUser(staffUser);
      startTransition(() => {
        router.push("/position");
      });
    }
  }

  async function logout(redirectTo?: unknown) {
    startLoading("กำลังออกจากระบบ...", true);
    const targetUrl = typeof redirectTo === "string" ? redirectTo : null;
    const prevRole = currentUser?.role;

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }

    // Clear local storage items
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
    startLoading("กำลังเลือกตำแหน่ง...", true);

    let activeUser = currentUser;
    if (position !== activeUser.position) {
      activeUser = { ...activeUser, position };
      setCurrentUser(activeUser);
    }

    startTransition(() => {
      router.push("/shift");
    });
  }

  async function selectShift(shift: ShiftType): Promise<void> {
    if (!currentUser) return;

    await withLoading(async () => {
      setSelectedShift(shift);

      const position = currentUser.position || STAFF_POSITIONS[0];

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

          const targetPath = currentUser.role === "manager" ? "/admin/dashboard" : "/checklist";
          router.push(targetPath);
          return;
        } else {
          alert("ดึงข้อมูลจากฐานข้อมูลไม่สำเร็จ: " + (res.error || ""));
          throw new Error(res.error || "ดึงข้อมูลจากฐานข้อมูลไม่สำเร็จ");
        }
      } catch (err) {
        console.warn("Could not sync shift session from DB:", err);
        if (!(err instanceof Error && err.message.includes("ดึงข้อมูลจากฐานข้อมูลไม่สำเร็จ"))) {
          alert("เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบ กรุณาลองใหม่อีกครั้ง");
        }
        throw err;
      }
    }, "กำลังเตรียมเช็คลิสต์ประจำกะ...");
  }

  function updateSession(updated: ShiftSession) {
    if (!isTodayThai(updated.startedAt)) {
      setActiveSession(null);
      return;
    }
    const allSessions = getSessions();
    const hasSess = allSessions.some((s) => s.id === updated.id);
    const next = hasSess
      ? allSessions.map((s) => (s.id === updated.id ? updated : s))
      : [...allSessions, updated];
    saveSessions(next);
    setSessionsState(next);

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
        comment: changedItem.comment || undefined,
      }).catch((err) => console.error("Failed to sync toggle to DB:", err));
    }

    setActiveSession(updated);
  }

  async function endShift(continueNextShift?: boolean) {
    await withLoading(async () => {
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

        try {
          await endShiftSessionAction(activeSession.id);
        } catch (err) {
          console.error("Failed to end shift in DB:", err);
        }
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
        await selectShift(nextShiftToRun);
        return;
      }

      startTransition(() => {
        if (wasManager) {
          router.push("/admin/dashboard");
        } else {
          router.push("/shift");
        }
      });
    }, "กำลังบันทึกและส่งรายงานกะ...");
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
        refreshUserData,
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
