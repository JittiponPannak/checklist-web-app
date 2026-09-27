"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ManagerAuthPage } from "../../../../components/auth/ManagerAuthPage";
import { useApp } from "../../../../context/AppContext";

export default function ManagerLoginPage() {
    const router = useRouter();
    const { currentUser, isReady, login } = useApp();

    useEffect(() => {
        if (!isReady) return;
        if (currentUser) {
            if (currentUser.role === "manager" || currentUser.role === "manager_assistant") {
                if (!currentUser.branchName) {
                    router.replace("/awaiting-assignment");
                } else {
                    router.replace("/manager/dashboard");
                }
            } else if (currentUser.role === "committee" || currentUser.role === "general_manager") {
                router.replace("/manager/dashboard");
            } else if (currentUser.role === "admin") {
                router.replace("/admin/dashboard");
            } else if (currentUser.role === "employee") {
                router.replace("/position");
            }
        }
    }, [currentUser, isReady, router]);

    return <ManagerAuthPage onLogin={login} />;
}
