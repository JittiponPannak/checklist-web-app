import { useState } from "react";
import { User } from "../../types";
import { STAFF_POSITIONS } from "../../types";
import { getUsers, saveUsers } from "../../data/storage";
import { BrandLogo } from "../common/BrandLogo";
import { loginAction, registerAction } from "../../actions/auth";
import Link from "next/link";

export function EmployeeAuthPage({
    onLogin,
}: {
    onLogin: (user: User, shift?: any, redirectPath?: string) => void;
}) {
    const [tab, setTab] = useState<"login" | "register">("login");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "employee" as "employee" | "manager_assistant",
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
        "w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="w-full max-w-[400px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-5 relative z-10">
                <header className="mb-2 text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-[11px] font-semibold border border-indigo-800/60 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                        <span>ระบบพนักงานและผู้ช่วยผู้จัดการร้าน</span>
                    </div>
                    <BrandLogo size={48} showText={true} isDark={true} />
                </header>

                <div
                    role="tablist"
                    className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800 gap-1"
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
                                ? "bg-indigo-600 text-white shadow-md font-bold"
                                : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            {t === "login" ? "เข้าสู่ระบบพนักงาน" : "ลงทะเบียนพนักงานใหม่"}
                        </button>
                    ))}
                </div>

                <div role="tabpanel" className="space-y-4 focus-visible:outline-none">
                    {tab === "register" && (
                        <div>
                            <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                                ชื่อ-นามสกุล
                            </label>
                            <input
                                id="reg-name"
                                className={inp}
                                placeholder="ระบุชื่อ-นามสกุล"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="emp-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                            อีเมลพนักงาน
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
                        <label htmlFor="emp-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
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

                    {error && (
                        <div role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-200 text-center font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        disabled={loading}
                        onClick={tab === "register" ? handleRegister : handleLogin}
                        className={`w-full py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg transition-all mt-3 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-950/50 ${loading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        <span>{loading ? "กำลังตรวจสอบข้อมูล..." : tab === "login" ? "เข้าสู่ระบบพนักงาน →" : "ยืนยันการสมัครสมาชิก"}</span>
                    </button>

                    {tab === "login" && (
                        <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="text-[11px] font-medium text-slate-400">ทดสอบด่วน:</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setForm({ ...form, email: "cashier@factory.com", password: "123" });
                                    setError("");
                                }}
                                className="inline-flex items-center gap-1.5 font-mono text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                                <span>cashier@factory.com</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 text-center flex flex-col gap-2">
                    <Link href="/login/executive" className="text-[11px] text-slate-400 hover:text-indigo-400 font-medium transition-colors">
                        สำหรับระดับผู้จัดการ / กรรมการ →
                    </Link>
                    <Link href="/" className="text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors">
                        ← กลับไปหน้าเลือกประเภทผู้ใช้งาน
                    </Link>
                </div>
            </div>
        </div>
    );
}
