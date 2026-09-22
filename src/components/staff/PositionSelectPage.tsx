import { ShiftType, User } from "../../types";
import { MANAGEMENT_POSITIONS, STAFF_POSITIONS } from "../../types";
import { ThemeToggle } from "../common/ThemeToggle";
import { BrandLogo } from "../common/BrandLogo";
import { PointStreakBadge } from "../common/PointStreakBadge";
import { NotificationCenter } from "../common/NotificationCenter";
import { CreditCard, Package, ArrowLeft, LogOut, Store } from "lucide-react";

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
      <header className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between gap-2 sm:gap-4 p-2.5 sm:p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text)] transition-all cursor-pointer shrink-0"
              title="ย้อนกลับ"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <BrandLogo size={32} showText={true} hideTextOnMobile={true} isDark={false} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <PointStreakBadge />
          <NotificationCenter />
          <ThemeToggle />

          {/* User Profile Block */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)]">
            <div className="text-right hidden lg:block">
              <p className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] leading-tight truncate max-w-[150px]">
                {user.name}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {user.branchName && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] leading-none shrink-0">
                    <Store size={10} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    {user.branchName}
                  </span>
                )}
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] leading-none shrink-0">
                  เลือกตำแหน่ง
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-brown)] text-amber-100 font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0 ring-1 ring-[var(--color-border)]" title={user.name}>
              {user.name.slice(0, 2)}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className="text-xs sm:text-sm text-[var(--color-text)] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:border-rose-700 transition-all p-2 sm:px-2.5 sm:py-2 rounded-xl border border-[var(--color-border)] font-bold cursor-pointer min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <LogOut size={15} />
            <span className="hidden xl:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Main Section */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            เลือกตำแหน่งงานประจำวัน
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-2 max-w-lg mx-auto leading-relaxed font-medium">
            เลือกหน้าที่ที่คุณปฏิบัติงาน เพื่อดำเนินการเลือกกะการทำงานในขั้นตอนถัดไป
          </p>
        </div>

        {/* Position Cards Grid - Clean, un-nested cards with clear contrast and readable body typography */}
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
                className={`group rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-3 transition-all duration-150 flex flex-col justify-between cursor-pointer active:scale-[0.99] bg-[var(--color-surface)] border-2 ${
                  isCashier
                    ? "border-amber-400 hover:border-amber-500 dark:border-amber-600 dark:hover:border-amber-500 focus-visible:ring-amber-400/50"
                    : "border-emerald-500 hover:border-emerald-600 dark:border-emerald-600 dark:hover:border-emerald-500 focus-visible:ring-emerald-400/50"
                }`}
              >
                <div>
                  {/* Card Header: Icon + Category Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs ${
                        isCashier
                          ? "bg-amber-500 text-amber-950 dark:bg-amber-400 dark:text-amber-950"
                          : "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950"
                      }`}
                    >
                      {isCashier ? (
                        <CreditCard size={24} strokeWidth={2.3} />
                      ) : (
                        <Package size={24} strokeWidth={2.3} />
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide px-3 py-1 rounded-full border shadow-xs transition-colors ${
                        isCashier
                          ? "bg-amber-500 text-amber-950 border-amber-600 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-300"
                          : "bg-emerald-500 text-emerald-950 border-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCashier ? "bg-amber-950" : "bg-emerald-950"}`} aria-hidden="true" />
                      {isCashier ? "จุดชำระเงิน & บริการ" : "สินค้าสด & ตู้แช่"}
                    </span>
                  </div>

                  {/* Position Title */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight mb-3">
                    {pos}
                  </h3>

                  {/* Body description - larger, highly readable Thai text */}
                  <p className="text-sm sm:text-base text-[var(--color-text)] leading-relaxed mb-5 font-normal">
                    {isCashier
                      ? "รับผิดชอบงานจุดชำระเงิน ตรวจสอบระบบแคชเชียร์ นับเงินทอน และดูแลบริการลูกค้าหน้าร้าน"
                      : "รับผิดชอบการจัดเรียงสินค้า ตรวจนับสต็อก เติมสินค้าตู้แช่ และตรวจสอบความสดใหม่"}
                  </p>

                  {/* Key Tasks - Clean list without nested card borders */}
                  <div className="space-y-2.5 pt-4 pb-2 border-t border-[var(--color-border-subtle)] text-sm text-[var(--color-text)]">
                    {isCashier ? (
                      <>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" aria-hidden="true" />
                          <span className="font-medium">ตรวจเงินสด ลิ้นชัก และอุปกรณ์รับชำระ</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" aria-hidden="true" />
                          <span className="font-medium">ดูแลความสะอาดรอบจุดเคาน์เตอร์บริการ</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" aria-hidden="true" />
                          <span className="font-medium">ตรวจรับสินค้าสดและเติมตู้แช่ตามมาตรฐาน</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" aria-hidden="true" />
                          <span className="font-medium">ตรวจเช็คป้ายราคา ป้ายโปรโมชั่น และวันหมดอายุ</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Direct Action Affordance */}
                <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono transition-all ${
                    isCashier
                      ? "bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] group-hover:bg-amber-500 group-hover:text-amber-950 group-hover:border-amber-600"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-700"
                  }`}>
                    เลือก ↵
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        {onBack && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-[var(--color-text)] hover:text-amber-600 font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer p-2 rounded-xl"
            >
              <ArrowLeft size={16} />
              <span>ย้อนกลับไปหน้าเลือกช่องทางเข้างาน</span>
            </button>
          </div>
        )}
      </div>

      <footer className="text-center text-xs sm:text-sm text-[var(--color-text-muted)] font-medium py-3">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}
