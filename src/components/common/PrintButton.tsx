"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "พิมพ์ / บันทึก PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
      title="พิมพ์เอกสาร หรือบันทึกเป็นไฟล์ PDF"
    >
      <Printer size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
