"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeAuthPage } from "../../../../components/auth/EmployeeAuthPage";
import { useApp } from "../../../../context/AppContext";

export default function EmployeeLoginPage() {
    const router = useRouter();
    const { currentUser, isReady, login } = useApp();

    useEffect(() => {
        if (!isReady) return;
        if (currentUser) {
            if (currentUser.role === "employee") {
                if (!currentUser.branchName) {
                    router.replace("/awaiting-assignment");
                } else {
                    router.replace("/position");
                }
            } else if (currentUser.role === "manager" || currentUser.role === "manager_assistant") {
                router.replace("/manager/dashboard");
            } else if (currentUser.role === "committee" || currentUser.role === "general_manager") {
                router.replace("/manager/dashboard");
            } else if (currentUser.role === "admin") {
                router.replace("/admin/dashboard");
            }
        }
    }, [currentUser, isReady, router]);

    return <EmployeeAuthPage onLogin={login} />;
}
