import { useState } from "react";
import { User } from "../../types";
import { loginAction } from "../../actions/auth";
import { BrandLogo } from "../common/BrandLogo";
import Link from "next/link";

export function AdminAuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!form.email.trim() || !form.password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await loginAction(form.email, form.password);

      if (res.success && res.user) {
        if (res.user.role !== "admin") {
          setError("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบส่วนกลาง (Admin)");
        } else {
          onLogin(res.user);
        }
      } else {
        setError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง (เฉพาะผู้ดูแลระบบ)");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full bg-[#FAF4EC] hover:bg-[#F5EDE2] focus:bg-white border border-[#EADBCE] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus-visible:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all";

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2B1413] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-1/4 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[440px] bg-white border border-[#EADBCE] rounded-2xl p-7 sm:p-8 shadow-xl shadow-amber-900/5 space-y-5 relative z-10">
        {/* Brand Header */}
        <header className="text-center space-y-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[#2B1413] text-[11px] font-semibold border border-amber-300 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span>Admin Portal • ระบบฝ่ายบริหาร</span>
          </div>
          <BrandLogo size={48} showText={true} isDark={false} subtitle="ระบบควบคุมและตรวจสอบเช็คลิสต์การปฏิบัติงานสาขา" />
        </header>

        {/* Form */}
        <div className="space-y-3.5 pt-4 border-t border-[#EADBCE] focus-visible:outline-none">

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-[#78483B] mb-1">
              อีเมลฝ่ายบริหาร
            </label>
            <input
              id="admin-email"
              className={inputStyle}
              placeholder="manager@factory.com"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-auth-error" : undefined}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-[#78483B] mb-1">
              รหัสผ่าน
            </label>
            <input
              id="admin-password"
              className={inputStyle}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-auth-error" : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <div id="admin-auth-error" role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center font-semibold flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
            className={`w-full py-2.5 bg-[#2B1413] hover:bg-[#442220] active:bg-[#1a0a09] text-amber-300 text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 focus-visible:outline-none ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบผู้ดูแลระบบ (Admin)"}</span>
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Portal Links */}
        <div className="pt-2 border-t border-[#EADBCE] text-center text-xs text-[#78483B]">
          <Link
            href="/"
            className="hover:text-[#2B1413] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
          </Link>
        </div>
      </div>
    </div>
  );
}
