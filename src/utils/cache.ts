import { secureGetItem, secureSetItem, secureRemoveItem } from "./crypto";

function login(userID: string, branchID: string) {
    secureSetItem("user_id", userID)
    secureSetItem("branch_id", branchID)
}
function startSession(shift_session: string) {
    secureSetItem("shift_session", shift_session)
}
function endSession(shift_session: string) {
    secureRemoveItem("shift_session")
}

function updateBranchLastUpdate(timestamp: Date) {
    secureSetItem("branch_last_update", timestamp.toString())
}
function getBranchLastUpdate(): Date | null {
    const data = secureGetItem("branch_last_update");

    return typeof (data) == "string" ? new Date(data) : null;
}
function shouldBranchUpdate(timestamp: Date): boolean {
    const last = getBranchLastUpdate();

    if (last instanceof Date) {
        return timestamp == last;
    }

    return true;
}

function clear() {
    localStorage.clear()
}