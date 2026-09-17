"use client";

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { getUserByIdAction } from "../../actions/auth";

export default function AwaitingAssignmentPage() {
    const { logout, currentUser, login } = useApp();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function handleRefresh() {
        if (!currentUser) return;
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await getUserByIdAction(currentUser.id);
            if (res.success && res.user) {
                if (res.user.branchName) {
                    login(res.user);
                } else {
                    setErrorMsg("บัญชีของคุณยังไม่ได้รับการอนุมัติสาขา");
                }
            } else {
                setErrorMsg(res.error || "ดึงข้อมูลผู้ใช้สำเร็จ แต่ยังไม่ได้รับกำหนดสาขา");
            }
        } catch (err) {
            console.error("Refresh error:", err);
            setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 sm:p-10 shadow-lg text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-amber-glow)] border border-[var(--color-amber)] text-amber-600 mx-auto flex items-center justify-center mb-6 shadow-xs">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">รอการกำหนดสาขา</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
                    บัญชีของคุณยังไม่ได้ถูกกำหนดให้อยู่ในสาขาใด ๆ กรุณาติดต่อผู้ดูแลระบบ (Admin) หรือผู้บริหาร เพื่อทำการกำหนดสาขาก่อนเข้าใช้งาน
                </p>
                {errorMsg && (
                    <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                        {errorMsg}
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold bg-[var(--color-brown)] text-amber-300 hover:bg-[var(--color-brown-light)] disabled:opacity-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-[var(--color-amber)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                        )}
                        <span>ตรวจสอบสถานะใหม่</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => logout()}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-semibold bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[#F2E7DC] hover:text-[var(--color-text)] border border-[var(--color-border)] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        กลับสู่หน้าล็อกอิน
                    </button>
                </div>
            </div>
        </div>
    );
}
