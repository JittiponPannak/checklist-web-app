import { useState } from "react";
import { User } from "../../types";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction } from "../../actions/auth";
import Link from "next/link";

export function ExecutiveAuthPage({
    onLogin,
}: {
    onLogin: (user: User, shift?: any, redirectPath?: string) => void;
}) {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e?: React.FormEvent) {
        e?.preventDefault();
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

            const role = res.user.role;
            if (role !== "manager" && role !== "general_manager" && role !== "committee") {
                setError("บทบาทนี้ไม่สามารถเข้าระบบระดับบริหารได้");
                setLoading(false);
                return;
            }

            onLogin(res.user, undefined, "/manager/dashboard");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง");
            setLoading(false);
        }
    }

    const inp =
        "w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
            <div className="absolute top-1/4 -right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="w-full max-w-[400px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-5 relative z-10">
                <header className="mb-2 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-[11px] font-semibold border border-indigo-800/60 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                        <span>ระบบบริหารสาขาและการจัดการ</span>
                    </div>
                    <BrandLogo size={48} showText={true} isDark={true} />
                </header>

                <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-slate-800/80 focus-visible:outline-none">

                    <div>
                        <label htmlFor="exec-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            อีเมลฝ่ายบริหาร
                        </label>
                        <input
                            id="exec-email"
                            className={inp}
                            placeholder="manager@factory.com"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="exec-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            รหัสผ่าน
                        </label>
                        <input
                            id="exec-password"
                            className={inp}
                            placeholder="••••••••"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg transition-all mt-3 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-950/50 ${loading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        <span>{loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ (Executive) →"}</span>
                    </button>
                </form>

                <div className="pt-3.5 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 block">
                        ทดสอบด่วน:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            { role: "ผู้จัดการ", email: "manager@factory.com", pass: "manager123" },
                            { role: "กรรมการ", email: "director@factory.com", pass: "director123" },
                        ].map((acc) => (
                            <button
                                key={acc.email}
                                type="button"
                                onClick={() => {
                                    setForm({ ...form, email: acc.email, password: acc.pass });
                                    setError("");
                                }}
                                className="flex-1 p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500 bg-slate-950 hover:bg-slate-900 text-left transition-all cursor-pointer shadow-xs"
                            >
                                <span className="block text-xs font-bold text-indigo-300">{acc.role}</span>
                                <span className="block text-[10px] font-mono text-slate-400 truncate">{acc.email}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 text-center flex flex-col gap-2">
                    <Link href="/login/staff" className="text-[11px] text-slate-400 hover:text-indigo-400 font-medium transition-colors">
                        สำหรับพนักงาน / ผู้ช่วยผู้จัดการ →
                    </Link>
                    <Link href="/" className="text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors">
                        ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
                    </Link>
                </div>
            </div>
        </div>
    );
}
