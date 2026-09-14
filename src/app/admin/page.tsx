"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthPage } from "../../components/admin/AdminAuthPage";
import { useApp } from "../../context/AppContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { currentUser, isReady, login } = useApp();

  useEffect(() => {
    if (!isReady) return;
    if (currentUser && (currentUser.role === "admin" || currentUser.role === "committee" || currentUser.role === "general_manager")) {
      router.replace("/admin/dashboard");
    }
  }, [currentUser, isReady, router]);

  return <AdminAuthPage onLogin={login} />;
}
