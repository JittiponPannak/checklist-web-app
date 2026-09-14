"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffAuthPage } from "../components/staff/StaffAuthPage";
import { useApp } from "../context/AppContext";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isReady, login } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (currentUser) {
      if (currentUser.role === "manager" || currentUser.role === "manager_assistant" || currentUser.role === "committee") {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/position");
      }
    }
  }, [currentUser, isReady, router]);

  return <StaffAuthPage onLogin={login} />;
}
