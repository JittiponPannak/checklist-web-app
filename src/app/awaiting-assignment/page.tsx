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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-amber-950 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-3">รอการกำหนดสาขา</h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    บัญชีของคุณยังไม่ได้ถูกกำหนดให้อยู่ในสาขาใด ๆ กรุณาติดต่อผู้ดูแลระบบ (Admin) หรือผู้บริหาร เพื่อทำการกำหนดสาขาก่อนเข้าใช้งาน
                </p>
                {errorMsg && (
                    <div className="mb-6 p-3 bg-red-950 border border-red-800 text-red-400 text-xs rounded-xl font-medium">
                        {errorMsg}
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg cursor-pointer focus-visible:outline-2 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                        className="w-full py-3 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
                    >
                        กลับสู่หน้าล็อกอิน
                    </button>
                </div>
            </div>
        </div>
    );
}
