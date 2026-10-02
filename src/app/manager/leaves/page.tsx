"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { LoadingSpinner } from "../../loading";
import { BranchStaffUnifiedHub } from "../../../components/manager/BranchStaffUnifiedHub";

export default function ManagerLeavesPage() {
  const router = useRouter();
  const { currentUser, isReady } = useApp();

  useEffect(() => {
    if (!isReady) return;
    // Disallow regular employees; allow manager, manager_assistant, general_manager, committee, admin
    if (currentUser && currentUser.role === "employee") {
      router.replace("/checklist");
    }
  }, [currentUser, isReady, router]);

  if (!isReady) {
    return <LoadingSpinner text="กำลังโหลดระบบจัดการการลาพนักงาน..." />;
  }

  const activeUser = currentUser || {
    id: "preview-manager-user",
    name: "คุณวิภาดา สุขเจริญ",
    username: "manager",
    role: "manager" as const,
    position: "ผู้จัดการร้าน",
  };

  return <BranchStaffUnifiedHub currentUser={activeUser} initialTab="leaves" />;
}
