"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { LoadingSpinner } from "../../loading";
import { BranchLeaveManagementView } from "../../../components/manager/BranchLeaveManagementView";

export default function ManagerLeavesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultUserId = searchParams.get("userId") || undefined;
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
    email: "manager@factory.com",
    role: "manager" as const,
    position: "ผู้จัดการร้าน",
  };

  return (
    <BranchLeaveManagementView 
      currentUser={activeUser}
      onBackToDashboard={() => router.push("/manager/dashboard")}
      defaultSelectedUserId={defaultUserId}
    />
  );
}
