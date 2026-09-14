import { useState } from "react";
import { User } from "../../types";
import { STAFF_POSITIONS } from "../../data/checklists";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction, registerAction } from "../../actions/auth";
import Link from "next/link";

type AuthTab = "staff" | "manager" | "register";

export function StaffAuthPage({
  onLogin,
}: {
  onLogin: (user: User, shift?: any, redirectPath?: string) => void;
}) {
  const [tab, setTab] = useState<AuthTab>("staff");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as 'employee' | 'manager' | 'committee' | 'manager_assistant',
    position: STAFF_POSITIONS[0],
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
      if (!res.success || !res.user) {
        setError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }
      const localUsers = getUsers();
      if (!localUsers.some((u) => u.id === res.user!.id)) {
        saveUsers([...localUsers, res.user]);
      }
      // If logging in from manager tab, redirect directly to /manager/dashboard
      if (tab === "manager") {
        const isExec = res.user.role !== "employee";
        if (!isExec) {
          setError("บัญชีนี้เป็นบัญชีพนักงานทั่วไป กรุณาเข้าสู่ระบบผ่านแท็บ 'เข้าสู่ระบบพนักงาน'");
          setLoading(false);
          return;
        }
        onLogin(res.user, undefined, "/manager/dashboard");
      } else {
        onLogin(res.user);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await registerAction({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        position: form.position,
      });
      if (!res.success || !res.user) {
        setError(res.error || "ไม่สามารถสมัครสมาชิกได้");
        setLoading(false);
        return;
      }
      const localUsers = getUsers();
      saveUsers([...localUsers, res.user]);
      if (res.user.role !== "employee") {
        onLogin(res.user, undefined, "/manager/dashboard");
      } else {
        onLogin(res.user);
      }
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  const inp =
    "w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-300 focus:border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus:ring-3 focus:ring-slate-950/10 transition-all";

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/[0.03] relative z-10">
        {/* Brand Header */}
        <header className="mb-6 text-center flex flex-col items-center">
          <BrandLogo size={48} showText={true} subtitle="ระบบบันทึกและตรวจสอบเช็คลิสต์พนักงาน" />
        </header>

        {/* Login / Register Tabs */}
        <div
          role="tablist"
          aria-label="ตัวเลือกการเข้าสู่ระบบ"
          className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200/70 gap-1"
        >
          {[
            { id: "staff" as AuthTab, label: "เข้าสู่ระบบพนักงาน" },
            { id: "manager" as AuthTab, label: "เข้าสู่ระบบฝ่ายบริหาร" },
            { id: "register" as AuthTab, label: "สมัครสมาชิก" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setError("");
              }}
              className={`flex-1 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                tab === t.id
                  ? t.id === "manager"
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Manager Mode Banner Notification */}
        {tab === "manager" && (
          <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-[11px] text-indigo-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>เข้าสู่ระบบเพื่อไปยัง <strong>Manager Dashboard</strong> (ผู้ช่วย, ผู้จัดการ, กรรมการ)</span>
          </div>
        )}

        {/* Form Panel */}
        <div role="tabpanel" id={`tab-${tab}-panel`} tabIndex={0} className="space-y-4 focus-visible:outline-none">
          {tab === "register" && (
            <div>
              <label htmlFor="staff-name" className="block text-xs font-semibold text-slate-800 mb-1.5">
                ชื่อ-นามสกุล
              </label>
              <input
                id="staff-name"
                className={inp}
                placeholder="ระบุชื่อ-นามสกุล"
                autoComplete="name"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "staff-auth-error" : undefined}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-800 mb-1.5">
              {tab === "manager" ? "อีเมลฝ่ายบริหาร" : tab === "register" ? "อีเมล" : "อีเมลพนักงาน"}
            </label>
            <input
              id="staff-email"
              className={inp}
              placeholder={tab === "manager" ? "manager@factory.com" : "cashier@factory.com"}
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "staff-auth-error" : undefined}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-800 mb-1.5">
              รหัสผ่าน
            </label>
            <input
              id="staff-password"
              className={inp}
              placeholder="••••••••"
              type="password"
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "staff-auth-error" : undefined}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (tab === "register" ? handleRegister() : handleLogin())}
            />
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                บทบาท / ตำแหน่ง
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className={inp}
              >
                <option value="employee">พนักงานทั่วไป (แคชเชียร์ / สต็อก)</option>
                <option value="manager_assistant">ผู้ช่วยผู้จัดการร้าน (Assistant Manager)</option>
                <option value="manager">ผู้จัดการร้าน (Store Manager)</option>
                <option value="committee">กรรมการบริหาร (Executive Committee)</option>
              </select>
            </div>
          )}

          {error && (
            <div id="staff-auth-error" role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 text-center font-semibold my-2 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={loading}
            onClick={tab === "register" ? handleRegister : handleLogin}
            className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-all mt-3 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              tab === "manager"
                ? "bg-slate-900 hover:bg-slate-800 active:bg-black focus-visible:outline-slate-900"
                : "bg-slate-900 hover:bg-slate-800 active:bg-black focus-visible:outline-slate-900"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <span>
              {loading
                ? "กำลังตรวจสอบข้อมูล..."
                : tab === "manager"
                ? "เข้าสู่ระบบฝ่ายบริหาร (Manager) →"
                : tab === "register"
                ? "ยืนยันการสมัครสมาชิก"
                : "เข้าสู่ระบบพนักงาน →"}
            </span>
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Quick 1-click credential helper for employee */}
          {tab === "staff" && (
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-medium text-slate-500">บัญชีทดสอบพนักงาน:</span>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, email: "cashier@factory.com", password: "123" });
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 font-mono text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title="คลิกเพื่อกรอกข้อมูลทดสอบอัตโนมัติ"
              >
                <span>cashier@factory.com</span>
                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded font-sans">กรอกด่วน</span>
              </button>
            </div>
          )}

          {/* Quick 1-click credentials for manager */}
          {tab === "manager" && (
            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block">
                คลิกทดสอบด่วน (เข้าสู่ Manager Dashboard ทันที):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {[
                  { role: "ผู้จัดการร้าน", email: "manager@factory.com", pass: "manager123" },
                  { role: "ผู้ช่วยฯ", email: "assistant@factory.com", pass: "123" },
                  { role: "กรรมการ", email: "director@factory.com", pass: "director123" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, email: acc.email, password: acc.pass });
                      setError("");
                    }}
                    className="p-2 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="block text-xs font-bold text-slate-800">{acc.role}</span>
                    <span className="block text-[10px] font-mono text-slate-500 truncate">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Link to Admin Portal */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/admin"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>สำหรับผู้ดูแลระบบส่วนกลาง (Admin Portal) →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
