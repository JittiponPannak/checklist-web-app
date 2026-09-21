"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial state from document element class list
        if (document.documentElement.classList.contains("dark")) {
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.remove("dark");
            localStorage.theme = "light";
            setIsDark(false);
        } else {
            root.classList.add("dark");
            localStorage.theme = "dark";
            setIsDark(true);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center focus-visible:outline-hidden focus:ring-2 focus:ring-amber-400 active:scale-95 duration-150 ${className}`}
            aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง (Light mode)" : "เปลี่ยนเป็นโหมดมืด (Dark mode)"}
            title={isDark ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)"}
        >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>
    );
}
