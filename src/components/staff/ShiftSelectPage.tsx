import { useState, useEffect } from "react";
import { ShiftSession, ShiftType, User } from "../../types";
import { Badge } from "../common/Badge";
import { BrandLogo } from "../common/BrandLogo";
import { getSessions } from "../../data/storage";
import { getPositionShiftsStatusAction, resetTodayChecklistDataAction } from "../../actions/checklist";

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

  useEffect(() => {
    setInternalSessions(getSessions());
  }, []);

  useEffect(() => {
    if (user.position) {
      getPositionShiftsStatusAction(user.position)
        .then((res) => {
          if (res.success && res.statuses) {
            setDbStatuses(res.statuses);
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
      title: "เช้า",
      subTitle: "กะเช้า",
      time: "08:00 – 16:00",
      tagline: "เปิดร้าน รับสินค้า ตรวจนับสต็อก และบริการลูกค้าช่วงเช้า",
      isCurrent: hour >= 6 && hour < 14,
    },
    {
      id: "afternoon",
      title: "บ่าย",
      subTitle: "กะบ่าย",
      time: "16:00 – 00:00",
      tagline: "ดูแลลูกค้าหน้าร้าน เติมสต็อก สรุปยอดเงิน และปิดร้าน",
      isCurrent: hour >= 14 && hour < 22,
    },
    {
      id: "both",
      title: "ควบ",
      subTitle: "ควบสองกะ",
      time: "08:00 – 00:00",
      tagline: "ควงกะปฏิบัติงานต่อเนื่องตลอดวัน ทั้งรอบเช้าและรอบบ่าย",
      isCurrent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-between px-4 py-6 sm:py-10 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-200/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      {/* Clean Top Profile Bar */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl shadow-xs relative z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-slate-300 hover:border-slate-500 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
              title="ย้อนกลับไปเลือกตำแหน่ง"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <BrandLogo size={36} showText={true} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-right hidden sm:flex">
            <div>
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">{user.position || "พนักงานสาขา"}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name.slice(0, 2)}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50/60 hover:border-rose-300 transition-all px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Area: Clean Header & 3 Shift Cards */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4 relative z-10">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-amber-900 tracking-wider uppercase bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full mb-3 shadow-2xs">
            ขั้นตอนที่ 2 จาก 2 • เลือกกะการทำงาน
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            เลือกกะการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            เลือกช่วงเวลาปฏิบัติงานสำหรับตำแหน่ง <span className="font-bold text-slate-900">{user.position || "พนักงาน"}</span> เพื่อเริ่มบันทึกรายการ
          </p>
        </div>

        {/* 3 Shift Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
          {shifts.map((s) => {
            const isMorn = s.id === "morning";
            const isAft = s.id === "afternoon";

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

            const cardTheme = isMorn
              ? {
                  hoverBorder: "hover:border-amber-400 hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.15)]",
                  iconBox: "bg-amber-50 border-amber-200/80 text-amber-700 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500",
                  btnHover: "group-hover:bg-amber-600",
                  badgeColor: "amber" as const,
                }
              : isAft
              ? {
                  hoverBorder: "hover:border-sky-400 hover:shadow-[0_12px_28px_-6px_rgba(2,132,199,0.15)]",
                  iconBox: "bg-sky-50 border-sky-200/80 text-sky-700 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600",
                  btnHover: "group-hover:bg-sky-600",
                  badgeColor: "blue" as const,
                }
              : {
                  hoverBorder: "hover:border-indigo-400 hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.15)]",
                  iconBox: "bg-indigo-50 border-indigo-200/80 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600",
                  btnHover: "group-hover:bg-slate-900",
                  badgeColor: "muted" as const,
                };

            const containerBorder =
              checkStatus === "completed"
                ? "border-emerald-300 ring-1 ring-emerald-500/20 bg-emerald-50/15 hover:border-emerald-500 hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.2)]"
                : checkStatus === "incomplete"
                ? "border-amber-300 ring-1 ring-amber-500/20 bg-amber-50/15 hover:border-amber-500 hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.2)]"
                : `bg-white border-slate-200/90 ${cardTheme.hoverBorder}`;

            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`เลือกกะ${s.title} ช่วงเวลา ${s.time}`}
                onClick={() => onSelect(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(s.id);
                  }
                }}
                className={`group border rounded-2xl p-6 shadow-xs ${containerBorder} focus-visible:outline-none focus:ring-3 focus:ring-slate-950/10 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${cardTheme.iconBox}`}>
                      {isMorn ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                        </svg>
                      ) : isAft ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {checkStatus === "completed" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>เช็คหมดแล้ว</span>
                        </span>
                      ) : checkStatus === "incomplete" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>งานยังไม่เสร็จ</span>
                        </span>
                      ) : null}

                      {s.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                          เวลานี้
                        </span>
                      )}
                      <Badge color={cardTheme.badgeColor}>
                        {s.subTitle}
                      </Badge>
                    </div>
                  </div>

                  {/* Big Clean Title */}
                  <div className="my-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1 font-mono flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{s.time}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {s.tagline}
                  </p>

                  {/* Dynamic Shift Status Notification */}
                  {checkStatus === "completed" && (
                    <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span>กะนี้มีการเช็คหมดแล้ว</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                        {doneItems}/{totalItems}
                      </span>
                    </div>
                  )}

                  {checkStatus === "incomplete" && (
                    <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                        <span>กะนี้ยังคงมีงานที่ยังทำไม่เสร็จ</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                        ค้าง {totalItems - doneItems} ข้อ
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Indicator */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div
                    aria-hidden="true"
                    className={`w-full py-2.5 px-4 rounded-xl ${
                      checkStatus === "completed"
                        ? "bg-emerald-700 group-hover:bg-emerald-800 active:bg-emerald-900"
                        : checkStatus === "incomplete"
                        ? "bg-amber-700 group-hover:bg-amber-800 active:bg-amber-900"
                        : `bg-slate-900 ${cardTheme.btnHover} active:bg-black`
                    } text-white text-xs sm:text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2 select-none`}
                  >
                    <span>
                      {checkStatus === "completed"
                        ? `ดูรายการที่เช็คแล้ว (${doneItems}/${totalItems})`
                        : checkStatus === "incomplete"
                        ? `ทำรายการต่อ (เหลือ ${totalItems - doneItems} ข้อ)`
                        : `เลือกกะ${s.title} → เริ่มตรวจงาน`}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>ต้องการเปลี่ยนตำแหน่ง? ย้อนกลับไปเลือกตำแหน่ง</span>
            </button>
          )}

          {onBack && <span className="text-slate-300 hidden sm:inline" aria-hidden="true">•</span>}

          <button
            type="button"
            onClick={async () => {
              if (confirm("ต้องการรีเซ็ตข้อมูลประวัติเช็คลิสต์ทั้งหมดเป็นค่าว่างใช่หรือไม่?")) {
                await resetTodayChecklistDataAction(user.position);
                localStorage.setItem("app_sessions", "[]");
                localStorage.removeItem("app_active_session");
                window.location.reload();
              }
            }}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
        Eater Egg Fresh Mart • Checklist System
      </footer>
    </div>
  );
}
