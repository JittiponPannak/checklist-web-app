import { BrandLogo } from "../components/common/BrandLogo";
import Link from "next/link";
import { Users, Briefcase, Shield } from "lucide-react";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#FFFDF9] text-[#2B1413] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background warm ambient glows */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-yellow-200/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl">
        <header className="mb-10 text-center flex flex-col items-center">
          <BrandLogo size={64} showText={true} isDark={false} subtitle="ระบบบันทึกและตรวจสอบเช็คลิสต์การปฏิบัติงาน" />
          <p className="mt-4 text-[#78483B] font-medium text-sm sm:text-base">
            กรุณาเลือกประเภทผู้ใช้งานเพื่อเข้าสู่ระบบ
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Staff Login */}
          <Link
            href="/login/staff"
            className="group flex flex-col items-center p-8 bg-white hover:bg-[#FFFDF9] rounded-2xl border border-[#EADBCE] hover:border-amber-400 shadow-sm hover:shadow-xl hover:shadow-amber-900/5 transition-all text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Users size={32} strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-[#2B1413] mb-2">พนักงานร้านสาขา</h2>
            <p className="text-sm text-[#78483B] leading-relaxed flex-1">
              สำหรับพนักงานทั่วไป (แคชเชียร์, สต็อก) และผู้ช่วยผู้จัดการร้าน
            </p>
            <div className="mt-6 flex items-center justify-center text-amber-600 text-sm font-semibold group-hover:text-amber-700 transition-colors">
              <span>เข้าสู่ระบบ</span>
              <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Executive Login */}
          <Link
            href="/login/executive"
            className="group flex flex-col items-center p-8 bg-white hover:bg-[#FFFDF9] rounded-2xl border border-[#EADBCE] hover:border-amber-400 shadow-sm hover:shadow-xl hover:shadow-amber-900/5 transition-all text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Briefcase size={32} strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-[#2B1413] mb-2">ผู้บริหาร / กรรมการ</h2>
            <p className="text-sm text-[#78483B] leading-relaxed flex-1">
              สำหรับผู้จัดการร้าน, ผู้จัดการทั่วไป และระดับกรรมการบริหาร
            </p>
            <div className="mt-6 flex items-center justify-center text-amber-600 text-sm font-semibold group-hover:text-amber-700 transition-colors">
              <span>เข้าสู่ระบบ</span>
              <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Admin Login */}
          <Link
            href="/admin"
            className="group flex flex-col items-center p-8 bg-white hover:bg-[#FFFDF9] rounded-2xl border border-[#EADBCE] hover:border-amber-400 shadow-sm hover:shadow-xl hover:shadow-amber-900/5 transition-all text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Shield size={32} strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-[#2B1413] mb-2">ผู้ดูแลระบบส่วนกลาง</h2>
            <p className="text-sm text-[#78483B] leading-relaxed flex-1">
              เฉพาะผู้ดูแลระบบส่วนกลาง (Admin Portal) เท่านั้น
            </p>
            <div className="mt-6 flex items-center justify-center text-amber-600 text-sm font-semibold group-hover:text-amber-700 transition-colors">
              <span>เข้าสู่ระบบ</span>
              <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-[#9C6C60]">
          <p>© {new Date().getFullYear()} Eater Egg Fresh Mart • Checklist System</p>
        </footer>
      </div>
    </main>
  );
}
