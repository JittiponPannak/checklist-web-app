import { ShiftSession } from "../../types";
import { fmtDate, fmtTime } from "../../data/storage";
import { Badge, Divider, getShiftBadge } from "../common/Badge";
import { useModalFocusTrap } from "../common/ModalFocusTrap";

export function SessionDetailModal({
  session,
  onClose,
  canApprove = false,
  isApproved = false,
  onApprove,
  approveRoleTitle = "ผู้จัดการ",
}: {
  session: ShiftSession | null;
  onClose: () => void;
  canApprove?: boolean;
  isApproved?: boolean;
  onApprove?: (sessionId: string) => void;
  approveRoleTitle?: string;
}) {
  const { dialogRef, handleKeyDown } = useModalFocusTrap(Boolean(session), onClose);

  if (!session) return null;

  const total = session.items.length;
  const done = session.items.filter((i) => i.completedAt).length;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        tabIndex={-1}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 focus-visible:outline-2 focus-visible:outline-indigo-500 flex flex-col justify-between text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="session-detail-title" className="text-base font-bold text-white">
                {session.userName}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {session.userPosition && <Badge color="muted">{session.userPosition}</Badge>}
                {getShiftBadge(session.shift)}
                <span className="text-xs font-mono text-slate-400">{fmtDate(session.startedAt)}</span>
                {isApproved ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                    ✓ รับรองผลแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                    รอรับรองผล
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดรายละเอียดกะ"
              className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-indigo-500 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>ความคืบหน้างาน: {done}/{total} ข้อ</span>
            <span className="font-mono font-bold text-indigo-400">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
          </div>

          <Divider />
          <div className="mt-4 space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {session.items.map((item, idx) => {
              const prevItem = idx > 0 ? session.items[idx - 1] : null;
              const showCat = item.category && (!prevItem || prevItem.category !== item.category);
              return (
                <div key={item.id} className="space-y-1.5">
                  {showCat && (
                    <p className="text-[11px] font-bold text-slate-400 pt-2 pb-0.5">{item.category}</p>
                  )}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      item.completedAt ? "bg-slate-950/80 border-emerald-900/60" : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        item.completedAt ? "border-emerald-500 bg-emerald-500" : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {item.completedAt && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path
                            d="M2 5l2.5 2.5L8 3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className={`text-xs font-medium ${item.completedAt ? "text-slate-300 line-through" : "text-white"}`}>{item.label}</p>
                      </div>
                      {item.completedAt && (
                        <p className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
                          เสร็จเมื่อ {fmtTime(item.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Action: Approve Button */}
        {canApprove && onApprove && !isApproved && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onApprove(session.id)}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 shadow-indigo-950/50"
            >
              <span>รับรองผลการตรวจงาน ({approveRoleTitle})</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
