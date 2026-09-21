import { useState, useEffect } from "react";
import { User } from "../../types";
import { STAFF_POSITIONS } from "../../types";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction, registerAction } from "../../actions/auth";
import { getBranchesAction, DashboardBranch } from "../../actions/branch";
import Link from "next/link";

export function EmployeeAuthPage({
    onLogin,
}: {
    onLogin: (user: User, shift?: any, redirectPath?: string) => void;
}) {
    const [tab, setTab] = useState<"login" | "register">("login");
    const [branches, setBranches] = useState<DashboardBranch[]>([]);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "employee" as "employee" | "manager_assistant",
        position: STAFF_POSITIONS[0],
        branchId: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tab === "register") {
            getBranchesAction().then((res) => {
                if (res.success && res.branches) {
                    setBranches(res.branches);
                }
            }).catch(console.error);
        }
    }, [tab]);

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

            const role = res.user.role;
            if (role !== "employee" && role !== "manager_assistant") {
                setError("บทบาทนี้ไม่สามารถเข้าสู่ระบบในหน้านี้ได้ กรุณาไปยังหน้าเฉพาะของตำแหน่งคุณ");
                setLoading(false);
                return;
            }

            if (role === "manager_assistant") {
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
        if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
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
                branchId: form.branchId || undefined,
            });
            if (!res.success || !res.user) {
                setError(res.error || "ไม่สามารถสมัครสมาชิกได้");
                setLoading(false);
                return;
            }
            const localUsers = getUsers();
            saveUsers([...localUsers, res.user]);

            if (res.user.role === "manager_assistant") {
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
        "w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)] focus:bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all";

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[var(--color-amber-glow)]/30 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-[var(--color-amber-glow)]/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="w-full max-w-[420px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 sm:p-8 shadow-xl shadow-amber-900/5 space-y-5 relative z-10">
                <header className="mb-2 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-amber-glow)] text-[var(--color-text)] text-[11px] font-semibold border border-[var(--color-amber)] mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber-glow)]" aria-hidden="true" />
                        <span>ระบบพนักงานและผู้ช่วยผู้จัดการร้าน</span>
                    </div>
                    <BrandLogo size={48} showText={true} isDark={false} />
                </header>

                <div
                    role="tablist"
                    className="flex bg-[var(--color-surface-2)] p-1 rounded-xl mb-4 border border-[var(--color-border)] gap-1"
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
                            className={`flex-1 py-2 min-h-[36px] text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${tab === t
                                ? "bg-[var(--color-brown)] text-amber-300 shadow-sm font-bold"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                }`}
                        >
                            {t === "login" ? "เข้าสู่ระบบพนักงาน" : "ลงทะเบียนใหม่"}
                        </button>
                    ))}
                </div>

                <div role="tabpanel" className="space-y-3.5 focus-visible:outline-none">
                    {tab === "register" && (
                        <>
                            <div>
                                <label htmlFor="reg-name" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                    ชื่อ-นามสกุล
                                </label>
                                <input
                                    id="reg-name"
                                    className={inp}
                                    placeholder="สมศรี ใจดี"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="reg-role" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                        ระดับ
                                    </label>
                                    <select
                                        id="reg-role"
                                        className={inp}
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                                    >
                                        <option value="employee">พนักงานสาขา</option>
                                        <option value="manager_assistant">ผู้ช่วยผู้จัดการ</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="reg-pos" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                        ตำแหน่งงาน
                                    </label>
                                    <select
                                        id="reg-pos"
                                        className={inp}
                                        value={form.position}
                                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    >
                                        {STAFF_POSITIONS.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="reg-branch" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                    สังกัดสาขา
                                </label>
                                <select
                                    id="reg-branch"
                                    className={inp}
                                    value={form.branchId}
                                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                >
                                    <option value="">-- ยังไม่ระบุสาขา --</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="emp-email" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                            อีเมล
                        </label>
                        <input
                            id="emp-email"
                            className={inp}
                            placeholder="cashier@factory.com"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="emp-password" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                            รหัสผ่าน
                        </label>
                        <input
                            id="emp-password"
                            className={inp}
                            placeholder="••••••••"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && (tab === "register" ? handleRegister() : handleLogin())}
                        />
                    </div>

                    {tab === "register" && (
                        <div>
                            <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                id="reg-confirm-password"
                                className={inp}
                                placeholder="••••••••"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                            />
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        disabled={loading}
                        onClick={tab === "register" ? handleRegister : handleLogin}
                        className={`w-full py-2.5 text-amber-300 text-sm font-semibold rounded-xl shadow-md transition-all mt-2 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 bg-[var(--color-brown)] hover:bg-[var(--color-brown-light)] active:bg-[#1f0d0c] shadow-amber-950/20 ${loading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        <span>{loading ? "กำลังตรวจสอบข้อมูล..." : tab === "login" ? "เข้าสู่ระบบพนักงาน →" : "ยืนยันการสมัครสมาชิก"}</span>
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center flex flex-col gap-2">
                    <Link href="/login/executive" className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-medium transition-colors">
                        สำหรับระดับผู้จัดการ / กรรมการ →
                    </Link>
                    <Link href="/" className="text-[11px] text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] font-medium transition-colors">
                        ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
                    </Link>
                </div>
            </div>
        </div>
    );
}
