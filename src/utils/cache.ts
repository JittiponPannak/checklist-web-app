import { secureGetItem, secureSetItem, secureRemoveItem } from "./crypto";
import type { DashboardBranch } from "../services/BranchService";
import { checkBranchesUpdatedAction, getBranchesAction } from "../actions/branch";

export function login(userID: string, branchID: string) {
  secureSetItem("user_id", userID);
  secureSetItem("branch_id", branchID);
}

export function startSession(shift_session: string) {
  secureSetItem("shift_session", shift_session);
}

export function endSession() {
  secureRemoveItem("shift_session");
}

export function updateBranchLastUpdate(timestamp: Date | string) {
  const iso = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  secureSetItem("branch_last_update", iso);
}

export function getBranchLastUpdate(): Date | null {
  const data = secureGetItem("branch_last_update");
  if (!data) return null;
  const d = new Date(data);
  return isNaN(d.getTime()) ? null : d;
}

export function shouldBranchUpdate(serverTimestamp: Date | string | null | undefined): boolean {
  if (!serverTimestamp) return true;
  const last = getBranchLastUpdate();
  if (!last) return true;

  const serverDate = serverTimestamp instanceof Date ? serverTimestamp : new Date(serverTimestamp);
  if (isNaN(serverDate.getTime())) return true;

  // Server timestamp is newer than local cache
  return serverDate.getTime() > last.getTime();
}

export function getCachedBranches(): DashboardBranch[] | null {
  try {
    const raw = secureGetItem("cached_branches");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setCachedBranches(branches: DashboardBranch[], lastUpdate?: Date | string) {
  try {
    secureSetItem("cached_branches", JSON.stringify(branches));
    if (lastUpdate) {
      updateBranchLastUpdate(lastUpdate);
    }
  } catch (err) {
    console.warn("Failed to set cached branches in localStorage:", err);
  }
}

export function getLastBranchesCheckTime(): number {
  try {
    const raw = secureGetItem("branches_last_checked_at");
    if (!raw) return 0;
    const num = Number(raw);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export function setLastBranchesCheckTime(timestamp = Date.now()) {
  try {
    secureSetItem("branches_last_checked_at", timestamp.toString());
  } catch (err) {
    console.warn("Failed to set last checked time:", err);
  }
}

export function invalidateBranchCache() {
  secureRemoveItem("cached_branches");
  secureRemoveItem("branch_last_update");
  secureRemoveItem("branches_last_checked_at");
}

export async function fetchBranchesWithCache(options?: {
  force?: boolean;
  intervalMs?: number;
}): Promise<{
  success: boolean;
  branches?: DashboardBranch[];
  lastUpdate?: string;
  error?: string;
  fromCache?: boolean;
}> {
  const intervalMs = options?.intervalMs ?? 30000; // 30s default check interval
  const now = Date.now();
  const cached = getCachedBranches();
  const lastChecked = getLastBranchesCheckTime();

  // 1. If within interval and cache exists: return cached data immediately (0 network/DB requests)
  if (!options?.force && cached && cached.length > 0 && now - lastChecked < intervalMs) {
    return {
      success: true,
      branches: cached,
      lastUpdate: getBranchLastUpdate()?.toISOString(),
      fromCache: true,
    };
  }

  // 2. Interval passed or force requested: check server using lightweight last_update verification
  try {
    const cachedLastUpdate = getBranchLastUpdate();
    const res = await checkBranchesUpdatedAction(cachedLastUpdate?.toISOString());

    if (res.success) {
      if (!res.updated && cached && cached.length > 0) {
        // Data in DB has not changed! Just update the check timestamp and return cached data
        setLastBranchesCheckTime(now);
        return {
          success: true,
          branches: cached,
          lastUpdate: res.lastUpdate || cachedLastUpdate?.toISOString(),
          fromCache: true,
        };
      }

      if (res.updated && res.branches) {
        // Data has changed or was empty: store fresh data in local cache
        setCachedBranches(res.branches, res.lastUpdate);
        setLastBranchesCheckTime(now);
        return {
          success: true,
          branches: res.branches,
          lastUpdate: res.lastUpdate,
          fromCache: false,
        };
      }
    }

    // 3. Fallback: full fetch if check action didn't return branches or if error
    const fullRes = await getBranchesAction({ forceRefresh: true });
    if (fullRes.success && fullRes.branches) {
      setCachedBranches(fullRes.branches, fullRes.lastUpdate);
      setLastBranchesCheckTime(now);
      return {
        success: true,
        branches: fullRes.branches,
        lastUpdate: fullRes.lastUpdate,
        fromCache: false,
      };
    }

    // If fetch failed but we have stale cache, return stale cache as graceful fallback
    if (cached) {
      return {
        success: true,
        branches: cached,
        lastUpdate: cachedLastUpdate?.toISOString(),
        fromCache: true,
      };
    }

    return { success: false, error: fullRes.error || "ไม่สามารถโหลดข้อมูลสาขาได้" };
  } catch (err: unknown) {
    console.error("fetchBranchesWithCache error:", err);
    if (cached) {
      return {
        success: true,
        branches: cached,
        fromCache: true,
      };
    }
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูลสาขา";
    return { success: false, error: message };
  }
}

export function clear() {
  if (typeof window !== "undefined") {
    localStorage.clear();
  }
}