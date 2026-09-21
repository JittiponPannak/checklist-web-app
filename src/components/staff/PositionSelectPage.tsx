import { ShiftType, User } from "../../types";
import { MANAGEMENT_POSITIONS, STAFF_POSITIONS } from "../../types";
import { Badge } from "../common/Badge";

export function PositionSelectPage({
  user,
  shift,
  onSelectPosition,
  onBack,
  onLogout,
}: {
  user: User;
  shift?: ShiftType;
  onSelectPosition: (position: string) => void;
  onBack?: () => void;
  onLogout: () => void;
}) {
  const isMorning = shift === "morning";
  const isAfternoon = shift === "afternoon";
  const shiftTitle = shift ? (isMorning ? "กะเช้า" : isAfternoon ? "กะบ่าย" : "กะควบ (2 กะ)") : null;
  const shiftHours = shift ? (isMorning ? "06:00 – 16:30" : isAfternoon ? "10:00 – 20:30" : "06:00 – 20:30") : null;

  const availablePositions = user.role === "manager" ? MANAGEMENT_POSITIONS : STAFF_POSITIONS;

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-between px-4 py-6 sm:py-10">
      {/* Top Header Card */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            {user.branchName && (
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">
                {user.branchName}
              </p>
            )}
            <h1 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] leading-none mb-1">{user.name}</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
              {shiftTitle ? (
                <>กะที่เลือก: <span className="font-bold text-[var(--color-text)]">{shiftTitle} ({shiftHours})</span></>
              ) : (
                <>ขั้นตอนที่ 1 จาก 2 • <span className="font-bold text-[var(--color-text)]">เลือกตำแหน่งที่ปฏิบัติงาน</span></>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-[var(--color-text-muted)] hover:text-rose-700 transition-colors px-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer min-h-[36px]"
        >
          ออกจากระบบ
        </button>
      </header>

      {/* Main Section */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-[var(--color-text)] tracking-wider uppercase bg-[var(--color-amber-glow)] border border-[var(--color-amber)] px-3 py-1 rounded-full mb-3">
            ขั้นตอนที่ 1 จาก 2 • เลือกตำแหน่งหน้าที่
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            เลือกตำแหน่งงาน
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 max-w-md mx-auto">
            เลือกหน้าที่ที่คุณปฏิบัติงาน เพื่อดำเนินการเลือกกะการทำงานในขั้นตอนถัดไป
          </p>
        </div>

        {/* Position Cards Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {availablePositions.map((pos) => {
            const isCashier = pos === "แคชเชียร์";

            return (
              <div
                key={pos}
                role="button"
                tabIndex={0}
                aria-label={`เลือกหน้าที่ ${pos}`}
                onClick={() => onSelectPosition(pos)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectPosition(pos);
                  }
                }}
                className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm hover:border-amber-400 hover:shadow-md focus-visible:outline-none focus:ring-2 focus:ring-amber-400 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] group-hover:bg-amber-400 group-hover:border-amber-400 flex items-center justify-center transition-all">
                      {isCashier ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <circle cx="7" cy="15" r="1" />
                          <circle cx="12" cy="15" r="1" />
                          <circle cx="17" cy="15" r="1" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight mb-2">
                    {pos}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
                    {isCashier
                      ? "รับผิดชอบงานจุดชำระเงิน ตรวจสอบระบบแคชเชียร์ นับเงินทอน และดูแลบริการลูกค้าหน้าร้าน"
                      : "รับผิดชอบการจัดเรียงสินค้า ตรวจนับสต็อก เติมสินค้าตู้แช่ และตรวจสอบความสดใหม่"}
                  </p>

                  <div className="space-y-2 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                    {isCashier ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                          <span>ตรวจเงินสด ลิ้นชัก และอุปกรณ์รับชำระ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                          <span>ดูแลความสะอาดรอบจุดเคาน์เตอร์</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                          <span>ตรวจรับสินค้าสดและเติมตู้แช่</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                          <span>ตรวจเช็คป้ายราคาและวันหมดอายุ</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Action Indicator */}
                <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                  <div
                    aria-hidden="true"
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-brown)] text-amber-300 group-hover:bg-[var(--color-brown-light)] text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 select-none"
                  >
                    <span>เลือกหน้าที่{pos} → ไปเลือกกะ</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        {onBack && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
            </button>
          </div>
        )}
      </div>

      <footer className="text-center text-[11px] text-[var(--color-text-subtle)] font-medium py-2">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}
