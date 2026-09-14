import { useState, useEffect } from "react";
import { User } from "../../types";
import { BrandLogo } from "../common/BrandLogo";
import { getUsers, saveUsers } from "../../data/storage";
import Link from "next/link";

interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  managerName: string;
  staffCount: number;
  status: "active" | "maintenance" | "standby";
  todayCompletionRate: number;
}

interface MasterTask {
  id: string;
  title: string;
  role: "cashier" | "stock" | "manager_assistant";
  shift: "morning" | "afternoon" | "both";
  timeWindow: string;
  mandatory: boolean;
  active: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  severity: "info" | "success" | "warning";
}

const INITIAL_BRANCHES: Branch[] = [
  {
    id: "b-1",
    code: "BKK-001",
    name: "สาขาพญาไท (สำนักงานใหญ่)",
    location: "เขตราชเทวี กรุงเทพฯ",
    managerName: "คุณวิภาดา สุขเจริญ",
    staffCount: 12,
    status: "active",
    todayCompletionRate: 100,
  },
  {
    id: "b-2",
    code: "BKK-002",
    name: "สาขาอารีย์ มาร์เก็ต",
    location: "เขตพญาไท กรุงเทพฯ",
    managerName: "คุณทนงศักดิ์ วงศ์ชื่น",
    staffCount: 8,
    status: "active",
    todayCompletionRate: 91,
  },
  {
    id: "b-3",
    code: "BKK-003",
    name: "สาขาสุขุมวิท 24",
    location: "เขตคลองเตย กรุงเทพฯ",
    managerName: "คุณรสรินทร์ สมบูรณ์",
    staffCount: 10,
    status: "active",
    todayCompletionRate: 95,
  },
  {
    id: "b-4",
    code: "BKK-004",
    name: "สาขาพระราม 9",
    location: "เขตห้วยขวาง กรุงเทพฯ",
    managerName: "คุณชาญวิทย์ ปิติพร",
    staffCount: 7,
    status: "active",
    todayCompletionRate: 100,
  },
  {
    id: "b-5",
    code: "CNX-001",
    name: "สาขานิมมานเหมินท์",
    location: "อ.เมือง จ.เชียงใหม่",
    managerName: "กำลังสรรหา",
    staffCount: 4,
    status: "standby",
    todayCompletionRate: 0,
  },
];

const INITIAL_MASTER_TASKS: MasterTask[] = [
  {
    id: "mt-1",
    title: "สแกนนิ้วเข้างาน แต่งกายและติดป้ายชื่อเรียบร้อย",
    role: "cashier",
    shift: "morning",
    timeWindow: "06:00 – 07:30",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-2",
    title: "เปิดเครื่อง POS ล็อกอินด้วยรหัสของตนเอง และทดสอบอุปกรณ์",
    role: "cashier",
    shift: "morning",
    timeWindow: "06:00 – 07:30",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-3",
    title: "ตรวจนับเงินทอน (Float) ก้นลิ้นชักให้ครบถ้วน",
    role: "cashier",
    shift: "morning",
    timeWindow: "06:00 – 07:30",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-4",
    title: "ตรวจเช็คอุณหภูมิตู้แช่เย็น (Chiller) และตู้แช่แข็ง (Freezer)",
    role: "stock",
    shift: "morning",
    timeWindow: "06:00 – 08:00",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-5",
    title: "ตรวจรับสินค้าสด (Fresh Meat & Egg Supplies) จากรถขนส่ง",
    role: "stock",
    shift: "morning",
    timeWindow: "07:00 – 09:30",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-6",
    title: "ตรวจสอบความเรียบร้อยของพนักงานก่อนเปิดประตูร้าน",
    role: "manager_assistant",
    shift: "morning",
    timeWindow: "07:30 – 08:00",
    mandatory: true,
    active: true,
  },
  {
    id: "mt-7",
    title: "ตรวจสอบยอดขายรอบเที่ยงและสรุปเงินส่งเซฟกลาง",
    role: "manager_assistant",
    shift: "afternoon",
    timeWindow: "14:00 – 15:30",
    mandatory: true,
    active: true,
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "14 ก.ย. 2026 13:29:51",
    user: "สมศรี ใจดี (แคชเชียร์)",
    action: "CHECKLIST_SUBMIT",
    target: "ตรวจนับเงินทอน ก้นลิ้นชัก (BKK-001)",
    severity: "success",
  },
  {
    id: "log-2",
    timestamp: "14 ก.ย. 2026 13:28:10",
    user: "คุณวิภาดา สุขเจริญ (ผู้จัดการ)",
    action: "SHIFT_APPROVE",
    target: "รับรองผลกะเช้า แคชเชียร์ สาขาพญาไท",
    severity: "success",
  },
  {
    id: "log-3",
    timestamp: "14 ก.ย. 2026 12:45:00",
    user: "คุณสมเกียรติ บริหารกิจ (Admin)",
    action: "ROLE_CHANGE",
    target: "แต่งตั้ง คุณธนากร เป็น ผู้ช่วยผู้จัดการร้าน",
    severity: "info",
  },
  {
    id: "log-4",
    timestamp: "14 ก.ย. 2026 11:30:15",
    user: "System Watchdog",
    action: "DB_BACKUP",
    target: "Supabase PostgreSQL Automated Snapshot (Pooler Asia-0)",
    severity: "info",
  },
  {
    id: "log-5",
    timestamp: "14 ก.ย. 2026 08:15:20",
    user: "สมชาย มั่นคง (สต็อก)",
    action: "CHECKLIST_ALERT",
    target: "ตู้แช่เย็น 02 อุณหภูมิสูงกว่าเกณฑ์ (+4.8°C)",
    severity: "warning",
  },
];

export function AdminDashboardView({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "branches" | "tasks" | "users" | "audit">("overview");
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [tasks, setTasks] = useState<MasterTask[]>(INITIAL_MASTER_TASKS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [branchSearch, setBranchSearch] = useState("");
  const [taskRoleFilter, setTaskRoleFilter] = useState<"all" | "cashier" | "stock" | "manager_assistant">("all");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    setUsersList(getUsers());
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function toggleTaskStatus(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, active: !t.active } : t))
    );
    showToast("อัปเดตสถานะการใช้งานแม่แบบงานเรียบร้อยแล้ว");
  }

  function handlePromoteUser(userId: string, newRole: any) {
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setUsersList(updated);
    saveUsers(updated);
    showToast(`ปรับเปลี่ยนสิทธิ์ผู้ใช้เป็น ${newRole} สำเร็จ`);
  }

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    taskRoleFilter === "all" ? true : t.role === taskRoleFilter
  );

  const filteredUsers = usersList.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.position && u.position.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl animate-fade-in flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size={36} showText={true} />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-indigo-950 text-indigo-400 border border-indigo-800/80 px-2.5 py-1 rounded-md">
              System Admin Portal
            </span>
            <span className="text-xs text-slate-400">ระดับศูนย์กลางองค์กร</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/manager/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
          >
            <span>ดูหน้าผู้จัดการร้าน</span>
            <span className="text-indigo-400">→</span>
          </Link>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-100">{user.name}</p>
              <p className="text-[11px] text-slate-400">{user.position || "ผู้ดูแลระบบส่วนกลาง"}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-slate-800 transition-all font-semibold cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            {[
              { id: "overview", label: "ภาพรวมระบบ (Overview)" },
              { id: "branches", label: `จัดการสาขา (${branches.length})` },
              { id: "tasks", label: `แม่แบบงานกลาง (${tasks.length})` },
              { id: "users", label: `จัดการผู้ใช้และสิทธิ์ (${usersList.length})` },
              { id: "audit", label: "บันทึกประวัติ (Audit Logs)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs text-slate-400 font-mono">DB Pooler: Connected</span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">สาขาที่เปิดทำการ</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                    Online 100%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">{branches.filter(b => b.status === "active").length}</span>
                  <span className="text-xs text-slate-500">/ {branches.length} สาขาทั่วประเทศ</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">อัตราการเช็คลิสต์รวมวันนี้</span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded-full">
                    ทั่วประเทศ
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-indigo-400 font-mono">96.5%</span>
                  <span className="text-xs text-emerald-400 font-semibold">+2.1% จากสัปดาห์ก่อน</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">พนักงานในระบบทั้งหมด</span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">{usersList.length || 8}</span>
                  <span className="text-xs text-slate-500">บัญชีผู้ใช้งาน</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">ระบบฐานข้อมูล Supabase</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                    Healthy
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-200">PostgreSQL 15</span>
                  <span className="text-xs text-slate-500 font-mono">24ms Ping</span>
                </div>
              </div>
            </div>

            {/* Quick Status Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">สรุปผลการปฏิบัติงานรายสาขาประจำวัน</h3>
                  <p className="text-xs text-slate-400">แสดงข้อมูลความคืบหน้าการเช็คลิสต์ของทุกสาขาแบบเรียลไทม์</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("branches")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
                >
                  จัดการสาขาทั้งหมด →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-3">รหัสสาขา</th>
                      <th className="py-3 px-3">ชื่อสาขา</th>
                      <th className="py-3 px-3">ผู้จัดการประจำสาขา</th>
                      <th className="py-3 px-3">พนักงาน</th>
                      <th className="py-3 px-3">สถานะ</th>
                      <th className="py-3 px-3 text-right">ความคืบหน้า Checklist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {branches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-400">{b.code}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{b.name}</td>
                        <td className="py-3 px-3 text-slate-400">{b.managerName}</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{b.staffCount} คน</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === "active"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {b.status === "active" ? "เปิดปกติ" : "รอเปิด"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  b.todayCompletionRate === 100
                                    ? "bg-emerald-500"
                                    : b.todayCompletionRate > 80
                                    ? "bg-indigo-500"
                                    : "bg-slate-600"
                                }`}
                                style={{ width: `${b.todayCompletionRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-200 w-10 text-right">
                              {b.todayCompletionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANCH MANAGEMENT */}
        {activeTab === "branches" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="ค้นหาชื่อสาขา หรือรหัสสาขา..."
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-80"
              />
              <button
                type="button"
                onClick={() => showToast("เปิดหน้าต่างเพิ่มสาขาใหม่ (Mockup)")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ เพิ่มสาขาใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map((b) => (
                <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                        {b.code}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{b.name}</h4>
                      <p className="text-xs text-slate-400">{b.location}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === "active"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {b.status === "active" ? "เปิดทำการ" : "Standby"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">ผู้จัดการสาขา</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{b.managerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">จำนวนพนักงาน</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{b.staffCount} คน</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => showToast(`กำหนดผู้จัดการสำหรับ ${b.name}`)}
                      className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer flex-1"
                    >
                      จัดการสาขา
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`เปิดดูแดชบอร์ดสาขา ${b.name}`)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg border border-indigo-900/80 transition-all cursor-pointer"
                    >
                      ดูผลตรวจ →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MASTER TASKS */}
        {activeTab === "tasks" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "cashier", label: "แคชเชียร์" },
                  { id: "stock", label: "สต็อก/จัดเรียง" },
                  { id: "manager_assistant", label: "ผู้ช่วยผู้จัดการ" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTaskRoleFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      taskRoleFilter === f.id ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => showToast("เปิดแบบฟอร์มเพิ่มงานเช็คลิสต์กลาง (Mockup)")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                + เพิ่มรายการงานใหม่
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <tr>
                      <th className="py-3.5 px-4">รายการงาน (Master Task)</th>
                      <th className="py-3.5 px-3">ตำแหน่งงาน</th>
                      <th className="py-3.5 px-3">กะงาน</th>
                      <th className="py-3.5 px-3">ช่วงเวลา</th>
                      <th className="py-3.5 px-3">ความสำคัญ</th>
                      <th className="py-3.5 px-3 text-right">เปิด/ปิดการใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTasks.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-200 max-w-md">
                          <span className="font-mono text-slate-500 mr-2">{String(idx + 1).padStart(2, "0")}</span>
                          <span>{t.title}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px]">
                            {t.role === "cashier" ? "แคชเชียร์" : t.role === "stock" ? "สต็อก" : "ผู้ช่วยผจก."}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 capitalize">{t.shift}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">{t.timeWindow}</td>
                        <td className="py-3.5 px-3">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-900 px-2 py-0.5 rounded">
                            จำเป็น
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(t.id)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              t.active
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-800"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-950 hover:text-emerald-400"
                            }`}
                          >
                            {t.active ? "ใช้งานอยู่" : "ปิดชั่วคราว"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS & PERMISSIONS */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ใช้งาน, อีเมล หรือตำแหน่ง..."
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-80"
              />

              <button
                type="button"
                onClick={() => showToast("เปิดแบบฟอร์มสร้างบัญชีผู้ใช้งานใหม่")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                + เพิ่มผู้ใช้ใหม่
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <tr>
                      <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                      <th className="py-3.5 px-3">อีเมล</th>
                      <th className="py-3.5 px-3">บทบาทระบบ (Role)</th>
                      <th className="py-3.5 px-3">ตำแหน่งที่กำหนด</th>
                      <th className="py-3.5 px-3 text-right">ปรับเปลี่ยนสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">{u.email}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === "admin" || u.role === "committee"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : u.role === "manager"
                                ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">{u.position || "-"}</td>
                        <td className="py-3.5 px-3 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handlePromoteUser(u.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="employee">Staff (พนักงาน)</option>
                            <option value="manager">Manager (ผู้จัดการ)</option>
                            <option value="manager_assistant">Assistant (ผู้ช่วยผจก.)</option>
                            <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">บันทึกเหตุการณ์และความปลอดภัยระบบ (System Audit Log)</h3>
                  <p className="text-xs text-slate-400">บันทึกทุกกิจกรรมการเช็คงาน การอนุมัติผล และการแก้ไขสิทธิ์โดยละเอียด</p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("ดาวน์โหลด Audit Report (.CSV) เรียบร้อย")}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Export CSV ↓
                </button>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          log.severity === "success"
                            ? "bg-emerald-500"
                            : log.severity === "warning"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                      />
                      <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                      <span className="font-bold text-slate-200">{log.user}</span>
                      <span className="font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded text-[10px] border border-indigo-900">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-slate-400 text-right">{log.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-3 text-center text-xs text-slate-500">
        Eater Egg Fresh Mart • Central Enterprise Administration Portal v2.0
      </footer>
    </div>
  );
}
