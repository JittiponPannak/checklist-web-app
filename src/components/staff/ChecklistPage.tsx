"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistItem, ShiftSession, ShiftType } from "../../types";
import { fmtTime, getSelectedShift } from "../../data/storage";
import { secureGetItem, secureSetItem, secureRemoveItem } from "../../utils/crypto";
import { getShiftBadge } from "../common/Badge";
import { useModalFocusTrap } from "../common/ModalFocusTrap";
import { NotificationCenter } from "../common/NotificationCenter";
import { PointStreakBadge } from "../common/PointStreakBadge";
import { ThemeToggle } from "../common/ThemeToggle";
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  Lock, 
  LogOut, 
  Sparkles, 
  ArrowRight, 
  Store, 
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import { BranchRefrigeratorChecklist } from "./BranchRefrigeratorChecklist";
import { LateReasonModal } from "../common/LateReasonModal";
import { getOrCreateShiftSessionAction } from "../../actions/checklist";

function getCategoryColor(category?: string) {
  if (!category) {
    return {
      dot: "bg-amber-600",
      text: "text-[var(--color-text)] font-extrabold",
    };
  }
  const cat = category.toLowerCase();
  if (cat.includes("แช่") || cat.includes("เย็น") || cat.includes("ตู้") || cat.includes("chill") || cat.includes("temp")) {
    return {
      dot: "bg-sky-600",
      text: "text-sky-950 dark:text-sky-200 font-extrabold",
    };
  }
  if (cat.includes("สด") || cat.includes("สินค้า") || cat.includes("stock") || cat.includes("สต็อก") || cat.includes("เรียง")) {
    return {
      dot: "bg-emerald-600",
      text: "text-emerald-950 dark:text-emerald-200 font-extrabold",
    };
  }
  if (cat.includes("ปิด") || cat.includes("สรุป") || cat.includes("ปลอดภัย") || cat.includes("เงิน")) {
    return {
      dot: "bg-orange-600",
      text: "text-orange-950 dark:text-orange-300 font-extrabold",
    };
  }
  return {
    dot: "bg-amber-600",
    text: "text-[var(--color-text)] font-extrabold",
  };
}

export function ChecklistPage({
  session,
  selectedShift: propSelectedShift,
  onUpdate,
  onEndShift,
  onOpenDashboard,
  onExit,
}: {
  session: ShiftSession;
  selectedShift?: ShiftType | null;
  onUpdate: (s: ShiftSession) => void;
  onEndShift: (continueNextShift?: boolean) => void;
  onOpenDashboard?: () => void;
  onExit?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [mobileTab, setMobileTab] = useState<"tasks" | "refrigerators">("tasks");

  const isStockShift =
    session.taskRole === "stock" ||
    Boolean(session.userPosition?.includes("สต็อก") || session.userPosition?.includes("stock"));

  const activeSelectedShift = propSelectedShift || (typeof window !== "undefined"
    ? getSelectedShift()
    : null);

  const hasNextShift = session.shift === "morning";

  const [continueShift, setContinueShift] = useState<boolean>(() => {
    if (!hasNextShift) return false;
    if (typeof window !== "undefined") {
      return secureGetItem("app_queue_afternoon") === "true";
    }
    return false;
  });

  const { dialogRef: confirmDialogRef, handleKeyDown: handleConfirmKeyDown } = useModalFocusTrap(
    showConfirm,
    () => setShowConfirm(false)
  );
  const { dialogRef: exitDialogRef, handleKeyDown: handleExitKeyDown } = useModalFocusTrap(
    showExitConfirm,
    () => setShowExitConfirm(false)
  );

  const [items, setItems] = useState<ChecklistItem[]>(session.items || []);
  const [shiftCompleted, setShiftCompleted] = useState<boolean>(Boolean(session.completedAt));

  useEffect(() => {
    if (session.items) {
      setItems(session.items);
    }
  }, [session.items]);

  useEffect(() => {
    setShiftCompleted(Boolean(session.completedAt));
  }, [session.completedAt]);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Background sync every 8 seconds to reflect tasks added/disabled by manager live
  useEffect(() => {
    let isMounted = true;

    async function syncTasksFromDb() {
      if (typeof document !== "undefined" && document.hidden) return;
      const currentSess = sessionRef.current;
      if (!currentSess?.userId) return;

      try {
        const res = await getOrCreateShiftSessionAction({
          userId: currentSess.userId,
          userName: currentSess.userName,
          position: currentSess.userPosition || "พนักงาน",
          shift: currentSess.shift,
        });

        if (res.success && res.session && isMounted) {
          const freshSession = res.session;
          const freshItems = freshSession.items || [];
          const curItems = itemsRef.current;

          const curSig = curItems.map((i) => `${i.id}:${i.label}:${i.category}`).join("|");
          const freshSig = freshItems.map((i) => `${i.id}:${i.label}:${i.category}`).join("|");

          if (curSig !== freshSig) {
            const merged = freshItems.map((fItem) => {
              const localMatch = curItems.find((i) => i.id === fItem.id);
              if (localMatch && localMatch.completedAt && !fItem.completedAt) {
                return {
                  ...fItem,
                  completedAt: localMatch.completedAt,
                  comment: localMatch.comment,
                  isLate: localMatch.isLate,
                };
              }
              return fItem;
            });

            setItems(merged);
            onUpdateRef.current({
              ...currentSess,
              items: merged,
            });
          }
        }
      } catch (err) {
        console.warn("Live task sync error in ChecklistPage:", err);
      }
    }

    const interval = setInterval(syncTasksFromDb, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const total = items.length;
  const done = items.filter((i) => i.completedAt).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = progress === 100;

  const canContinueShift = hasNextShift && progress === 100 && !shiftCompleted;
  const canFinishShift = progress === 100 && !shiftCompleted;

  const filteredItems = items.filter((i) => {
    if (filter === "pending") return !i.completedAt;
    if (filter === "done") return !!i.completedAt;
    return true;
  });

  const [lateModalTarget, setLateModalTarget] = useState<{
    id: string;
    label: string;
    deadlineText?: string;
  } | null>(null);

  function applyToggle(id: string, comment: string | null, isLate: boolean) {
    const updated = items.map((item) =>
      item.id === id
        ? {
            ...item,
            completedAt: new Date().toISOString(),
            isLate,
            comment: comment ?? item.comment ?? null,
          }
        : item
    );
    setItems(updated);
    if (shiftCompleted) {
      setShiftCompleted(false);
    }
    const allComplete = updated.length > 0 && updated.every((i) => i.completedAt);
    let updatedSession = { ...session, completedAt: null, items: updated };
    if (allComplete && !session.notified) {
      updatedSession = { ...updatedSession, notified: true };
    }
    onUpdate(updatedSession);
  }

  function handleLateReasonSubmit(reason: string) {
    if (!lateModalTarget) return;
    applyToggle(lateModalTarget.id, reason, true);
    setLateModalTarget(null);
  }

  function toggleItem(id: string) {
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    if (targetItem.completedAt) {
      const updated = items.map((item) =>
        item.id === id ? { ...item, completedAt: null, isLate: false, comment: null } : item
      );
      setItems(updated);
      if (shiftCompleted) {
        setShiftCompleted(false);
      }
      onUpdate({ ...session, completedAt: null, items: updated });
      return;
    }

    let isLate = false;
    let deadlineText: string | undefined;
    if (targetItem.category) {
      const match = targetItem.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (match) {
        const endStr = match[2];
        const [endHr, endMin] = endStr.split(":").map(Number);
        const deadlineDate = new Date(session.startedAt);
        deadlineDate.setHours(endHr, endMin, 0, 0);
        deadlineText = `${targetItem.category} (สิ้นสุด ${endStr} น.)`;
        if (new Date() > deadlineDate) {
          isLate = true;
        }
      }
    }

    if (isLate) {
      setLateModalTarget({
        id: targetItem.id,
        label: targetItem.label,
        deadlineText,
      });
      return;
    }

    applyToggle(id, null, false);
  }

  function handleToggleContinue() {
    if (!canContinueShift) return;
    const nextVal = !continueShift;
    setContinueShift(nextVal);
    if (typeof window !== "undefined") {
      if (nextVal) {
        secureSetItem("app_queue_afternoon", "true");
      } else {
        secureRemoveItem("app_queue_afternoon");
      }
    }
  }

  function endShift() {
    setShowConfirm(false);
    setShiftCompleted(true);
    onEndShift(continueShift);
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col items-center pb-28 sm:pb-32 px-3 sm:px-6 pt-3 sm:pt-6">
      {/* Assistive Tech Announcements */}
      <div aria-live="polite" className="sr-only">
        ความคืบหน้าเช็คลิสต์ {done} จาก {total} รายการ ({progress}%)
      </div>

      <div className={`w-full space-y-4 transition-all ${isStockShift ? "max-w-6xl" : "max-w-2xl"}`}>
        {/* Top App Bar */}
        <nav aria-label="แถบข้อมูลผู้ใช้งานและเครื่องมือ" className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 shadow-xs flex items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-amber-glow)] border border-amber-300 text-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Store size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate max-w-[120px] sm:max-w-none">
                  {session.branchName || "สาขาหลัก"}
                </span>
                {session.userPosition && (
                  <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text)] bg-[var(--color-surface-2)] px-1.5 sm:px-2 py-0.5 rounded-full border border-[var(--color-border)] shrink-0">
                    {session.userPosition}
                  </span>
                )}
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-[var(--color-text)] truncate leading-tight">
                {session.userName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <PointStreakBadge />
            <NotificationCenter />
            <ThemeToggle />
            
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                aria-label="เปิดหน้าแดชบอร์ด"
                className="p-1.5 sm:p-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:text-[var(--color-text)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                title="เปิดหน้าแดชบอร์ด"
              >
                <LayoutDashboard size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="p-1.5 sm:p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:border-rose-700 transition-colors cursor-pointer min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              title="ออกจากหน้าเช็คลิสต์"
              aria-label="ออกจากหน้าเช็คลิสต์"
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>

        {/* Hero Progress Banner */}
        <header className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {getShiftBadge(session.shift)}
              <span className="text-xs sm:text-sm font-mono text-[var(--color-text)] flex items-center gap-1 font-semibold">
                <Clock size={14} className="text-amber-600" />
                เริ่ม {fmtTime(session.startedAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-[var(--color-text)]">เสร็จสิ้น</span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-[var(--color-text)]">
                {done}<span className="text-xs sm:text-sm text-[var(--color-text-muted)] font-bold">/{total}</span>
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="relative w-full h-2.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden p-0.5 border border-[var(--color-border-subtle)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                allDone ? "bg-emerald-600" : "bg-amber-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
              {allDone ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold text-xs shadow-2xs">
                  <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>ร้านสด สะอาด พร้อมบริการ 100% ครบทุกข้อ!</span>
                </span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>เหลืออีก {total - done} ข้อในการปฏิบัติงาน</span>
                </>
              )}
            </span>
            <span className={`font-mono font-black text-xs sm:text-sm ${allDone ? "text-emerald-700 dark:text-emerald-300" : "text-[var(--color-text)]"}`}>
              {progress}%
            </span>
          </div>
        </header>

        {/* Mobile Tab Switcher for Stock Shift */}
        {isStockShift && (
          <div className="lg:hidden flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] text-xs font-bold gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileTab("tasks")}
              className={`flex-1 py-2 rounded-lg text-center cursor-pointer transition-all ${
                mobileTab === "tasks"
                  ? "bg-[var(--color-brown)] text-amber-100 dark:bg-amber-400 dark:text-amber-950 shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              📋 งานประจำกะ ({done}/{total})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("refrigerators")}
              className={`flex-1 py-2 rounded-lg text-center cursor-pointer transition-all ${
                mobileTab === "refrigerators"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              ❄️ เช็คลิสต์ตู้แช่สาขา
            </button>
          </div>
        )}

        {/* Main Content Layout (2 Columns for Stock, 1 Column for Others) */}
        <div className={isStockShift ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" : ""}>
          {/* Left Column: Usual Shift Tasks */}
          <div className={`space-y-4 ${isStockShift && mobileTab === "refrigerators" ? "hidden lg:block" : "block"}`}>
            {/* Filter Segmented Control */}
            <div className="flex items-center justify-between gap-2 px-1">
          <div
            role="tablist"
            aria-label="กรองรายการเช็คลิสต์"
            onKeyDown={(e) => {
              const filterTabs: Array<"all" | "pending" | "done"> = ["all", "pending", "done"];
              const currentIndex = filterTabs.indexOf(filter);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setFilter(filterTabs[(currentIndex + 1) % filterTabs.length]);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setFilter(filterTabs[(currentIndex - 1 + filterTabs.length) % filterTabs.length]);
              }
            }}
            className="flex w-full sm:w-auto bg-[var(--color-surface-2)] p-1 rounded-xl text-xs font-semibold gap-1 border border-[var(--color-border)] shadow-2xs"
          >
            {(["all", "pending", "done"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filter === t}
                tabIndex={filter === t ? 0 : -1}
                onClick={() => setFilter(t)}
                className={`flex-1 sm:flex-initial px-2 sm:px-3.5 py-2 min-h-[40px] sm:min-h-[34px] rounded-lg transition-all text-center cursor-pointer inline-flex items-center justify-center truncate ${
                  filter === t
                    ? "bg-[var(--color-brown)] text-amber-200 dark:bg-amber-400 dark:text-amber-950 shadow-xs font-bold"
                    : "text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5 font-semibold"
                }`}
              >
                {t === "all" ? `ทั้งหมด (${total})` : t === "pending" ? `ที่ต้องทำ (${total - done})` : `เสร็จแล้ว (${done})`}
              </button>
            ))}
          </div>

          {allDone && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
              <Check size={12} strokeWidth={3} />
              พร้อมจบกะ
            </span>
          )}
        </div>

        {/* Shift Completed Notice Banner */}
        {shiftCompleted && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
              <Sparkles size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="font-extrabold">กะการทำงานนี้ได้รับการบันทึกจบกะแล้ว</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">คุณสามารถคลิกที่รายการด้านล่างเพื่อตรวจเช็คหรือแก้ไขต่อได้ตลอดเวลา</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShiftCompleted(false);
                onUpdate({ ...session, completedAt: null });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              ปลดล็อคเพื่อทำรายการต่อ
            </button>
          </div>
        )}

        {/* Tactile Checklist Cards */}
        <div className="space-y-2.5" role="group" aria-label="รายการตรวจสอบประจำกะ">
          {filteredItems.map((item, idx) => {
            const isDone = !!item.completedAt;
            const originalIndex = items.findIndex((i) => i.id === item.id);
            const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
            const showCategoryHeader = item.category && (!prevItem || prevItem.category !== item.category);

            return (
              <div key={item.id} className="space-y-1.5">
                {showCategoryHeader && (() => {
                  const catTheme = getCategoryColor(item.category);
                  return (
                    <div className="pt-3 pb-1 flex items-center gap-2 px-1">
                      <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} aria-hidden="true" />
                      <h2 className={`text-xs font-bold tracking-wide uppercase ${catTheme.text}`}>
                        {item.category}
                      </h2>
                    </div>
                  );
                })()}
                
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full group flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 active:scale-[0.99] ${
                    isDone
                      ? "bg-[var(--color-surface-2)]/80 border-[var(--color-border)] shadow-2xs"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-amber-400 hover:bg-amber-50/70 dark:hover:bg-amber-950/20 shadow-xs hover:shadow-sm"
                  }`}
                >
                  {/* Checkbox Visual Toggle Target */}
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform duration-150 group-active:scale-90 ${
                      isDone
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] group-hover:border-amber-400"
                    }`}
                  >
                    {isDone && (
                      <Check size={14} strokeWidth={3} className="animate-in zoom-in-50 duration-150" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs font-mono select-none pt-0.5 shrink-0 ${
                          isDone ? "text-[var(--color-text-muted)] font-bold" : "text-[var(--color-text)] font-extrabold"
                        }`}
                        aria-hidden="true"
                      >
                        {String(originalIndex + 1).padStart(2, "0")}
                      </span>
                      <p
                        className={`text-sm sm:text-base leading-snug transition-all ${
                          isDone
                            ? "text-[var(--color-text-muted)] line-through font-medium"
                            : "text-[var(--color-text)] font-medium"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>

                    {isDone && item.completedAt && (() => {
                      let isLate = item.isLate ?? false;
                      if (!isLate && item.category) {
                        const match = item.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                        if (match) {
                          const endStr = match[2];
                          const [endHr, endMin] = endStr.split(":").map(Number);
                          const completedDate = new Date(item.completedAt);
                          const deadlineDate = new Date(session.startedAt);
                          deadlineDate.setHours(endHr, endMin, 0, 0);
                          if (completedDate > deadlineDate) {
                            isLate = true;
                          }
                        }
                      }

                      return (
                        <div className="flex flex-col gap-1 mt-2 pl-0 sm:pl-6">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-emerald-900 dark:text-emerald-300 font-bold">
                            <CheckCircle2 size={13} className="text-emerald-700" />
                            <span>บันทึกเมื่อ {fmtTime(item.completedAt)}</span>
                            {isLate && (
                              <span className="text-rose-950 dark:text-rose-200 font-bold bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded-md ml-1">
                                (ล่าช้า)
                              </span>
                            )}
                          </div>
                          {item.comment && (
                            <div className="text-xs text-rose-900 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg px-2.5 py-1 flex items-start gap-1.5 font-sans font-normal">
                              <span className="font-semibold shrink-0">เหตุผล:</span>
                              <span className="break-words">{item.comment}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </button>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2.5">
                {filter === "pending" ? <Sparkles size={24} /> : <Check size={24} />}
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                {filter === "pending" ? "ยอดเยี่ยม! ตรวจเช็คครบถ้วนทุกข้อแล้ว" : "ไม่มีรายการในหมวดนี้"}
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
                {filter === "pending"
                  ? "ไม่มีงานค้างในหมวดนี้แล้ว คุณสามารถตรวจทานข้ออื่นหรือกดส่งมอบงานจบกะได้ทันที"
                  : "ยังไม่มีรายการที่ได้รับการบันทึก"}
              </p>
            </div>
          )}
        </div>
          </div>

          {/* Right Column: Branch Refrigerator Checklist for Stock Shift */}
          {isStockShift && (
            <div className={`space-y-4 ${mobileTab === "tasks" ? "hidden lg:block" : "block"}`}>
              <BranchRefrigeratorChecklist
                userId={session.userId}
                branchName={session.branchName}
                shiftSessionId={session.id}
                shift={session.shift}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Ergonomic Action Dock (Floor Staff Thumb Zone) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-md">
        <div className={`mx-auto flex items-center justify-between gap-2 sm:gap-3 ${isStockShift ? "max-w-6xl" : "max-w-2xl"}`}>
          {/* Progress pill indicator */}
          <div className="flex flex-col shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-[var(--color-text)] leading-tight">
              ความคืบหน้ารวม
            </span>
            <span className="text-xs sm:text-sm font-extrabold font-mono text-[var(--color-text)]">
              {progress}% <span className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-bold">({done}/{total})</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
            {/* Optional "ต่อกะ" Toggle for Morning Shift */}
            {hasNextShift && !shiftCompleted && (
              <button
                type="button"
                disabled={!canContinueShift}
                onClick={handleToggleContinue}
                className={`text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border font-bold flex items-center gap-1 transition-colors min-h-[40px] sm:min-h-[44px] cursor-pointer shrink-0 ${
                  !canContinueShift
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed"
                    : continueShift
                    ? "bg-[var(--color-brown)] text-amber-100 dark:bg-amber-400 dark:text-amber-950 border-[var(--color-text)] shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-amber-500"
                }`}
                title={canContinueShift ? "เลือกต่อกะบ่าย" : "ต้องครบ 100% ก่อนจึงจะเลือกต่อกะ"}
              >
                <ArrowRight size={14} strokeWidth={2.2} />
                <span className="hidden sm:inline">{continueShift ? "ต่อกะบ่าย (เลือกแล้ว)" : "ต่อกะบ่าย"}</span>
                <span className="sm:hidden">{continueShift ? "ต่อกะ ✓" : "ต่อกะ"}</span>
              </button>
            )}

            {/* Primary Action Button: "จบกะงาน" */}
            <button
              type="button"
              disabled={!canFinishShift}
              onClick={() => setShowConfirm(true)}
              className={`text-xs sm:text-sm px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[44px] transition-all cursor-pointer shadow-xs min-w-0 truncate ${
                !canFinishShift
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-bold border border-[var(--color-border)] cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md active:scale-95 ring-2 ring-emerald-400/40"
              }`}
            >
              {!canFinishShift ? (
                <>
                  <Lock size={14} className="shrink-0" />
                  <span className="hidden md:inline">ตรวจให้ครบทุกข้อเพื่อจบกะ </span>
                  <span className="hidden sm:inline md:hidden">ตรวจให้ครบ </span>
                  <span className="truncate">(เหลือ {total - done} ข้อ)</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} className="shrink-0" />
                  <span>ส่งมอบงานจบกะ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Confirmation Finish Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4 animate-in fade-in duration-150"
          onClick={() => setShowConfirm(false)}
          onKeyDown={handleConfirmKeyDown}
        >
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-shift-title"
            tabIndex={-1}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center mb-3.5 shadow-xs">
              <Sparkles size={22} />
            </div>

            <h2 id="confirm-shift-title" className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] mb-2">
              ยืนยันการส่งมอบงานจบกะ?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed font-medium">
              คุณได้ตรวจสอบเช็คลิสต์ครบถ้วนสมบูรณ์ 100% แล้ว เมื่อกดยืนยัน ระบบจะบันทึกผลและส่งแจ้งเตือนไปยังผู้จัดการร้านเพื่อรอรับรองผล
            </p>

            {continueShift && (
              <div className="mb-5 p-3 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
                <Check size={14} className="text-amber-800 shrink-0" />
                <span>เลือกต่อกะไว้: ระบบจะเริ่มเช็คลิสต์ของกะบ่ายให้อัตโนมัติ</span>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-[44px] sm:min-h-[36px] py-2.5 rounded-xl border border-[var(--color-border)] text-xs sm:text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              >
                กลับไปตรวจทาน
              </button>
              <button
                type="button"
                onClick={endShift}
                className="flex-1 min-h-[44px] sm:min-h-[36px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 text-amber-950 text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer"
              >
                ส่งมอบงานจบกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 px-4 animate-in fade-in duration-150"
          onClick={() => setShowExitConfirm(false)}
          onKeyDown={handleExitKeyDown}
        >
          <div
            ref={exitDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            tabIndex={-1}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-center mb-3.5 shadow-xs">
              <AlertCircle size={22} />
            </div>
            
            <h2 id="exit-modal-title" className="text-lg sm:text-xl font-extrabold text-[var(--color-text)] mb-2">
              ต้องการออกจากหน้าเช็คลิสต์?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed font-medium">
              ความคืบหน้าข้อที่ตรวจเสร็จแล้วได้รับการบันทึกลงฐานข้อมูลเรียบร้อย คุณสามารถกลับมาตรวจต่อได้ตลอดเวลาก่อนหมดเวลากะ
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 min-h-[44px] sm:min-h-[36px] py-2.5 rounded-xl border border-[var(--color-border)] text-xs sm:text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              >
                อยู่ตรวจเช็คลิสต์ต่อ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  if (onExit) {
                    onExit();
                  } else if (typeof window !== "undefined") {
                    window.location.href = "/shift";
                  }
                }}
                className="flex-1 min-h-[44px] sm:min-h-[36px] py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer"
              >
                ออกจากหน้างาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Late Reason Requirement Modal */}
      <LateReasonModal
        isOpen={Boolean(lateModalTarget)}
        taskLabel={lateModalTarget?.label || ""}
        deadlineText={lateModalTarget?.deadlineText}
        onSubmit={handleLateReasonSubmit}
        onCancel={() => setLateModalTarget(null)}
      />
    </div>
  );
}
