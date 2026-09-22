import { BrandLogo } from "../components/common/BrandLogo";
import { ThemeToggle } from "../components/common/ThemeToggle";
import Link from "next/link";
import { Users, Briefcase, ShieldCheck, ArrowRight } from "lucide-react";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-between px-4 py-8 sm:py-14 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <header className="mb-8 sm:mb-10 text-center flex flex-col items-center">
          <BrandLogo size={56} showText={true} isDark={false} subtitle="ระบบตรวจเช็คลิสต์และมาตรฐานการปฏิบัติงานสาขา" />
          <h1 className="sr-only">ระบบตรวจเช็คลิสต์และกำกับดูแลสาขา Eater Egg Fresh Mart</h1>
          <p className="mt-3 text-[var(--color-text-muted)] text-sm sm:text-base font-normal max-w-md">
            เลือกช่องทางเข้าปฏิบัติงานตามตำแหน่งและหน้าที่รับผิดชอบ
          </p>
        </header>

        {/* Structured Operational Gateways: Hierarchy-based (Not 3 identical cards) */}
        <div className="space-y-4">
          {/* Primary Gateway: Floor Staff (High Velocity, 80%+ of Daily Traffic) */}
          <Link
            href="/login/staff"
            className="group block p-6 sm:p-7 bg-[var(--color-surface)] rounded-2xl border-2 border-amber-300 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Users size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] tracking-tight">
                      พนักงานร้านสาขา (Floor Staff)
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold leading-5 bg-amber-500 text-[#2b1413] border border-amber-600 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2b1413] shrink-0" aria-hidden="true" />
                      หน้าร้าน
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    สำหรับพนักงานแคชเชียร์, พนักงานสต็อก และผู้ช่วยผู้จัดการร้าน เข้าปฏิบัติงานประจำกะ
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200 group-hover:bg-amber-500 group-hover:text-amber-950 text-amber-900 border border-amber-200 transition-colors shrink-0 mt-1">
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
                ระบบเปิดรับรายงานประจำกะ
              </span>
              <span className="text-amber-950 dark:text-amber-200 font-bold sm:hidden flex items-center gap-1">
                เข้าสู่ระบบพนักงาน →
              </span>
            </div>
          </Link>

          {/* Secondary Gateway: Store Management & Audit */}
          <Link
            href="/login/executive"
            className="group block p-5 sm:p-6 bg-[var(--color-surface)] rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/60 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)] text-amber-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Briefcase size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
                      ผู้จัดการ & กรรมการบริหาร (Management & Audit)
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold leading-5 bg-[var(--color-primary)] text-amber-200 dark:bg-amber-950 dark:text-amber-200 border border-[var(--color-primary-dim)] dark:border-amber-800 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                      ตรวจรับรอง
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    ตรวจรับรองกะงาน, อนุมัติรายงานความเรียบร้อยสาขา และติดตามดัชนีคุณภาพ
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-primary)] dark:text-amber-200 group-hover:bg-[var(--color-primary)] group-hover:text-amber-200 transition-colors shrink-0 mt-1">
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Tertiary Utility Row: Central Administration */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 px-2">
            <span className="text-xs text-[var(--color-text-muted)] font-medium">
              ระดับศูนย์กลางองค์กร
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-amber-950 dark:hover:text-amber-200 font-semibold min-h-[44px] sm:min-h-[32px] px-3 py-2 sm:px-2.5 sm:py-1 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              <ShieldCheck size={14} className="text-amber-700" />
              <span>เข้าสู่ระบบผู้ดูแลระบบส่วนกลาง (Central Admin) →</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-[var(--color-text-muted)] font-medium">
        Eater Egg Fresh Mart • Checklist System
      </footer>
    </main>
  );
}
