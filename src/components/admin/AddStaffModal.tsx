import { useState } from "react";
import { Position, User } from "../../types";
import { getUsers, saveUsers, uid } from "../../data/storage";
import { useModalFocusTrap } from "../common/ModalFocusTrap";

export function AddStaffModal({
  isOpen,
  onClose,
  positions,
  canManagePositions,
  onStaffAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  canManagePositions: boolean;
  onStaffAdded: (user: User) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
  });
  const [error, setError] = useState("");
  const { dialogRef, handleKeyDown } = useModalFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  function handleAddStaff() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      setError("อีเมลนี้มีผู้ใช้งานแล้วในระบบ");
      return;
    }
    const newUser: User = {
      id: uid(),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      role: "employee",
      position: form.position || undefined,
    };
    saveUsers([...users, newUser]);
    onStaffAdded(newUser);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-staff-modal-title"
        tabIndex={-1}
        className="bg-white border border-[#EADBCE] rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-4 text-[#2B1413]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
          <h2 id="add-staff-modal-title" className="text-base font-bold text-[#2B1413]">
            เพิ่มพนักงานใหม่เข้าร้าน
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 text-[#78483B] hover:text-[#2B1413] hover:bg-[#FAF4EC] rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="new-staff-name" className="block text-xs font-semibold text-[#78483B] mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              id="new-staff-name"
              type="text"
              placeholder="เช่น สมศรี ใจดี"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-staff-email" className="block text-xs font-semibold text-[#78483B] mb-1">
              อีเมลพนักงาน
            </label>
            <input
              id="new-staff-email"
              type="email"
              placeholder="name@factory.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-staff-password" className="block text-xs font-semibold text-[#78483B] mb-1">
              รหัสผ่านเริ่มต้น
            </label>
            <input
              id="new-staff-password"
              type="password"
              placeholder="รหัสผ่านเข้าสู่ระบบ"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-staff-position" className="block text-xs font-semibold text-[#78483B] mb-1">
              กำหนดตำแหน่งงาน
            </label>
            {canManagePositions ? (
              <select
                id="new-staff-position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-sm text-[#2B1413] focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">-- ยังไม่กำหนดตำแหน่ง (กำหนดภายหลังได้) --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#78483B] flex items-center justify-between">
                <span>รอผู้จัดการกำหนดตำแหน่ง</span>
                <span className="text-[10px] text-[#2B1413] font-semibold bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-mono">
                  ผู้ช่วยไม่สามารถเลือกตำแหน่งได้
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#EADBCE]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#EADBCE] bg-[#FAF4EC] hover:bg-[#F2E7DC] text-xs font-semibold text-[#78483B] transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleAddStaff}
            className="flex-1 py-2.5 rounded-xl bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            บันทึกพนักงาน
          </button>
        </div>
      </div>
    </div>
  );
}
