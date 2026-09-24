"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ParsedDoc, TocItem } from "../../utils/markdown";
import { 
  BookOpen, 
  FileText, 
  Search, 
  ExternalLink, 
  X, 
  Maximize2, 
  Minimize2, 
  List, 
  Users, 
  CheckCircle2, 
  ArrowUp,
  Download
} from "lucide-react";
import { useModalFocusTrap } from "./ModalFocusTrap";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: "guide" | "readme";
  guideData: ParsedDoc;
  readmeData: ParsedDoc;
}

export const ROLE_FILTERS = [
  { id: "all", label: "ทั้งหมด", keywords: [] },
  { id: "cashier", label: "พนักงานแคชเชียร์", keywords: ["แคชเชียร์", "cashier"] },
  { id: "stock", label: "พนักงานสต็อก", keywords: ["สต็อก", "stock"] },
  { id: "assistant", label: "ผู้ช่วยผู้จัดการ", keywords: ["ผู้ช่วยผู้จัดการ", "ผู้ช่วย", "assistant"] },
  { id: "manager", label: "ผู้จัดการร้าน", keywords: ["ผู้จัดการร้าน", "store manager"] },
  { id: "general_manager", label: "ผู้ตรวจการเขต / GM", keywords: ["ผู้จัดการทั่วไป", "general manager", "ผู้ตรวจ"] },
  { id: "owner", label: "เจ้าของกิจการ / กรรมการ", keywords: ["กรรมการ", "เจ้าของ", "owner", "board"] },
  { id: "admin", label: "ผู้ดูแลระบบ (Admin)", keywords: ["แอดมิน", "ผู้ดูแลระบบ", "admin"] },
  { id: "faq", label: "กฎเหล็ก & FAQ", keywords: ["กฎเหล็ก", "faq", "คำถามที่พบบ่อย"] },
];

export function DocsModal({
  isOpen,
  onClose,
  initialDoc = "guide",
  guideData,
  readmeData,
}: DocsModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "readme">(initialDoc);
  const [activeRole, setActiveRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const { dialogRef, handleKeyDown } = useModalFocusTrap(isOpen, onClose);

  useEffect(() => {
    setActiveTab(initialDoc);
  }, [initialDoc, isOpen]);

  // Track scroll position for Back to Top button
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > 300);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen, activeTab]);

  const currentDocData = activeTab === "guide" ? guideData : readmeData;

  // Filter TOC by search query
  const filteredToc = useMemo(() => {
    if (!searchQuery.trim()) return currentDocData.toc;
    const q = searchQuery.toLowerCase();
    return currentDocData.toc.filter(item => 
      item.title.toLowerCase().includes(q)
    );
  }, [currentDocData.toc, searchQuery]);

  const scrollToHeading = (idOrSlug: string) => {
    if (!contentRef.current || !idOrSlug) return;
    const cleanId = idOrSlug.startsWith("#") ? idOrSlug.slice(1) : idOrSlug;

    // 1. Try document.getElementById (safest, supports any string/language without selector syntax errors)
    let target: HTMLElement | null = document.getElementById(cleanId);

    // 2. Try querying data-doc-id inside container
    if (!target && contentRef.current) {
      try {
        target = contentRef.current.querySelector<HTMLElement>(`[data-doc-id="${cleanId.replace(/"/g, '\\"')}"]`);
      } catch {
        // ignore selector error
      }
    }

    // 3. Fallback: match by id or data-doc-id attribute among headings in container
    if (!target && contentRef.current) {
      const headings = contentRef.current.querySelectorAll<HTMLElement>("h1, h2, h3, h4");
      for (const h of Array.from(headings)) {
        if (h.id === cleanId || h.getAttribute("data-doc-id") === cleanId) {
          target = h;
          break;
        }
      }
    }

    // 4. Fallback: match by partial slug or heading text
    if (!target && contentRef.current) {
      const headings = contentRef.current.querySelectorAll<HTMLElement>("h1, h2, h3, h4");
      const lower = cleanId.toLowerCase();
      for (const h of Array.from(headings)) {
        const hText = (h.textContent || "").toLowerCase();
        if (hText.includes(lower) || lower.includes(h.id.toLowerCase())) {
          target = h;
          break;
        }
      }
    }

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setShowToc(false);
    }
  };

  const handleRoleSelect = (roleId: string) => {
    setActiveRole(roleId);
    if (roleId === "all") {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 1. Try finding in currentDocData.toc by roleTag
    const matchedByTag = currentDocData.toc.find(item => item.roleTag === roleId);
    if (matchedByTag) {
      scrollToHeading(matchedByTag.id);
      return;
    }

    // 2. Check by keywords in TOC items
    const filterCfg = ROLE_FILTERS.find(r => r.id === roleId);
    if (filterCfg && filterCfg.keywords.length > 0) {
      const matchedByKeyword = currentDocData.toc.find(item =>
        filterCfg.keywords.some(kw => item.title.toLowerCase().includes(kw.toLowerCase()))
      );
      if (matchedByKeyword) {
        scrollToHeading(matchedByKeyword.id);
        return;
      }
    }

    // 3. Fallback: search headings directly in DOM by keyword
    if (contentRef.current && filterCfg && filterCfg.keywords.length > 0) {
      const headings = contentRef.current.querySelectorAll<HTMLElement>("h1, h2, h3");
      for (const h of Array.from(headings)) {
        const text = (h.textContent || "").toLowerCase();
        if (filterCfg.keywords.some(kw => text.includes(kw.toLowerCase()))) {
          h.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="docs-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 doc-modal-overlay bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`doc-modal-container bg-[var(--color-surface)] text-[var(--color-text)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-2xl border border-[var(--color-border)] shadow-2xl"
        }`}
      >
        {/* Header Toolbar */}
        <header className="no-print shrink-0 px-4 sm:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-2)] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("guide");
                setActiveRole("all");
                setSearchQuery("");
                contentRef.current?.scrollTo({ top: 0 });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "guide"
                  ? "bg-[var(--color-surface)] text-amber-950 dark:text-amber-200 shadow-xs border border-amber-200 dark:border-amber-900"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <BookOpen size={16} className={activeTab === "guide" ? "text-amber-600" : ""} />
              <span>คู่มือการปฏิบัติงาน (GUIDE)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("readme");
                setActiveRole("all");
                setSearchQuery("");
                contentRef.current?.scrollTo({ top: 0 });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "readme"
                  ? "bg-[var(--color-surface)] text-amber-950 dark:text-amber-200 shadow-xs border border-amber-200 dark:border-amber-900"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <FileText size={16} className={activeTab === "readme" ? "text-amber-600" : ""} />
              <span>ข้อมูลระบบ & ดูแลรักษา (README)</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* TOC Toggle button */}
            <button
              type="button"
              onClick={() => setShowToc(!showToc)}
              className={`p-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showToc ? "bg-amber-500 text-amber-950 border-amber-600" : "hover:bg-[var(--color-surface-2)] text-[var(--color-text)]"
              }`}
              title="สารบัญเนื้อหา"
              aria-label="สารบัญเนื้อหา"
            >
              <List size={16} />
              <span className="hidden md:inline">สารบัญ</span>
            </button>

            {/* Open Fullpage Link */}
            <a
              href={activeTab === "guide" ? "/guide" : "/readme"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="เปิดหน้าเต็มในแท็บใหม่"
            >
              <ExternalLink size={16} />
              <span className="hidden lg:inline">เปิดแท็บใหม่</span>
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] transition-colors"
              title={isFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[var(--color-surface-2)] hover:bg-amber-200 dark:hover:bg-amber-900/60 text-[var(--color-text)] transition-colors"
              title="ปิดหน้าต่าง (Esc)"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Sub-header / Role Quick Filter (Specifically for GUIDE) */}
        {activeTab === "guide" && (
          <div className="no-print shrink-0 px-4 sm:px-6 py-2.5 bg-[var(--color-surface-2)]/60 border-b border-[var(--color-border)] overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1 pr-1">
                <Users size={14} className="text-amber-600" />
                <span>กระโดดไปตามบทบาท:</span>
              </span>
              {ROLE_FILTERS.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    activeRole === role.id
                      ? "bg-amber-500 text-amber-950 font-bold shadow-2xs"
                      : "bg-[var(--color-surface)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] border border-[var(--color-border-subtle)]"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Table of Contents Drawer/Sidebar */}
          {showToc && (
            <aside className="no-print w-72 sm:w-80 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-4 overflow-y-auto flex flex-col gap-3 animate-in slide-in-from-left-4 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                <div className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <List size={14} className="text-amber-600" />
                  <span>สารบัญเนื้อหา ({filteredToc.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowToc(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] sm:hidden"
                >
                  ปิด
                </button>
              </div>

              {/* Search in TOC */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="ค้นหาหัวข้อในคู่มือ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs focus:outline-2 focus:outline-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-xs text-[var(--color-text-muted)]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* TOC List */}
              <nav className="flex-1 space-y-1">
                {filteredToc.length === 0 ? (
                  <div className="text-xs text-[var(--color-text-muted)] p-2">ไม่พบหัวข้อที่ค้นหา</div>
                ) : (
                  filteredToc.map((item, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      type="button"
                      onClick={() => scrollToHeading(item.id)}
                      className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs transition-colors block truncate ${
                        item.level === 1
                          ? "font-bold text-[var(--color-text)] bg-[var(--color-surface)]/80"
                          : item.level === 2
                          ? "pl-4 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                          : "pl-6 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  ))
                )}
              </nav>
            </aside>
          )}

          {/* Document Content View */}
          <main
            ref={contentRef}
            className="flex-1 overflow-y-auto px-5 sm:px-10 py-6 sm:py-8 doc-content"
          >
            {/* Printable Header - Visible only in Print */}
            <div className="hidden print:block mb-8 pb-4 border-b-2 border-black">
              <div className="text-xl font-bold">Eater Egg Fresh Mart</div>
              <div className="text-sm text-gray-600">
                {activeTab === "guide" ? "คู่มือการปฏิบัติงานตามมาตรฐาน (SOP & User Guide)" : "คู่มือโครงสร้างระบบและการดูแลรักษา (System Architecture & Maintenance)"}
              </div>
              <div className="text-xs text-gray-500 mt-1">พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH")}</div>
            </div>

            {/* Document Body rendered as HTML */}
            <article
              dangerouslySetInnerHTML={{ __html: currentDocData.html }}
              className="max-w-4xl mx-auto"
            />

            {/* Back to top floating button */}
            {showScrollTop && (
              <button
                type="button"
                onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                className="no-print fixed bottom-6 right-6 sm:bottom-8 sm:right-8 p-3 rounded-full bg-amber-500 text-amber-950 shadow-lg hover:bg-amber-400 hover:scale-105 transition-all z-20"
                title="กลับขึ้นด้านบน"
                aria-label="กลับขึ้นด้านบน"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="no-print shrink-0 px-6 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div>
            <span>เอกสาร: </span>
            <span className="font-semibold text-[var(--color-text)]">
              {activeTab === "guide" ? "GUIDE.md (คู่มือรายตำแหน่ง)" : "README.md (ระบบและการดูแลรักษา)"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>กดปุ่ม <strong>Esc</strong> เพื่อปิด</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
