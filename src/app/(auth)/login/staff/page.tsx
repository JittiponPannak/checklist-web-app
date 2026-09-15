"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeAuthPage } from "../../../../components/auth/EmployeeAuthPage";
import { useApp } from "../../../../context/AppContext";

export default function StaffLoginPage() {
    const router = useRouter();
    const { currentUser, isReady, login } = useApp();

    useEffect(() => {
        if (!isReady) return;
        if (currentUser) {
            if (currentUser.role === "manager" || currentUser.role === "manager_assistant" || currentUser.role === "committee" || currentUser.role === "general_manager") {
                router.replace("/manager/dashboard");
            } else {
                router.replace("/position");
            }
        }
    }, [currentUser, isReady, router]);

    return <EmployeeAuthPage onLogin={login} />;
}
