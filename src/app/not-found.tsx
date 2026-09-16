import Link from "next/link";
import { BrandLogo } from "../components/common/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative z-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={44} showText={false} isDark={true} />
        </div>
        <span className="inline-block text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full mb-3">
          404 Not Found
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-md"
          >
            ไปหน้าแรก / เข้าสู่ระบบ
          </Link>
          <Link
            href="/admin"
            className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer"
          >
            ผู้ดูแลระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

