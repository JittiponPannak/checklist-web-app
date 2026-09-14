"use client";

import { useRouter } from "next/navigation";
import { ExecutiveDashboard } from "../../../components/manager/ExecutiveDashboard";
import { useApp } from "../../../context/AppContext";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    activeSession,
    isReady,
    logout,
    selectShift,
    updateSession,
    endShift,
  } = useApp();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  // Use current logged in user or sample executive preview user
  const activeUser = currentUser || {
    id: "preview-exec-user",
    name: "คุณวิภาดา สุขเจริญ",
    email: "manager@factory.com",
    role: "manager" as const,
    position: "ผู้จัดการร้าน",
  };

  return (
    <ExecutiveDashboard
      user={activeUser}
      onLogout={() => logout("/")}
      activeSession={activeSession}
      onStartChecklist={selectShift}
      onUpdateSession={updateSession}
      onEndShift={endShift}
      onOpenChecklistPage={() => router.push("/checklist")}
    />
  );
}
