"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Error:", error);
  }, [error]);

  return (
    <html lang="th">
      <body style={{ backgroundColor: "#fffdf9", color: "#2b1413", fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "28rem", width: "100%", backgroundColor: "#ffffff", border: "1px solid #eadbce", borderRadius: "16px", padding: "2rem", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: "3rem", height: "3rem", backgroundColor: "#fcf8f2", border: "1px solid #eadbce", borderRadius: "12px", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", fontSize: "1.25rem", fontWeight: "bold" }}>
              !
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#2b1413" }}>เกิดข้อผิดพลาดระดับระบบ</h1>
            <p style={{ fontSize: "0.875rem", color: "#78483b", lineHeight: 1.5, margin: "0 0 1.5rem 0" }}>
              ไม่สามารถประมวลผลโครงสร้างหลักของแอปพลิเคชันได้ กรุณากดปุ่มเพื่อเริ่มต้นใหม่
            </p>
            {error?.digest && (
              <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#9c6c60", backgroundColor: "#fcf8f2", padding: "0.5rem", borderRadius: "8px", margin: "0 0 1.5rem 0", wordBreak: "break-all" }}>
                Digest: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              style={{ width: "100%", minHeight: "44px", padding: "10px 20px", backgroundColor: "#f59e0b", color: "#2b1413", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "0.875rem", cursor: "pointer" }}
            >
              เริ่มต้นระบบใหม่อีกครั้ง
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
