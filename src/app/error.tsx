"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "../components/common/BrandLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative z-10">
        <div className="mb-4 flex justify-center">
          <BrandLogo size={44} showText={false} isDark={true} />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">เกิดข้อผิดพลาดในการทำงาน</h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          ระบบไม่สามารถโหลดข้อมูลหน้านี้ได้ กรุณาลองใหม่อีกครั้ง หรือกลับไปยังหน้าหลัก
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-md"
          >
            ลองใหม่อีกครั้ง
          </button>
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

