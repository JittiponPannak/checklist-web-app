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
        "w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)] focus:bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all";

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
            <div className="absolute top-1/4 -right-20 w-72 h-72 bg-[var(--color-amber-glow)]/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-[var(--color-amber-glow)]/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="w-full max-w-[400px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 sm:p-8 shadow-xl shadow-amber-900/5 space-y-5 relative z-10">
                <header className="mb-2 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-amber-glow)] text-[var(--color-text)] text-[11px] font-semibold border border-[var(--color-amber)] mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber-glow)]0" aria-hidden="true" />
                        <span>ระบบบริหารสาขาและการจัดการ</span>
                    </div>
                    <BrandLogo size={48} showText={true} isDark={false} />
                </header>

                <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t border-[var(--color-border)] focus-visible:outline-none">

                    <div>
                        <label htmlFor="exec-email" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
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
                        <label htmlFor="exec-password" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
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
                        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 text-amber-300 text-sm font-semibold rounded-xl shadow-md transition-all mt-3 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 bg-[var(--color-brown)] hover:bg-[var(--color-brown-light)] active:bg-[#1f0d0c] shadow-amber-950/20 ${loading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        <span>{loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ (Executive) →"}</span>
                    </button>
                </form>



                <div className="mt-5 pt-4 border-t border-[var(--color-border)] text-center flex flex-col gap-2">
                    <Link href="/login/staff" className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium transition-colors">
                        สำหรับพนักงาน / ผู้ช่วยผู้จัดการ →
                    </Link>
                    <Link href="/" className="text-[11px] text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] font-medium transition-colors">
                        ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
                    </Link>
                </div>
            </div>
        </div>
    );
}
