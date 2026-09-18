"use client";

import { useEffect, useState } from "react";
import { User } from "../../types";
import {
    RefrigeratorConfig,
    getRefrigeratorsAction,
    createRefrigeratorAction,
    updateRefrigeratorAction,
} from "../../actions/refrigerator";

export function RefrigeratorConfigView({ user }: { user: User }) {
    const [refrigerators, setRefrigerators] = useState<RefrigeratorConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isAdding, setIsAdding] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [formName, setFormName] = useState("ตู้แช่");
    const [formTemp, setFormTemp] = useState(4);
    const [formDisable, setFormDisable] = useState(false);
    const [saving, setSaving] = useState(false);

    async function loadData() {
        setLoading(true);
        const res = await getRefrigeratorsAction(user.id);
        if (res.success && res.data) {
            setRefrigerators(res.data);
        } else {
            setError(res.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    function handleOpenAdd() {
        setIsAdding(true);
        setEditId(null);
        setFormName("ตู้แช่");
        setFormTemp(4);
        setFormDisable(false);
    }

    function handleOpenEdit(ref: RefrigeratorConfig) {
        setIsAdding(false);
        setEditId(ref.id);
        setFormName(ref.name);
        setFormTemp(ref.target_temperature);
        setFormDisable(ref.disable_check);
    }

    function handleCancel() {
        setIsAdding(false);
        setEditId(null);
    }

    async function handleSave() {
        if (!formName.trim()) {
            alert("กรุณาระบุชื่อตู้แช่");
            return;
        }

        setSaving(true);
        if (isAdding) {
            const res = await createRefrigeratorAction({
                userId: user.id,
                name: formName,
                targetTemperature: formTemp,
                disableCheck: formDisable,
            });
            if (res.success && res.data) {
                setRefrigerators([...refrigerators, res.data]);
                handleCancel();
            } else {
                alert(res.error || "บันทึกไม่สำเร็จ");
            }
        } else if (editId) {
            const res = await updateRefrigeratorAction({
                id: editId,
                name: formName,
                targetTemperature: formTemp,
                disableCheck: formDisable,
            });
            if (res.success) {
                setRefrigerators(
                    refrigerators.map((r) =>
                        r.id === editId
                            ? { ...r, name: formName, target_temperature: formTemp, disable_check: formDisable }
                            : r
                    )
                );
                handleCancel();
            } else {
                alert(res.error || "อัปเดตไม่สำเร็จ");
            }
        }
        setSaving(false);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>การตั้งค่าและจัดการอุปกรณ์ตู้แช่เซเว่นฯ (Refrigerator Configuration)</span>
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            เพิ่มตู้แช่, ตั้งชื่อ, และกำหนดอุณหภูมิเป้าหมายของตู้แช่ในสาขาของท่าน
                        </p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        disabled={isAdding || editId !== null}
                        className="text-[11px] font-semibold text-[var(--color-brown)] hover:text-[#3D1D1B] bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <span>+ เพิ่มตู้แช่ใหม่</span>
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {error}
                    </div>
                )}

                {(isAdding || editId) && (
                    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] p-4 rounded-xl space-y-4 mb-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <h4 className="font-bold text-sm text-[var(--color-text)] relative z-10">
                            {isAdding ? "เพิ่มตู้แช่ใหม่" : "แก้ไขข้อมูลตู้แช่"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                    ชื่อตู้แช่ (เช่น ตู้เบียร์, ตู้นม, ตู้ 1)
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                                    อุณหภูมิเป้าหมายสูงสุด (องศาเซลเซียส)
                                </label>
                                <input
                                    type="number"
                                    value={formTemp}
                                    onChange={(e) => setFormTemp(Number(e.target.value))}
                                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="disableCheck"
                                checked={formDisable}
                                onChange={(e) => setFormDisable(e.target.checked)}
                                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                            />
                            <label htmlFor="disableCheck" className="text-xs font-semibold text-[var(--color-text-muted)] cursor-pointer">
                                ปิดการตรวจสอบตู้แช่นี้ (ตู้เสียหรือปิดใช้งาน)
                            </label>
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-rose-600 bg-[var(--color-surface)] rounded-lg transition-colors border border-[var(--color-border)]"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors border border-amber-500 shadow-sm disabled:opacity-50"
                            >
                                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                            </button>
                        </div>
                    </div>
                )}

                {loading && <div className="text-center py-8 text-xs text-[var(--color-text-muted)]">กำลังโหลดข้อมูลตู้แช่...</div>}

                {!loading && refrigerators.length === 0 && !isAdding && (
                    <div className="text-center py-8 border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-2)]/50">
                        <p className="text-sm font-semibold text-[var(--color-text-muted)] mb-1">ยังไม่มีตู้แช่ในระบบสาขานี้</p>
                        <p className="text-xs text-[var(--color-text-subtle)]">กดปุ่ม "+ เพิ่มตู้แช่ใหม่" เพื่อเพิ่มอุปกรณ์</p>
                    </div>
                )}

                {!loading && refrigerators.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {refrigerators.map((ref) => (
                            <div
                                key={ref.id}
                                className={`p-4 rounded-xl border transition-all ${ref.disable_check
                                    ? "bg-[var(--color-surface-2)] border-[var(--color-border)] opacity-70"
                                    : "bg-[var(--color-surface)] border-amber-200 shadow-[0_2px_8px_-2px_rgba(251,191,36,0.15)] hover:shadow-[0_4px_12px_-2px_rgba(251,191,36,0.25)]"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{ref.disable_check ? "❄️❌" : "❄️"}</span>
                                        <div>
                                            <h4 className={`font-bold text-sm ${ref.disable_check ? "text-[var(--color-text-muted)] line-through" : "text-amber-500"}`}>
                                                {ref.name}
                                            </h4>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenEdit(ref)}
                                        className="p-1.5 text-[var(--color-text-muted)] hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                        title="แก้ไขข้อมูล"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-[var(--color-text-muted)]">อุณหภูมิเป้าหมาย:</span>
                                    <span className={`px-2 py-0.5 rounded border ${ref.disable_check ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-cyan-50 text-cyan-700 border-cyan-200"}`}>
                                        ≤ {ref.target_temperature} °C
                                    </span>
                                </div>
                                {ref.disable_check && (
                                    <div className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded px-2 py-1 text-center">
                                        ปิดการตรวจสอบ/ซ่อมบำรุง
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
