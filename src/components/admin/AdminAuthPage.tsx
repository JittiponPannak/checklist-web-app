import { useState } from "react";
import { User } from "../../types";
import { loginAction } from "../../actions/auth";
import { BrandLogo } from "../common/BrandLogo";

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
    "w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-1/4 -right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[440px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-5 relative z-10">
        {/* Brand Header */}
        <header className="text-center space-y-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-[11px] font-semibold border border-indigo-800/60 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
            <span>Admin Portal • ระบบฝ่ายบริหาร</span>
          </div>
          <BrandLogo size={48} showText={true} isDark={true} subtitle="ระบบควบคุมและตรวจสอบเช็คลิสต์การปฏิบัติงานสาขา" />
        </header>

        {/* Form */}
        <div className="space-y-3.5 pt-4 border-t border-slate-800/80 focus-visible:outline-none">

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-300 mb-1">
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
            <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-300 mb-1">
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
            <div id="admin-auth-error" role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 text-center font-semibold flex items-center justify-center gap-1.5">
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
            className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-indigo-950/50 ${loading ? "opacity-70 cursor-not-allowed" : ""
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
        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
          <a
            href="/"
            className="hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
          </a>
        </div>
      </div>
    </div>
  );
}
