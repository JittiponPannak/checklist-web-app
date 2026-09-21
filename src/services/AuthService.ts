import { eq, sql } from "drizzle-orm";
import { users, branches } from "../db/schema";
import { IAuthService } from "./types";
import { User, Role } from "../types";

const INITIAL_USERS: Array<{
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'committee' | 'general_manager' | 'manager' | 'manager_assistant' | 'employee';
  position?: string;
}> = [
  { name: "คุณวิภาดา สุขเจริญ", email: "manager@factory.com", password: "manager123", role: "manager", position: "ผู้จัดการร้าน" },
  { name: "คุณกิตติศักดิ์ พัฒนกิจ", email: "director@factory.com", password: "director123", role: "committee", position: "กรรมการ" },
  { name: "คุณธนากร เกียรติไพบูลย์", email: "assistant@factory.com", password: "123", role: "manager_assistant", position: "ผู้ช่วยผู้จัดการร้าน" },
  { name: "คุณอนุรักษ์ วงศ์สวัสดิ์", email: "manager2@factory.com", password: "manager123", role: "manager", position: "ผู้จัดการร้าน" },
  { name: "คุณพรทิพย์ สุขเจริญ", email: "asst@factory.com", password: "123", role: "manager_assistant", position: "ผู้ช่วยผู้จัดการร้าน" },
  { name: "สมศรี ใจดี", email: "cashier@factory.com", password: "123", role: "employee", position: "แคชเชียร์" },
  { name: "สมชาย มั่นคง", email: "stock@factory.com", password: "123", role: "employee", position: "พนักงานสต็อก/จัดเรียง" },
  { name: "กัญญาภัทร พิมพา", email: "kanya@factory.com", password: "123", role: "employee", position: "แคชเชียร์" },
  { name: "ศุภชัย มีสุข", email: "suphachai@factory.com", password: "123", role: "employee", position: "พนักงานทั่วไป" },
  { name: "คุณสมเกียรติ บริหารกิจ", email: "admin@factory.com", password: "admin123", role: "admin", position: "ผู้ดูแลระบบส่วนกลาง" },
];

export class AuthService implements IAuthService {
  constructor(private db: any, private supabaseServerClient?: any) {}

  async seedUsersIfEmpty(): Promise<void> {
    try {
      const existing = await this.db.select({ id: users.id }).from(users).limit(1);
      if (existing.length === 0) {
        await this.db.insert(users).values(
          INITIAL_USERS.map((u) => ({
            name: u.name,
            email: u.email.toLowerCase(),
            password: u.password,
            role: u.role,
          }))
        );
        console.log("Seeded initial users to database.");
      }
    } catch (err) {
      console.error("seedUsersIfEmpty error:", err);
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
    }

    try {
      await this.seedUsersIfEmpty();

      const result = await this.db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, cleanEmail))
        .limit(1);

      if (result.length === 0) {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }

      const foundUser = result[0];

      if (foundUser.password && foundUser.password !== cleanPassword) {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }

      // Update last_login
      await this.db
        .update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, foundUser.id));

      let defaultPosition: string | undefined = undefined;
      if (foundUser.role === "manager") defaultPosition = "ผู้จัดการร้าน";
      else if (foundUser.role === "committee") defaultPosition = "กรรมการ";
      else if (foundUser.role === "manager_assistant") defaultPosition = "ผู้ช่วยผู้จัดการร้าน";
      else if (foundUser.role === "admin") defaultPosition = "ผู้ดูแลระบบส่วนกลาง";

      const branchQuery = await this.db
        .select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(sql`${foundUser.id} = ANY(${branches.members})`)
        .limit(1);

      const branchName = branchQuery.length > 0 ? branchQuery[0].name : undefined;
      const branchId = branchQuery.length > 0 ? branchQuery[0].id : undefined;

      const userObj: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role as Role,
        position: defaultPosition,
        branchName,
        branchId,
        point: foundUser.point || 0,
        pointStreak: foundUser.point_streak || 0,
        pointStreakType: foundUser.point_streak_type as any,
        longestStreak: foundUser.longest_streak || 0,
      };

      return { success: true, user: userObj };
    } catch (err: any) {
      console.error("AuthService.login error:", err);
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง" };
    }
  }

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role?: Role;
    position?: string;
    branchId?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password ? data.password.trim() : null;

    let dbRole: Role = "employee";
    if (data.role === "manager") {
      if (data.position?.includes("กรรมการ")) dbRole = "committee";
      else if (data.position?.includes("ผู้ช่วย")) dbRole = "manager_assistant";
      else dbRole = "manager";
    } else if (data.role) {
      dbRole = data.role;
    }

    if (!cleanName || !cleanEmail) {
      return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
    }

    try {
      const existing = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(sql`lower(${users.email})`, cleanEmail))
        .limit(1);

      if (existing.length > 0) {
        return { success: false, error: "อีเมลนี้มีผู้ใช้งานแล้วในระบบ" };
      }

      const [created] = await this.db
        .insert(users)
        .values({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: dbRole as any,
          last_login: new Date(),
        })
        .returning();

      let assignedBranchName: string | undefined = undefined;
      if (data.branchId) {
        const targetBranch = await this.db
          .select()
          .from(branches)
          .where(eq(branches.id, data.branchId))
          .limit(1);

        if (targetBranch.length > 0) {
          assignedBranchName = targetBranch[0].name;
          const currentMembers = targetBranch[0].members || [];
          await this.db
            .update(branches)
            .set({
              members: [...currentMembers, created.id],
            })
            .where(eq(branches.id, data.branchId));
        }
      }

      const isManagement = ["admin", "committee", "general_manager", "manager", "manager_assistant"].includes(
        created.role
      );

      const userObj: User = {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role as Role,
        position: isManagement ? data.position ?? "ผู้จัดการร้าน" : undefined,
        branchName: assignedBranchName,
        branchId: data.branchId,
        point: 0,
        pointStreak: 0,
        pointStreakType: "none",
        longestStreak: 0,
      };

      return { success: true, user: userObj };
    } catch (err: any) {
      console.error("AuthService.register error:", err);
      return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล" };
    }
  }

  async getUserById(id: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!id) return { success: false, error: "ไม่มีรหัสผู้ใช้งาน" };

    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return { success: false, error: "ไม่พบผู้ใช้งาน" };
      }

      const foundUser = result[0];

      let defaultPosition: string | undefined = undefined;
      if (foundUser.role === "manager") defaultPosition = "ผู้จัดการร้าน";
      else if (foundUser.role === "committee") defaultPosition = "กรรมการ";
      else if (foundUser.role === "manager_assistant") defaultPosition = "ผู้ช่วยผู้จัดการร้าน";
      else if (foundUser.role === "admin") defaultPosition = "ผู้ดูแลระบบส่วนกลาง";

      const branchQuery = await this.db
        .select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(sql`${foundUser.id} = ANY(${branches.members})`)
        .limit(1);

      const branchName = branchQuery.length > 0 ? branchQuery[0].name : undefined;
      const branchId = branchQuery.length > 0 ? branchQuery[0].id : undefined;

      const userObj: User = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role as Role,
        position: defaultPosition,
        branchName,
        branchId,
        point: foundUser.point || 0,
        pointStreak: foundUser.point_streak || 0,
        pointStreakType: foundUser.point_streak_type as any,
        longestStreak: foundUser.longest_streak || 0,
      };

      return { success: true, user: userObj };
    } catch (err: any) {
      console.error("AuthService.getUserById error:", err);
      return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" };
    }
  }

  async getAllUsers(): Promise<{ success: boolean; users?: User[]; error?: string }> {
    try {
      const allUsers = await this.db.select().from(users);
      const allBranches = await this.db.select().from(branches);

      const formatted: User[] = allUsers.map((u: any) => {
        let defaultPosition: string | undefined = undefined;
        if (u.role === "manager") defaultPosition = "ผู้จัดการร้าน";
        else if (u.role === "committee") defaultPosition = "กรรมการ";
        else if (u.role === "manager_assistant") defaultPosition = "ผู้ช่วยผู้จัดการร้าน";
        else if (u.role === "admin") defaultPosition = "ผู้ดูแลระบบส่วนกลาง";

        const userBranch = allBranches.find(
          (b: any) => Array.isArray(b.members) && b.members.includes(u.id)
        );

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as Role,
          position: defaultPosition,
          branchName: userBranch ? userBranch.name : undefined,
          branchId: userBranch ? userBranch.id : undefined,
          point: u.point || 0,
          pointStreak: u.point_streak || 0,
          pointStreakType: u.point_streak_type as any,
          longestStreak: u.longest_streak || 0,
        };
      });

      return { success: true, users: formatted };
    } catch (err: any) {
      console.error("AuthService.getAllUsers error:", err);
      return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน" };
    }
  }

  async syncOAuthUser(userData: {
    id: string;
    email: string;
    name?: string;
    role?: Role;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = userData.email.trim().toLowerCase();
      const displayName = userData.name || cleanEmail.split("@")[0] || "ผู้ใช้งาน";

      // 1. Check if user with this email or id already exists
      const [existing] = await this.db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${cleanEmail}`)
        .limit(1);

      if (existing) {
        // Update last_login
        await this.db
          .update(users)
          .set({ last_login: new Date() })
          .where(eq(users.id, existing.id));

        return this.getUserById(existing.id);
      }

      // 2. Insert new OAuth user with the Supabase auth ID
      const [created] = await this.db
        .insert(users)
        .values({
          id: userData.id,
          name: displayName,
          email: cleanEmail,
          password: null,
          role: (userData.role as any) || "employee",
          last_login: new Date(),
        })
        .returning();

      return this.getUserById(created.id);
    } catch (err: any) {
      console.error("AuthService.syncOAuthUser error:", err);
      return { success: false, error: err?.message || "Failed to sync OAuth user" };
    }
  }
}
