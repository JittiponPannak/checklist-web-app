"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { LoadingSpinner } from "../../loading";
import { BranchStaffPresenceView } from "../../../components/manager/BranchStaffPresenceView";

export default function ManagerStaffStatusPage() {
  const router = useRouter();
  const { currentUser, isReady } = useApp();

  useEffect(() => {
    if (!isReady) return;
    // Allow manager, manager_assistant, general_manager, committee, and admin
    if (currentUser && currentUser.role === "employee") {
      router.replace("/checklist");
    }
  }, [currentUser, isReady, router]);

  if (!isReady) {
    return <LoadingSpinner text="กำลังโหลดข้อมูลสถานะพนักงาน..." />;
  }

  const activeUser = currentUser || {
    id: "preview-manager-user",
    name: "คุณวิภาดา สุขเจริญ",
    email: "manager@factory.com",
    role: "manager" as const,
    position: "ผู้จัดการร้าน",
  };

  return <BranchStaffPresenceView currentUser={activeUser} />;
}
