import { boolean, date, integer, pgEnum, pgTable, timestamp, varchar, time, uuid, text } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', ['admin', 'committee', 'general_manager', 'manager', 'manager_assistant', 'employee']);
export const taskRoleEnum = pgEnum('task_role', ['manager_assistant', 'cashier', 'stock']);
export const shiftEnum = pgEnum('shift', ['morning', 'afternoon', 'morning_afternoon']);

export const users = pgTable.withRLS("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    role: roleEnum("role").notNull(),
    point: integer("point").notNull().default(0),

    last_login: timestamp("last_login"),
})

export const tasks = pgTable.withRLS("tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    shift: shiftEnum("shift").notNull(),
    name: text("name").notNull(),
    task_role: taskRoleEnum("task_role").notNull(),

    start: time("start_time").notNull(),
    end: time("end_time").notNull(),

    disabled: boolean("disabled").notNull().default(false),
})

export const shiftSession = pgTable.withRLS("shift_session", {
    id: uuid("id").primaryKey().defaultRandom(),
    user: uuid("user_id").notNull().references(() => users.id),
    branch: uuid("branch_id").notNull().references(() => branches.id),
    task_role: taskRoleEnum("task_role").notNull(),
    shift: shiftEnum("shift").notNull(),

    start: timestamp("start_timestamp").notNull(),
    end: timestamp("end_timestamp"),
})

export const taskWork = pgTable.withRLS("task_work", {
    id: uuid("id").primaryKey().defaultRandom(),
    task: uuid("task_id").notNull().references(() => tasks.id),
    shift_session: uuid("shift_session_id").notNull().references(() => shiftSession.id),
    comment: text("comment"),

    timestamp: timestamp("timestamp"),
    manager_assistance_approve_timestamp: timestamp("manager_assistance_approve_timestamp"),
    manager_approve_timestamp: timestamp("manager_approve_timestamp"),
})

export const refrigerators = pgTable.withRLS("refrigerators", {
    id: uuid("id").primaryKey().defaultRandom(),
    target_temperature: integer("target_temperature").notNull(),
});

export const refrigeratorCheck = pgTable.withRLS("refrigerator_check", {
    id: uuid("id").primaryKey().defaultRandom(),
    refrigerator: uuid("task_id").notNull().references(() => refrigerators.id),
    shift_session: uuid("shift_session_id").notNull().references(() => shiftSession.id),
    is_okay: boolean("is_okay").notNull(),
    comment: text("comment"),

    timestamp: timestamp("timestamp"),
})

export const branches = pgTable.withRLS("branches", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    members: uuid("member_ids").array().notNull().default([]),
    tasks: uuid("task_ids").array().notNull().default([]),
    refrigerators: uuid("refrigerators").array().notNull().default([]),

    last_update: timestamp("last_update").default(new Date()),
});

/*
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text("name").notNull(),
    to_roles: roleEnum("to_roles").array().notNull().default([]),
    seen: uuid("seen_ids").array().notNull().default([]),
    branch: uuid("id").references(() => branches.id)
});
*/