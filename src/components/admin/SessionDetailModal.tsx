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
      className="fixed inset-0 bg-[#2B1413]/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        tabIndex={-1}
        className="bg-white border border-[#EADBCE] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 focus-visible:outline-2 focus-visible:outline-amber-400 flex flex-col justify-between text-[#2B1413]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="session-detail-title" className="text-base font-bold text-[#2B1413]">
                {session.userName}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {session.userPosition && <Badge color="muted">{session.userPosition}</Badge>}
                {getShiftBadge(session.shift)}
                <span className="text-xs font-mono text-[#78483B]">{fmtDate(session.startedAt)}</span>
                {isApproved ? (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    ✓ รับรองผลแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#78483B] bg-[#FAF4EC] border border-[#EADBCE] px-2 py-0.5 rounded-full">
                    รอรับรองผล
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดรายละเอียดกะ"
              className="p-2 -mr-2 text-[#78483B] hover:text-[#2B1413] hover:bg-[#FAF4EC] rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF4EC] border border-[#EADBCE] mb-4 flex items-center justify-between text-xs font-semibold text-[#78483B]">
            <span>ความคืบหน้างาน: {done}/{total} ข้อ</span>
            <span className="font-mono font-bold text-[#2B1413]">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
          </div>

          <Divider />
          <div className="mt-4 space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {session.items.map((item, idx) => {
              const prevItem = idx > 0 ? session.items[idx - 1] : null;
              const showCat = item.category && (!prevItem || prevItem.category !== item.category);
              return (
                <div key={item.id} className="space-y-1.5">
                  {showCat && (
                    <p className="text-[11px] font-bold text-[#78483B] pt-2 pb-0.5">{item.category}</p>
                  )}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${item.completedAt ? "bg-[#FFFDF8] border-amber-300/80" : "bg-white border-[#EADBCE]"
                      }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${item.completedAt ? "border-amber-500 bg-amber-500" : "border-[#EADBCE] bg-white"
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
                        <span className="text-[10px] font-mono text-[#9C6C60]">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className={`text-xs font-medium ${item.completedAt ? "text-[#78483B] line-through" : "text-[#2B1413]"}`}>{item.label}</p>
                      </div>
                      {item.completedAt && (() => {
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
                          <p className="text-[10px] font-mono text-amber-700 font-semibold mt-0.5">
                            เสร็จเมื่อ {fmtTime(item.completedAt)}
                            {isLate && <span className="text-rose-600 font-bold ml-1 font-sans">(ล่าช้า)</span>}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Action: Approve Button */}
        {canApprove && onApprove && !isApproved && (
          <div className="mt-5 pt-4 border-t border-[#EADBCE]">
            <button
              type="button"
              onClick={() => onApprove(session.id)}
              className="w-full py-2.5 px-4 bg-[#2B1413] hover:bg-[#3D1D1B] text-amber-300 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
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
