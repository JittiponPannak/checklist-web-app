import { useState } from "react";
import { User } from "../../types";
import { MANAGEMENT_POSITIONS } from "../../data/checklists";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction, registerAction } from "../../actions/auth";
import Link from "next/link";

export function ManagerAuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    position: MANAGEMENT_POSITIONS[1], // default "ผู้จัดการร้าน"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function directLogin(email: string, pass: string, position: string) {
    setLoading(true);
    setError("");
    try {
      const res = await loginAction(email, pass);
      if (!res.success || !res.user) {
        setError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }
      const activeUser: User = {
        ...res.user,
        role: position.includes("กรรมการ") ? "committee" : position.includes("ผู้ช่วย") ? "manager_assistant" : "manager",
        position: position || res.user.position,
      };
      const localUsers = getUsers();
      if (!localUsers.some((u) => u.id === activeUser.id)) {
        saveUsers([...localUsers, activeUser]);
      }
      onLogin(activeUser);
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

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
      const roleFromUser =
        res.user.role === "committee" || res.user.position?.includes("กรรมการ")
          ? "committee"
          : res.user.role === "manager_assistant" || res.user.position?.includes("ผู้ช่วย")
          ? "manager_assistant"
          : "manager";

      const activeUser: User = {
        ...res.user,
        role: roleFromUser,
        position: res.user.position || form.position,
      };
      const localUsers = getUsers();
      if (!localUsers.some((u) => u.id === activeUser.id)) {
        saveUsers([...localUsers, activeUser]);
      }
      onLogin(activeUser);
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
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
        role: "manager",
        position: form.position,
      });
      if (!res.success || !res.user) {
        setError(res.error || "ไม่สามารถลงทะเบียนได้");
        setLoading(false);
        return;
      }
      const activeUser: User = {
        ...res.user,
        role: form.position.includes("กรรมการ") ? "committee" : form.position.includes("ผู้ช่วย") ? "manager_assistant" : "manager",
        position: form.position,
      };
      const localUsers = getUsers();
      saveUsers([...localUsers, activeUser]);
      onLogin(activeUser);
    } catch {
      setError("เกิดข้อผิดพลาดในการลงทะเบียน");
      setLoading(false);
    }
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[11px] font-bold border border-indigo-200 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
            <span>Manager Portal • ระบบฝ่ายบริหารและตรวจสอบสาขา</span>
          </div>
          <BrandLogo size={48} showText={true} subtitle="ระบบตรวจรับรองกะงานและกำกับดูแลมาตรฐานร้าน" />
        </header>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="ตัวเลือกเข้าสู่ระบบฝ่ายบริหาร"
          className="flex bg-slate-100 p-1 rounded-xl border border-slate-200"
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === t ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "login" ? "เข้าสู่ระบบฝ่ายบริหาร" : "ลงทะเบียนใหม่"}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                className={inputStyle}
                placeholder="เช่น คุณอนุรักษ์ วงศ์สวัสดิ์"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              อีเมลฝ่ายบริหาร
            </label>
            <input
              className={inputStyle}
              placeholder="manager@factory.com"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              รหัสผ่าน
            </label>
            <input
              className={inputStyle}
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleRegister())}
            />
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                ตำแหน่งฝ่ายบริหาร
              </label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className={inputStyle}
              >
                <option value="ผู้ช่วยผู้จัดการร้าน">ผู้ช่วยผู้จัดการร้าน (Assistant Manager)</option>
                <option value="ผู้จัดการร้าน">ผู้จัดการร้าน (Store Manager)</option>
                <option value="กรรมการ">กรรมการบริหาร (Executive Committee)</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 text-center font-semibold flex items-center justify-center gap-1.5">
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={tab === "login" ? handleLogin : handleRegister}
            className={`w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <span>{loading ? "กำลังตรวจสอบข้อมูล..." : (tab === "login" ? "เข้าสู่ระบบฝ่ายบริหาร →" : "ยืนยันการลงทะเบียน")}</span>
          </button>
        </div>

        {/* 1-Click Sample Accounts */}
        {tab === "login" && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                คลิกทดสอบด่วน (1-Click Accounts):
              </span>
              <span className="text-[10px] text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold">
                เข้าสู่ Manager Dashboard
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  role: "ผู้จัดการร้าน",
                  name: "คุณวิภาดา สุขเจริญ",
                  email: "manager@factory.com",
                  pass: "manager123",
                  pos: "ผู้จัดการร้าน",
                  badge: "bg-slate-900 text-white border-slate-900",
                },
                {
                  role: "ผู้ช่วยผู้จัดการ",
                  name: "คุณธนากร เกียรติไพบูลย์",
                  email: "assistant@factory.com",
                  pass: "123",
                  pos: "ผู้ช่วยผู้จัดการร้าน",
                  badge: "bg-indigo-50 text-indigo-900 border-indigo-200",
                },
                {
                  role: "กรรมการบริหาร",
                  name: "คุณกิตติศักดิ์ พัฒนกิจ",
                  email: "director@factory.com",
                  pass: "director123",
                  pos: "กรรมการ",
                  badge: "bg-amber-100 text-amber-950 border-amber-300 font-bold",
                },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => directLogin(acc.email, acc.pass, acc.pos)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer text-left shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200 transition-colors">
                      {acc.role.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${acc.badge}`}>
                          {acc.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{acc.email}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    เข้าสู่ระบบ →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Portal Switching Links */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>← สำหรับพนักงานทั่วไป (/)</span>
          </Link>
          <Link
            href="/admin"
            className="hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Admin Portal (/admin) →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
