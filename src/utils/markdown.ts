import fs from "fs";
import path from "path";
import { marked, Tokens } from "marked";

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

export function slugify(text: string): string {
  const clean = text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/[^\w\u0E00-\u0E7F]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "heading";
}

function processCallouts(markdown: string): string {
  // Replace GitHub alerts: > [!NOTE], > [!WARNING], > [!TIP], > [!IMPORTANT], > [!CAUTION]
  return markdown.replace(
    />\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*?\n((?:>.*(?:\n|$))*)/gi,
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
    const rawContent = fs.readFileSync(filePath, "utf-8");
    // Normalize Windows CRLF to standard LF to ensure cross-platform regex compatibility
    const raw = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Extract TOC
    const toc: TocItem[] = [];
    const lines = raw.split("\n");
    let docTitle: string = filename;

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const rawTitle = headingMatch[2].trim();
        const titleText = rawTitle.replace(/\*\*/g, "").replace(/`/g, "");
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

    // Custom renderer for marked to ensure full inline formatting & anchor IDs
    const renderer = new marked.Renderer();

    renderer.heading = function (token: Tokens.Heading) {
      const html = this.parser.parseInline(token.tokens);
      const plainText = token.text.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").replace(/`/g, "");
      const id = slugify(plainText);
      return `<h${token.depth} id="${id}" data-doc-id="${id}" class="doc-heading doc-h${token.depth} group flex items-center justify-between scroll-mt-24">
        <span>${html}</span>
        <a href="#${id}" class="opacity-0 group-hover:opacity-100 text-amber-500 ml-2 text-sm font-normal transition-opacity" aria-label="Link to section">#</a>
      </h${token.depth}>`;
    };

    renderer.listitem = function (token: Tokens.ListItem) {
      // Parse child inline tokens to properly render links, bold text, and code within list items
      const html = token.tokens ? this.parser.parse(token.tokens) : token.text;
      return `<li class="my-1.5 text-[var(--color-text)] leading-relaxed">${html}</li>`;
    };

    renderer.link = function (token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      let href = token.href || "#";

      // Sanitize any PC absolute path or local file URL to protect user privacy
      if (
        href.includes("file://") ||
        href.includes("nemoz") ||
        href.includes("Users") ||
        /^[a-zA-Z]:[\\/]/.test(href)
      ) {
        href = "/";
      }

      const isInternal = href.startsWith("#") || href.startsWith("/");
      const targetAttr = isInternal ? "" : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${href}" class="text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"${targetAttr}>${text}</a>`;
    };

    renderer.table = function (token: Tokens.Table) {
      const headerRow = token.header
        .map(
          (cell) =>
            `<th class="p-3 text-left font-semibold text-[var(--color-text)] border-b border-[var(--color-border)]">${this.parser.parseInline(cell.tokens)}</th>`
        )
        .join("");

      const bodyRows = token.rows
        .map((row) => {
          const cells = row
            .map(
              (cell) =>
                `<td class="p-3 border-b border-[var(--color-border-subtle)] text-[var(--color-text-subtle)]">${this.parser.parseInline(cell.tokens)}</td>`
            )
            .join("");
          return `<tr class="hover:bg-[var(--color-surface-2)]/50 transition-colors">${cells}</tr>`;
        })
        .join("");

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

    renderer.code = function (token: Tokens.Code) {
      const escaped = token.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<div class="my-4 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#1e1412] text-[#fffaf2] shadow-xs">
        ${token.lang ? `<div class="px-4 py-1.5 text-xs font-mono font-bold bg-[#140807] border-b border-[#3b1c18] text-amber-300 flex items-center justify-between"><span>${token.lang}</span></div>` : ""}
        <pre class="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed"><code>${escaped}</code></pre>
      </div>`;
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
