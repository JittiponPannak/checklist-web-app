"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Award, Users } from "lucide-react";
import { LeaderboardEntry } from "../../types";
import { getLeaderboardAction } from "../../actions/points";

export function LeaderboardWidget({ branchId }: { branchId?: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboardAction(branchId)
      .then((res) => {
        if (res.success && res.leaderboard) {
          setLeaderboard(res.leaderboard);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [branchId]);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base">🥇</span>;
    if (index === 1) return <span className="text-base">🥈</span>;
    if (index === 2) return <span className="text-base">🥉</span>;
    return (
      <span className="w-5 h-5 rounded-full bg-[var(--color-surface-2)] text-[11px] font-bold text-[var(--color-text-muted)] flex items-center justify-center">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text)]">ตารางอันดับและผลงาน (Leaderboard)</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">คะแนนสะสมและสตรีคการปฏิบัติงานของทีมงาน</p>
          </div>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-semibold border border-[var(--color-border)]">
          {leaderboard.length} คน
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
          กำลังโหลดอันดับผลงาน...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-6 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-1.5">
          <Users className="w-6 h-6 opacity-30" />
          <p>ยังไม่มีข้อมูลคะแนนพนักงาน</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)] max-h-72 overflow-y-auto">
          {leaderboard.slice(0, 10).map((user, idx) => (
            <div
              key={user.userId}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)]/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 flex items-center justify-center shrink-0">
                  {getRankBadge(idx)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--color-text)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--color-text-subtle)] truncate">
                    {user.position || user.role} {user.branchName ? `• ${user.branchName}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {user.pointStreak > 0 && (
                  <div className="flex items-center gap-0.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    <span>{user.pointStreak}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>{user.point}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
