import { ShiftType, User } from "../../types";
import { MANAGEMENT_POSITIONS, STAFF_POSITIONS } from "../../types";
import { Badge } from "../common/Badge";
import { ThemeToggle } from "../common/ThemeToggle";
import { BrandLogo } from "../common/BrandLogo";
import { PointStreakBadge } from "../common/PointStreakBadge";
import { NotificationCenter } from "../common/NotificationCenter";
import { CreditCard, Package, ArrowRight, ArrowLeft, LogOut } from "lucide-react";

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
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-between px-3 sm:px-4 py-4 sm:py-10 pb-[max(1rem,env(safe-area-inset-bottom))] font-sans">
      {/* Unified Top Header Bar */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] transition-all cursor-pointer shrink-0"
              title="ย้อนกลับ"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <BrandLogo size={36} showText={true} hideTextOnMobile={true} isDark={false} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <PointStreakBadge />
          <NotificationCenter />
          <ThemeToggle />

          <div className="flex items-center gap-2 text-right hidden lg:flex">
            <div>
              {user.branchName && (
                <p className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-widest mb-0.5 leading-none">
                  {user.branchName}
                </p>
              )}
              <p className="text-xs font-bold text-[var(--color-text)] leading-tight">{user.name}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-medium">ขั้นตอนที่ 1 • เลือกตำแหน่ง</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brown)] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
              {user.name.slice(0, 2)}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className="text-xs text-[var(--color-text-muted)] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:border-rose-800 transition-all p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[var(--color-border)] font-semibold cursor-pointer min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Main Section */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            เลือกตำแหน่งงานประจำวัน
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5 max-w-md mx-auto">
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
                className={`group border-2 rounded-2xl p-6 sm:p-7 shadow-xs focus-visible:outline-none focus-visible:ring-2 transition-all duration-150 flex flex-col justify-between cursor-pointer active:scale-[0.99] hover:shadow-md bg-[var(--color-surface)] ${
                  isCashier
                    ? "border-amber-400 hover:border-amber-500 dark:border-amber-600 dark:hover:border-amber-500 focus-visible:ring-amber-400/50"
                    : "border-emerald-500 hover:border-emerald-600 dark:border-emerald-600 dark:hover:border-emerald-500 focus-visible:ring-emerald-400/50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-2xs ${
                        isCashier
                          ? "bg-amber-500 text-amber-950 border-amber-600/40 shadow-xs dark:bg-amber-500 dark:text-amber-950"
                          : "bg-emerald-600 text-white border-emerald-700/40 shadow-xs dark:bg-emerald-600 dark:text-white"
                      }`}
                    >
                      {isCashier ? (
                        <CreditCard size={22} strokeWidth={2.2} />
                      ) : (
                        <Package size={22} strokeWidth={2.2} />
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isCashier
                          ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          : "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      }`}
                    >
                      {isCashier ? "จุดชำระเงิน & บริการ" : "สินค้าสด & ตู้แช่"}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] tracking-tight mb-2">
                    {pos}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
                    {isCashier
                      ? "รับผิดชอบงานจุดชำระเงิน ตรวจสอบระบบแคชเชียร์ นับเงินทอน และดูแลบริการลูกค้าหน้าร้าน"
                      : "รับผิดชอบการจัดเรียงสินค้า ตรวจนับสต็อก เติมสินค้าตู้แช่ และตรวจสอบความสดใหม่"}
                  </p>

                  <div className="space-y-2 py-3 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
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
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                          <span>ตรวจรับสินค้าสดและเติมตู้แช่</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                          <span>ตรวจเช็คป้ายราคาและวันหมดอายุ</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Action Indicator */}
                <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
                  <div
                    aria-hidden="true"
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 select-none shadow-xs group-hover:shadow-sm ${
                      isCashier
                        ? "bg-amber-500 hover:bg-amber-600 text-amber-950 border-amber-600/40"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700/40"
                    }`}
                  >
                    <span>เลือกหน้าที่{pos} และระบุกะงาน →</span>
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
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
              <ArrowLeft size={14} />
              <span>ย้อนกลับไปหน้าเลือกช่องทางเข้างาน</span>
            </button>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-[var(--color-text-subtle)] font-medium py-2">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}
