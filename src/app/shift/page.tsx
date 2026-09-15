"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShiftSelectPage } from "../../components/staff/ShiftSelectPage";
import { useApp } from "../../context/AppContext";

export default function ShiftRoutePage() {
  const router = useRouter();
  const { currentUser, sessions, isReady, selectShift, logout } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "employee" && !currentUser.position) {
      router.replace("/position");
    }
  }, [currentUser, isReady, router]);

  if (!isReady || !currentUser || (currentUser.role === "employee" && !currentUser.position)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ShiftSelectPage
      user={currentUser}
      sessions={sessions}
      onSelect={selectShift}
      onBack={() => router.push("/position")}
      onLogout={logout}
    />
  );
}
