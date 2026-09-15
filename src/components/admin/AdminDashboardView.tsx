import { useState, useEffect } from "react";
import { User } from "../../types";
import { BrandLogo } from "../common/BrandLogo";
import Link from "next/link";
import { getBranchesAction, createBranchAction, assignStaffToBranchAction, assignTasksToBranchAction, DashboardBranch as Branch } from "../../actions/branch";
import { getAllUsersAction } from "../../actions/auth";
import { getAllTasksAction, createTaskAction } from "../../actions/task";

interface MasterTask {
  id: string;
  title: string;
  role: "cashier" | "stock" | "manager_assistant";
  shift: "morning" | "afternoon" | "both";
  timeWindow: string;
  mandatory: boolean;
  active: boolean;
}



// Removed INITIAL_BRANCHES

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



export function AdminDashboardView({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "branches" | "tasks" | "users">("overview");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tasks, setTasks] = useState<MasterTask[]>(INITIAL_MASTER_TASKS);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal states
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const [isManageStaffModalOpen, setIsManageStaffModalOpen] = useState(false);
  const [selectedBranchForStaff, setSelectedBranchForStaff] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);
  const [selectedBranchForTasks, setSelectedBranchForTasks] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSavingTasks, setIsSavingTasks] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [tasksList, setTasksList] = useState<any[]>([]);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskRole, setNewTaskRole] = useState<"manager_assistant" | "cashier" | "stock">("cashier");
  const [newTaskShift, setNewTaskShift] = useState<"morning" | "afternoon" | "morning_afternoon">("morning");
  const [newTaskStart, setNewTaskStart] = useState("");
  const [newTaskEnd, setNewTaskEnd] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Filters
  const [branchSearch, setBranchSearch] = useState("");
  const [taskRoleFilter, setTaskRoleFilter] = useState<"all" | "cashier" | "stock" | "manager_assistant">("all");
  const [userSearch, setUserSearch] = useState("");

  const loadBranches = async () => {
    const res = await getBranchesAction();
    if (res.success && res.branches) setBranches(res.branches);
    else showToast(res.error || "โหลดข้อมูลสาขาไม่สำเร็จ");
  };

  const loadUsers = async () => {
    const res = await getAllUsersAction();
    if (res.success && res.users) {
      setUsersList(res.users);
    } else {
      showToast(res.error || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
    }
  };

  const loadTasks = async () => {
    const res = await getAllTasksAction();
    if (res.success && res.tasks) {
      setTasksList(res.tasks);
    } else {
      showToast(res.error || "โหลดข้อมูลงานไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadUsers();
    loadTasks();
    loadBranches();
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!newBranchName.trim()) return showToast("กรุณาระบุชื่อสาขา");

    setIsCreatingBranch(true);
    const res = await createBranchAction(newBranchName);
    setIsCreatingBranch(false);

    if (res.success) {
      showToast("เพิ่มสาขาใหม่สำเร็จ");
      setIsNewBranchModalOpen(false);
      setNewBranchName("");
      loadBranches();
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด");
    }
  }

  function openManageStaffModal(branchId: string) {
    setSelectedBranchForStaff(branchId);
    const branch = branches.find((b) => b.id === branchId);
    setSelectedStaffIds(branch ? branch.members : []);
    setIsManageStaffModalOpen(true);
  }

  async function handleSaveStaff() {
    if (!selectedBranchForStaff) return;
    setIsSavingStaff(true);

    const res = await assignStaffToBranchAction(selectedBranchForStaff, selectedStaffIds);
    setIsSavingStaff(false);

    if (res.success) {
      showToast("บันทึกการมอบหมายพนักงานสำเร็จ");
      setIsManageStaffModalOpen(false);
      loadBranches();
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด");
    }
  }

  function openManageTasksModal(branchId: string) {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;
    setSelectedBranchForTasks(branch.id);
    setSelectedTaskIds(branch.tasks || []);
    setIsManageTasksModalOpen(true);
  }

  async function handleSaveTasks() {
    if (!selectedBranchForTasks) return;
    setIsSavingTasks(true);
    const res = await assignTasksToBranchAction(selectedBranchForTasks, selectedTaskIds);
    if (res.success) {
      showToast("บันทึกการตั้งค่างานของสาขาสำเร็จ");
      await loadBranches();
      setIsManageTasksModalOpen(false);
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด");
    }
    setIsSavingTasks(false);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return showToast("กรุณาระบุชื่องาน");

    setIsCreatingTask(true);
    const res = await createTaskAction({
      name: newTaskName,
      task_role: newTaskRole,
      shift: newTaskShift,
      start: newTaskStart,
      end: newTaskEnd,
      disabled: false
    });
    setIsCreatingTask(false);

    if (res.success) {
      showToast("เพิ่มงานใหม่สำเร็จ");
      setIsCreateTaskModalOpen(false);
      setNewTaskName("");
      setNewTaskStart("");
      setNewTaskEnd("");
      loadTasks(); // reload from DB
    } else {
      showToast(res.error || "เกิดข้อผิดพลาด");
    }
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
    // TODO: implement updateUserRoleAction in the future
    showToast(`ปรับเปลี่ยนสิทธิ์ผู้ใช้เป็น ${newRole} สำเร็จ`);
  }

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredTasks = tasksList.filter((t) =>
    taskRoleFilter === "all" ? true : t.task_role === taskRoleFilter
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
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${activeTab === tab.id
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "active"
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
                                className={`h-full rounded-full ${b.todayCompletionRate === 100
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
                onClick={() => setIsNewBranchModalOpen(true)}
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "active"
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

                  <div className="pt-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => openManageStaffModal(b.id)}
                      className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-1 py-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer flex-1"
                    >
                      จัดการสาขา
                    </button>
                    <button
                      type="button"
                      onClick={() => openManageTasksModal(b.id)}
                      className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-100 bg-emerald-950 hover:bg-emerald-900 px-1 py-1.5 rounded-lg border border-emerald-900/50 transition-all cursor-pointer flex-1"
                    >
                      จัดการงาน
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
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${taskRoleFilter === f.id ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(true)}
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
                      <th className="py-3.5 px-3 text-right">สถานะระบบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">ไม่มีข้อมูล หรือ ไม่มีงานในตำแหน่งนี้</td>
                      </tr>
                    ) : (
                      filteredTasks.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-200 max-w-md">
                            <span className="font-mono text-slate-500 mr-2">{String(idx + 1).padStart(2, "0")}</span>
                            <span>{t.name}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px]">
                              {t.task_role === "cashier" ? "แคชเชียร์" : t.task_role === "stock" ? "สต็อก/จัดเรียง" : "ผู้ช่วยผจก."}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 capitalize">{t.shift === "morning" ? "กะเช้า" : t.shift === "afternoon" ? "กะบ่าย" : "ควบกะ"}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-400">{t.start ? `${t.start} - ${t.end}` : "ตามเวลาปฏิบัติการ"}</td>
                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold ${!t.disabled
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                            >
                              {!t.disabled ? "ทำงานได้" : "ปิดชั่วคราว"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === "admin" || u.role === "committee"
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
                            <option value="employee">Staff (พนักงานทั่วไป)</option>
                            <option value="manager_assistant">Assistant (ผู้ช่วยผู้จัดการร้าน)</option>
                            <option value="manager">Store Manager (ผู้จัดการร้าน)</option>
                            <option value="general_manager">General Manager (ผู้จัดการทั่วไป)</option>
                            <option value="committee">Committee (กรรมการบริหาร)</option>
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


        {/* MODALS */}
        {isNewBranchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-white text-lg">เพิ่มสาขาใหม่</h3>
                <button
                  type="button"
                  onClick={() => setIsNewBranchModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateBranch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">ชื่อสาขา (อย่างน้อย 3 ตัวอักษร)</label>
                    <input
                      type="text"
                      required
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="เช่น สาขาพญาไท"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewBranchModalOpen(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingBranch || newBranchName.length < 3}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
                    >
                      {isCreatingBranch ? "กำลังสร้าง..." : "บันทึกข้อมูลสาขา"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isManageStaffModalOpen && selectedBranchForStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-white text-lg">จัดการพนักงานและผู้จัดการสาขา</h3>
                <button
                  type="button"
                  onClick={() => setIsManageStaffModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Assigned Staff (Cards Stack) */}
                <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col bg-slate-900/50">
                  <div className="p-4 border-b border-slate-800">
                    <h4 className="font-semibold text-emerald-400">พนักงานประจำสาขานี้</h4>
                    <p className="text-xs text-slate-400">บุคลากรที่ถูกคัดเลือกและจัดตารางงานแล้ว</p>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Management Level */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-indigo-950/40 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-indigo-300">
                        ผู้จัดการร้าน (Manager)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && (u.role === "manager" || u.role === "general_manager")).length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && (u.role === "manager" || u.role === "general_manager")).map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assistant Level */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-purple-950/40 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-purple-300">
                        ผู้ช่วยผู้จัดการ (Assistant)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "manager_assistant").length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "manager_assistant").map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-slate-800 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-slate-300">
                        พนักงานทั่วไป (Staff)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "employee").length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "employee").map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                              <p className="text-[10px] text-slate-500">{user.position || "พนักงาน"}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Available Users (Searchable) */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="p-4 border-b border-slate-800">
                    <h4 className="font-semibold text-slate-200">รายชื่อพนักงานในระบบ</h4>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ หรืออีเมล..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {usersList
                      .filter(u => !selectedStaffIds.includes(u.id))
                      .filter(u => u.role === "manager" || u.role === "manager_assistant" || u.role === "employee")
                      .filter(u => u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(staffSearchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const rank = { manager: 1, manager_assistant: 2, employee: 3 };
                        const rankA = rank[a.role as keyof typeof rank] || 99;
                        const rankB = rank[b.role as keyof typeof rank] || 99;
                        return rankA - rankB;
                      })
                      .map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white leading-tight">{user.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{user.position || "พนักงาน"}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedStaffIds(prev => [...prev, user.id])}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            + เพิ่มเข้าสาขา
                          </button>
                        </div>
                      ))}
                    {usersList
                      .filter(u => !selectedStaffIds.includes(u.id))
                      .filter(u => u.role === "manager" || u.role === "manager_assistant" || u.role === "employee")
                      .filter(u => u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(staffSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-8">
                          ไม่พบรายชื่อพนักงาน หรือถูกเพิ่มเข้าสาขาหมดแล้ว
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManageStaffModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveStaff}
                  disabled={isSavingStaff}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  {isSavingStaff ? "กำลังบันทึก..." : "ยืนยันการตั้งค่าพนักงาน"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isManageTasksModalOpen && selectedBranchForTasks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-white text-lg">กำหนดขอบเขตงานของสาขา</h3>
                <button
                  type="button"
                  onClick={() => setIsManageTasksModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Assigned Tasks */}
                <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col bg-slate-900/50">
                  <div className="p-4 border-b border-slate-800">
                    <h4 className="font-semibold text-emerald-400">งานที่สาขานี้ต้องทำ</h4>
                    <p className="text-xs text-slate-400">รายการงานที่จะแสดงให้พนักงานในสาขาทำ</p>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Management Level */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-purple-950/40 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-purple-300">
                        ผู้ช่วยผู้จัดการ (Assistant)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "manager_assistant").length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "manager_assistant").map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level - Cashier */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-slate-800 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-emerald-300">
                        พนักงานแคชเชียร์ (Cashier)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "cashier").length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "cashier").map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level - Stock */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden">
                      <div className="bg-slate-800 border-b border-slate-700/50 px-3 py-2 text-xs font-bold text-amber-300">
                        พนักงานสต็อก (Stock)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "stock").length === 0 && (
                          <div className="text-xs text-slate-500 text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "stock").map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-400 text-xs px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Available Tasks (Searchable) */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="p-4 border-b border-slate-800">
                    <h4 className="font-semibold text-slate-200">งานทั้งหมดในระบบกลาง</h4>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่องาน..."
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {tasksList
                      .filter(t => !selectedTaskIds.includes(t.id))
                      .filter(t => t.name.toLowerCase().includes(taskSearchQuery.toLowerCase()))
                      .sort((a, b) => a.task_role.localeCompare(b.task_role))
                      .map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white leading-tight">{t.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{t.task_role} | กะ: {t.shift} | {t.start || "ตามกำหนด"}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskIds(prev => [...prev, t.id])}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0 ml-2"
                          >
                            + มอบหมาย
                          </button>
                        </div>
                      ))}
                    {tasksList
                      .filter(t => !selectedTaskIds.includes(t.id))
                      .filter(t => t.name.toLowerCase().includes(taskSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-8">
                          ไม่พบรายการงาน หรือถูกกำหนดเข้าสาขาหมดแล้ว
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManageTasksModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveTasks}
                  disabled={isSavingTasks}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  {isSavingTasks ? "กำลังบันทึก..." : "ยืนยันการตั้งค่างานสาขา"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-white text-lg">เพิ่มรายการงานใหม่ (Master Task)</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      ชื่อรายการงาน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="เช่น ทำความสะอาดจุดแคชเชียร์"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-full transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        ตำแหน่งงาน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newTaskRole}
                        onChange={(e) => setNewTaskRole(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-full transition-all"
                      >
                        <option value="cashier">แคชเชียร์</option>
                        <option value="stock">สต็อก / จัดเรียง</option>
                        <option value="manager_assistant">ผู้ช่วยผู้จัดการ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        กะงาน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newTaskShift}
                        onChange={(e) => setNewTaskShift(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-full transition-all"
                      >
                        <option value="morning">กะเช้า</option>
                        <option value="afternoon">กะบ่าย</option>
                        <option value="morning_afternoon">ควบกะ (เช้า-บ่าย)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        เวลาเริ่ม (Optional)
                      </label>
                      <input
                        type="time"
                        value={newTaskStart}
                        onChange={(e) => setNewTaskStart(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-full transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        เวลาสิ้นสุด (Optional)
                      </label>
                      <input
                        type="time"
                        value={newTaskEnd}
                        onChange={(e) => setNewTaskEnd(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-full transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateTaskModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isCreatingTask ? "กำลังบันทึก..." : "เพิ่มงาน"}
                  </button>
                </div>
              </form>
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
