"use client";

import { useState } from "react";
import { ParsedDoc } from "../../utils/markdown";
import { DocsModal } from "./DocsModal";
import { BookOpen, FileCode2, ArrowRight, Sparkles, Shield, ChevronRight } from "lucide-react";

interface PortalDocsSectionProps {
  guideData: ParsedDoc;
  readmeData: ParsedDoc;
}

export function PortalDocsSection({ guideData, readmeData }: PortalDocsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<"guide" | "readme">("guide");

  const openDoc = (doc: "guide" | "readme") => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="mt-8 pt-6 border-t border-[var(--color-border)]/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
              ศูนย์ข้อมูลและคู่มือปฏิบัติงาน (Documentation & SOP)
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">
            อัปเดตล่าสุด: พร้อมใช้งาน
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Operational Guide (GUIDE.md) */}
          <div className="group relative p-5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  <Sparkles size={12} className="text-amber-600" />
                  พนักงาน • ผู้บริหาร • เจ้าของร้าน
                </span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">GUIDE.md</span>
              </div>

              <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                คู่มือการปฏิบัติงานสาขา (SOP Guide)
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                ขั้นตอนการตรวจตู้แช่ (0°C – 4°C), ตรวจนับเงินทอนเปิดกะ, การปิดกะ 100%, การอนุมัติสองระดับ และ 3 เสาหลักความมั่นคงของร้านสำหรับเจ้าของกิจการ
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openDoc("guide")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:text-amber-950 transition-colors cursor-pointer"
              >
                <span>เปิดอ่านคู่มือ</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
                title="เปิดในแท็บใหม่"
              >
                <span>ดูหน้าเต็ม</span>
                <ChevronRight size={12} />
              </a>
            </div>
          </div>

          {/* Card 2: System Architecture & Maintenance (README.md) */}
          <div className="group relative p-5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] border border-[var(--color-border)]">
                  <Shield size={12} className="text-amber-600" />
                  สถาปัตยกรรม & การดูแลระบบ
                </span>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">README.md</span>
              </div>

              <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                ข้อมูลระบบและการดูแลรักษา (Maintenance)
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                สถาปัตยกรรม Next.js 16, Supabase Realtime, Drizzle ORM, Vercel Cron Jobs (เวลาไทย 23:55 น.), การจัดการแคชในเครื่อง และการแก้ไขปัญหา
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openDoc("readme")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:text-amber-950 transition-colors cursor-pointer"
              >
                <span>เปิดอ่านข้อมูลระบบ</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="/readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
                title="เปิดในแท็บใหม่"
              >
                <span>ดูหน้าเต็ม</span>
                <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Docs Modal Dialog */}
      <DocsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDoc={selectedDoc}
        guideData={guideData}
        readmeData={readmeData}
      />
    </>
  );
}

export function PortalDocsHeaderButton({
  onOpenGuide,
  onOpenReadme,
}: {
  onOpenGuide: () => void;
  onOpenReadme: () => void;
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
      <button
        type="button"
        onClick={onOpenReadme}
        className="px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-colors"
      >
        <FileCode2 size={14} className="text-amber-600" />
        <span className="hidden sm:inline">ระบบ</span>
        <span>README</span>
      </button>
    </div>
  );
}
