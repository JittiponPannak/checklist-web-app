import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { ThemeToggle } from "../components/common/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eater Egg Fresh Mart - ระบบเช็คลิสต์ประจำกะ",
  description: "ระบบจัดการและตรวจสอบเช็คลิสต์การปฏิบัติงานประจำกะ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[var(--color-surface)] focus:text-[var(--color-primary)] focus:text-xs focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-2 focus:outline-[var(--color-primary)]"
        >
          ข้ามไปยังเนื้อหาหลัก (Skip to main content)
        </a>
        <AppProvider>
          <div className="fixed bottom-6 right-6 z-50">
            <ThemeToggle />
          </div>
          <main id="main-content" tabIndex={-1} className="min-h-full flex-1 focus-visible:outline-none">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
