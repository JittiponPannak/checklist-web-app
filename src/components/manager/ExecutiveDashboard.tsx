import { useEffect, useMemo, useState, useCallback } from "react";
import { Notification, ShiftSession, ShiftType, User, ChecklistItem } from "../../types";

import {
  fmtDate,
  fmtTime,
  getNotifications,
  getSessions,
  saveNotifications,
  saveSessions,
  seedSampleData,
} from "../../data/storage";
import { secureGetItem, secureSetItem, secureRemoveItem } from "../../utils/crypto";
import { Badge, getShiftBadge, getShiftName } from "../common/Badge";
import { BrandLogo } from "../common/BrandLogo";
import { SessionDetailModal } from "../admin/SessionDetailModal";
import {
  getManagerShiftSessionsAction,
  getHistoryShiftSessionsAction,
  approveShiftSessionAction,
  ManagerShiftSummary,
} from "../../actions/manager";
import {
  getOrCreateShiftSessionAction,
  toggleTaskWorkAction,
  resetTodayChecklistDataAction,
} from "../../actions/checklist";

export type ExecutiveRole = "manager_assistant" | "manager" | "committee" | "general_manager";

export function ExecutiveDashboard({
  user,
  onLogout,
  activeSession,
  onStartChecklist,
  onUpdateSession,
  onEndShift,
  onOpenChecklistPage,
}: {
  user: User;
  onLogout: () => void;
  activeSession: ShiftSession | null;
  onStartChecklist: (shift: ShiftType) => void;
  onUpdateSession: (session: ShiftSession) => void;
  onEndShift: () => void;
  onOpenChecklistPage: () => void;
}) {
  // Determine role directly from logged-in user account
  const currentRole: ExecutiveRole = useMemo(() => {
    if (user.role === "general_manager" || user.position?.includes("ผู้จัดการทั่วไป")) return "general_manager";
    if (user.role === "committee" || user.position?.includes("กรรมการ")) return "committee";
    if (user.role === "manager_assistant" || user.position?.includes("ผู้ช่วย")) return "manager_assistant";
    return "manager";
  }, [user]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<ShiftSession[]>([]);
  const [historySessions, setHistorySessions] = useState<ShiftSession[]>([]);
  const [specificDaySessions, setSpecificDaySessions] = useState<ShiftSession[] | null>(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyShiftFilter, setHistoryShiftFilter] = useState<"all" | ShiftType>("all");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [hasAssistantLoggedInToday, setHasAssistantLoggedInToday] = useState(true);

  // Approval status tracking in client state (synced with Supabase task_work)
  const [approvals, setApprovals] = useState<Record<string, { assistantApproved?: boolean; managerApproved?: boolean }>>({});
  const [isResetting, setIsResetting] = useState(false);

  // Checklist for Assistant Manager self-check (connected to Supabase)
  const [myChecklistShift, setMyChecklistShift] = useState<ShiftType>("morning");
  const [myChecklistItems, setMyChecklistItems] = useState<ChecklistItem[]>([]);
  const [assistantSession, setAssistantSession] = useState<ShiftSession | null>(null);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  // Navigation tab
  type DashboardTab = "overview" | "checklist" | "history";
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Load live shift sessions from Supabase DB
  const loadDbSessions = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsLoadingDb(true);
      const res = await getManagerShiftSessionsAction();
      if (res.success && res.sessions) {
        setIsLiveFromDb(true);
        if (res.hasAssistantLoggedInToday !== undefined) {
          setHasAssistantLoggedInToday(res.hasAssistantLoggedInToday);
        }
        const mappedSessions: ShiftSession[] = res.sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          userPosition: s.userPosition,
          taskRole: s.taskRole,
          shift: s.shift,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          items: s.items.map((it) => ({
            id: it.id,
            label: it.label,
            category: it.category,
            completedAt: it.completedAt,
            taskWorkId: it.taskWorkId,
          })),
          notified: true,
          branchName: s.branchName,
        }));
        setSessions(mappedSessions);

        const newApprovals: Record<string, { assistantApproved?: boolean; managerApproved?: boolean }> = {};
        res.sessions.forEach((s) => {
          newApprovals[s.id] = {
            assistantApproved: s.assistantApproved,
            managerApproved: s.managerApproved,
          };
        });
        setApprovals((prev) => ({ ...prev, ...newApprovals }));

        // Read notification IDs stored locally
        const readIds: string[] = (() => {
          try {
            return JSON.parse(secureGetItem("app_manager_read_notifs") ?? "[]");
          } catch {
            return [];
          }
        })();

        // Sync notifications 1-to-1 with Supabase shift sessions
        const dbNotifs: Notification[] = res.sessions
          .map((s) => {
            const latestTaskTime = s.items
              .map((i) => i.completedAt)
              .filter((t): t is string => t !== null)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

            const eventTime = s.completedAt || latestTaskTime || s.startedAt;
            const isRead = s.managerApproved || readIds.includes(s.id);

            return {
              id: `notif-${s.id}`,
              shiftSessionId: s.id,
              userName: s.userName,
              userPosition: s.userPosition,
              shift: s.shift,
              completedAt: eventTime,
              read: isRead,
            };
          })
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        setNotifications(dbNotifs);
      }
    } catch (err) {
      console.error("Failed to fetch sessions from Supabase DB:", err);
    } finally {
      if (isManual) setIsLoadingDb(false);
    }
  }, []);

  // Sync initial DB fetch on mount
  useEffect(() => {
    loadDbSessions();

    // Auto-refresh from Supabase DB every 6 seconds
    const interval = setInterval(() => {
      loadDbSessions();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadDbSessions]);

  // Load history metadata
  const loadHistorySessions = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await getHistoryShiftSessionsAction(14);
      if (res.success && res.sessions) {
        const mappedSessions: ShiftSession[] = res.sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          userPosition: s.userPosition,
          taskRole: s.taskRole,
          shift: s.shift,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          items: s.items.map((it) => ({
            id: it.id,
            label: it.label,
            category: it.category,
            completedAt: it.completedAt,
            taskWorkId: it.taskWorkId,
          })),
          notified: true,
          branchName: s.branchName,
        }));
        setHistorySessions(mappedSessions);
      }
    } catch (err) {
      console.error("Failed to fetch history sessions:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch history when tab becomes active
  useEffect(() => {
    if (activeTab === "history" && historySessions.length === 0) {
      loadHistorySessions();
    }
  }, [activeTab, loadHistorySessions, historySessions.length]);

  const fetchSpecificHistoryDate = async (dateStr: string) => {
    if (!dateStr) {
      setSpecificDaySessions(null);
      return;
    }

    try {
      setIsLoadingHistory(true);
      const res = await getHistoryShiftSessionsAction(14, dateStr);
      if (res.success && res.sessions) {
        const mappedSessions: ShiftSession[] = res.sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          userPosition: s.userPosition,
          taskRole: s.taskRole,
          shift: s.shift,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          items: s.items.map((it) => ({
            id: it.id,
            label: it.label,
            category: it.category,
            completedAt: it.completedAt,
            taskWorkId: it.taskWorkId,
          })),
          notified: true,
          branchName: s.branchName,
        }));
        setSpecificDaySessions(mappedSessions);
      }
    } catch (err) {
      console.error("Failed to fetch specific date history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDateSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedHistoryDate(val);
    fetchSpecificHistoryDate(val);
  };

  // Load assistant manager checklist directly from Supabase DB
  const loadAssistantChecklist = useCallback(async (shift: ShiftType) => {
    if (currentRole !== "manager_assistant") return;
    try {
      setIsLoadingChecklist(true);
      const res = await getOrCreateShiftSessionAction({
        userId: user.id,
        userName: user.name,
        position: "ผู้ช่วยผู้จัดการร้าน",
        shift: shift,
      });
      if (res.success && res.session) {
        setAssistantSession(res.session);
        setMyChecklistItems(res.session.items);
      }
    } catch (err) {
      console.error("Failed to load assistant checklist from DB:", err);
    } finally {
      setIsLoadingChecklist(false);
    }
  }, [currentRole, user]);

  useEffect(() => {
    if (currentRole === "manager_assistant") {
      loadAssistantChecklist(myChecklistShift);
    } else {
      setAssistantSession(null);
      setMyChecklistItems([]);
      if (activeTab === "checklist") {
        setActiveTab("overview");
      }
    }
  }, [currentRole, myChecklistShift, loadAssistantChecklist, activeTab]);

  // Role metadata configurations
  const roleConfig = {
    manager_assistant: {
      title: "ผู้ช่วยผู้จัดการร้าน (Assistant Manager)",
      badge: "bg-[#FAF2EB] text-[#78483B] border-[#EADBCE]",
      description: "ตรวจสอบความเรียบร้อยหน้างาน รับรองกะพนักงานเบื้องต้น และรายงานสรุป",
      primaryDuty: "ตรวจรับรองกะงานพนักงาน (Morning / Afternoon Sign-off)",
      icon: "📋",
    },
    manager: {
      title: "ผู้จัดการร้าน (Store Manager)",
      badge: "bg-[#2B1413] text-amber-300 border-[#2B1413]",
      description: "กำกับดูแลภาพรวมสาขา อนุมัติขั้นสุดท้าย และควบคุมมาตรฐานการปฏิบัติงาน",
      primaryDuty: "อนุมัติขั้นสุดท้าย (Manager Final Approval) & ควบคุมดัชนีร้าน",
      icon: "👔",
    },
    committee: {
      title: "กรรมการบริหาร (Executive Committee)",
      badge: "bg-amber-100 text-[#2B1413] border-amber-300 font-bold",
      description: "ตรวจสอบนโยบาย ติดตาม KPI คุณภาพสาขา และดูรายงานสรุปประสิทธิภาพ",
      primaryDuty: "ตรวจสอบดัชนีคุณภาพ (Quality Audit) & สรุปผลการดำเนินงาน",
      icon: "🏛️",
    },
    general_manager: {
      title: "ผู้จัดการทั่วไป (General Manager)",
      badge: "bg-amber-300 text-[#2B1413] border-amber-400 font-bold",
      description: "บริหารระดับสูง กำหนดทิศทาง ระเบียบปฏิบัติของทุกสาขา มีอำนาจสูงสุดคล้ายกรรมการบริหาร",
      primaryDuty: "ตรวจสอบดัชนีภาพรวม และติดตามความก้าวหน้า",
      icon: "🌟",
    },
  }[currentRole];

  // Helper metrics
  const unreadCount = notifications.filter((n) => !n.read).length;
  const completedSessions = sessions.filter((s) => s.completedAt);
  const pendingApprovalsCount = sessions.filter((s) => {
    const app = approvals[s.id];
    const isAssistantSession = s.taskRole === "manager_assistant" || s.userPosition === "ผู้ช่วยผู้จัดการร้าน";
    if (currentRole === "manager_assistant") {
      // Assistant manager cannot approve tasks from assistant manager
      if (isAssistantSession) return false;
      return !app?.assistantApproved;
    }
    return !app?.managerApproved;
  }).length;

  const totalChecklistItems = sessions.reduce((acc, s) => acc + s.items.length, 0);
  const completedChecklistItems = sessions.reduce(
    (acc, s) => acc + s.items.filter((i) => i.completedAt).length,
    0
  );
  const complianceRate =
    totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 95;

  function showToast(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  }

  async function handleApproveSession(sessionId: string, type: "assistant" | "manager") {
    // Check if target session is from assistant manager
    const target = sessions.find((s) => s.id === sessionId);
    const isAssistantSession =
      target?.taskRole === "manager_assistant" || target?.userPosition === "ผู้ช่วยผู้จัดการร้าน";

    if (isAssistantSession && currentRole === "manager_assistant") {
      showToast("เฉพาะผู้จัดการร้านหรือกรรมการบริหารเท่านั้นที่สามารถอนุมัติงานของผู้ช่วยผู้จัดการร้านได้");
      return;
    }

    // Optimistic UI update
    setApprovals((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [type === "assistant" ? "assistantApproved" : "managerApproved"]: true,
      },
    }));

    try {
      const roleForDb =
        type === "assistant"
          ? "manager_assistant"
          : (currentRole === "committee" || currentRole === "general_manager")
            ? currentRole
            : "manager";

      const res = await approveShiftSessionAction({
        shiftSessionId: sessionId,
        role: roleForDb,
      });

      if (res.success) {
        showToast(
          type === "assistant"
            ? "บันทึกการรับรองกะโดยผู้ช่วยผู้จัดการลงฐานข้อมูลเรียบร้อยแล้ว ✓"
            : (currentRole === "committee" || currentRole === "general_manager")
              ? `รับรองผลการตรวจงานโดย${roleConfig.title}ลงฐานข้อมูลเรียบร้อยแล้ว ✓`
              : "อนุมัติกะโดยผู้จัดการร้านลงฐานข้อมูลเรียบร้อยแล้ว ✓"
        );
        await loadDbSessions();
      } else {
        showToast(res.error || "บันทึกในระบบเบื้องต้นแล้ว (Local)");
      }
    } catch {
      showToast("บันทึกในระบบเบื้องต้นแล้ว (Local)");
    }
  }

  async function handleToggleMyItem(itemId: string) {
    const item = myChecklistItems.find((i) => i.id === itemId);
    if (!item) return;

    const willBeDone = !item.completedAt;
    const newCompletedAt = willBeDone ? new Date().toISOString() : null;

    // Optimistic UI update
    setMyChecklistItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, completedAt: newCompletedAt } : i))
    );

    // Persist to Supabase database
    try {
      await toggleTaskWorkAction({
        shiftSessionId: assistantSession?.id,
        taskId: itemId,
        taskWorkId: item.taskWorkId,
        completed: willBeDone,
      });
      // Refresh live shift sessions in background
      loadDbSessions();
    } catch (err) {
      console.error("Failed to toggle assistant task work in DB:", err);
    }
  }

  async function handleResetChecklistData() {
    if (confirm("ต้องการรีเซ็ตข้อมูลประวัติเช็คลิสต์ทั้งหมดของวันนี้เป็นค่าว่างใช่หรือไม่?")) {
      try {
        setIsResetting(true);
        await resetTodayChecklistDataAction();
        secureSetItem("app_sessions", "[]");
        secureRemoveItem("app_active_session");
        secureRemoveItem("app_manager_read_notifs");
        showToast("รีเซ็ตข้อมูลเช็คลิสต์ประจำวันเรียบร้อยแล้ว ✓");
        await loadDbSessions(true);
        if (currentRole === "manager_assistant") {
          await loadAssistantChecklist(myChecklistShift);
        }
      } catch (err) {
        console.error("Reset error:", err);
        showToast("เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล");
      } finally {
        setIsResetting(false);
      }
    }
  }

  function handleMarkAllNotifsRead() {
    const allIds = notifications.map((n) => n.shiftSessionId);
    try {
      secureSetItem("app_manager_read_notifs", JSON.stringify(allIds));
    } catch { }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อย");
  }

  const activeHistorySource = specificDaySessions !== null ? specificDaySessions : historySessions;
  const filteredHistory = activeHistorySource.filter((s) => {
    const matchesSearch =
      s.userName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (s.userPosition || "").toLowerCase().includes(historySearch.toLowerCase());
    const matchesShift = historyShiftFilter === "all" || s.shift === historyShiftFilter;
    return matchesSearch && matchesShift;
  });

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2B1413] pb-16 font-sans">
      {/* ─── Top Brand Navigation Bar ────────────────────────────────────────────── */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-[#EADBCE] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo size={40} showText={false} isDark={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-[#2B1413] tracking-tight">
                  Eater Egg Fresh Mart
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EB] text-[#78483B] border border-[#EADBCE]">
                  {user.branchName || "ไม่ได้ระบุสาขา"}
                </span>
              </div>
              <p className="text-[11px] text-[#78483B] hidden sm:block">
                ระบบกำกับดูแลและตรวจสอบมาตรฐานงานสาขา (Operations & Audit Portal)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="p-2 text-[#78483B] hover:text-[#2B1413] hover:bg-[#FAF4EC] rounded-xl transition-all relative cursor-pointer"
                title="การแจ้งเตือนงานสาขา"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main Content Container ───────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Notification Alert */}
        {actionFeedback && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ปิด
            </button>
          </div>
        )}

        {/* ─── Executive Welcome Banner ───────────────────────────────────────── */}
        <header className="bg-white border border-[#EADBCE] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-extrabold text-[#2B1413] tracking-tight">
                สวัสดี, {user.name}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${roleConfig.badge}`}>
                <span>{roleConfig.icon}</span>
                <span>{roleConfig.title}</span>
              </span>
            </div>
            <p className="text-xs text-[#78483B] max-w-2xl leading-relaxed">
              {roleConfig.description}
            </p>
            <p className="text-[11px] text-[#9C6C60] font-mono pt-0.5">
              ภารกิจหลักวันนี้: <span className="font-semibold text-[#2B1413]">{roleConfig.primaryDuty}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 z-10 flex-wrap sm:flex-nowrap">
            {currentRole === "manager_assistant" && (
              <button
                type="button"
                onClick={() => setActiveTab("checklist")}
                className="px-4 py-2.5 bg-[#2B1413] hover:bg-[#3D1D1B] active:bg-black text-amber-300 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>ตรวจเช็คลิสต์ประจำกะ →</span>
              </button>
            )}
          </div>
        </header>

        {/* ─── Navigation Tabs (Tailored to Executive & Operations) ──────────── */}
        <div className="bg-[#F7F1E9] p-1.5 rounded-2xl border border-[#EADBCE] shadow-2xs">
          <div className={`grid ${currentRole === "manager_assistant" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-1`}>
            {[
              {
                id: "overview" as DashboardTab,
                label: "ภาพรวมและการรับรองกะ",
                icon: "📋",
                desc: "ตรวจรับรองกะและแจ้งเตือน",
              },
              ...(currentRole === "manager_assistant"
                ? [
                  {
                    id: "checklist" as DashboardTab,
                    label: "เช็คลิสต์ตรวจงานของฉัน",
                    icon: "✅",
                    desc: "บันทึกเช็คลิสต์ประจำกะ",
                  },
                ]
                : []),
              {
                id: "history" as DashboardTab,
                label: "ประวัติการตรวจสอบย้อนหลัง",
                icon: "🕒",
                desc: "ค้นหาและดูรายละเอียดทุกกะ",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col ${activeTab === tab.id
                  ? "bg-[#2B1413] text-amber-300 shadow-sm font-bold"
                  : "text-[#78483B] hover:text-[#2B1413] hover:bg-white/70"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </div>
                <span className={`text-[10px] font-normal pl-5 hidden sm:block ${activeTab === tab.id ? "text-amber-200/80" : "text-[#9C6C60]"}`}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW & LIVE SHIFT APPROVALS ──────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Live Shift Handover & Approval Queue */}
            <div className="bg-white border border-[#EADBCE] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EADBCE] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#2B1413] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>รายการกะงานสาขา & สถานะการรับรอง (Shift Handover & Approval Queue)</span>
                    </h3>
                    {isLiveFromDb && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-[#2B1413] border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Supabase Live DB</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78483B] mt-0.5">
                    ตรวจสอบความเรียบร้อยของรายการเช็คลิสต์และกดรับรองกะงาน
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => loadDbSessions(true)}
                    disabled={isLoadingDb}
                    className="text-[11px] font-semibold text-[#2B1413] hover:text-[#442220] bg-[#FAF4EC] hover:bg-[#F2E7DC] border border-[#EADBCE] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="โหลดข้อมูลล่าสุดจากฐานข้อมูล"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isLoadingDb ? "animate-spin text-amber-600" : ""}
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>{isLoadingDb ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetChecklistData}
                    disabled={isResetting}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="ล้างข้อมูลเช็คลิสต์ประจำวันทั้งหมดในฐานข้อมูลเพื่อเริ่มทดสอบใหม่"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    <span>{isResetting ? "กำลังรีเซ็ต..." : "รีเซ็ตข้อมูลเช็คลิสต์"}</span>
                  </button>

                  <span className="text-[11px] font-mono text-[#78483B] bg-[#FAF4EC] border border-[#EADBCE] px-2.5 py-1 rounded-lg">
                    วันนี้: {fmtDate(new Date().toISOString())}
                  </span>
                </div>
              </div>

              {/* Shifts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EADBCE] text-[#78483B] font-semibold bg-[#FAF4EC]">
                      <th className="py-2.5 px-3 rounded-l-lg">ผู้ปฏิบัติงาน</th>
                      <th className="py-2.5 px-3">ตำแหน่ง / กะ</th>
                      <th className="py-2.5 px-3">ความคืบหน้า</th>
                      <th className="py-2.5 px-3">เวลาส่งกะ</th>
                      <th className="py-2.5 px-3 text-center">การรับรองของผู้ช่วย</th>
                      <th className="py-2.5 px-3 text-center">การอนุมัติของผู้จัดการ</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/70">
                    {sessions.filter(sess => {
                      if (currentRole === "manager_assistant") {
                        return !(sess.taskRole === "manager_assistant" || sess.userPosition === "ผู้ช่วยผู้จัดการร้าน");
                      }
                      return true;
                    }).map((sess) => {
                      const completedCount = sess.items.filter((i) => i.completedAt).length;
                      const pct = Math.round((completedCount / (sess.items.length || 1)) * 100);
                      const app = approvals[sess.id] || {};
                      const isAssistantSession =
                        sess.taskRole === "manager_assistant" || sess.userPosition === "ผู้ช่วยผู้จัดการร้าน";

                      return (
                        <tr key={sess.id} className="hover:bg-[#FFFDF9] transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#2B1413]">
                            {sess.userName}
                          </td>
                          <td className="py-3 px-3 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${isAssistantSession
                                  ? "bg-amber-100 text-[#2B1413] border border-amber-300"
                                  : "bg-[#FAF4EC] text-[#78483B] border border-[#EADBCE]"
                                  }`}
                              >
                                {sess.userPosition || "พนักงาน"}
                              </span>
                              {getShiftBadge(sess.shift)}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono text-[#78483B]">
                                <span>{completedCount}/{sess.items.length}</span>
                                <span className="font-bold text-[#2B1413]">{pct}%</span>
                              </div>
                              <div className="w-24 bg-[#F2E7DC] h-1.5 rounded-full overflow-hidden border border-[#EADBCE]">
                                <div
                                  className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#78483B] text-[11px]">
                            {sess.completedAt ? fmtTime(sess.completedAt) : (
                              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                                กำลังปฏิบัติงาน
                              </span>
                            )}
                          </td>
                          {/* Assistant Approval */}
                          <td className="py-3 px-3 text-center">
                            {isAssistantSession ? (
                              <span className="text-[10px] text-[#A88B77] font-medium">
                                - (งานผู้ช่วย)
                              </span>
                            ) : app.assistantApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ รับรองแล้ว
                              </span>
                            ) : !hasAssistantLoggedInToday ? (
                              <span className="text-[10px] text-[#A88B77] font-medium tooltip" title="ไม่มีผู้ช่วยเข้างานในวันนี้ จึงข้ามขั้นตอนนี้ให้ผู้จัดการพิจารณาโดยตรง">
                                - (ข้าม)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                รอดำเนินการ
                              </span>
                            )}
                          </td>
                          {/* Manager Approval */}
                          <td className="py-3 px-3 text-center">
                            {app.managerApproved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ อนุมัติแล้ว
                              </span>
                            ) : isAssistantSession ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                รอผู้จัดการอนุมัติ
                              </span>
                            ) : app.assistantApproved || !hasAssistantLoggedInToday ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                รอผู้จัดการอนุมัติ
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#A88B77] font-medium">
                                (รอผู้ช่วยรับรองก่อน)
                              </span>
                            )}
                          </td>
                          {/* Action button */}
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedSession(sess)}
                              className="px-3 py-1.5 text-xs font-semibold text-[#2B1413] bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-amber-200/50"
                            >
                              ตรวจรับรอง →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shift Notifications Log */}
            <div className="bg-white border border-[#EADBCE] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EADBCE] pb-3">
                <h3 className="text-sm font-bold text-[#2B1413] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>บันทึกการส่งงานและแจ้งเตือนล่าสุด (Recent Shift Notifications)</span>
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotifsRead}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                  >
                    อ่านทั้งหมดแล้ว
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-[#78483B] text-xs bg-[#FAF4EC]/60 rounded-xl border border-dashed border-[#EADBCE]">
                    ยังไม่มีรายการส่งมอบกะในวันนี้ (ข้อมูลจะแสดงอัตโนมัติเมื่อมีพนักงานเริ่มงานหรือส่งกะ)
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const target = sessions.find((s) => s.id === notif.shiftSessionId);
                    const isCompleted =
                      !!target?.completedAt ||
                      ((target?.items.length ?? 0) > 0 &&
                        (target?.items.every((i) => i.completedAt) ?? false));
                    const doneCount = target?.items.filter((i) => i.completedAt).length ?? 0;
                    const totalCount = target?.items.length ?? 0;

                    return (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${notif.read
                          ? "bg-[#FAF4EC]/50 border-[#EADBCE]"
                          : "bg-amber-50/70 border-amber-300"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${notif.read ? "bg-[#B89B85]" : "bg-amber-500"
                              }`}
                          />
                          <div>
                            <p className="text-xs font-semibold text-[#2B1413]">
                              {notif.userName}{" "}
                              <span className="font-normal text-[#78483B]">
                                ({notif.userPosition || "พนักงาน"})
                              </span>{" "}
                              {isCompleted ? (
                                <span className="text-emerald-700 font-semibold">ส่งมอบกะ {getShiftName(notif.shift)}</span>
                              ) : (
                                <span className="text-amber-800">
                                  กำลังปฏิบัติงานกะ {getShiftName(notif.shift)} ({doneCount}/
                                  {totalCount} ข้อ)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-[#78483B]">
                              {isCompleted ? "ส่งเมื่อ" : "บันทึกล่าสุด"} {fmtTime(notif.completedAt)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (target) setSelectedSession(target);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#2B1413] hover:text-[#442220] bg-white hover:bg-[#FAF4EC] border border-[#EADBCE] rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          ดูรายงาน
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MY CHECKLIST (ASSISTANT MANAGER ONLY) ─────────────────── */}
        {activeTab === "checklist" && currentRole === "manager_assistant" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-[#EADBCE] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADBCE] pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#2B1413] flex items-center gap-2">
                    <span>{roleConfig.icon}</span>
                    <span>เช็คลิสต์ตรวจงานประจำกะของ {roleConfig.title}</span>
                  </h3>
                  <p className="text-xs text-[#78483B] mt-0.5">
                    ติ๊กถูกเมื่อทำการตรวจสอบแต่ละขั้นตอนเสร็จสมบูรณ์ (เชื่อมต่อฐานข้อมูลจริง)
                  </p>
                </div>

                {/* Shift Selector */}
                <div className="inline-flex bg-[#FAF4EC] p-1 rounded-xl border border-[#EADBCE]">
                  {(["morning", "afternoon"] as ShiftType[]).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => {
                        setMyChecklistShift(sh);
                        loadAssistantChecklist(sh);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${myChecklistShift === sh
                        ? "bg-[#2B1413] text-amber-300 shadow-sm"
                        : "text-[#78483B] hover:text-[#2B1413]"
                        }`}
                    >
                      {sh === "morning" ? "กะเช้า" : "กะบ่าย"}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingChecklist ? (
                <div className="py-12 text-center text-[#78483B] text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังดึงรายการเช็คลิสต์จากฐานข้อมูล...</span>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  {(() => {
                    const done = myChecklistItems.filter((i) => i.completedAt).length;
                    const total = myChecklistItems.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <div className="bg-[#FAF4EC] p-3.5 rounded-xl border border-[#EADBCE] space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-[#2B1413]">
                          <span>ความคืบหน้าการตรวจเช็คลิสต์:</span>
                          <span className="font-mono text-amber-800">
                            {done} จาก {total} ข้อ ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EADBCE] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Checklist items */}
                  {myChecklistItems.length === 0 ? (
                    <div className="py-8 text-center text-[#78483B] text-xs border border-dashed border-[#EADBCE] rounded-xl bg-[#FAF4EC]/50">
                      ไม่พบรายการเช็คลิสต์ของตำแหน่งผู้ช่วยผู้จัดการร้านในฐานข้อมูลสำหรับกะนี้
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myChecklistItems.map((item, idx) => {
                        const isDone = !!item.completedAt;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleMyItem(item.id)}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${isDone
                              ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50"
                              : "bg-white border-[#EADBCE] hover:border-amber-400 hover:bg-[#FFFDF9]"
                              }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${isDone
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-[#C9B29F] bg-white"
                                }`}
                            >
                              {isDone && (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#78483B]">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                {item.category && (
                                  <span className="text-[10px] font-semibold text-[#2B1413] bg-[#FAF4EC] px-1.5 py-0.5 rounded border border-[#EADBCE]">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs sm:text-sm font-medium mt-1 ${isDone
                                  ? "text-[#A88B77] line-through opacity-80"
                                  : "text-[#2B1413]"
                                  }`}
                              >
                                {item.label}
                              </p>
                              {item.completedAt && (() => {
                                let isLate = item.isLate ?? false;
                                if (!isLate && item.category) {
                                  const match = item.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                                  if (match) {
                                    const endStr = match[2];
                                    const [endHr, endMin] = endStr.split(':').map(Number);
                                    const completedDate = new Date(item.completedAt);
                                    const deadlineDate = new Date(); // use today
                                    deadlineDate.setHours(endHr, endMin, 0, 0);
                                    if (completedDate > deadlineDate) {
                                      isLate = true;
                                    }
                                  }
                                }
                                return (
                                  <p className="text-[10px] font-mono text-emerald-600 mt-0.5">
                                    บันทึกเมื่อ: {fmtTime(item.completedAt)}
                                    {isLate && <span className="text-amber-600 font-bold ml-1 font-sans">(ล่าช้า)</span>}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: AUDIT HISTORY & SHIFT REPORTS ───────────────────────────── */}
        {activeTab === "history" && (
          <div className="bg-white border border-[#EADBCE] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EADBCE] pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#2B1413] flex items-center gap-2">
                  <span>🕒</span>
                  <span>ประวัติและรายงานการตรวจสอบย้อนหลัง (Audit Inspection History)</span>
                </h3>
                <p className="text-xs text-[#78483B] mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>ค้นหาและเรียกดูรายละเอียดของแต่ละกะที่ปฏิบัติงานแล้ว</span>
                  <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    แสดงข้อมูลย้อนหลัง 14 วัน (2 สัปดาห์)
                  </span>
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">

                {/* Specific Date Fetcher */}
                <div className="flex items-center gap-1.5 bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-2 py-1">
                  <input
                    type="date"
                    value={selectedHistoryDate}
                    onChange={handleDateSelection}
                    className="bg-transparent text-xs text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none cursor-pointer"
                  />
                  {selectedHistoryDate && (
                    <button
                      type="button"
                      onClick={() => handleDateSelection({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors"
                      title="Clear specific date and restore 14-days history"
                    >
                      ×
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือตำแหน่ง..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FAF4EC] border border-[#EADBCE] text-[#2B1413] placeholder:text-[#A88B77] rounded-xl focus:border-amber-400 focus:outline-none"
                />
                <select
                  value={historyShiftFilter}
                  onChange={(e) => setHistoryShiftFilter(e.target.value as "all" | ShiftType)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF4EC] border border-[#EADBCE] text-[#2B1413] rounded-xl focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">ทุกกะงาน</option>
                  <option value="morning">กะเช้า</option>
                  <option value="afternoon">กะบ่าย</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADBCE] text-[#78483B] font-semibold bg-[#FAF4EC]">
                    <th className="py-2.5 px-3 rounded-l-lg">รหัสกะ / วันที่</th>
                    <th className="py-2.5 px-3">ผู้ปฏิบัติงาน</th>
                    <th className="py-2.5 px-3">ตำแหน่ง</th>
                    <th className="py-2.5 px-3">กะงาน</th>
                    <th className="py-2.5 px-3">ข้อที่สำเร็จ</th>
                    <th className="py-2.5 px-3 text-center">สถานะรับรอง</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBCE]/70">
                  {filteredHistory.filter(sess => {
                    if (currentRole === "manager_assistant") {
                      return !(sess.taskRole === "manager_assistant" || sess.userPosition === "ผู้ช่วยผู้จัดการร้าน");
                    }
                    return true;
                  }).map((sess) => {
                    const doneCount = sess.items.filter((i) => i.completedAt).length;
                    const pct = Math.round((doneCount / sess.items.length) * 100);
                    const app = approvals[sess.id] || {};

                    return (
                      <tr key={sess.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3 px-3 font-mono text-[#78483B]">
                          <span className="font-semibold text-[#2B1413]">{sess.id}</span>
                          <span className="block text-[10px] text-[#A88B77]">{fmtDate(sess.startedAt)}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#2B1413]">
                          {sess.userName}
                        </td>
                        <td className="py-3 px-3 text-[#78483B]">
                          {sess.userPosition || "-"}
                        </td>
                        <td className="py-3 px-3">
                          {getShiftBadge(sess.shift)}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-[#2B1413]">{doneCount}/{sess.items.length}</span>
                          <span className="text-[10px] text-[#78483B] ml-1">({pct}%)</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {app.managerApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ อนุมัติสมบูรณ์
                            </span>
                          ) : (sess.taskRole === "manager_assistant" || sess.userPosition === "ผู้ช่วยผู้จัดการร้าน") ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              รอผู้จัดการอนุมัติ
                            </span>
                          ) : app.assistantApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#2B1413] border border-amber-300">
                              ผู้ช่วยตรวจแล้ว
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF4EC] text-[#78483B] border border-[#EADBCE]">
                              รอดำเนินการ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSession(sess)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#2B1413] bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors cursor-pointer shadow-sm shadow-amber-200/50"
                          >
                            เปิดดูข้อตรวจ →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </main>

      {/* ─── Detail Modal (Inspect Shift Checklists) ──────────────────────────── */}
      {selectedSession && (() => {
        const isAssistantSess =
          selectedSession.taskRole === "manager_assistant" ||
          selectedSession.userPosition === "ผู้ช่วยผู้จัดการร้าน";
        const isMgrOrHigher = currentRole === "manager" || currentRole === "committee" || currentRole === "general_manager";

        const canApprove = isAssistantSess
          ? isMgrOrHigher && !approvals[selectedSession.id]?.managerApproved
          : currentRole === "manager_assistant"
            ? !approvals[selectedSession.id]?.assistantApproved
            : !approvals[selectedSession.id]?.managerApproved;

        const isApproved = isAssistantSess
          ? !!approvals[selectedSession.id]?.managerApproved
          : currentRole === "manager_assistant"
            ? !!approvals[selectedSession.id]?.assistantApproved
            : !!approvals[selectedSession.id]?.managerApproved;

        const approveTitle = isAssistantSess
          ? (currentRole === "committee" || currentRole === "general_manager")
            ? roleConfig.title
            : "ผู้จัดการร้าน"
          : roleConfig.title;

        return (
          <SessionDetailModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            canApprove={canApprove}
            isApproved={isApproved}
            approveRoleTitle={approveTitle}
            onApprove={(sessId) => {
              handleApproveSession(
                sessId,
                isAssistantSess ? "manager" : currentRole === "manager_assistant" ? "assistant" : "manager"
              );
            }}
          />
        );
      })()}

      {/* ─── Footer with Reset Option (Same style as staff pages) ─────────────── */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78483B] border-t border-[#EADBCE] mt-12">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#2B1413]">Eater Egg Fresh Mart</span>
          <span>•</span>
          <span>Operations & Audit Management Portal</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleResetChecklistData}
            disabled={isResetting}
            className="text-xs text-[#78483B] hover:text-rose-700 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="ล้างข้อมูลเช็คลิสต์ทั้งหมดเพื่อเริ่มทดสอบใหม่"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>{isResetting ? "กำลังรีเซ็ตข้อมูล..." : "รีเซ็ตข้อมูลเช็คลิสต์"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
