"use client";

function uid() { return Math.random().toString(36).substring(2, 9); }
function fmtDate(dStr: string) {
  if (!dStr) return "";
  const d = new Date(dStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function fmtTime(dStr: string) {
  if (!dStr) return "";
  const d = new Date(dStr);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
}

function getChecklistTemplate(pos: string | undefined, shift: ShiftType) {
  return Array.from({ length: 9 }, (_, i) => ({ id: `mock-${i}`, label: `Mock checklist item ${i + 1}` }));
}

function getCustomNotifications() { return []; }
function saveCustomNotifications(n: any) { }

interface CustomNotification {
  id: string;
  shiftSessionId: string;
  userName: string;
  userPosition?: string;
  shift: string;
  completedAt: string;
  read: boolean;
}
import { useState, useEffect, useRef } from "react";

import { User, Role, ShiftType, ShiftSession, ChecklistItem } from "../../types";

import { loginAction, registerAction, getAllUsersAction } from "../../actions/auth";
import { getOrCreateShiftSessionAction, toggleTaskWorkAction, endShiftSessionAction, getPositionShiftsStatusAction } from "../../actions/checklist";
import { secureGetItem, secureSetItem, secureRemoveItem } from "../../utils/crypto";


// ─── Focus Trap Hook (SC 2.1.2 No Keyboard Trap & SC 2.4.3 Focus Order) ─────────
function useModalFocusTrap(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab" && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  return { dialogRef, handleKeyDown };
}

// ─── Position Constants ───────────────────────────────────────────────────────
const STAFF_POSITIONS = [
  "แคชเชียร์",
  "พนักงานสต็อก/จัดเรียง",
];

const MANAGEMENT_POSITIONS = [
  "ผู้ช่วยผู้จัดการร้าน",
  "ผู้จัดการร้าน",
  "กรรมการ",
];

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ children, color = "muted" }: { children: React.ReactNode; color?: "green" | "amber" | "blue" | "muted" | "red" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold",
    amber: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
    blue: "bg-blue-50 text-blue-900 border-blue-300 font-semibold",
    muted: "bg-slate-100 text-slate-800 border-slate-300 font-medium",
    red: "bg-red-50 text-red-900 border-red-300 font-semibold",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-mono ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

function getShiftBadge(shift: ShiftType) {
  if (shift === "morning") return <Badge color="amber">กะเช้า</Badge>;
  if (shift === "afternoon") return <Badge color="blue">กะบ่าย</Badge>;
  return <Badge color="green">กะควบ</Badge>;
}

function getShiftName(shift: ShiftType) {
  if (shift === "morning") return "กะเช้า";
  if (shift === "afternoon") return "กะบ่าย";
  return "กะควบ";
}

function Divider() {
  return <div className="h-px bg-slate-200 w-full" />;
}


// ─── Auth Helper ──────────────────────────────────────────────────────────────
async function handleAuthSubmit(action: any, data: any, setError: any, onLogin: any) {
  setError("");
  try {
    const res = await action(data);
    if (!res.success) {
      setError(res.error || "Login failed");
      return;
    }
    if (res.user) onLogin(res.user);
  } catch (err: any) {
    setError(err.message || "An unexpected error occurred");
  }
}

// ─── Staff Portal (URL / ) ───────────────────────────────────────────────────
function StaffAuthPage({ onLogin, onSwitchToExecutive, onSwitchToAdmin }: { onLogin: (user: User) => void; onSwitchToExecutive: () => void; onSwitchToAdmin: () => void; }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", position: STAFF_POSITIONS[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = "w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all";

  async function handleLogin() {
    setLoading(true);
    await handleAuthSubmit((d: any) => loginAction(d.email, d.password), form, setError, onLogin);
    setLoading(false);
  }
  async function handleRegister() {
    setLoading(true);
    await handleAuthSubmit(registerAction, { ...form, role: form.position === "ผู้ช่วยผู้จัดการร้าน" ? "manager_assistant" : "employee" }, setError, onLogin);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "login") handleLogin();
    else handleRegister();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-[390px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600 text-white mb-3 shadow-lg shadow-indigo-950/50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Eater Egg Fresh Mart</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">ระบบเช็คลิสต์พนักงานและผู้ช่วยฯ</p>
        </header>

        <div role="tablist" aria-label="โหมดการสลับหน้าพนักงาน" className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
          {["login", "register"].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              aria-controls={`staff-${t}-panel`}
              id={`staff-${t}-tab`}
              onClick={() => { setTab(t as any); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-indigo-500 ${tab === t ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              {t === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          ))}
        </div>

        <form id={`staff-${tab}-panel`} role="tabpanel" aria-labelledby={`staff-${tab}-tab`} onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label htmlFor="staff-name" className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อ-นามสกุล</label>
              <input id="staff-name" name="name" required className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          {tab === "register" && (
            <div>
              <label htmlFor="staff-position" className="block text-xs font-semibold text-slate-300 mb-1.5">ตำแหน่ง</label>
              <select id="staff-position" name="position" className={inp} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {STAFF_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="ผู้ช่วยผู้จัดการร้าน">ผู้ช่วยผู้จัดการร้าน</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-300 mb-1.5">อีเมล</label>
            <input
              id="staff-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "staff-auth-error" : undefined}
              className={inp}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-300 mb-1.5">รหัสผ่าน</label>
            <input
              id="staff-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "staff-auth-error" : undefined}
              className={inp}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && (
            <div id="staff-auth-error" role="alert" className="p-2.5 bg-rose-950/80 border border-rose-800 text-xs text-rose-300 text-center rounded-xl font-semibold">
              {error}
            </div>
          )}
          <button disabled={loading} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-950/50 font-semibold mt-3 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500">
            {loading ? "กำลังโหลด..." : tab === "login" ? "เข้าสู่ระบบ" : "ยืนยันสมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onSwitchToExecutive} className="text-xs text-slate-400 hover:text-indigo-400 font-semibold focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg py-2 px-2 transition-colors cursor-pointer min-h-[36px]">สำหรับผู้บริหาร (Executive Portal)</button>
          <button type="button" onClick={onSwitchToAdmin} className="text-xs text-slate-400 hover:text-slate-200 font-semibold focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg px-2.5 py-2 transition-colors cursor-pointer min-h-[36px]">Login Admin</button>
        </div>
      </div>
    </main>
  );
}

// ─── Executive Portal (URL /executive ) ─────────────────────────────────────
function ExecutiveAuthPage({ onLogin, onSwitchToStaff }: { onLogin: (user: User) => void; onSwitchToStaff: () => void; }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager", position: "ผู้จัดการร้าน" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = "w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-2 focus:ring-4 focus:ring-indigo-500/20 transition-all";

  async function handleLogin() {
    setLoading(true);
    await handleAuthSubmit((d: any) => loginAction(d.email, d.password), form, setError, onLogin);
    setLoading(false);
  }
  async function handleRegister() {
    setLoading(true);
    let dbRole = "manager";
    if (form.position === "กรรมการ") dbRole = "committee";
    if (form.position === "ผู้จัดการทั่วไป") dbRole = "general_manager";
    await handleAuthSubmit(registerAction, { ...form, role: dbRole }, setError, onLogin);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "login") handleLogin();
    else handleRegister();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-[420px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-400 text-xs font-bold mb-3 font-mono">
            <span>/executive</span>
            <span>•</span>
            <span>ฝ่ายบริหาร</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Eater Egg Fresh Mart</p>
        </header>

        <div role="tablist" aria-label="โหมดการสลับหน้าผู้บริหาร" className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
          {["login", "register"].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              aria-controls={`exec-${t}-panel`}
              id={`exec-${t}-tab`}
              onClick={() => { setTab(t as any); setError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-indigo-500 ${tab === t ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              {t === "login" ? "เข้าสู่ระบบผู้บริหาร" : "ลงทะเบียนผู้บริหาร"}
            </button>
          ))}
        </div>

        <form id={`exec-${tab}-panel`} role="tabpanel" aria-labelledby={`exec-${tab}-tab`} onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label htmlFor="exec-name" className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อ-นามสกุล</label>
              <input id="exec-name" name="name" required className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          {tab === "register" && (
            <div>
              <label htmlFor="exec-position" className="block text-xs font-semibold text-slate-300 mb-1.5">ตำแหน่งบริหาร</label>
              <select id="exec-position" name="position" className={inp} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="ผู้จัดการร้าน">ผู้จัดการร้าน</option>
                <option value="ผู้จัดการทั่วไป">ผู้จัดการทั่วไป</option>
                <option value="กรรมการ">กรรมการ</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="exec-email" className="block text-xs font-semibold text-slate-300 mb-1.5">อีเมล</label>
            <input
              id="exec-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "exec-auth-error" : undefined}
              className={inp}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="exec-password" className="block text-xs font-semibold text-slate-300 mb-1.5">รหัสผ่าน</label>
            <input
              id="exec-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "exec-auth-error" : undefined}
              className={inp}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && (
            <div id="exec-auth-error" role="alert" className="p-2.5 bg-rose-950/80 border border-rose-800 text-xs text-rose-300 text-center rounded-xl font-semibold">
              {error}
            </div>
          )}
          <button disabled={loading} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-950/50 font-semibold mt-3 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500">
            {loading ? "กำลังโหลด..." : tab === "login" ? "เข้าสู่ระบบผู้บริหาร" : "บันทึกข้อมูลผู้บริหาร"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button type="button" onClick={onSwitchToStaff} className="text-xs text-slate-400 hover:text-slate-200 font-semibold focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg py-2 px-3 transition-colors cursor-pointer min-h-[36px]">กลับไปยังหน้าพนักงาน (Staff Portal)</button>
        </div>
      </div>
    </main>
  );
}

// ─── System Admin Portal (URL /admin ) ──────────────────────────────────────
function SystemAdminAuthPage({ onLogin, onSwitchToStaff }: { onLogin: (user: User) => void; onSwitchToStaff: () => void; }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = "w-full bg-slate-950 focus:bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-2 focus:ring-4 focus:ring-red-500/20 transition-all";

  async function handleLogin() {
    setLoading(true);
    await handleAuthSubmit((d: any) => loginAction(d.email, d.password), form, setError, (user: User) => {
      if (user.role === "admin" || user.email === "admin@factory.com") onLogin(user);
      else setError("บัญชีนี้ไม่มีสิทธิ์การเข้าถึงระดับ System Admin");
    });
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="w-full max-w-[390px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl relative z-10">
        <header className="mb-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">System Admin</h1>
          <p className="text-xs text-slate-400 mt-1">Eater Egg Fresh Mart Data Control</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Admin Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              placeholder="admin@domain.com"
              aria-invalid={!!error}
              aria-describedby={error ? "admin-auth-error" : undefined}
              className={inp}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="admin-passkey" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Passkey</label>
            <input
              id="admin-passkey"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              aria-invalid={!!error}
              aria-describedby={error ? "admin-auth-error" : undefined}
              className={inp}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && (
            <div id="admin-auth-error" role="alert" className="p-2.5 bg-red-950 border border-red-900 text-xs text-red-300 text-center rounded-xl font-semibold">
              {error}
            </div>
          )}
          <button disabled={loading} type="submit" className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] font-semibold mt-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-red-500">
            {loading ? "Authenticating..." : "Authorize Access"}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <button type="button" onClick={onSwitchToStaff} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto py-2 px-3 rounded-lg focus-visible:outline-2 focus-visible:outline-red-500 min-h-[36px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Return to Core App
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Shift Select Page (Clean Minimalist Shift Cards) ──────────────────────────
function ShiftSelectPage({
  user,
  onSelect,
  onLogout,
}: {
  user: User;
  onSelect: (shift: ShiftType) => void;
  onLogout: () => void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const initialShift: ShiftType = hour < 14 ? "morning" : "afternoon";

  const shifts: {
    id: ShiftType;
    title: string;
    subTitle: string;
    time: string;
    tagline: string;
    isCurrent: boolean;
  }[] = [
      {
        id: "morning",
        title: "เช้า",
        subTitle: "กะเช้า",
        time: "06:00 – 16:30",
        tagline: "เปิดร้าน รับสินค้า ตรวจนับสต็อก และบริการลูกค้าช่วงเช้า",
        isCurrent: hour >= 6 && hour < 16,
      },
      {
        id: "afternoon",
        title: "บ่าย",
        subTitle: "กะบ่าย",
        time: "10:00 – 20:30",
        tagline: "ดูแลลูกค้าหน้าร้าน เติมสต็อก สรุปยอดเงิน และปิดร้าน",
        isCurrent: hour >= 10 && hour < 21,
      },
      {
        id: "both",
        title: "ควบ",
        subTitle: "ควบสองกะ",
        time: "06:00 – 20:30",
        tagline: "ควงกะปฏิบัติงานต่อเนื่องตลอดวัน ทั้งรอบเช้าและรอบบ่าย",
        isCurrent: false,
      },
    ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-4 py-6 sm:py-10">
      {/* Clean Top Profile Bar */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm select-none shadow-md">
            {user.name.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div>
                {user.branchName && (
                  <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 leading-none mb-0.5">
                    {user.branchName}
                  </p>
                )}
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">{user.name}</h1>
              </div>
              <span className="text-[11px] font-semibold bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-800">
                {user.position || "พนักงาน"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Eater Egg Fresh Mart</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-900 hover:bg-rose-950/40 font-semibold cursor-pointer min-h-[36px]"
        >
          ออกจากระบบ
        </button>
      </header>

      {/* Main Area: Clean Header & 3 Shift Cards */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/80 border border-indigo-800/80 px-3 py-1 rounded-full mb-3">
            ขั้นตอนที่ 1 จาก 2 • เลือกกะการทำงาน
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            เลือกกะการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            เลือกช่วงเวลาที่คุณต้องการปฏิบัติงานเพื่อเข้าสู่การเลือกหน้าที่
          </p>
        </div>

        {/* 3 Shift Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Top Bar inside Card */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                    {s.id === "morning" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                      </svg>
                    ) : s.id === "afternoon" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {s.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                        เวลานี้
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-300 font-mono bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                      {s.subTitle}
                    </span>
                  </div>
                </div>

                {/* Big Clean Title */}
                <div className="my-2">
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1 font-mono flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{s.time}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {s.tagline}
                </p>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  <span>เลือกกะ{s.title}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-500 font-medium py-2">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}

// ─── Position Select Page (Clean Minimalist Position Cards) ───────────────────
function PositionSelectPage({
  user,
  shift,
  onSelectPosition,
  onBack,
  onLogout,
}: {
  user: User;
  shift: ShiftType;
  onSelectPosition: (position: string) => void;
  onBack: () => void;
  onLogout: () => void;
}) {
  const isMorning = shift === "morning";
  const isAfternoon = shift === "afternoon";
  const shiftTitle = isMorning ? "กะเช้า" : isAfternoon ? "กะบ่าย" : "กะควบ (2 กะ)";
  const shiftHours = isMorning ? "06:00 – 16:30" : isAfternoon ? "10:00 – 20:30" : "06:00 – 20:30";

  const availablePositions = user.role === "manager" ? MANAGEMENT_POSITIONS : STAFF_POSITIONS;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-4 py-6 sm:py-10">
      {/* Top Header Card */}
      <header className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="ย้อนกลับไปเลือกกะ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            {user.branchName && (
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5 leading-none">
                {user.branchName}
              </p>
            )}
            <p className="text-sm sm:text-base font-bold text-white leading-tight mb-1">{user.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">
              กะที่เลือก: <span className="font-bold text-indigo-300">{shiftTitle} ({shiftHours})</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-3.5 py-2 rounded-xl border border-slate-800 hover:border-rose-900 hover:bg-rose-950/40 focus-visible:outline-2 focus-visible:outline-indigo-500 font-semibold cursor-pointer min-h-[36px]"
        >
          ออกจากระบบ
        </button>
      </header>

      {/* Main Section */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-4">
        {/* Step Indicator & Title */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-950/80 border border-indigo-800/80 px-3 py-1 rounded-full mb-3">
            ขั้นตอนที่ 2 จาก 2 • เลือกตำแหน่งหน้าที่
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            เลือกตำแหน่งงาน
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            เลือกหน้าที่ที่คุณปฏิบัติงานในกะนี้ เพื่อเริ่มต้นตรวจเช็คงาน
          </p>
        </div>

        {/* Position Cards Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {availablePositions.map((pos) => {
            const isCashier = pos === "แคชเชียร์";

            return (
              <div
                key={pos}
                className="group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/30 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                      {isCashier ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <circle cx="7" cy="15" r="1" />
                          <circle cx="12" cy="15" r="1" />
                          <circle cx="17" cy="15" r="1" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      )}
                    </div>

                    <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full">
                      เข้าใช้งาน
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                    {pos}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    {isCashier
                      ? "รับผิดชอบงานจุดชำระเงิน ตรวจสอบระบบแคชเชียร์ นับเงินทอน และดูแลบริการลูกค้าหน้าร้าน"
                      : "รับผิดชอบการจัดเรียงสินค้า ตรวจนับสต็อก เติมสินค้าตู้แช่ และตรวจสอบความสดใหม่"}
                  </p>

                  <div className="space-y-2 py-3 border-t border-slate-800 text-xs text-slate-400">
                    {isCashier ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>ตรวจเงินสด ลิ้นชัก และอุปกรณ์รับชำระ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>ดูแลความสะอาดรอบจุดเคาน์เตอร์</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>ตรวจรับสินค้าสดและเติมตู้แช่</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>ตรวจเช็คป้ายราคาและวันหมดอายุ</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectPosition(pos)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
                  >
                    <span>เลือกหน้าที่{pos}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-lg px-2 py-1 min-h-[36px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>ต้องการเปลี่ยนกะ? กลับไปเลือกกะ</span>
          </button>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-500 font-medium py-2">
        {user.branchName || "Eater Egg Fresh Mart"} • Checklist System
      </footer>
    </main>
  );
}

// ─── Checklist Page (Clean Minimalist Task List with Filter Tabs) ─────────────
function ChecklistPage({
  session,
  onUpdate,
  onEndShift,
  onOpenDashboard,
  onExit,
}: {
  session: ShiftSession;
  onUpdate: (s: ShiftSession) => void;
  onEndShift: () => void;
  onOpenDashboard?: () => void;
  onExit?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const { dialogRef: confirmDialogRef, handleKeyDown: handleConfirmKeyDown } = useModalFocusTrap(showConfirm, () => setShowConfirm(false));

  const total = session.items.length;
  const done = session.items.filter((i) => i.completedAt).length;
  const allDone = done === total;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const filteredItems = session.items.filter((i: any) => {
    if (filter === "pending") return !i.completedAt;
    if (filter === "done") return !!i.completedAt;
    return true;
  });

  async function toggleItem(id: string) {
    if (session.completedAt) return;
    const item = session.items.find(i => i.id === id);
    if (!item) return;
    const completed = !item.completedAt;

    // optimistically update state
    const updated = session.items.map((i) =>
      i.id === id ? { ...i, completedAt: completed ? new Date().toISOString() : null } : i
    );
    const allComplete = updated.every((i) => i.completedAt);
    let updatedSession = { ...session, items: updated, notified: session.notified || allComplete };

    onUpdate(updatedSession);

    // Call server action
    await toggleTaskWorkAction({
      taskWorkId: item.taskWorkId,
      shiftSessionId: session.id,
      taskId: id,
      userId: session.userId,
      completed
    });
  }

  async function endShift() {
    setShowConfirm(false);
    await endShiftSessionAction(session.id);
    onEndShift();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Off-screen live status update for assistive tech (SC 4.1.3) */}
      <div aria-live="polite" className="sr-only">
        ความคืบหน้างาน {done} จาก {total} รายการ ({progress}%)
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* Header Card */}
        <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {getShiftBadge(session.shift)}
                {session.userPosition && (
                  <span className="text-xs font-semibold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    {session.userPosition}
                  </span>
                )}
                {allDone && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    ครบถ้วน 100%
                  </span>
                )}
              </div>
              {session.branchName && (
                <p className="text-[10px] sm:text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1 leading-none">
                  {session.branchName}
                </p>
              )}
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-none">{session.userName}</h1>
              <p className="text-xs text-slate-400 font-mono mt-1.5">เริ่มงานเวลา {fmtTime(session.startedAt)}</p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenDashboard && (
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="text-xs px-3 py-2 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 hover:bg-indigo-900 transition-colors font-semibold flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  แดชบอร์ด
                </button>
              )}
              {/* ปุ่ม “ต่อกะ” - กดได้เฉพาะเมื่อเลือก 2 กะ และ Checklist ครบ 100% */}
              {(() => {
                const activeSelectedShifts = typeof window !== "undefined" ? (JSON.parse(secureGetItem("app_selected_shifts") || "[]") as string[]) : [];
                const hasNextShift = activeSelectedShifts.length === 2 && session.shift === "morning";
                const canContinueShift = hasNextShift && allDone && !Boolean(session.completedAt);
                const canFinishShift = allDone && !Boolean(session.completedAt);

                return (
                  <>
                    <button
                      type="button"
                      disabled={!canContinueShift}
                      onClick={() => {
                        if (!canContinueShift) return;
                        const nextVal = typeof window !== "undefined" && secureGetItem("app_queue_afternoon") === "true" ? false : true;
                        if (typeof window !== "undefined") {
                          if (nextVal) secureSetItem("app_queue_afternoon", "true");
                          else secureRemoveItem("app_queue_afternoon");
                        }
                      }}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-1.5 min-h-[36px] transition-all ${!canContinueShift
                        ? "bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                        : typeof window !== "undefined" && secureGetItem("app_queue_afternoon") === "true"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md cursor-pointer"
                          : "bg-slate-800/90 border-slate-700 text-slate-200 hover:border-indigo-500 cursor-pointer"
                        }`}
                      title={
                        !hasNextShift
                          ? "เลือกเพียง 1 กะ หรือไม่มีกะถัดไปที่เลือกไว้"
                          : !canContinueShift
                            ? "ต้องทำ Checklist ครบ 100% ก่อนจึงจะเลือกต่อกะได้"
                            : "ต่อกะ"
                      }
                    >
                      {!canContinueShift && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                      <span>ต่อกะ</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canFinishShift}
                      onClick={() => setShowConfirm(true)}
                      className={`text-xs px-4 py-2 rounded-xl border font-semibold flex items-center gap-1.5 min-h-[36px] transition-all ${!canFinishShift
                        ? "bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                        : "bg-rose-950/80 border-rose-800 text-rose-200 hover:bg-rose-900 hover:border-rose-600 hover:text-white cursor-pointer shadow-lg shadow-rose-950/50"
                        }`}
                    >
                      {!canFinishShift && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                      <span>จบกะงาน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowExitConfirm(true)}
                      className="text-xs px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-rose-300 hover:border-rose-900/80 hover:bg-rose-950/30 transition-all font-semibold flex items-center gap-1.5 min-h-[36px] cursor-pointer shadow-xs"
                      title="ออกจากหน้านี้"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>ออก</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Minimalist Progress Indicator */}
          <div className="pt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">
                ความคืบหน้า: <span className="font-mono">{done}/{total}</span> รายการ
              </span>
              <span className="font-mono font-bold text-indigo-400">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-800">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "all" ? "bg-indigo-600 text-white font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              ทั้งหมด ({total})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "pending" ? "bg-indigo-600 text-white font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              ที่ต้องทำ ({total - done})
            </button>
            <button
              type="button"
              onClick={() => setFilter("done")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filter === "done" ? "bg-indigo-600 text-white font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              เสร็จแล้ว ({done})
            </button>
          </div>

          {allDone && (
            <span className="hidden sm:inline-flex text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
              ตรวจครบทุกข้อแล้ว
            </span>
          )}
        </div>

        {/* Checklist Items */}
        <ul className="space-y-2.5 list-none p-0" aria-label="รายการตรวจสอบประจำกะ">
          {filteredItems.map((item: any, idx: number) => {
            const isDone = !!item.completedAt;
            const originalIndex = session.items.findIndex((i) => i.id === item.id);
            const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
            const showCategoryHeader = item.category && (!prevItem || prevItem.category !== item.category);

            return (
              <li key={item.id} className="space-y-2">
                {showCategoryHeader && (
                  <div className="pt-3 pb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-slate-300 tracking-wide">{item.category}</h2>
                  </div>
                )}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-indigo-500 shadow-md cursor-pointer ${isDone
                    ? "bg-slate-950/80 border-slate-850"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                      }`}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-slate-500 font-semibold pt-0.5 select-none" aria-hidden="true">
                        {String(originalIndex + 1).padStart(2, "0")}
                      </span>
                      <p className={`text-sm leading-relaxed ${isDone ? "text-slate-500 line-through" : "text-white font-medium"}`}>
                        {item.label}
                      </p>
                    </div>
                    {isDone && item.completedAt && (() => {
                      let isLate = item.isLate ?? false;
                      if (!isLate && item.category) {
                        const match = item.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                        if (match) {
                          const endStr = match[2];
                          const [endHr, endMin] = endStr.split(':').map(Number);
                          const completedDate = new Date(item.completedAt);
                          const deadlineDate = new Date(session.startedAt);
                          deadlineDate.setHours(endHr, endMin, 0, 0);
                          if (completedDate > deadlineDate) {
                            isLate = true;
                          }
                        }
                      }
                      return (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-400 pl-6 font-medium">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            เสร็จเมื่อ {fmtTime(item.completedAt)}
                            {isLate && <span className="text-amber-500 font-bold ml-1">(Late)</span>}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </button>
              </li>
            );
          })}

          {filteredItems.length === 0 && (
            <li className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-sm font-semibold text-slate-300">ไม่มีรายการในหมวดนี้</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {filter === "pending" ? "คุณทำครบทุกรายการแล้ว" : "ยังไม่มีรายการที่เสร็จสมบูรณ์"}
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowConfirm(false)}
          onKeyDown={handleConfirmKeyDown}
        >
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-shift-title"
            tabIndex={-1}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-2 focus-visible:outline-indigo-500 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-shift-title" className="text-base font-bold text-white mb-2">
              ยืนยันการจบกะงาน?
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {allDone
                ? "คุณได้ทำการตรวจสอบครบถ้วนทั้ง 100% แล้ว ต้องการบันทึกและจบกะงานใช่หรือไม่?"
                : `ยังมีรายการที่ยังไม่เสร็จอีก ${total - done} รายการ คุณต้องการจบกะงานตอนนี้เลยหรือไม่?`}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={endShift}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer"
              >
                จบกะงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-main-title"
            tabIndex={-1}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-2 focus-visible:outline-indigo-500 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 id="exit-modal-main-title" className="text-base font-bold text-white mb-2">
              ต้องการออกจากหน้า Checklist หรือไม่?
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              คุณต้องการกลับไปยังหน้าเลือกกะการทำงานหรือไม่? (รายการที่บันทึกแล้วจะยังคงถูกบันทึกไว้ในระบบ)
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  if (onExit) onExit();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                ออกจากหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard({
  user,
  onLogout,
  activeSession,
  onStartChecklist,
  onUpdateSession,
  onEndShift,
  onOpenChecklistPage,
}: {
  user: User;
  onLogout: () => void;
  activeSession: ShiftSession | null;
  onStartChecklist: (shift: ShiftType) => void;
  onUpdateSession: (session: ShiftSession) => void;
  onEndShift: () => void;
  onOpenChecklistPage: () => void;
}) {

  const [notifications, setCustomNotifications] = useState<CustomNotification[]>([]);
  const [sessions, setSessions] = useState<ShiftSession[]>([]);
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [shiftsStatus, setShiftsStatus] = useState<any>(null);

  const [newPositionName, setNewPositionName] = useState("");
  const [positionMsg, setPositionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [staffMsg, setStaffMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: "", email: "", password: "", position: "" });

  // Permissions: Assistant Manager cannot assign or select positions for staff (only Store Manager and Directors can)
  const isAssistant = user.position?.includes("ผู้ช่วย") || false;
  const canManagePositions = !isAssistant;

  const [activeTab, setActiveTab] = useState<"my-checklist" | "staff" | "inbox" | "history" | "positions">(
    isAssistant ? "my-checklist" : "staff"
  );
  const [selectedSession, setSelectedSession] = useState<ShiftSession | null>(null);
  const { dialogRef: sessionDialogRef, handleKeyDown: handleSessionKeyDown } = useModalFocusTrap(!!selectedSession, () => setSelectedSession(null));
  const { dialogRef: addStaffDialogRef, handleKeyDown: handleAddStaffKeyDown } = useModalFocusTrap(showAddStaffModal, () => setShowAddStaffModal(false));

  const unread = notifications.filter((n) => !n.read).length;
  const employees = usersList.filter((u) => u.role === "employee");
  const unassignedEmployees = employees.filter((u) => !u.position);


  useEffect(() => {
    async function loadData() {
      getAllUsersAction().then((res: any) => { if (res.users) setUsersList(res.users); });
      getPositionShiftsStatusAction(user.position || "ผู้จัดการร้าน").then(res => {
        if (res.success) setShiftsStatus(res.statuses);
      });
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);


  function markRead(id: string) {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    saveCustomNotifications(updated);
    setCustomNotifications(updated);
  }

  function markAllRead() {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveCustomNotifications(updated);
    setCustomNotifications(updated);
  }

  function handleUpdateUserPosition(userId: string, newPos: string) {
    if (!canManagePositions) {
      setStaffMsg({
        text: "ผู้ช่วยผู้จัดการร้านไม่สามารถเลือกหรือเปลี่ยนตำแหน่งให้พนักงานได้ (สิทธิ์เฉพาะผู้จัดการร้านและกรรมการ)",
        type: "error",
      });
      return;
    }
    const users = usersList;
    const updated = users.map((u) => (u.id === userId ? { ...u, position: newPos || undefined } : u));
    // call assign user action - not fully implemented in prototype
    setUsersList(updated);
    const target = users.find((u) => u.id === userId);
    setStaffMsg({
      text: `อัปเดตตำแหน่งของ "${target?.name || "พนักงาน"}" เป็น "${newPos || "ยังไม่กำหนด"}" สำเร็จ`,
      type: "success",
    });
    setTimeout(() => setStaffMsg(null), 3000);
  }

  function handleDeleteStaff(userId: string) {
    if (!canManagePositions) {
      setStaffMsg({ text: "ผู้ช่วยผู้จัดการร้านไม่มีสิทธิ์ลบบัญชีพนักงาน", type: "error" });
      return;
    }
    const users = usersList;
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === user.id) {
      alert("ไม่สามารถลบบัญชีของตัวเองได้");
      return;
    }
    if (!confirm(`ยืนยันการลบบัญชีของ "${target.name}" หรือไม่?`)) return;
    const updated = users.filter((u) => u.id !== userId);
    // call assign user action - not fully implemented in prototype
    setUsersList(updated);
    setStaffMsg({ text: `ลบบัญชีพนักงาน "${target.name}" เรียบร้อยแล้ว`, type: "success" });
    setTimeout(() => setStaffMsg(null), 3000);
  }

  function handleAddStaff() {
    if (!newStaffForm.name.trim() || !newStaffForm.email.trim() || !newStaffForm.password.trim()) {
      setStaffMsg({ text: "กรุณากรอกข้อมูลพนักงานให้ครบถ้วน", type: "error" });
      return;
    }
    const users = usersList;
    if (users.some((u) => u.email.toLowerCase() === newStaffForm.email.trim().toLowerCase())) {
      setStaffMsg({ text: "อีเมลนี้มีอยู่ในระบบแล้ว", type: "error" });
      return;
    }
    const newUser: User = {
      id: uid(),
      name: newStaffForm.name.trim(),
      email: newStaffForm.email.trim(),
      password: newStaffForm.password.trim(),
      role: "employee",
      position: canManagePositions ? (newStaffForm.position || undefined) : undefined,
    };
    const updated = [...users, newUser];
    // call assign user action - not fully implemented in prototype
    setUsersList(updated);
    setNewStaffForm({ name: "", email: "", password: "", position: "" });
    setShowAddStaffModal(false);
    setStaffMsg({ text: `เพิ่มพนักงาน "${newUser.name}" เรียบร้อยแล้ว`, type: "success" });
    setTimeout(() => setStaffMsg(null), 3000);
  }

  function handleAddPosition() {
    if (!canManagePositions) return;
    const trimmed = newPositionName.trim();
    if (!trimmed) return;
    if (positions.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setPositionMsg({ text: "มีชื่อตำแหน่งนี้อยู่แล้วในระบบ", type: "error" });
      return;
    }
    const updated = [...positions, { id: uid(), name: trimmed }];

    setPositions(updated);
    setNewPositionName("");
    setPositionMsg({ text: `เพิ่มตำแหน่ง "${trimmed}" เรียบร้อยแล้ว`, type: "success" });
    setTimeout(() => setPositionMsg(null), 3000);
  }

  function handleDeletePosition(posId: string) {
    if (!canManagePositions) return;
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    const users = usersList;
    const assignedCount = users.filter((u) => u.position === pos.name).length;
    if (assignedCount > 0) {
      if (!confirm(`มีพนักงาน ${assignedCount} คนอยู่ในตำแหน่ง "${pos.name}" คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งนี้?`)) {
        return;
      }
    }
    const updated = positions.filter((p) => p.id !== posId);

    setPositions(updated);
    setPositionMsg({ text: `ลบตำแหน่ง "${pos.name}" เรียบร้อยแล้ว`, type: "success" });
    setTimeout(() => setPositionMsg(null), 3000);
  }

  const completedSessions = sessions
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(staffSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (staffFilter === "unassigned") return !emp.position;
    if (staffFilter === "assigned") return Boolean(emp.position);
    return true;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-100 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${user.position?.includes("กรรมการ")
                  ? "bg-amber-500"
                  : user.position?.includes("ผู้ช่วย")
                    ? "bg-blue-500"
                    : "bg-emerald-500"
                  }`}
                aria-hidden="true"
              />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {user.position?.includes("กรรมการ")
                  ? "คณะกรรมการบริหาร (Executive Board)"
                  : user.position?.includes("ผู้ช่วย")
                    ? "ฝ่ายบริหารสาขา (Assistant Store Manager)"
                    : "ผู้จัดการสาขา (Store Manager)"}
              </p>
            </div>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              {user.position && (
                <Badge
                  color={
                    user.position.includes("กรรมการ")
                      ? "amber"
                      : user.position.includes("ผู้ช่วย")
                        ? "blue"
                        : "green"
                  }
                >
                  {user.position}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSession ? (
              <button
                type="button"
                onClick={onOpenChecklistPage}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm min-h-[36px]"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>เช็คลิสต์ที่ทำอยู่ ({activeSession.items.filter((i) => i.completedAt).length}/{activeSession.items.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("my-checklist")}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-colors flex items-center gap-1.5 min-h-[36px]"
              >
                <span>ทำเช็คลิสต์กะของฉัน</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-600 hover:text-red-600 transition-colors px-3.5 py-2 rounded-lg border border-slate-200 hover:border-red-300 min-h-[36px] inline-flex items-center font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="region" aria-label="สถิติภาพรวม">
          {[
            { label: "พนักงานทั้งหมด", value: employees.length, color: "text-slate-900" },
            { label: "รอกำหนดตำแหน่ง", value: unassignedEmployees.length, color: unassignedEmployees.length > 0 ? "text-amber-700 font-bold" : "text-slate-600" },
            { label: "แจ้งเตือนงานเสร็จ", value: unread, color: unread > 0 ? "text-amber-700 font-bold" : "text-slate-600" },
            { label: "กะที่เสร็จวันนี้", value: completedSessions.filter((s) => s.completedAt && new Date(s.completedAt).toDateString() === new Date().toDateString()).length, color: "text-emerald-700" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] font-medium text-slate-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="หมวดหมู่ข้อมูลผู้จัดการ" className="flex bg-slate-100 border border-slate-200 rounded-lg p-1 flex-wrap sm:flex-nowrap gap-1">
          {(["my-checklist", "staff", "inbox", "positions", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`${t}-tab`}
              aria-selected={activeTab === t}
              aria-controls={`${t}-panel`}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === t ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              {t === "my-checklist" && (
                <>
                  <span>เช็คลิสต์กะของฉัน</span>
                  {activeSession && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  )}
                </>
              )}
              {t === "staff" && (isAssistant ? "รายชื่อพนักงาน" : "จัดการพนักงาน & ตำแหน่ง")}
              {t === "inbox" && "กล่องแจ้งเตือน"}
              {t === "positions" && (isAssistant ? "เกณฑ์เช็คลิสต์แต่ละตำแหน่ง" : "ตำแหน่ง & เช็คลิสต์")}
              {t === "history" && "ประวัติกะ"}

              {t === "staff" && unassignedEmployees.length > 0 && canManagePositions && (
                <span
                  className="bg-amber-600 text-white text-[10px] font-bold font-mono rounded-full px-1.5 py-0.2 flex items-center justify-center"
                  aria-label={`รอกำหนดตำแหน่ง ${unassignedEmployees.length} คน`}
                >
                  {unassignedEmployees.length}
                </span>
              )}
              {t === "inbox" && unread > 0 && (
                <span
                  className="bg-amber-600 text-white text-[10px] font-bold font-mono rounded-full w-4 h-4 flex items-center justify-center"
                  aria-label={`ยังไม่อ่าน ${unread} รายการ`}
                >
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
          {/* MY CHECKLIST TAB (เช็คลิสต์ประจำกะของผู้ช่วยผู้จัดการ / ผู้บริหาร) */}
          {activeTab === "my-checklist" && (
            <div className="space-y-4">
              {/* Info Header */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge color={isAssistant ? "blue" : "green"}>{user.position || "ฝ่ายบริหาร"}</Badge>
                    <span className="text-xs text-emerald-950 font-bold">เช็คลิสต์การปฏิบัติงานประจำกะ</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isAssistant
                      ? "รายการตรวจสอบประจำกะสำหรับ ผู้ช่วยผู้จัดการร้าน (ควบคุมเงินสด, นำส่งธนาคาร, รับเข้าสินค้า และดูแลการขาย)"
                      : "รายการตรวจสอบมาตรฐานประจำกะสำหรับ ผู้จัดการสาขา"}
                  </p>
                </div>

                {activeSession && (
                  <button
                    type="button"
                    onClick={onOpenChecklistPage}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                  >
                    <span>เปิดแบบเต็มจอ</span>
                  </button>
                )}
              </div>

              {!activeSession ? (
                /* Shift Selection for Assistant / Manager */
                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="text-center max-w-md mx-auto mb-4">
                    <h2 className="text-base font-bold text-slate-900">เลือกกะการปฏิบัติงานเพื่อเริ่มเช็คลิสต์</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      คลิกเพื่อเปิดรายการตรวจสอบงานประจำวันตามกะที่คุณรับผิดชอบ
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Morning Shift Card */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:border-amber-400 hover:bg-amber-50/20 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                            กะเช้า (05:30 - 15:00)
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {getChecklistTemplate(user.position, "morning" as ShiftType).length} รายการ
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mb-1.5">หน้าที่หลักในกะเช้า:</p>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {getChecklistTemplate(user.position, "morning" as ShiftType).slice(0, 4).map((item) => (
                            <li key={item.id} className="line-clamp-1">{item.label}</li>
                          ))}
                          {getChecklistTemplate(user.position, "morning" as ShiftType).length > 4 && (
                            <li className="text-slate-500 italic">และอีก {getChecklistTemplate(user.position, "morning" as ShiftType).length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartChecklist("morning")}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>เริ่มทำเช็คลิสต์กะเช้า</span>
                      </button>
                    </div>

                    {/* Afternoon Shift Card */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 text-xs font-bold font-mono">
                            กะบ่าย (13:00 - 21:00)
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {getChecklistTemplate(user.position, "afternoon" as ShiftType).length} รายการ
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mb-1.5">หน้าที่หลักในกะบ่าย:</p>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {getChecklistTemplate(user.position, "afternoon" as ShiftType).slice(0, 4).map((item) => (
                            <li key={item.id} className="line-clamp-1">{item.label}</li>
                          ))}
                          {getChecklistTemplate(user.position, "afternoon" as ShiftType).length > 4 && (
                            <li className="text-slate-500 italic">และอีก {getChecklistTemplate(user.position, "afternoon" as ShiftType).length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartChecklist("afternoon")}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>เริ่มทำเช็คลิสต์กะบ่าย</span>
                      </button>
                    </div>

                    {/* Both Shifts Card */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
                            รวบสองกะ (ทั้งวัน)
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {getChecklistTemplate(user.position, "both").length} รายการ
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mb-1.5">หน้าที่ครอบคลุมทั้งวัน:</p>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          {getChecklistTemplate(user.position, "both").slice(0, 4).map((item) => (
                            <li key={item.id} className="line-clamp-1">{item.label}</li>
                          ))}
                          {getChecklistTemplate(user.position, "both").length > 4 && (
                            <li className="text-slate-500 italic">และอีก {getChecklistTemplate(user.position, "both").length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartChecklist("both")}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>เริ่มทำเช็คลิสต์รวบสอง</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Live In-Dashboard Checklist Runner */
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-2xs">
                  {/* Progress header */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getShiftBadge(activeSession.shift)}
                        <span className="text-xs text-slate-500 font-mono">
                          เริ่ม {fmtTime(activeSession.startedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {activeSession.items.filter((i) => i.completedAt).length} / {activeSession.items.length} รายการ
                        </span>
                        <button
                          type="button"
                          onClick={onEndShift}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold transition-colors"
                        >
                          จบกะงาน
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                        style={{
                          width: `${(activeSession.items.filter((i) => i.completedAt).length / activeSession.items.length) * 100
                            }%`,
                        }}
                      />
                    </div>
                    {activeSession.items.every((i) => i.completedAt) && (
                      <p className="text-xs text-emerald-700 font-bold mt-1">
                        ✓ ทำเช็คลิสต์ครบ 100% แล้ว (ส่งข้อมูลเข้าระบบเรียบร้อย)
                      </p>
                    )}
                  </div>

                  {/* Checklist Item Cards */}
                  <div className="space-y-2.5">
                    {activeSession.items.map((item: any, idx: number) => {
                      const isDone = !!item.completedAt;
                      const prevItem = idx > 0 ? activeSession.items[idx - 1] : null;
                      const showCat = item.category && (!prevItem || prevItem.category !== item.category);

                      function toggleDashboardItem(id: string) {
                        if (!activeSession) return;
                        const currentSession = activeSession;
                        const updatedItems = currentSession.items.map((it: any) => {
                          if (it.id !== id) return it;
                          return { ...it, completedAt: it.completedAt ? null : new Date().toISOString() };
                        });
                        const updatedSession: ShiftSession = { ...currentSession, items: updatedItems };
                        if (updatedItems.every((it: any) => it.completedAt) && !currentSession.notified) {
                          updatedSession.notified = true;
                          const notif: CustomNotification = {
                            id: uid(),
                            shiftSessionId: currentSession.id,
                            userName: currentSession.userName,
                            userPosition: currentSession.userPosition,
                            shift: currentSession.shift,
                            completedAt: new Date().toISOString(),
                            read: false,
                          };
                          saveCustomNotifications([...getCustomNotifications(), notif]);
                        }
                        onUpdateSession(updatedSession);
                      }

                      return (
                        <div key={item.id} className="space-y-1.5">
                          {showCat && (
                            <p className="text-xs font-bold text-slate-800 pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>{item.category}</span>
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleDashboardItem(item.id)}
                            className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all ${isDone
                              ? "bg-emerald-50/70 border-emerald-300 text-slate-600"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900"
                              }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${isDone ? "border-emerald-600 bg-emerald-600" : "border-slate-400 bg-white"
                                }`}
                            >
                              {isDone && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-mono text-slate-400">{String(idx + 1).padStart(2, "0")}</span>
                                <p className={`text-xs sm:text-sm font-medium ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}>
                                  {item.label}
                                </p>
                              </div>
                              {isDone && item.completedAt && (() => {
                                let isLate = item.isLate ?? false;
                                if (!isLate && item.category) {
                                  const match = item.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                                  if (match) {
                                    const endStr = match[2];
                                    const [endHr, endMin] = endStr.split(':').map(Number);
                                    const completedDate = new Date(item.completedAt);
                                    const deadlineDate = new Date(activeSession!.startedAt);
                                    deadlineDate.setHours(endHr, endMin, 0, 0);
                                    if (completedDate > deadlineDate) {
                                      isLate = true;
                                    }
                                  }
                                }
                                return (
                                  <p className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">
                                    เสร็จเมื่อ {fmtTime(item.completedAt)}
                                    {isLate && <span className="text-amber-500 font-bold ml-1">(Late)</span>}
                                  </p>
                                );
                              })()}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAFF MANAGEMENT TAB */}
          {activeTab === "staff" && (
            <div className="space-y-4">
              {/* Permission Banner for Assistant Manager */}
              {!canManagePositions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
                  <div>
                    <p className="font-bold text-amber-900">สิทธิ์ผู้ช่วยผู้จัดการร้าน (Assistant Store Manager)</p>
                    <p className="text-amber-800 mt-0.5">
                      ท่านสามารถตรวจสอบรายชื่อและสถานะของพนักงานได้ แต่<strong>ไม่สามารถเลือกหรือกำหนดตำแหน่งงานให้พนักงานได้</strong> (สิทธิ์การกำหนดตำแหน่งสงวนไว้เฉพาะผู้จัดการร้านและกรรมการ)
                    </p>
                  </div>
                </div>
              )}

              {/* Alert message */}
              {staffMsg && (
                <div role="status" className={`p-3 rounded-lg text-xs font-semibold border ${staffMsg.type === "success" ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-700"}`}>
                  {staffMsg.text}
                </div>
              )}

              {/* Top controls: Search, Filter, Add button */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล หรือตำแหน่ง..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-400 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white focus-visible:outline-2 focus-visible:outline-emerald-700 transition-colors"
                  />
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setStaffFilter("all")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${staffFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"}`}
                    >
                      ทั้งหมด ({employees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffFilter("unassigned")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${staffFilter === "unassigned" ? "bg-white text-amber-900 shadow-2xs font-bold" : "text-slate-600"}`}
                    >
                      รอกำหนด ({unassignedEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffFilter("assigned")}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${staffFilter === "assigned" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"}`}
                    >
                      มีตำแหน่งแล้ว ({employees.length - unassignedEmployees.length})
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 min-h-[36px]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  เพิ่มพนักงานใหม่
                </button>
              </div>

              {/* Employees List */}
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-xl">
                  {staffSearch ? "ไม่พบพนักงานที่ตรงกับการค้นหา" : "ยังไม่มีพนักงานในระบบ"}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEmployees.map((emp) => {
                    const empSessions = sessions.filter((s) => s.userId === emp.id);
                    const lastSession = empSessions[empSessions.length - 1];

                    return (
                      <div
                        key={emp.id}
                        className={`p-4 rounded-xl border transition-all ${!emp.position ? "bg-amber-50/40 border-amber-300" : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Employee Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0 mt-0.5">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                                {!emp.position && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold font-mono">
                                    รอกำหนดตำแหน่ง
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-mono">{emp.email}</p>
                              {lastSession && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  เข้ากะล่าสุด: {getShiftName(lastSession.shift)} ({fmtDate(lastSession.startedAt)})
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Position Selector & Actions */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                              <label htmlFor={`pos-select-${emp.id}`} className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                ตำแหน่ง:
                              </label>
                              {canManagePositions ? (
                                <select
                                  id={`pos-select-${emp.id}`}
                                  value={emp.position || ""}
                                  onChange={(e) => handleUpdateUserPosition(emp.id, e.target.value)}
                                  aria-label={`เลือกตำแหน่งงานสำหรับ ${emp.name}`}
                                  className="text-xs font-medium bg-white border border-slate-400 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-700 cursor-pointer shadow-2xs min-w-[170px]"
                                >
                                  <option value="">-- ยังไม่กำหนดตำแหน่ง --</option>
                                  {positions.map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-[170px]">
                                  <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${emp.position ? "bg-slate-50 text-slate-800 border-slate-200" : "bg-amber-50 text-amber-800 border-amber-200 italic"}`}>
                                    {emp.position || "รอกำหนดตำแหน่ง"}
                                  </span>
                                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5" title="ผู้ช่วยไม่สามารถเลือกตำแหน่งให้พนักงานได้">
                                    เฉพาะผู้จัดการกำหนด
                                  </span>
                                </div>
                              )}
                            </div>

                            {canManagePositions && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(emp.id)}
                                aria-label={`ลบพนักงาน ${emp.name}`}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors min-h-[32px] inline-flex items-center gap-1 font-medium"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                ลบ
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* INBOX TAB */}
          {activeTab === "inbox" && (
            <div>
              {notifications.length > 0 && unread > 0 && (
                <div className="flex justify-end mb-3">
                  <button type="button" onClick={markAllRead} className="text-xs px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors min-h-[32px] inline-flex items-center font-medium shadow-xs">
                    อ่านทั้งหมด
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-400" aria-hidden="true">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...notifications].reverse().filter(notif => {
                    if (isAssistant) {
                      return !(notif.userPosition === "ผู้ช่วยผู้จัดการร้าน" || notif.userPosition?.includes("Assistant") || notif.userName === user.name);
                    }
                    return true;
                  }).map((notif) => {
                    const sess = sessions.find((s) => s.id === notif.shiftSessionId);
                    return (
                      <div key={notif.id} className={`p-4 rounded-xl border transition-all ${!notif.read ? "bg-amber-50/70 border-amber-300" : "bg-slate-50/60 border-slate-200"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {!notif.read && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                                  <span>ยังไม่อ่าน</span>
                                </span>
                              )}
                              <p className="text-sm font-bold text-slate-900">{notif.userName}</p>
                              {notif.userPosition && <Badge color="muted">{notif.userPosition}</Badge>}
                              {getShiftBadge(notif.shift as ShiftType)}
                            </div>
                            <p className="text-xs text-slate-600">ตรวจสอบงานครบทุกรายการแล้ว</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">{fmtDate(notif.completedAt)} {fmtTime(notif.completedAt)}</p>
                          </div>
                          <div className="flex gap-2">
                            {sess && (
                              <button type="button" onClick={() => { setSelectedSession(sess); markRead(notif.id); }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors min-h-[32px] inline-flex items-center font-medium shadow-xs">
                                ดูรายละเอียด
                              </button>
                            )}
                            {!notif.read && (
                              <button type="button" onClick={() => markRead(notif.id)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors min-h-[32px] inline-flex items-center font-semibold">
                                อ่านแล้ว
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {completedSessions.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">ยังไม่มีประวัติกะ</div>
              ) : (
                completedSessions.filter(sess => {
                  if (isAssistant) {
                    return !(sess.userPosition === "ผู้ช่วยผู้จัดการร้าน" || sess.userId === user.id);
                  }
                  return true;
                }).map((sess) => (
                  <button type="button" key={sess.id} onClick={() => setSelectedSession(sess)} className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 hover:border-slate-300 transition-all focus-visible:outline-2 focus-visible:outline-emerald-600 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-slate-900">{sess.userName}</p>
                          {sess.userPosition && <Badge color="muted">{sess.userPosition}</Badge>}
                          {getShiftBadge(sess.shift)}
                          <Badge color="green">{sess.items.filter((i) => i.completedAt).length}/{sess.items.length}</Badge>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500">{fmtDate(sess.completedAt!)} {fmtTime(sess.startedAt)} → {fmtTime(sess.completedAt!)}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* POSITIONS & CHECKLIST TEMPLATE TAB */}
          {activeTab === "positions" && (
            <div className="space-y-6">
              {/* Permission Banner or Add position form */}
              {!canManagePositions ? (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-center gap-2">
                  <span>ผู้ช่วยผู้จัดการร้านสามารถตรวจสอบเกณฑ์เช็คลิสต์ของแต่ละตำแหน่งได้ แต่<strong>ไม่สามารถเพิ่มหรือลบตำแหน่งได้</strong> (สงวนสิทธิ์เฉพาะผู้จัดการร้านและกรรมการ)</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-slate-900 mb-1">เพิ่มตำแหน่งงานใหม่ในร้าน</h2>
                  <p className="text-xs text-slate-500 mb-3">เมื่อสร้างตำแหน่งแล้ว คุณสามารถมอบหมายตำแหน่งนี้ให้กับพนักงานในแท็บ "จัดการพนักงาน"</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="เช่น เจ้าหน้าที่ความปลอดภัย (จป.)"
                      value={newPositionName}
                      onChange={(e) => setNewPositionName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPosition()}
                      className="flex-1 bg-white border border-slate-400 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus-visible:outline-2 focus-visible:outline-emerald-700 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddPosition}
                      disabled={!newPositionName.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      เพิ่มตำแหน่ง
                    </button>
                  </div>
                  {positionMsg && (
                    <p role="status" className={`text-xs mt-2.5 font-semibold ${positionMsg.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
                      {positionMsg.text}
                    </p>
                  )}
                </div>
              )}

              {/* Positions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900">รายการตำแหน่งงานทั้งหมด ({positions.length})</h2>
                </div>
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-xl">
                    ยังไม่มีตำแหน่งงานในระบบ
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {positions.map((pos) => {
                      const users = usersList;
                      const count = users.filter((u) => u.position === pos.name).length;
                      const morningItems = getChecklistTemplate(pos.name, "morning").length;
                      const afternoonItems = getChecklistTemplate(pos.name, "afternoon").length;
                      return (
                        <div
                          key={pos.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{pos.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span>พนักงาน: <strong className="text-slate-700">{count} คน</strong></span>
                                <span>•</span>
                                <span>เช็คลิสต์: กะเช้า {morningItems} / กะบ่าย {afternoonItems} ข้อ</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {canManagePositions && (
                              <button
                                type="button"
                                onClick={() => handleDeletePosition(pos.id)}
                                aria-label={`ลบตำแหน่ง ${pos.name}`}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors min-h-[32px] inline-flex items-center font-medium"
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
          onClick={() => setShowAddStaffModal(false)}
          onKeyDown={handleAddStaffKeyDown}
        >
          <div
            ref={addStaffDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-staff-modal-title"
            tabIndex={-1}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 id="add-staff-modal-title" className="text-base font-bold text-slate-900">
                เพิ่มพนักงานใหม่เข้าร้าน
              </h2>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                aria-label="ปิดหน้าต่าง"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  placeholder="เช่น สมศรี ใจดี"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-400 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลพนักงาน</label>
                <input
                  type="email"
                  placeholder="name@factory.com"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-400 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่านเริ่มต้น</label>
                <input
                  type="password"
                  placeholder="รหัสผ่านเข้าสู่ระบบ"
                  value={newStaffForm.password}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-400 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-600 focus:bg-white focus-visible:outline-2 focus-visible:outline-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">กำหนดตำแหน่งงาน</label>
                {canManagePositions ? (
                  <select
                    value={newStaffForm.position}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-400 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus-visible:outline-2 focus-visible:outline-emerald-700 cursor-pointer"
                  >
                    <option value="">-- ยังไม่กำหนดตำแหน่ง (กำหนดภายหลังได้) --</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>รอผู้จัดการกำหนดตำแหน่ง</span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">ผู้ช่วยไม่สามารถเลือกตำแหน่งได้</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                บันทึกพนักงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedSession(null)}
          onKeyDown={handleSessionKeyDown}>
          <div ref={sessionDialogRef} role="dialog" aria-modal="true" aria-labelledby="session-detail-title" tabIndex={-1}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 focus-visible:outline-2 focus-visible:outline-emerald-700"
            onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 id="session-detail-title" className="text-base font-bold text-slate-900">{selectedSession.userName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedSession.userPosition && <Badge color="muted">{selectedSession.userPosition}</Badge>}
                    {getShiftBadge(selectedSession.shift)}
                    <span className="text-xs font-mono text-slate-500">{fmtDate(selectedSession.startedAt)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedSession(null)} aria-label="ปิดรายละเอียดกะ" className="p-2 -mr-2 text-slate-500 hover:text-slate-800 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-emerald-700">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
              <Divider />
              <div className="mt-4 space-y-2.5">
                {selectedSession.items.map((item: any, idx: number) => {
                  const prevItem = idx > 0 ? selectedSession.items[idx - 1] : null;
                  const showCat = item.category && (!prevItem || prevItem.category !== item.category);
                  return (
                    <div key={item.id} className="space-y-1.5">
                      {showCat && (
                        <p className="text-[11px] font-bold text-slate-700 pt-2 pb-0.5">{item.category}</p>
                      )}
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${item.completedAt ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50/70 border-slate-200"}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${item.completedAt ? "border-emerald-600 bg-emerald-600" : "border-slate-400 bg-white"}`}>
                          {item.completedAt && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{String(idx + 1).padStart(2, "0")}</span>
                            <p className="text-xs font-medium text-slate-900">{item.label}</p>
                          </div>
                          {item.completedAt && (() => {
                            let isLate = item.isLate ?? false;
                            if (!isLate && item.category) {
                              const match = item.category.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                              if (match) {
                                const endStr = match[2];
                                const [endHr, endMin] = endStr.split(':').map(Number);
                                const completedDate = new Date(item.completedAt);
                                const deadlineDate = new Date(selectedSession.startedAt);
                                deadlineDate.setHours(endHr, endMin, 0, 0);
                                if (completedDate > deadlineDate) {
                                  isLate = true;
                                }
                              }
                            }
                            return (
                              <p className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">
                                {fmtTime(item.completedAt)}
                                {isLate && <span className="text-amber-500 font-bold ml-1 font-sans">(Late)</span>}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to detect if current URL is /admin or #admin
// ─── Awaiting Assignment Page ─────────────────────────────────────────────────────
function AwaitingAssignmentPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-3">รอการกำหนดสาขา</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          บัญชีของคุณยังไม่ได้ถูกกำหนดให้อยู่ในสาขาใด ๆ กรุณาติดต่อผู้ดูแลระบบ (Admin) เพื่อทำการกำหนดสาขาก่อนเข้าใช้งาน
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          กลับสู่หน้าล็อกอิน
        </button>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
type Page = "auth" | "shift-select" | "position-select" | "checklist" | "manager" | "awaiting-assignment";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("auth");
  const [authView, setAuthView] = useState<'staff' | 'executive' | 'admin'>('staff');
  const [selectedShift, setSelectedShift] = useState<ShiftType | null>(null);
  const [activeSession, setActiveSession] = useState<ShiftSession | null>(null);

  useEffect(() => {
    document.documentElement.lang = "th";
    function checkUrlRouting() {
      if (typeof window === "undefined") return;
      const p = window.location.pathname.toLowerCase() + window.location.hash.toLowerCase();
      if (p.includes("admin")) setAuthView("admin");
      else if (p.includes("executive") || p.includes("manager")) setAuthView("executive");
      else setAuthView("staff");
    }
    checkUrlRouting();
    window.addEventListener("hashchange", checkUrlRouting);
    return () => window.removeEventListener("hashchange", checkUrlRouting);
  }, []);

  function handleLogin(user: User, shift?: ShiftType) {
    setCurrentUser(user);

    // Block users that have not been assigned to a branch yet (unless they are admin)
    if (!user.branchName && user.role !== "admin") {
      setPage("awaiting-assignment");
      return;
    }

    if (user.role === "manager" || user.role === "committee" || user.role === "general_manager" || user.role === "admin") {
      setPage("manager");
    } else {
      if (shift) {
        setSelectedShift(shift);
        setPage("position-select");
      } else {
        setPage("shift-select");
      }
    }
  }

  function handleShiftSelect(shift: ShiftType) {
    setSelectedShift(shift);
    setPage("position-select");
  }

  async function handlePositionSelect(position: string) {
    if (!currentUser || !selectedShift) return;
    let activeUser = currentUser;
    if (position !== activeUser.position) {
      activeUser = { ...activeUser, position };
      setCurrentUser(activeUser);
    }
    const res = await getOrCreateShiftSessionAction({
      userId: activeUser.id,
      userName: activeUser.name,
      position: position,
      shift: selectedShift
    });
    if (res.success && res.session) {
      setActiveSession(res.session);
      setPage(activeUser.role === "manager_assistant" || activeUser.role === "employee" ? "checklist" : "manager");
    } else {
      console.error(res.error);
    }
  }

  function handleBackToShiftSelect() {
    setSelectedShift(null);
    setPage("shift-select");
  }

  function handleSessionUpdate(updated: ShiftSession) {
    setActiveSession(updated);
  }

  function handleEndShift() {
    setActiveSession(null);
    setSelectedShift(null);
    setPage(currentUser?.role === "manager" ? "manager" : "shift-select");
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveSession(null);
    setSelectedShift(null);
    setPage("auth");
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg focus-visible:outline-2 focus-visible:outline-emerald-950 focus:ring-2 focus:ring-emerald-700">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-white text-slate-900 focus-visible:outline-none">
        {page === "auth" && (
          authView === "admin" ? (
            <SystemAdminAuthPage onLogin={handleLogin} onSwitchToStaff={() => setAuthView("staff")} />
          ) : authView === "executive" ? (
            <ExecutiveAuthPage onLogin={handleLogin} onSwitchToStaff={() => setAuthView("staff")} />
          ) : (
            <StaffAuthPage onLogin={handleLogin} onSwitchToExecutive={() => setAuthView("executive")} onSwitchToAdmin={() => setAuthView("admin")} />
          )
        )}
        {page === "shift-select" && currentUser && (
          <ShiftSelectPage user={currentUser} onSelect={handleShiftSelect} onLogout={handleLogout} />
        )}
        {page === "position-select" && currentUser && selectedShift && (
          <PositionSelectPage user={currentUser} shift={selectedShift} onSelectPosition={handlePositionSelect} onBack={handleBackToShiftSelect} onLogout={handleLogout} />
        )}
        {page === "checklist" && activeSession && (
          <ChecklistPage
            session={activeSession}
            onUpdate={handleSessionUpdate}
            onEndShift={handleEndShift}
            onOpenDashboard={currentUser?.role === "manager" ? () => setPage("manager") : undefined}
            onExit={() => setPage("shift-select")}
          />
        )}
        {page === "manager" && currentUser && (
          <ManagerDashboard user={currentUser} onLogout={handleLogout} activeSession={activeSession} onStartChecklist={handleShiftSelect} onUpdateSession={handleSessionUpdate} onEndShift={handleEndShift} onOpenChecklistPage={() => setPage("checklist")} />
        )}
        {page === "awaiting-assignment" && currentUser && (
          <AwaitingAssignmentPage onLogout={handleLogout} />
        )}
      </main>
    </>
  );
}
