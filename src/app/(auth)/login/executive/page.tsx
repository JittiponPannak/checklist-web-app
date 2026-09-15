"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExecutiveAuthPage } from "../../../../components/auth/ExecutiveAuthPage";
import { useApp } from "../../../../context/AppContext";

export default function ExecutiveLoginPage() {
    const router = useRouter();
    const { currentUser, isReady, login } = useApp();

    useEffect(() => {
        if (!isReady) return;
        if (currentUser) {
            if (currentUser.role === "manager" || currentUser.role === "general_manager" || currentUser.role === "committee") {
                router.replace("/manager/dashboard");
            } else if (currentUser.role === "admin") {
                router.replace("/admin/dashboard");
            } else if (currentUser.role === "manager_assistant") {
                router.replace("/manager/dashboard");
            } else {
                router.replace("/position");
            }
        }
    }, [currentUser, isReady, router]);

    return <ExecutiveAuthPage onLogin={login} />;
}
