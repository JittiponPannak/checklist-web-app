"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardView } from "../../../components/admin/AdminDashboardView";
import { useApp } from "../../../context/AppContext";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser, isReady, logout } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (currentUser && currentUser.role === "employee") {
      router.replace("/");
    }
  }, [currentUser, isReady, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const activeUser = currentUser || {
    id: "preview-admin-user",
    name: "คุณสมเกียรติ บริหารกิจ",
    email: "admin@factory.com",
    role: "admin" as const,
    position: "ผู้ดูแลระบบส่วนกลาง",
  };

  return (
    <AdminDashboardView
      user={activeUser}
      onLogout={logout}
    />
  );
}
