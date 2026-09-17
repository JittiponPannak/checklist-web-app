import { useState, useEffect } from "react";
import { User } from "../../types";
import { BrandLogo } from "../common/BrandLogo";

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
  const [assignedTaskSearchQuery, setAssignedTaskSearchQuery] = useState("");
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
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  function togglePassword(userId: string) {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

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
    <div className="min-h-screen bg-[#FFFDF9] text-[#2B1413] flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#2B1413] text-amber-300 border border-amber-300/40 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl animate-fade-in flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-[#EADBCE] bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <BrandLogo size={36} showText={true} isDark={false} />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#EADBCE]">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-100 text-[#2B1413] border border-amber-300 px-2.5 py-1 rounded-md">
              System Admin Portal
            </span>
            <span className="text-xs text-[#78483B]">ระดับศูนย์กลางองค์กร</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#EADBCE]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#2B1413]">{user.name}</p>
              <p className="text-[11px] text-[#78483B]">{user.position || "ผู้ดูแลระบบส่วนกลาง"}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#2B1413] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-[#78483B] hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-[#EADBCE] transition-all font-semibold cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EADBCE] pb-4">
          <div className="flex items-center gap-1 bg-[#FAF4EC] p-1.5 rounded-2xl border border-[#EADBCE] text-xs font-semibold">
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
                  ? "bg-[#2B1413] text-amber-300 shadow-sm font-bold"
                  : "text-[#78483B] hover:text-[#2B1413] hover:bg-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs text-[#78483B] font-mono">DB Pooler: Connected</span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#EADBCE] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78483B]">สาขาที่เปิดทำการ</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Online 100%
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#2B1413] font-mono">{branches.filter(b => b.status === "active").length}</span>
                  <span className="text-xs text-[#A88B77]">/ {branches.length} สาขาทั่วประเทศ</span>
                </div>
              </div>

              <div className="bg-white border border-[#EADBCE] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78483B]">อัตราการเช็คลิสต์รวมวันนี้</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    ทั่วประเทศ
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-700 font-mono">96.5%</span>
                  <span className="text-xs text-emerald-600 font-semibold">+2.1% จากสัปดาห์ก่อน</span>
                </div>
              </div>

              <div className="bg-white border border-[#EADBCE] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78483B]">พนักงานในระบบทั้งหมด</span>
                  <span className="text-[10px] font-bold text-[#78483B] bg-[#FAF4EC] px-2 py-0.5 rounded-full border border-[#EADBCE]">
                    Active
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#2B1413] font-mono">{usersList.length || 8}</span>
                  <span className="text-xs text-[#A88B77]">บัญชีผู้ใช้งาน</span>
                </div>
              </div>

              <div className="bg-white border border-[#EADBCE] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#78483B]">ระบบฐานข้อมูล Supabase</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Healthy
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#2B1413]">PostgreSQL 15</span>
                  <span className="text-xs text-[#A88B77] font-mono">24ms Ping</span>
                </div>
              </div>
            </div>

            {/* Quick Status Table */}
            <div className="bg-white border border-[#EADBCE] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#2B1413]">สรุปผลการปฏิบัติงานรายสาขาประจำวัน</h3>
                  <p className="text-xs text-[#78483B]">แสดงข้อมูลความคืบหน้าการเช็คลิสต์ของทุกสาขาแบบเรียลไทม์</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("branches")}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold transition-colors cursor-pointer"
                >
                  จัดการสาขาทั้งหมด →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EADBCE] text-[#78483B] font-semibold bg-[#FAF4EC]">
                    <tr>
                      <th className="py-3 px-3 rounded-l-lg">รหัสสาขา</th>
                      <th className="py-3 px-3">ชื่อสาขา</th>
                      <th className="py-3 px-3">ผู้จัดการประจำสาขา</th>
                      <th className="py-3 px-3">พนักงาน</th>
                      <th className="py-3 px-3">สถานะ</th>
                      <th className="py-3 px-3 text-right rounded-r-lg">ความคืบหน้า Checklist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/70">
                    {branches.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-700">{b.code}</td>
                        <td className="py-3 px-3 font-semibold text-[#2B1413]">{b.name}</td>
                        <td className="py-3 px-3 text-[#78483B]">{b.managerName}</td>
                        <td className="py-3 px-3 text-[#78483B] font-mono">{b.staffCount} คน</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                          >
                            {b.status === "active" ? "เปิดปกติ" : "รอเปิด"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-[#F2E7DC] rounded-full overflow-hidden border border-[#EADBCE]">
                              <div
                                className={`h-full rounded-full ${b.todayCompletionRate === 100
                                  ? "bg-emerald-500"
                                  : b.todayCompletionRate > 80
                                    ? "bg-amber-400"
                                    : "bg-[#C9B29F]"
                                  }`}
                                style={{ width: `${b.todayCompletionRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[#2B1413] w-10 text-right">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#EADBCE] p-4 rounded-2xl shadow-sm">
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="ค้นหาชื่อสาขา หรือรหัสสาขา..."
                className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 w-full sm:w-80"
              />
              <button
                type="button"
                onClick={() => setIsNewBranchModalOpen(true)}
                className="bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>+ เพิ่มสาขาใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map((b) => (
                <div key={b.id} className="bg-white border border-[#EADBCE] rounded-2xl p-5 space-y-4 hover:border-amber-400 shadow-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {b.code}
                      </span>
                      <h4 className="text-base font-bold text-[#2B1413] mt-1.5">{b.name}</h4>
                      <p className="text-xs text-[#78483B]">{b.location}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                    >
                      {b.status === "active" ? "เปิดทำการ" : "Standby"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#EADBCE] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[#A88B77]">ผู้จัดการสาขา</p>
                      <p className="font-semibold text-[#2B1413] mt-0.5">{b.managerName}</p>
                    </div>
                    <div>
                      <p className="text-[#A88B77]">จำนวนพนักงาน</p>
                      <p className="font-semibold text-[#2B1413] mt-0.5">{b.staffCount} คน</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openManageStaffModal(b.id)}
                      className="text-[11px] font-semibold text-[#2B1413] hover:text-[#442220] bg-[#FAF4EC] hover:bg-[#F2E7DC] px-2 py-1.5 rounded-lg border border-[#EADBCE] transition-all cursor-pointer flex-1"
                    >
                      จัดการสาขา
                    </button>
                    <button
                      type="button"
                      onClick={() => openManageTasksModal(b.id)}
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-lg border border-amber-200 transition-all cursor-pointer flex-1"
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#EADBCE] p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 bg-[#FAF4EC] p-1 rounded-xl border border-[#EADBCE] text-xs font-semibold">
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
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${taskRoleFilter === f.id ? "bg-[#2B1413] text-amber-300 font-bold" : "text-[#78483B] hover:text-[#2B1413]"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                + เพิ่มรายการงานใหม่
              </button>
            </div>

            <div className="bg-white border border-[#EADBCE] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EADBCE] text-[#78483B] font-semibold bg-[#FAF4EC]">
                    <tr>
                      <th className="py-3.5 px-4">รายการงาน (Master Task)</th>
                      <th className="py-3.5 px-3">ตำแหน่งงาน</th>
                      <th className="py-3.5 px-3">กะงาน</th>
                      <th className="py-3.5 px-3">ช่วงเวลา</th>
                      <th className="py-3.5 px-3 text-right">สถานะระบบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/70">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#A88B77]">ไม่มีข้อมูล หรือ ไม่มีงานในตำแหน่งนี้</td>
                      </tr>
                    ) : (
                      filteredTasks.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-[#FFFDF9] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-[#2B1413] max-w-md">
                            <span className="font-mono text-[#A88B77] mr-2">{String(idx + 1).padStart(2, "0")}</span>
                            <span>{t.name}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF4EC] text-[#78483B] border border-[#EADBCE] font-semibold text-[11px]">
                              {t.task_role === "cashier" ? "แคชเชียร์" : t.task_role === "stock" ? "สต็อก/จัดเรียง" : "ผู้ช่วยผจก."}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-[#78483B] capitalize">{t.shift === "morning" ? "กะเช้า" : t.shift === "afternoon" ? "กะบ่าย" : "ควบกะ"}</td>
                          <td className="py-3.5 px-3 font-mono text-[#78483B]">{t.start ? `${t.start} - ${t.end}` : "ตามเวลาปฏิบัติการ"}</td>
                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold ${!t.disabled
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-[#FAF4EC] text-[#A88B77] border border-[#EADBCE]"
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#EADBCE] p-4 rounded-2xl shadow-sm">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ใช้งาน, อีเมล หรือตำแหน่ง..."
                className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-3.5 py-2 text-xs text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 w-full sm:w-80"
              />

              <button
                type="button"
                onClick={() => showToast("เปิดแบบฟอร์มสร้างบัญชีผู้ใช้งานใหม่")}
                className="bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                + เพิ่มผู้ใช้ใหม่
              </button>
            </div>

            <div className="bg-white border border-[#EADBCE] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#EADBCE] text-[#78483B] font-semibold bg-[#FAF4EC]">
                    <tr>
                      <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                      <th className="py-3.5 px-3">อีเมล</th>
                      <th className="py-3.5 px-3">รหัสผ่าน</th>
                      <th className="py-3.5 px-3">บทบาทระบบ (Role)</th>
                      <th className="py-3.5 px-3">ตำแหน่งที่กำหนด</th>
                      <th className="py-3.5 px-3 text-right">ปรับเปลี่ยนสิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBCE]/70">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#2B1413] flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FAF4EC] border border-[#EADBCE] flex items-center justify-center text-[10px] text-[#78483B]">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[#78483B]">{u.email}</td>
                        <td className="py-3.5 px-3 font-mono text-[#78483B]">
                          <div className="flex items-center gap-2">
                            <span>
                              {visiblePasswords.has(u.id) ? (u.password || "ไม่มีรหัสผ่าน") : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePassword(u.id)}
                              className="text-[#A88B77] hover:text-amber-700 cursor-pointer"
                              title={visiblePasswords.has(u.id) ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                            >
                              {visiblePasswords.has(u.id) ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === "admin" || u.role === "committee"
                              ? "bg-amber-100 text-[#2B1413] border border-amber-300"
                              : u.role === "manager"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-[#FAF4EC] text-[#78483B] border border-[#EADBCE]"
                              }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#78483B]">{u.position || "-"}</td>
                        <td className="py-3.5 px-3 text-right">
                          <select
                            value={u.role}
                            disabled={u.role === "admin"}
                            onChange={(e) => handlePromoteUser(u.id, e.target.value)}
                            className="bg-[#FAF4EC] border border-[#EADBCE] rounded-lg px-2.5 py-1 text-xs text-[#2B1413] focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#EADBCE] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#EADBCE] flex justify-between items-center bg-[#FAF4EC]">
                <h3 className="font-bold text-[#2B1413] text-lg">เพิ่มสาขาใหม่</h3>
                <button
                  type="button"
                  onClick={() => setIsNewBranchModalOpen(false)}
                  className="text-[#78483B] hover:text-[#2B1413] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateBranch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#78483B] mb-1.5">ชื่อสาขา (อย่างน้อย 3 ตัวอักษร)</label>
                    <input
                      type="text"
                      required
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="เช่น สาขาพญาไท"
                      className="w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-3 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewBranchModalOpen(false)}
                      className="flex-1 py-3 bg-[#FAF4EC] hover:bg-[#F2E7DC] text-[#78483B] border border-[#EADBCE] rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingBranch || newBranchName.length < 3}
                      className="flex-1 py-3 bg-[#2B1413] hover:bg-[#442220] disabled:opacity-50 disabled:cursor-not-allowed text-amber-300 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#EADBCE] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#EADBCE] flex justify-between items-center bg-[#FAF4EC]">
                <h3 className="font-bold text-[#2B1413] text-lg">จัดการพนักงานและผู้จัดการสาขา</h3>
                <button
                  type="button"
                  onClick={() => setIsManageStaffModalOpen(false)}
                  className="text-[#78483B] hover:text-[#2B1413] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Assigned Staff (Cards Stack) */}
                <div className="w-full md:w-1/2 border-r border-[#EADBCE] flex flex-col bg-[#FFFDF9]">
                  <div className="p-4 border-b border-[#EADBCE]">
                    <h4 className="font-semibold text-emerald-700">พนักงานประจำสาขานี้</h4>
                    <p className="text-xs text-[#78483B]">บุคลากรที่ถูกคัดเลือกและจัดตารางงานแล้ว</p>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Management Level */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-amber-50 border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-amber-800">
                        ผู้จัดการร้าน (Manager)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && (u.role === "manager" || u.role === "general_manager")).length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && (u.role === "manager" || u.role === "general_manager")).map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{user.name}</p>
                              <p className="text-[10px] text-[#A88B77] mt-0.5">{user.email}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assistant Level */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-amber-100/60 border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-[#2B1413]">
                        ผู้ช่วยผู้จัดการ (Assistant)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "manager_assistant").length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "manager_assistant").map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{user.name}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-[#FAF4EC] border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-[#78483B]">
                        พนักงานทั่วไป (Staff)
                      </div>
                      <div className="p-2 space-y-1">
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "employee").length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ยังไม่มีบุคลากร</div>
                        )}
                        {usersList.filter(u => selectedStaffIds.includes(u.id) && u.role === "employee").map((user) => (
                          <div key={user.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{user.name}</p>
                              <p className="text-[10px] text-[#A88B77]">{user.position || "พนักงาน"}</p>
                            </div>
                            <button onClick={() => setSelectedStaffIds(prev => prev.filter(id => id !== user.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Available Users (Searchable) */}
                <div className="w-full md:w-1/2 flex flex-col bg-white">
                  <div className="p-4 border-b border-[#EADBCE]">
                    <h4 className="font-semibold text-[#2B1413]">รายชื่อพนักงานในระบบ</h4>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ หรืออีเมล..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="mt-2 w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-lg px-3 py-2 text-sm text-[#2B1413] focus:outline-none focus:border-amber-400 transition-colors"
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
                        <div key={user.id} className="flex justify-between items-center p-3 rounded-xl border border-[#EADBCE] bg-white hover:border-amber-400 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-[#2B1413] leading-tight">{user.name}</div>
                            <div className="text-[10px] text-[#A88B77] mt-0.5">{user.position || "พนักงาน"}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedStaffIds(prev => [...prev, user.id])}
                            className="bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs"
                          >
                            + เพิ่มเข้าสาขา
                          </button>
                        </div>
                      ))}
                    {usersList
                      .filter(u => !selectedStaffIds.includes(u.id))
                      .filter(u => u.role === "manager" || u.role === "manager_assistant" || u.role === "employee")
                      .filter(u => u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(staffSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center text-[#A88B77] text-sm py-8">
                          ไม่พบรายชื่อพนักงาน หรือถูกเพิ่มเข้าสาขาหมดแล้ว
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-[#EADBCE] bg-[#FAF4EC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManageStaffModalOpen(false)}
                  className="px-6 py-2.5 bg-white hover:bg-[#F2E7DC] text-[#78483B] border border-[#EADBCE] rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveStaff}
                  disabled={isSavingStaff}
                  className="px-6 py-2.5 bg-[#2B1413] hover:bg-[#442220] disabled:opacity-50 text-amber-300 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSavingStaff ? "กำลังบันทึก..." : "ยืนยันการตั้งค่าพนักงาน"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isManageTasksModalOpen && selectedBranchForTasks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#EADBCE] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#EADBCE] flex justify-between items-center bg-[#FAF4EC]">
                <h3 className="font-bold text-[#2B1413] text-lg">กำหนดขอบเขตงานของสาขา</h3>
                <button
                  type="button"
                  onClick={() => setIsManageTasksModalOpen(false)}
                  className="text-[#78483B] hover:text-[#2B1413] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Assigned Tasks */}
                <div className="w-full md:w-1/2 border-r border-[#EADBCE] flex flex-col bg-[#FFFDF9]">
                  <div className="p-4 border-b border-[#EADBCE]">
                    <h4 className="font-semibold text-emerald-700">งานที่สาขานี้ต้องทำ</h4>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่องานที่มอบหมายแล้ว..."
                      value={assignedTaskSearchQuery}
                      onChange={(e) => setAssignedTaskSearchQuery(e.target.value)}
                      className="mt-2 w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-lg px-3 py-2 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Management Level */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-amber-100/60 border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-[#2B1413]">
                        ผู้ช่วยผู้จัดการ (Assistant)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "manager_assistant" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "manager_assistant" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{t.name}</p>
                              <p className="text-[10px] text-[#A88B77] mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level - Cashier */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-[#FAF4EC] border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-emerald-700">
                        พนักงานแคชเชียร์ (Cashier)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "cashier" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "cashier" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{t.name}</p>
                              <p className="text-[10px] text-[#A88B77] mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff Level - Stock */}
                    <div className="bg-white border border-[#EADBCE] rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-[#FAF4EC] border-b border-[#EADBCE] px-3 py-2 text-xs font-bold text-amber-800">
                        พนักงานสต็อก (Stock)
                      </div>
                      <div className="p-2 space-y-1">
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "stock" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).length === 0 && (
                          <div className="text-xs text-[#A88B77] text-center py-2">ไม่มีระบบงาน</div>
                        )}
                        {tasksList.filter(t => selectedTaskIds.includes(t.id) && t.task_role === "stock" && t.name.toLowerCase().includes(assignedTaskSearchQuery.toLowerCase())).map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-[#FAF4EC] border border-[#EADBCE]">
                            <div>
                              <p className="text-sm font-bold text-[#2B1413] leading-tight">{t.name}</p>
                              <p className="text-[10px] text-[#A88B77] mt-0.5">{t.shift} | {t.start || "ตามกำหนด"}</p>
                            </div>
                            <button onClick={() => setSelectedTaskIds(prev => prev.filter(id => id !== t.id))} className="text-rose-700 text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 font-semibold cursor-pointer">นำออก</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Available Tasks (Searchable) */}
                <div className="w-full md:w-1/2 flex flex-col bg-white">
                  <div className="p-4 border-b border-[#EADBCE]">
                    <h4 className="font-semibold text-[#2B1413]">งานทั้งหมดในระบบกลาง</h4>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่องาน..."
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="mt-2 w-full bg-[#FAF4EC] border border-[#EADBCE] rounded-lg px-3 py-2 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-2">
                    {tasksList
                      .filter(t => !selectedTaskIds.includes(t.id))
                      .filter(t => t.name.toLowerCase().includes(taskSearchQuery.toLowerCase()))
                      .sort((a, b) => a.task_role.localeCompare(b.task_role))
                      .map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 rounded-xl border border-[#EADBCE] bg-white hover:border-amber-400 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-[#2B1413] leading-tight">{t.name}</div>
                            <div className="text-[10px] text-[#A88B77] mt-0.5">{t.task_role} | กะ: {t.shift} | {t.start || "ตามกำหนด"}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskIds(prev => [...prev, t.id])}
                            className="bg-[#2B1413] hover:bg-[#442220] text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0 ml-2 shadow-xs"
                          >
                            + มอบหมาย
                          </button>
                        </div>
                      ))}
                    {tasksList
                      .filter(t => !selectedTaskIds.includes(t.id))
                      .filter(t => t.name.toLowerCase().includes(taskSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center text-[#A88B77] text-sm py-8">
                          ไม่พบรายการงาน หรือถูกกำหนดเข้าสาขาหมดแล้ว
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-4 border-t border-[#EADBCE] bg-[#FAF4EC] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManageTasksModalOpen(false)}
                  className="px-6 py-2.5 bg-white hover:bg-[#F2E7DC] text-[#78483B] border border-[#EADBCE] rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveTasks}
                  disabled={isSavingTasks}
                  className="px-6 py-2.5 bg-[#2B1413] hover:bg-[#442220] disabled:opacity-50 text-amber-300 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSavingTasks ? "กำลังบันทึก..." : "ยืนยันการตั้งค่างานสาขา"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white border border-[#EADBCE] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#EADBCE] flex justify-between items-center bg-[#FAF4EC]">
                <h3 className="font-bold text-[#2B1413] text-lg">เพิ่มรายการงานใหม่ (Master Task)</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="text-[#78483B] hover:text-[#2B1413] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#78483B] mb-1.5">
                      ชื่อรายการงาน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="เช่น ทำความสะอาดจุดแคชเชียร์"
                      className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-2.5 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 w-full transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#78483B] mb-1.5">
                        ตำแหน่งงาน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newTaskRole}
                        onChange={(e) => setNewTaskRole(e.target.value as any)}
                        className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-2.5 text-sm text-[#2B1413] focus:outline-none focus:border-amber-400 w-full transition-all cursor-pointer"
                      >
                        <option value="cashier">แคชเชียร์</option>
                        <option value="stock">สต็อก / จัดเรียง</option>
                        <option value="manager_assistant">ผู้ช่วยผู้จัดการ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#78483B] mb-1.5">
                        กะงาน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newTaskShift}
                        onChange={(e) => setNewTaskShift(e.target.value as any)}
                        className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-2.5 text-sm text-[#2B1413] focus:outline-none focus:border-amber-400 w-full transition-all cursor-pointer"
                      >
                        <option value="morning">กะเช้า</option>
                        <option value="afternoon">กะบ่าย</option>
                        <option value="morning_afternoon">ควบกะ (เช้า-บ่าย)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#78483B] mb-1.5">
                        เวลาเริ่ม (Optional)
                      </label>
                      <input
                        type="time"
                        value={newTaskStart}
                        onChange={(e) => setNewTaskStart(e.target.value)}
                        className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-2.5 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 w-full transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#78483B] mb-1.5">
                        เวลาสิ้นสุด (Optional)
                      </label>
                      <input
                        type="time"
                        value={newTaskEnd}
                        onChange={(e) => setNewTaskEnd(e.target.value)}
                        className="bg-[#FAF4EC] border border-[#EADBCE] rounded-xl px-4 py-2.5 text-sm text-[#2B1413] placeholder:text-[#A88B77] focus:outline-none focus:border-amber-400 w-full transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[#EADBCE] bg-[#FAF4EC] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateTaskModalOpen(false)}
                    className="px-6 py-2.5 bg-white hover:bg-[#F2E7DC] text-[#78483B] border border-[#EADBCE] rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="px-6 py-2.5 bg-[#2B1413] hover:bg-[#442220] disabled:opacity-50 text-amber-300 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
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
      <footer className="border-t border-[#EADBCE] bg-[#FAF4EC] py-3 text-center text-xs text-[#78483B]">
        Eater Egg Fresh Mart • Central Enterprise Administration Portal v2.0
      </footer>
    </div>
  );
}
