"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "../../context/LoadingContext";

export function PageTransitionWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startLoading, stopLoading, resetLoading } = useLoading();

  const [progress, setProgress] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const activeNavRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const previousUrlRef = useRef("");

  // Helper to clear all running timers
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  // When pathname or searchParams change, navigation has landed
  useEffect(() => {
    const currentUrl = `${pathname}${searchParams ? `?${searchParams.toString()}` : ""}`;

    if (previousUrlRef.current && previousUrlRef.current !== currentUrl) {
      // Clear any pending step or fallback timers
      clearTimers();

      // Complete the top loading bar
      setProgress(100);
      setIsVisible(true);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        const resetTimer = setTimeout(() => {
          setProgress(null);
          activeNavRef.current = false;
        }, 200);
        timersRef.current.push(resetTimer);
      }, 160);
      timersRef.current.push(hideTimer);

      // Reset any lingering global page-transition lock
      resetLoading();
    }

    previousUrlRef.current = currentUrl;
  }, [pathname, searchParams, clearTimers, resetLoading]);

  // Intercept click on internal links to provide instant feedback and prevent misclicks
  useEffect(() => {
    function handleAnchorClick(e: MouseEvent) {
      // Ignore right clicks or clicks with modifier keys
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, hash anchors, mailto, tel, downloads
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target.hasAttribute("download") ||
        target.getAttribute("target") === "_blank"
      ) {
        return;
      }

      // Check if it's an internal route
      try {
        const url = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin !== currentUrl.origin) return; // External origin

        // If clicking the exact current URL (including hash), no route transition needed
        if (
          url.pathname === currentUrl.pathname &&
          url.search === currentUrl.search &&
          url.hash === currentUrl.hash
        ) {
          return;
        }

        // Cancel any pending timers from previous interactions
        clearTimers();

        // Start navigation progress
        activeNavRef.current = true;
        setIsVisible(true);
        setProgress(25);

        // Advance progress smoothly and predictably (all tracked in timersRef)
        timersRef.current.push(setTimeout(() => setProgress(50), 120));
        timersRef.current.push(setTimeout(() => setProgress(75), 350));
        timersRef.current.push(setTimeout(() => setProgress(88), 700));

        // Show full screen transition blocker ONLY if transition takes unusually long (> 1200ms)
        const overlayTimer = setTimeout(() => {
          if (activeNavRef.current) {
            startLoading("กำลังเตรียมเนื้อหาหน้าถัดไป...", true);
          }
        }, 1200);
        timersRef.current.push(overlayTimer);

        // Safety fallback: if navigation fails or is cancelled, auto-recover in 3.5 seconds
        const fallbackTimer = setTimeout(() => {
          if (activeNavRef.current) {
            setProgress(100);
            const fadeTimer = setTimeout(() => {
              setIsVisible(false);
              setProgress(null);
              stopLoading();
              activeNavRef.current = false;
            }, 180);
            timersRef.current.push(fadeTimer);
          }
        }, 3500);
        timersRef.current.push(fallbackTimer);
      } catch {
        // Ignore invalid URLs
      }
    }

    const handlePopState = () => {
      // Browser back/forward button clicked
      clearTimers();
      activeNavRef.current = true;
      setIsVisible(true);
      setProgress(35);
      timersRef.current.push(setTimeout(() => setProgress(70), 150));
    };

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers, startLoading, stopLoading]);

  if (!isVisible && progress === null) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.85)] transition-all ease-out"
        style={{
          width: `${progress ?? 0}%`,
          transitionDuration: progress === 100 ? "160ms" : "250ms",
        }}
      />
    </div>
  );
}
