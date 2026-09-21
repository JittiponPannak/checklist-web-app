import { useState, useEffect } from "react";
import { ShiftSession, ShiftType, User } from "../../types";
import { Badge } from "../common/Badge";
import { BrandLogo } from "../common/BrandLogo";
import { getSessions } from "../../data/storage";
import { getPositionShiftsStatusAction, resetTodayChecklistDataAction } from "../../actions/checklist";
import { secureSetItem, secureRemoveItem } from "../../utils/crypto";
import { Confetti } from "../common/Confetti";
import { NotificationCenter } from "../common/NotificationCenter";
import { PointStreakBadge } from "../common/PointStreakBadge";

export function ShiftSelectPage({
  user,
  sessions: propSessions,
  onSelect,
  onBack,
  onLogout,
}: {
  user: User;
  sessions?: ShiftSession[];
  onSelect: (shift: ShiftType) => void;
  onBack?: () => void;
  onLogout: () => void;
}) {
  const [internalSessions, setInternalSessions] = useState<ShiftSession[]>([]);
  const [dbStatuses, setDbStatuses] = useState<Record<
    ShiftType,
    { status: "completed" | "incomplete" | "none"; total: number; done: number }
  > | null>(null);

  // Single shift selection state
  const [chosenShift, setChosenShift] = useState<ShiftType | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setInternalSessions(getSessions());
  }, []);

  useEffect(() => {
    if (user.position) {
      getPositionShiftsStatusAction(user.position)
        .then((res) => {
          if (res.success && res.statuses) {
            setDbStatuses(res.statuses);

            // Auto-select next available shift once validated
            const mornDone = res.statuses['morning'].status === "completed";
            const aftDone = res.statuses['afternoon'].status === "completed";

            if (mornDone || aftDone) {
              setShowConfetti(true);
            }

            if (!mornDone) {
              setChosenShift("morning");
            } else if (!aftDone) {
              setChosenShift("afternoon");
            }
          }
        })
        .catch(console.error);
    }
  }, [user.position]);

  const sessions =
    propSessions && propSessions.length > 0
      ? propSessions
      : internalSessions.length > 0
        ? internalSessions
        : typeof window !== "undefined"
          ? getSessions()
          : [];

  const now = new Date();
  const hour = now.getHours();

  const shifts: {
    id: ShiftType;
    title: string;
    subTitle: string;
    time: string;
    tagline: string;
    isCurrent: boolean;
  }[] = [
      {
        id: "morning",
        title: "กะเช้า",
        subTitle: "งานประจำกะเช้า",
        time: "06:00 - 16:30",
        tagline: "เปิดร้าน รับสินค้า ตรวจนับสต็อก และบริการลูกค้าช่วงเช้า",
        isCurrent: hour >= 6 && hour < 16,
      },
      {
        id: "afternoon",
        title: "กะบ่าย",
        subTitle: "งานประจำกะบ่าย",
        time: "10:00 - 20:30",
        tagline: "ดูแลลูกค้าหน้าร้าน เติมสต็อก สรุปยอดเงิน และปิดร้าน",
        isCurrent: hour >= 10 && hour < 21,
      },
    ];

  const handleStartWork = () => {
    if (chosenShift) {
      if (typeof window !== "undefined") {
        secureRemoveItem("app_selected_shifts");
      }
      onSelect(chosenShift);
    }
  };

  const hasSelection = chosenShift !== null;

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-between px-4 py-6 sm:py-10 relative overflow-hidden">
      {/* Ambient Brand Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--color-amber-glow)]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      {showConfetti && <Confetti />}

      {/* Clean Top Profile Bar */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm relative z-30">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] transition-all cursor-pointer"
              title="ย้อนกลับไปเลือกตำแหน่ง"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <BrandLogo size={36} showText={true} isDark={false} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PointStreakBadge />
          <NotificationCenter />

          <div className="flex items-center gap-2 text-right hidden sm:flex">
            <div>
              {user.branchName && (
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-0.5 leading-none">
                  {user.branchName}
                </p>
              )}
              <p className="text-xs font-bold text-[var(--color-text)] leading-tight">{user.name}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-medium">{user.position || "พนักงานสาขา"}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brown)] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name.slice(0, 2)}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-[var(--color-text-muted)] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all px-3 py-1.5 rounded-xl border border-[var(--color-border)] font-semibold cursor-pointer min-h-[36px]"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Area: Clean Header & 2 Shift Cards */}
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center py-4 relative z-10">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-[var(--color-text)] tracking-wider uppercase bg-[var(--color-amber-glow)] border border-[var(--color-amber)] px-3 py-1 rounded-full mb-3 shadow-2xs">
            ขั้นตอนที่ 2 จาก 2 • เลือกกะการทำงาน
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            เลือกกะการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
            ติ๊กเลือกกะที่ต้องการปฏิบัติงานสำหรับตำแหน่ง <span className="font-bold text-[var(--color-text)]">{user.position || "พนักงาน"}</span>
          </p>
        </div>

        {/* 2 Shift Cards with Multi-select Checkboxes */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {shifts.map((s) => {
            const isMorn = s.id === "morning";
            // Find session specifically for this user's currently selected position
            const todayStr = new Date().toDateString();
            const positionSessions = sessions.filter(
              (sess) =>
                sess.shift === s.id &&
                sess.userPosition?.trim() === user.position?.trim()
            );

            const todaySession = positionSessions.find(
              (sess) =>
                new Date(sess.startedAt).toDateString() === todayStr ||
                (sess.completedAt ? new Date(sess.completedAt).toDateString() === todayStr : false)
            );

            const shiftSession =
              todaySession ||
              positionSessions.sort(
                (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
              )[0];

            const dbStatus = dbStatuses ? dbStatuses[s.id] : null;
            const hasDbData = Boolean(dbStatus && dbStatus.total > 0);

            const totalItems = hasDbData ? dbStatus!.total : shiftSession ? shiftSession.items.length : 0;
            const doneItems = hasDbData ? dbStatus!.done : shiftSession ? shiftSession.items.filter((i) => i.completedAt !== null).length : 0;
            const isAllDone = totalItems > 0 && doneItems === totalItems;
            const isEnded = Boolean(shiftSession && shiftSession.completedAt);
            const hasActivity = Boolean(
              (hasDbData && dbStatus!.status !== "none") ||
              (shiftSession && (doneItems > 0 || isEnded))
            );

            const checkStatus: "completed" | "incomplete" | "none" =
              hasDbData && dbStatus!.status !== "none"
                ? dbStatus!.status
                : !hasActivity
                  ? "none"
                  : isAllDone
                    ? "completed"
                    : "incomplete";

            const isLoading = dbStatuses === null;
            const isDisabled = isLoading || checkStatus === "completed";
            const isChecked = isDisabled ? false : chosenShift === s.id;

            const toggleSelect = () => {
              if (isDisabled) return;
              setChosenShift(s.id as ShiftType);
            };

            const containerTheme = isDisabled
              ? checkStatus === "completed"
                ? "border-emerald-200 bg-emerald-50/50 opacity-80"
                : "border-[var(--color-border)] bg-[var(--color-surface-2)]/60 opacity-50"
              : isChecked
                ? "border-amber-400 bg-[var(--color-amber-glow)]/40 ring-2 ring-amber-400/40 shadow-md"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-amber)] hover:bg-[var(--color-background)]";

            return (
              <div
                key={s.id}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={isDisabled ? -1 : 0}
                onClick={toggleSelect}
                onKeyDown={(e) => {
                  if (isDisabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSelect();
                  }
                }}
                className={`group border rounded-2xl p-6 shadow-sm ${containerTheme} focus-visible:outline-none focus:ring-2 focus:ring-amber-400 ${isDisabled ? "cursor-not-allowed" : "hover:-translate-y-1 cursor-pointer"} transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  {/* Top Header inside Card: Checkbox & Shift Icon / Badges */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    {/* Checkbox indicator */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isChecked
                          ? "bg-amber-500 border-amber-400 text-stone-950 shadow-md scale-105"
                          : isDisabled && checkStatus === "completed"
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] group-hover:border-amber-400"
                          }`}
                      >
                        {(isChecked || (isDisabled && checkStatus === "completed")) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-bold transition-colors ${isChecked ? "text-[var(--color-text)]" : isDisabled ? (checkStatus === "completed" ? "text-emerald-700" : "text-[var(--color-text-subtle)]") : "text-[var(--color-text-muted)]"}`}>
                        {isChecked ? "เลือกแล้ว" : isDisabled ? (checkStatus === "completed" ? "ทำเสร็จแล้ว" : isLoading ? "กำลังโหลด..." : "ไม่สามารถเลือกได้") : "แตะเพื่อเลือก"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {checkStatus === "completed" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>เสร็จสมบูรณ์</span>
                        </span>
                      ) : checkStatus === "incomplete" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-amber-glow)] text-[var(--color-amber)] border border-[var(--color-amber)] flex items-center gap-1">
                          <span>ค้าง {totalItems - doneItems} ข้อ</span>
                        </span>
                      ) : null}

                      {s.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-[var(--color-text)] font-mono shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brown)] animate-pulse" aria-hidden="true" />
                          เวลานี้
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Icon Header */}
                  <div className="flex items-start gap-3.5 mb-2">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${isMorn
                      ? "bg-[var(--color-surface-2)] border-[var(--color-border)] text-amber-600"
                      : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-amber-600"
                      }`}>
                      {isMorn ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-[var(--color-text)] tracking-tight flex items-center gap-2">
                        {s.title}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-0.5 font-mono flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{s.time}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)] mt-3 leading-relaxed">
                    {s.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                  <span>{s.subTitle}</span>
                  {checkStatus === "completed" && (
                    <span className="text-emerald-700 font-mono text-[11px] font-bold">เช็คแล้ว ({doneItems}/{totalItems})</span>
                  )}
                  {checkStatus === "incomplete" && (
                    <span className="text-[var(--color-amber)] font-mono text-[11px] font-bold">ค้าง ({totalItems - doneItems})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Shifts Summary Text */}
        <div className="w-full text-center mb-6 min-h-[32px] flex items-center justify-center">
          {chosenShift === "morning" ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs sm:text-sm font-medium shadow-xs">
              <span>เลือกเฉพาะ: กะเช้า (06:00 - 16:30)</span>
            </div>
          ) : chosenShift === "afternoon" ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs sm:text-sm font-medium shadow-xs">
              <span>เลือกเฉพาะ: กะบ่าย (10:00 - 20:30)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-amber-glow)] border border-[var(--color-amber)] text-[var(--color-amber)] text-xs font-medium">
              <span>กรุณาติ๊กเลือก 1 กะการทำงาน</span>
            </div>
          )}
        </div>

        {/* Big Main Action Button */}
        <div className="w-full max-w-sm">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={handleStartWork}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${hasSelection
              ? "bg-[var(--color-brown)] hover:bg-[var(--color-brown-light)] text-amber-300 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] border border-[var(--color-border)] cursor-not-allowed opacity-60"
              }`}
          >
            <span>เริ่มตรวจงาน</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>ต้องการเปลี่ยนตำแหน่ง? ย้อนกลับไปเลือกตำแหน่ง</span>
            </button>
          )}

          {onBack && <span className="text-[#C9B29F] hidden sm:inline" aria-hidden="true">•</span>}

          <button
            type="button"
            onClick={async () => {
              if (confirm("ต้องการรีเซ็ตข้อมูลประวัติเช็คลิสต์ทั้งหมดเป็นค่าว่างใช่หรือไม่?")) {
                await resetTodayChecklistDataAction(user.position);
                secureSetItem("app_sessions", "[]");
                secureRemoveItem("app_active_session");
                secureRemoveItem("app_queue_afternoon");
                window.location.reload();
              }
            }}
            className="text-xs text-[var(--color-text-muted)] hover:text-rose-700 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="ล้างข้อมูลเช็คลิสต์ทั้งหมดเพื่อเริ่มทดสอบใหม่"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>รีเซ็ตข้อมูลเช็คลิสต์</span>
          </button>
        </div>
      </div>

      <footer className="text-center text-[11px] text-[var(--color-text-subtle)] font-medium py-2 relative z-10">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}
