"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChecklistPage } from "../../components/staff/ChecklistPage";
import { useApp } from "../../context/AppContext";

export default function ChecklistRoutePage() {
  const router = useRouter();
  const { currentUser, activeSession, selectedShift, isReady, updateSession, endShift } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (!activeSession) {
      router.replace(currentUser.role === "manager" ? "/admin/dashboard" : "/shift");
    }
  }, [currentUser, activeSession, isReady, router]);

  if (!isReady || !currentUser || !activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ChecklistPage
      session={activeSession}
      selectedShift={selectedShift}
      onUpdate={updateSession}
      onEndShift={endShift}
      onOpenDashboard={
        currentUser.role === "manager"
          ? () => router.push("/admin/dashboard")
          : undefined
      }
      onExit={() => router.push("/shift")}
    />
  );
}
