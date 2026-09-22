"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Flame, Award, History, X, Trophy, Sparkles } from "lucide-react";
import { PointTransaction } from "../../types";
import { getUserPointsAction } from "../../actions/points";
import { useApp } from "../../context/AppContext";

export function PointStreakBadge() {
  const { currentUser } = useApp();
  const [points, setPoints] = useState<number>(currentUser?.point || 0);
  const [streak, setStreak] = useState<number>(currentUser?.pointStreak || 0);
  const [longestStreak, setLongestStreak] = useState<number>(currentUser?.longestStreak || 0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPointDetails = async () => {
    if (!currentUser) return;
    try {
      const res = await getUserPointsAction(currentUser.id);
      if (res.success) {
        setPoints(res.points ?? 0);
        setStreak(res.streak ?? 0);
        setLongestStreak(res.longestStreak ?? 0);
        if (res.transactions) setTransactions(res.transactions);
      }
    } catch (err) {
      console.error("Failed to load user point details:", err);
    }
  };

  useEffect(() => {
    fetchPointDetails();
  }, [currentUser?.id]);

  const getTier = (pts: number) => {
    if (pts >= 500) return { name: "ระดับแพลตตินัม", icon: "💎", color: "text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/50 dark:border-cyan-800" };
    if (pts >= 250) return { name: "ระดับทอง", icon: "🥇", color: "text-amber-800 bg-amber-50 border-amber-300 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800" };
    if (pts >= 100) return { name: "ระดับเงิน", icon: "🥈", color: "text-slate-700 bg-slate-100 border-slate-300 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700" };
    return { name: "ระดับบรอนซ์", icon: "🥉", color: "text-amber-900 bg-orange-50 border-orange-200 dark:text-amber-300 dark:bg-orange-950/50 dark:border-orange-800" };
  };

  const tier = getTier(points);

  if (!currentUser) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsModalOpen(true);
          fetchPointDetails();
        }}
        className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xs hover:shadow-sm active:scale-95 transition-all duration-150 cursor-pointer group focus-visible:outline-none focus:ring-2 focus:ring-amber-400 shrink-0 min-h-[36px]"
        title="คลิกเพื่อดูประวัติแต้มและสตรีค"
      >
        {/* Streak Flame */}
        <div className="flex items-center gap-1 text-xs font-extrabold text-orange-700 dark:text-orange-400">
          <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 fill-orange-600 transition-transform duration-200 group-hover:scale-125 ${streak > 0 ? "animate-pulse" : "opacity-75"}`} />
          <span>{streak}</span>
        </div>

        <div className="w-px h-3.5 sm:h-4 bg-[var(--color-border)]" />

        {/* Total Points */}
        <div className="flex items-center gap-1 text-xs font-extrabold text-amber-900 dark:text-amber-300">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400" />
          <span>{points} <span className="text-xs font-semibold text-[var(--color-text-muted)] hidden sm:inline">แต้ม</span></span>
        </div>

        {/* Tier badge icon */}
        <span className="text-xs ml-0.5 hidden sm:inline">{tier.icon}</span>
      </button>

      {/* Point History & Streak Modal rendered via Portal to escape parent stacking contexts */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative z-10">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">แต้มสะสมและสตรีคของคุณ</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{currentUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Summary Cards */}
            <div className="p-4 sm:p-5 grid grid-cols-3 gap-2.5 bg-[var(--color-surface-2)]/30">
              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-xs">
                <span className="text-xs text-[var(--color-text-muted)] block mb-1">แต้มสะสม</span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-300">{points}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-xs">
                <span className="text-xs text-[var(--color-text-muted)] block mb-1">สตรีคปัจจุบัน</span>
                <span className="text-lg font-black text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-orange-500" /> {streak}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center shadow-xs">
                <span className="text-xs text-[var(--color-text-muted)] block mb-1">สตรีคสูงสุด</span>
                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">🏆 {longestStreak}</span>
              </div>
            </div>

            {/* Tier Banner */}
            <div className="px-4 sm:px-5 pb-2">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${tier.color}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tier.icon}</span>
                  <div>
                    <span className="text-xs font-bold block">{tier.name}</span>
                    <span className="text-xs font-medium">ปฏิบัติงานตรงเวลาเพื่อรับโบนัสสตรีคสูงสุด!</span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Transaction Ledger */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)] mb-3">
                <History className="w-4 h-4 text-amber-600" />
                <span>ประวัติการได้รับแต้มล่าสุด</span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--color-text-muted)]">
                  ยังไม่มีประวัติการได้รับแต้ม เมื่อผู้จัดการอนุมัติงานกะ แต้มจะแสดงที่นี่
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text)]">{t.description}</p>
                        <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        +{t.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[var(--color-surface-2)] border-t border-[var(--color-border)] text-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 bg-[var(--color-brown)] hover:bg-[var(--color-brown-light)] text-amber-100 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
