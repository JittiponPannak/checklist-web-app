import fs from "fs";
import path from "path";
import { marked } from "marked";

export interface TocItem {
  id: string;
  title: string;
  level: number;
  roleTag?: string;
}

export interface ParsedDoc {
  raw: string;
  html: string;
  toc: TocItem[];
  title: string;
}

function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\u0E00-\u0E7F]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean ? `doc-${clean}` : "doc-heading";
}

function processCallouts(markdown: string): string {
  // Replace GitHub alerts: > [!NOTE], > [!WARNING], > [!TIP], > [!IMPORTANT], > [!CAUTION]
  return markdown.replace(
    />\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gi,
    (match, type, content) => {
      const cleanContent = content
        .split("\n")
        .map((line: string) => line.replace(/^>\s?/, ""))
        .join("\n");

      const alertType = type.toUpperCase();
      let colorClasses = "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200";
      let icon = "ℹ️";
      let title = "หมายเหตุ";

      if (alertType === "WARNING") {
        colorClasses = "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200";
        icon = "⚠️";
        title = "ข้อควรระวัง";
      } else if (alertType === "CAUTION") {
        colorClasses = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200";
        icon = "🚫";
        title = "คำเตือนสำคัญ";
      } else if (alertType === "TIP") {
        colorClasses = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200";
        icon = "💡";
        title = "คำแนะนำ";
      } else if (alertType === "IMPORTANT") {
        colorClasses = "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200";
        icon = "📌";
        title = "ข้อกำหนดสำคัญ";
      }

      return `\n<div class="my-4 p-4 rounded-xl border-l-4 ${colorClasses}">
        <div class="font-bold flex items-center gap-2 mb-1">
          <span>${icon}</span>
          <span>${title}</span>
        </div>
        <div class="text-sm leading-relaxed">${cleanContent}</div>
      </div>\n`;
    }
  );
}

export function parseMarkdownFile(filename: "README.md" | "GUIDE.md"): ParsedDoc {
  try {
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), filename);
    const raw = fs.readFileSync(filePath, "utf-8");

    // Extract TOC
    const toc: TocItem[] = [];
    const lines = raw.split("\n");
    let docTitle: string = filename;

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const titleText = headingMatch[2].trim().replace(/\*\*/g, "").replace(/`/g, "");
        const id = slugify(titleText);

        if (level === 1 && docTitle === filename) {
          docTitle = titleText;
        }

        // Detect role tag in heading
        let roleTag: string | undefined;
        const lower = titleText.toLowerCase();
        if (lower.includes("แคชเชียร์") || lower.includes("cashier")) roleTag = "cashier";
        else if (lower.includes("สต็อก") || lower.includes("stock")) roleTag = "stock";
        else if (lower.includes("ผู้ช่วยผู้จัดการ") || lower.includes("assistant")) roleTag = "assistant";
        else if (lower.includes("ผู้จัดการร้าน") || lower.includes("store manager")) roleTag = "manager";
        else if (lower.includes("ผู้จัดการทั่วไป") || lower.includes("general manager")) roleTag = "general_manager";
        else if (lower.includes("กรรมการ") || lower.includes("เจ้าของ") || lower.includes("owner") || lower.includes("board")) roleTag = "owner";
        else if (lower.includes("แอดมิน") || lower.includes("admin")) roleTag = "admin";
        else if (lower.includes("กฎเหล็ก") || lower.includes("faq") || lower.includes("คำถามที่พบบ่อย")) roleTag = "faq";

        toc.push({ id, title: titleText, level, roleTag });
      }
    }

    // Process custom alerts and convert to HTML
    const processedMd = processCallouts(raw);

    // Custom renderer for marked to add heading anchors with IDs
    const renderer = new marked.Renderer();
    renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const plainText = text.replace(/<[^>]*>/g, "");
      const id = slugify(plainText);
      return `<h${depth} id="${id}" data-doc-id="${id}" class="doc-heading doc-h${depth} group flex items-center justify-between scroll-mt-24">
        <span>${text}</span>
        <a href="#${id}" class="opacity-0 group-hover:opacity-100 text-amber-500 ml-2 text-sm font-normal transition-opacity" aria-label="Link to section">#</a>
      </h${depth}>`;
    };

    renderer.table = (token) => {
      const headerRow = token.header.map(cell => `<th class="p-3 text-left font-semibold text-[var(--color-text)] border-b border-[var(--color-border)]">${cell.text}</th>`).join("");
      const bodyRows = token.rows.map(row => {
        const cells = row.map(cell => `<td class="p-3 border-b border-[var(--color-border-subtle)] text-[var(--color-text-subtle)]">${cell.text}</td>`).join("");
        return `<tr class="hover:bg-[var(--color-surface-2)]/50 transition-colors">${cells}</tr>`;
      }).join("");

      return `<div class="overflow-x-auto my-6 rounded-xl border border-[var(--color-border)] shadow-xs">
        <table class="w-full text-sm text-left border-collapse bg-[var(--color-surface)]">
          <thead class="bg-[var(--color-surface-2)]">
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </div>`;
    };

    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      return `<div class="my-4 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#1e1412] text-[#fffaf2] shadow-xs">
        ${lang ? `<div class="px-4 py-1.5 text-xs font-mono font-bold bg-[#140807] border-b border-[#3b1c18] text-amber-300 flex items-center justify-between"><span>${lang}</span></div>` : ""}
        <pre class="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed"><code>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>`;
    };

    renderer.listitem = ({ text }: { text: string }) => {
      return `<li class="my-1 text-[var(--color-text)] leading-relaxed">${text}</li>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: false,
    });

    const parsedHtml = marked.parse(processedMd) as string;

    return {
      raw,
      html: parsedHtml,
      toc,
      title: docTitle,
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filename}:`, error);
    return {
      raw: "",
      html: `<p class="text-red-500">ไม่สามารถโหลดไฟล์ ${filename} ได้</p>`,
      toc: [],
      title: filename,
    };
  }
}
