"use client";

import { useState } from "react";
import { ParsedDoc } from "../../utils/markdown";
import { DocsModal } from "./DocsModal";
import { BookOpen, ArrowRight, Sparkles, ChevronRight } from "lucide-react";

interface PortalDocsSectionProps {
  guideData: ParsedDoc;
  readmeData?: ParsedDoc;
}

export function PortalDocsSection({ guideData, readmeData }: PortalDocsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="mt-8 pt-6 border-t border-[var(--color-border)]/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
              คู่มือการปฏิบัติงานสาขา (Operations & SOP Guide)
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">
            อัปเดตล่าสุด: พร้อมใช้งาน
          </span>
        </div>

        {/* Featured Guide Card */}
        <div className="group relative p-5 sm:p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <Sparkles size={12} className="text-amber-600" />
                พนักงานสาขา • ผู้จัดการร้าน • ผู้บริหาร • เจ้าของกิจการ
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">GUIDE.md</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
              คู่มือและมาตรฐานการปฏิบัติงานสาขา (SOP & User Guide)
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              ขั้นตอนการตรวจตู้แช่ (0°C – 4°C), ตรวจนับเงินทอนเปิดกะ, การส่งมอบงานและปิดกะ 100%, การอนุมัติสองระดับของผู้ช่วยฯ และผู้จัดการ รวมถึง 3 เสาหลักความมั่นคงของร้านสำหรับเจ้าของกิจการ
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-200 hover:text-amber-950 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <BookOpen size={16} />
              <span>เปิดอ่านคู่มือปฏิบัติงาน</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 font-medium transition-colors"
              title="เปิดอ่านหน้าเต็มในแท็บใหม่"
            >
              <span>เปิดหน้าเต็ม (/guide)</span>
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Docs Modal Dialog */}
      <DocsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDoc="guide"
        guideData={guideData}
        readmeData={readmeData}
      />
    </>
  );
}

export function PortalDocsHeaderButton({
  onOpenGuide,
}: {
  onOpenGuide: () => void;
  onOpenReadme?: () => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={onOpenGuide}
        className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-colors"
      >
        <BookOpen size={14} className="text-amber-600" />
        <span className="hidden sm:inline">คู่มือ</span>
        <span>GUIDE</span>
      </button>
    </div>
  );
}
