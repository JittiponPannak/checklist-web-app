import { useState } from "react";
import { ShiftSession, ShiftType } from "../../types";
import { fmtTime, getNotifications, getSelectedShift, saveNotifications, uid } from "../../data/storage";
import { secureGetItem, secureSetItem, secureRemoveItem } from "../../utils/crypto";
import { getShiftBadge } from "../common/Badge";
import { useModalFocusTrap } from "../common/ModalFocusTrap";

export function ChecklistPage({
  session,
  selectedShift: propSelectedShift,
  onUpdate,
  onEndShift,
  onOpenDashboard,
  onExit,
}: {
  session: ShiftSession;
  selectedShift?: ShiftType | null;
  onUpdate: (s: ShiftSession) => void;
  onEndShift: (continueNextShift?: boolean) => void;
  onOpenDashboard?: () => void;
  onExit?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const activeSelectedShift = propSelectedShift || (typeof window !== "undefined"
    ? getSelectedShift()
    : null);

  const hasNextShift = session.shift === "morning";

  const [continueShift, setContinueShift] = useState<boolean>(() => {
    if (!hasNextShift) return false;
    if (typeof window !== "undefined") {
      return secureGetItem("app_queue_afternoon") === "true";
    }
    return false;
  });

  const { dialogRef: confirmDialogRef, handleKeyDown: handleConfirmKeyDown } = useModalFocusTrap(showConfirm, () => setShowConfirm(false));

  const [shiftCompleted, setShiftCompleted] = useState<boolean>(Boolean(session.completedAt));

  const total = session.items.length;
  const done = session.items.filter((i) => i.completedAt).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = progress === 100;

  const canContinueShift = hasNextShift && progress === 100 && !shiftCompleted;
  const canFinishShift = progress === 100 && !shiftCompleted;

  const filteredItems = session.items.filter((i) => {
    if (filter === "pending") return !i.completedAt;
    if (filter === "done") return !!i.completedAt;
    return true;
  });

  function toggleItem(id: string) {
    if (shiftCompleted) return;
    const updated = session.items.map((item) =>
      item.id === id ? { ...item, completedAt: item.completedAt ? null : new Date().toISOString() } : item
    );
    const allComplete = updated.every((i) => i.completedAt);
    let updatedSession = { ...session, items: updated };
    if (allComplete && !session.notified) {
      updatedSession = { ...updatedSession, notified: true };
      const notifs = getNotifications();
      notifs.push({
        id: uid(),
        shiftSessionId: session.id,
        userName: session.userName,
        userPosition: session.userPosition,
        shift: session.shift,
        completedAt: new Date().toISOString(),
        read: false,
      });
      saveNotifications(notifs);
    }
    onUpdate(updatedSession);
  }

  function handleToggleContinue() {
    if (!canContinueShift) return;
    const nextVal = !continueShift;
    setContinueShift(nextVal);
    if (typeof window !== "undefined") {
      if (nextVal) {
        secureSetItem("app_queue_afternoon", "true");
      } else {
        secureRemoveItem("app_queue_afternoon");
      }
    }
  }

  function endShift() {
    setShowConfirm(false);
    setShiftCompleted(true);
    onEndShift(continueShift);
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2B1413] flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Off-screen live status update for assistive tech (SC 4.1.3) */}
      <div aria-live="polite" className="sr-only">
        ความคืบหน้างาน {done} จาก {total} รายการ ({progress}%)
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* Header Card */}
        <header className="bg-white border border-[#EADBCE] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EADBCE]">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getShiftBadge(session.shift)}
                {session.userPosition && (
                  <span className="text-xs font-semibold text-[#78483B] bg-[#FAF4EC] px-2.5 py-0.5 rounded-full border border-[#EADBCE]">
                    {session.userPosition}
                  </span>
                )}
                {progress === 100 && (
                  <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>ครบถ้วน 100%</span>
                  </span>
                )}
              </div>
              {session.branchName && (
                <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-1 leading-none">
                  {session.branchName}
                </p>
              )}
              <h1 className="text-lg sm:text-xl font-extrabold text-[#2B1413] tracking-tight leading-none">{session.userName}</h1>
              <p className="text-xs text-[#78483B] font-mono mt-1.5">เริ่มงานเวลา {fmtTime(session.startedAt)}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {onOpenDashboard && (
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="text-xs px-3 py-2 rounded-xl bg-[#FAF4EC] border border-[#EADBCE] text-[#2B1413] hover:bg-[#F2E7DC] transition-colors font-semibold flex items-center gap-1.5 min-h-[36px] cursor-pointer shadow-xs"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  แดชบอร์ด
                </button>
              )}

              {/* ปุ่ม “ต่อกะ” */}
              <button
                type="button"
                disabled={!canContinueShift}
                onClick={handleToggleContinue}
                className={`text-xs px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-1.5 min-h-[36px] transition-all ${!canContinueShift
                  ? "bg-[#FAF4EC]/50 border-[#EADBCE] text-[#A88B77] cursor-not-allowed opacity-60"
                  : continueShift
                    ? "bg-[#2B1413] border-[#2B1413] text-amber-300 shadow-sm cursor-pointer hover:bg-[#442220]"
                    : "bg-[#FAF4EC] border-[#EADBCE] text-[#2B1413] hover:border-amber-400 hover:text-amber-700 cursor-pointer"
                  }`}
                title={
                  !hasNextShift
                    ? "เลือกเพียง 1 กะ หรือไม่มีกะถัดไปที่เลือกไว้"
                    : shiftCompleted
                      ? "จบกะงานแล้ว ไม่สามารถแก้ไขได้"
                      : progress < 100
                        ? "ต้องทำ Checklist ครบ 100% ก่อนจึงจะเลือกต่อกะได้"
                        : continueShift
                          ? "เลือกต่อกะแล้ว (กดเพื่อยกเลิก)"
                          : "กดเพื่อเลือกต่อกะถัดไป"
                }
              >
                {!canContinueShift ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {continueShift ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    )}
                  </svg>
                )}
                <span>ต่อกะ</span>
                {continueShift && canContinueShift && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              {/* ปุ่ม “จบกะ” */}
              <button
                type="button"
                disabled={!canFinishShift}
                onClick={() => setShowConfirm(true)}
                className={`text-xs px-4 py-2 rounded-xl border font-semibold flex items-center gap-1.5 min-h-[36px] transition-all ${!canFinishShift
                  ? "bg-[#FAF4EC]/50 border-[#EADBCE] text-[#A88B77] cursor-not-allowed opacity-60"
                  : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 cursor-pointer shadow-sm"
                  }`}
                title={
                  shiftCompleted
                    ? "จบกะงานเรียบร้อยแล้ว"
                    : progress < 100
                      ? "ต้องทำ Checklist ครบ 100% ก่อนจึงจะจบกะได้"
                      : "จบกะงาน"
                }
              >
                {!canFinishShift && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                <span>จบกะงาน</span>
              </button>

              {/* ปุ่ม “ออก” */}
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                className="text-xs px-3.5 py-2 rounded-xl border border-[#EADBCE] bg-[#FAF4EC] text-[#78483B] hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 transition-all font-semibold flex items-center gap-1.5 min-h-[36px] cursor-pointer shadow-xs"
                title="ออกจากหน้านี้ / สลับกะหรือออกจากระบบ"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>ออก</span>
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="pt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#78483B]">
                ความคืบหน้า: <span className="font-mono font-bold text-[#2B1413]">{done}/{total}</span> รายการ
              </span>
              <span className={`font-mono font-bold ${allDone ? "text-emerald-700" : "text-[#2B1413]"}`}>{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#FAF4EC] rounded-full overflow-hidden border border-[#EADBCE] p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${allDone ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div
            role="tablist"
            aria-label="กรองรายการเช็คลิสต์"
            onKeyDown={(e) => {
              const filterTabs: Array<"all" | "pending" | "done"> = ["all", "pending", "done"];
              const currentIndex = filterTabs.indexOf(filter);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setFilter(filterTabs[(currentIndex + 1) % filterTabs.length]);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setFilter(filterTabs[(currentIndex - 1 + filterTabs.length) % filterTabs.length]);
              }
            }}
            className="flex bg-[#FAF4EC] p-1 rounded-xl text-xs font-semibold gap-1 border border-[#EADBCE]"
          >
            {(["all", "pending", "done"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filter === t}
                tabIndex={filter === t ? 0 : -1}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 min-h-[32px] rounded-lg transition-all cursor-pointer ${filter === t ? "bg-[#2B1413] text-amber-300 shadow-sm font-bold" : "text-[#78483B] hover:text-[#2B1413]"
                  }`}
              >
                {t === "all" ? `ทั้งหมด (${total})` : t === "pending" ? `ที่ต้องทำ (${total - done})` : `เสร็จแล้ว (${done})`}
              </button>
            ))}
          </div>

          {allDone && (
            <span className="hidden sm:inline-flex text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              ตรวจครบทุกข้อแล้ว
            </span>
          )}
        </div>

        {/* Checklist Items */}
        <div className="space-y-2.5" role="group" aria-label="รายการตรวจสอบประจำกะ">
          {filteredItems.map((item, idx) => {
            const isDone = !!item.completedAt;
            const originalIndex = session.items.findIndex((i) => i.id === item.id);
            const prevItem = idx > 0 ? filteredItems[idx - 1] : null;
            const showCategoryHeader = item.category && (!prevItem || prevItem.category !== item.category);

            return (
              <div key={item.id} className="space-y-2">
                {showCategoryHeader && (
                  <div className="pt-3 pb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-[#2B1413] tracking-wide">{item.category}</h2>
                  </div>
                )}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 focus-visible:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer ${isDone
                    ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                    : "bg-white border-[#EADBCE] hover:border-amber-400 hover:bg-[#FFFDF9]"
                    }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone
                      ? "border-amber-500 bg-amber-500 text-white shadow-2xs"
                      : "border-[#C9B29F] bg-white hover:border-amber-400"
                      }`}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-mono font-semibold pt-0.5 select-none ${isDone ? "text-amber-700" : "text-[#A88B77]"}`} aria-hidden="true">
                        {String(originalIndex + 1).padStart(2, "0")}
                      </span>
                      <p className={`text-sm leading-relaxed ${isDone ? "text-[#A88B77] line-through opacity-80" : "text-[#2B1413] font-medium"}`}>
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
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-emerald-600 pl-6 font-medium">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            เสร็จเมื่อ {fmtTime(item.completedAt)}
                            {isLate && <span className="text-amber-600 font-bold ml-1">(ล่าช้า)</span>}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </button>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-8 text-center bg-white border border-[#EADBCE] rounded-2xl">
              <p className="text-sm font-semibold text-[#2B1413]">ไม่มีรายการในหมวดนี้</p>
              <p className="text-xs text-[#78483B] mt-1 font-medium">
                {filter === "pending" ? "คุณทำครบทุกรายการแล้ว" : "ยังไม่มีรายการที่เสร็จสมบูรณ์"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
          onClick={() => setShowConfirm(false)}
          onKeyDown={handleConfirmKeyDown}
        >
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-shift-title"
            tabIndex={-1}
            className="bg-white border border-[#EADBCE] rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-shift-title" className="text-base font-bold text-[#2B1413] mb-2">
              ยืนยันการจบกะงาน?
            </h2>
            <p className="text-sm text-[#78483B] mb-4 leading-relaxed">
              คุณได้ตรวจสอบครบถ้วนทั้ง 100% แล้ว ต้องการบันทึกและจบกะนี้ใช่หรือไม่?
            </p>
            {continueShift && (
              <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>เลือกต่อกะไว้: ระบบจะพาไปยัง Checklist ของกะถัดไปทันที</span>
              </div>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EADBCE] text-xs sm:text-sm font-semibold text-[#78483B] hover:bg-[#FAF4EC] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={endShift}
                className="flex-1 py-2.5 rounded-xl bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            tabIndex={-1}
            className="bg-white border border-[#EADBCE] rounded-2xl p-6 sm:p-7 w-full max-w-sm focus-visible:outline-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 id="exit-modal-title" className="text-base font-bold text-[#2B1413] mb-2">
              ต้องการออกจากหน้า Checklist หรือไม่?
            </h2>
            <p className="text-sm text-[#78483B] mb-6 leading-relaxed">
              คุณต้องการกลับไปยังหน้าเลือกกะการทำงานหรือไม่? (รายการที่บันทึกแล้วจะยังคงถูกบันทึกไว้ในระบบ)
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#EADBCE] text-xs sm:text-sm font-semibold text-[#78483B] hover:bg-[#FAF4EC] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  if (onExit) {
                    onExit();
                  } else if (typeof window !== "undefined") {
                    window.location.href = "/shift";
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                ออกจากหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
