import Link from "next/link";
import { BrandLogo } from "../components/common/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-amber-glow)]/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 text-center shadow-lg relative z-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={44} showText={false} isDark={false} />
        </div>
        <span className="inline-block text-xs font-mono font-bold text-[var(--color-amber)] bg-[var(--color-amber-glow)] border border-[var(--color-amber)] px-3 py-1 rounded-full mb-3">
          404 Not Found
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight mb-2">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-6">
          หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl bg-[var(--color-brown)] hover:bg-[var(--color-brown-light)] text-amber-300 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          >
            ไปหน้าแรก / เข้าสู่ระบบ
          </Link>
          <Link
            href="/admin"
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[#F2E7DC] text-[var(--color-text)] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer"
          >
            ผู้ดูแลระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
