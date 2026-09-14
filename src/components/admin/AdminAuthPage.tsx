import { useState } from "react";
import { User } from "../../types";
import { MANAGEMENT_POSITIONS } from "../../data/checklists";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction, registerAction } from "../../actions/auth";

export function AdminAuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "admin@factory.com",
    password: "",
    position: "ผู้ดูแลระบบส่วนกลาง",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function directLogin(email: string, pass: string, position: string) {
    setLoading(true);
    setError("");
    const localUsers = getUsers();
    let found = localUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = {
        id: "u-admin",
        name: "คุณสมเกียรติ บริหารกิจ",
        email: email,
        password: pass,
        role: "admin",
        position: position || "ผู้ดูแลระบบส่วนกลาง",
      };
      saveUsers([...localUsers, found]);
    }
    onLogin(found);
  }

  function handleLogin() {
    if (!form.email.trim() || !form.password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");

    const localUsers = getUsers();
    const found = localUsers.find(
      (u) =>
        u.email.trim().toLowerCase() === form.email.trim().toLowerCase() &&
        u.password === form.password.trim()
    );

    // Fallback support for default admin credentials
    if (form.email.trim().toLowerCase() === "admin@factory.com" && form.password.trim() === "admin123") {
      const adminUser: User = found || {
        id: "u-admin",
        name: "คุณสมเกียรติ บริหารกิจ",
        email: "admin@factory.com",
        password: "admin123",
        role: "admin",
        position: "ผู้ดูแลระบบส่วนกลาง",
      };
      if (!localUsers.some((u) => u.id === adminUser.id)) {
        saveUsers([...localUsers, adminUser]);
      }
      onLogin(adminUser);
      return;
    }

    if (!found) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง (เฉพาะผู้ดูแลระบบ)");
      setLoading(false);
      return;
    }

    if (found.role !== "admin") {
      setError("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบส่วนกลาง (Admin)");
      setLoading(false);
      return;
    }

    onLogin(found);
  }

  function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    setError("");

    const localUsers = getUsers();
    if (localUsers.some((u) => u.email.trim().toLowerCase() === form.email.trim().toLowerCase())) {
      setError("อีเมลนี้มีอยู่ในระบบแล้ว");
      setLoading(false);
      return;
    }

    const newUser: User = {
      id: "u-" + Date.now().toString(36),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      role: "admin",
      position: "ผู้ดูแลระบบส่วนกลาง",
    };

    saveUsers([...localUsers, newUser]);
    onLogin(newUser);
  }

  const inputStyle =
    "w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus:ring-3 focus:ring-slate-950/10 transition-all";

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-1/4 -right-20 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.03] space-y-5 relative z-10">
        {/* Brand Header */}
        <header className="text-center space-y-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" aria-hidden="true" />
            <span>Admin Portal • ระบบฝ่ายบริหาร</span>
          </div>
          <BrandLogo size={48} showText={true} subtitle="ระบบควบคุมและตรวจสอบเช็คลิสต์การปฏิบัติงานสาขา" />
        </header>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="ตัวเลือกการเข้าสู่ระบบฝ่ายบริหาร"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setTab(tab === "login" ? "register" : "login");
              setError("");
            }
          }}
          className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/70"
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`admin-${t}-tab`}
              tabIndex={tab === t ? 0 : -1}
              aria-selected={tab === t}
              aria-controls={`admin-${t}-panel`}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={`flex-1 py-1.5 min-h-[32px] text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === t ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "login" ? "เข้าสู่ระบบ" : "ลงทะเบียนใหม่"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div role="tabpanel" id={`admin-${tab}-panel`} aria-labelledby={`admin-${tab}-tab`} tabIndex={0} className="space-y-3.5 focus-visible:outline-none">
          {tab === "register" && (
            <div>
              <label htmlFor="admin-name" className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                id="admin-name"
                className={inputStyle}
                placeholder="เช่น คุณอนุรักษ์ วงศ์สวัสดิ์"
                autoComplete="name"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-auth-error" : undefined}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1">
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
            <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน
            </label>
            <input
              id="admin-password"
              className={inputStyle}
              placeholder="••••••••"
              type="password"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-auth-error" : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())}
            />
          </div>

          {tab === "register" && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">สิทธิ์การใช้งาน:</span> ผู้ดูแลระบบส่วนกลาง (System Administrator)
            </div>
          )}

          {error && (
            <div id="admin-auth-error" role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 text-center font-semibold flex items-center justify-center gap-1.5">
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
            onClick={tab === "login" ? handleLogin : handleRegister}
            className={`w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <span>{loading ? "กำลังเข้าสู่ระบบ..." : (tab === "login" ? "เข้าสู่ระบบผู้ดูแลระบบ (Admin)" : "ยืนยันการลงทะเบียน")}</span>
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* 1-Click Sample Accounts */}
        {tab === "login" && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                คลิกทดสอบด่วน (Admin Sample Account):
              </span>
              <span className="text-[10px] text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold">
                1-Click Login
              </span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => directLogin("admin@factory.com", "admin123", "ผู้ดูแลระบบส่วนกลาง")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    AD
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">คุณสมเกียรติ บริหารกิจ</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200">
                        System Admin
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">admin@factory.com</span>
                  </div>
                </div>
                <span className="text-xs text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 flex-shrink-0">
                  เข้าสู่ระบบ →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Portal Links */}
        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
          <a
            href="/"
            className="hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← กลับไปหน้าระบบร้านสาขา (เข้าสู่ระบบพนักงาน & ผู้จัดการ)
          </a>
        </div>
      </div>
    </div>
  );
}
