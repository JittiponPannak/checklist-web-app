import { useState, useEffect } from "react";
import { ShiftSession, ShiftType, User } from "../../types";
import { Badge } from "../common/Badge";
import { BrandLogo } from "../common/BrandLogo";
import { getSessions } from "../../data/storage";
import { getPositionShiftsStatusAction, resetTodayChecklistDataAction } from "../../actions/checklist";
import { secureSetItem, secureRemoveItem } from "../../utils/crypto";
import { Confetti } from "../common/Confetti";

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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-4 py-6 sm:py-10 relative overflow-hidden">
      {/* Ambient Brand Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      {showConfetti && <Confetti />}

      {/* Clean Top Profile Bar */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl relative z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
              title="ย้อนกลับไปเลือกตำแหน่ง"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <BrandLogo size={36} showText={true} isDark={true} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-right hidden sm:flex">
            <div>
              {user.branchName && (
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5 leading-none">
                  {user.branchName}
                </p>
              )}
              <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400 font-medium">{user.position || "พนักงานสาขา"}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              {user.name.slice(0, 2)}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 transition-all px-3 py-1.5 rounded-xl border border-slate-800 font-semibold cursor-pointer min-h-[36px]"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Area: Clean Header & 2 Shift Cards */}
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center py-4 relative z-10">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/80 border border-indigo-800/80 px-3 py-1 rounded-full mb-3 shadow-2xs">
            ขั้นตอนที่ 2 จาก 2 • เลือกกะการทำงาน
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            เลือกกะการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            ติ๊กเลือกกะที่ต้องการปฏิบัติงานสำหรับตำแหน่ง <span className="font-bold text-white">{user.position || "พนักงาน"}</span>
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
                ? "border-emerald-900/40 bg-emerald-950/20 opacity-75"
                : "border-slate-800 bg-slate-900/50 opacity-50"
              : isChecked
                ? "border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/50 shadow-[0_12px_28px_-6px_rgba(99,102,241,0.3)]"
                : "border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900/95";

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
                className={`group border rounded-2xl p-6 shadow-xl ${containerTheme} focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 ${isDisabled ? "cursor-not-allowed" : "hover:-translate-y-1 cursor-pointer"} transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  {/* Top Header inside Card: Checkbox & Shift Icon / Badges */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    {/* Checkbox indicator */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isChecked
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/50 scale-105"
                          : isDisabled && checkStatus === "completed"
                            ? "bg-emerald-900/50 border-emerald-800 text-emerald-400"
                            : "bg-slate-950 border-slate-600 group-hover:border-slate-400"
                          }`}
                      >
                        {(isChecked || (isDisabled && checkStatus === "completed")) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-bold transition-colors ${isChecked ? "text-indigo-300" : isDisabled ? (checkStatus === "completed" ? "text-emerald-500" : "text-slate-500") : "text-slate-400"}`}>
                        {isChecked ? "เลือกแล้ว" : isDisabled ? (checkStatus === "completed" ? "ทำเสร็จแล้ว" : isLoading ? "กำลังโหลด..." : "ไม่สามารถเลือกได้") : "แตะเพื่อเลือก"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {checkStatus === "completed" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>เสร็จสมบูรณ์</span>
                        </span>
                      ) : checkStatus === "incomplete" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <span>ค้าง {totalItems - doneItems} ข้อ</span>
                        </span>
                      ) : null}

                      {s.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                          เวลานี้
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Icon Header */}
                  <div className="flex items-start gap-3.5 mb-2">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${isMorn
                      ? (isChecked ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-slate-950 border-slate-800 text-amber-400")
                      : (isChecked ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-950 border-slate-800 text-sky-400")
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
                      <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        {s.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5 font-mono flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{s.time}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {s.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>{s.subTitle}</span>
                  {checkStatus === "completed" && (
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">เช็คแล้ว ({doneItems}/{totalItems})</span>
                  )}
                  {checkStatus === "incomplete" && (
                    <span className="text-amber-400 font-mono text-[11px] font-bold">ค้าง ({totalItems - doneItems})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Shifts Summary Text */}
        <div className="w-full text-center mb-6 min-h-[32px] flex items-center justify-center">
          {chosenShift === "morning" ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs sm:text-sm font-medium">
              <span>เลือกเฉพาะ: กะเช้า (06:00 - 16:30)</span>
            </div>
          ) : chosenShift === "afternoon" ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs sm:text-sm font-medium">
              <span>เลือกเฉพาะ: กะบ่าย (10:00 - 20:30)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/50 border border-rose-900/50 text-rose-300 text-xs font-medium">
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
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${hasSelection
              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60 hover:shadow-indigo-900/80 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
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
              className="text-xs text-slate-400 hover:text-white font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>ต้องการเปลี่ยนตำแหน่ง? ย้อนกลับไปเลือกตำแหน่ง</span>
            </button>
          )}

          {onBack && <span className="text-slate-600 hidden sm:inline" aria-hidden="true">•</span>}

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
            className="text-xs text-slate-500 hover:text-rose-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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

      <footer className="text-center text-[11px] text-slate-500 font-medium py-2 relative z-10">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}

