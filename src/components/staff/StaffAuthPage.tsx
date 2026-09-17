import { useState } from "react";
import { User } from "../../types";
import { STAFF_POSITIONS } from "../../types";
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
    "w-full bg-[var(--color-surface)] hover:bg-slate-900 focus:bg-[var(--color-surface)] border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all";

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Ambient Brand Glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[var(--color-amber-glow)]0/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[400px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-5 relative z-10">
        {/* Brand Header */}
        <header className="mb-6 text-center flex flex-col items-center">
          <BrandLogo size={48} showText={true} isDark={true} subtitle="ระบบบันทึกและตรวจสอบเช็คลิสต์พนักงาน" />
        </header>

        {/* Login / Register Tabs */}
        <div
          role="tablist"
          aria-label="ตัวเลือกการเข้าสู่ระบบ"
          className="flex bg-[var(--color-surface)] p-1 rounded-xl mb-5 border border-slate-800 gap-1"
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
              className={`flex-1 py-2 min-h-[36px] text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${tab === t.id
                ? "bg-indigo-600 text-[var(--color-brown)] shadow-md font-bold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Manager Mode Banner Notification */}
        {tab === "manager" && (
          <div className="mb-4 p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-[11px] text-indigo-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>เข้าสู่ระบบเพื่อไปยัง <strong>Manager Dashboard</strong> (ผู้ช่วย, ผู้จัดการ, กรรมการ)</span>
          </div>
        )}

        {/* Form Panel */}
        <div role="tabpanel" id={`tab-${tab}-panel`} tabIndex={0} className="space-y-4 focus-visible:outline-none">
          {tab === "register" && (
            <div>
              <label htmlFor="staff-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
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
            <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
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
            <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              <label htmlFor="staff-role-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                บทบาท / ตำแหน่ง
              </label>
              <select
                id="staff-role-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className={inp}
              >
                <option value="employee" className="bg-slate-900 text-[var(--color-brown)]">พนักงานทั่วไป (แคชเชียร์ / สต็อก)</option>
                <option value="manager_assistant" className="bg-slate-900 text-[var(--color-brown)]">ผู้ช่วยผู้จัดการร้าน (Assistant Manager)</option>
                <option value="manager" className="bg-slate-900 text-[var(--color-brown)]">ผู้จัดการร้าน (Store Manager)</option>
                <option value="committee" className="bg-slate-900 text-[var(--color-brown)]">กรรมการบริหาร (Executive Committee)</option>
              </select>
            </div>
          )}

          {error && (
            <div id="staff-auth-error" role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 text-center font-semibold my-2 flex items-center justify-center gap-1.5">
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
            className={`w-full py-2.5 text-[var(--color-brown)] text-sm font-semibold rounded-xl shadow-lg transition-all mt-3 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-950/50 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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


        </div>

        {/* Link to Admin Portal */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>สำหรับผู้ดูแลระบบส่วนกลาง (Admin Portal) →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
