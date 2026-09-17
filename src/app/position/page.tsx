"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PositionSelectPage } from "../../components/staff/PositionSelectPage";
import { useApp } from "../../context/AppContext";

export default function PositionRoutePage() {
  const router = useRouter();
  const { currentUser, selectedShift, isReady, selectPosition, logout } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) {
      router.replace("/");
    } else {
      const requiresBranch = currentUser.role === "employee" || currentUser.role === "manager_assistant" || currentUser.role === "manager";
      if (requiresBranch && !currentUser.branchName) {
        router.replace("/awaiting-assignment");
      }
    }
  }, [currentUser, isReady, router]);

  if (!isReady || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <PositionSelectPage
      user={currentUser}
      onSelectPosition={selectPosition}
      onLogout={logout}
    />
  );
}
