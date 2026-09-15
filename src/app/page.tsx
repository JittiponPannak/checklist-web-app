import { BrandLogo } from "../components/common/BrandLogo";
import Link from "next/link";
import { Users, Briefcase, Shield } from "lucide-react";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient blurs */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl">
        <header className="mb-10 text-center flex flex-col items-center">
          <BrandLogo size={56} showText={true} isDark={true} subtitle="ระบบบันทึกและตรวจสอบเช็คลิสต์การปฏิบัติงาน" />
          <p className="mt-4 text-slate-400 font-medium text-sm sm:text-base">
            กรุณาเลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Staff Login */}
          <Link
            href="/login/staff"
            className="group flex flex-col items-center p-8 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-emerald-500/50 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/30 transition-all text-center"
          >
            <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Users size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">พนักงานร้านสาขา</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              สำหรับพนักงานทั่วไป (แคชเชียร์, สต็อก) และผู้ช่วยผู้จัดการร้าน
            </p>
            <div className="mt-6 flex items-center justify-center text-emerald-400 text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
              เข้าสู่ระบบ
              <svg className="ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Executive Login */}
          <Link
            href="/login/executive"
            className="group flex flex-col items-center p-8 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/30 transition-all text-center"
          >
            <div className="w-16 h-16 bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <Briefcase size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">ผู้บริหาร / กรรมการ</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              สำหรับผู้จัดการร้าน, ผู้จัดการทั่วไป และระดับกรรมการบริหาร
            </p>
            <div className="mt-6 flex items-center justify-center text-indigo-400 text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
              เข้าสู่ระบบ
              <svg className="ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Admin Login */}
          <Link
            href="/admin"
            className="group flex flex-col items-center p-8 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md rounded-2xl border border-slate-800 hover:border-rose-500/50 shadow-xl hover:shadow-2xl hover:shadow-rose-950/30 transition-all text-center"
          >
            <div className="w-16 h-16 bg-rose-950/80 text-rose-400 border border-rose-800/80 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">ผู้ดูแลระบบส่วนกลาง</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              เฉพาะผู้ดูแลระบบส่วนกลาง (Admin Portal) เท่านั้น
            </p>
            <div className="mt-6 flex items-center justify-center text-rose-400 text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
              เข้าสู่ระบบ
              <svg className="ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Eater Egg Fresh Mart • Checklist System</p>
        </footer>
      </div>
    </main>
  );
}
