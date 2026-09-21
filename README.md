# Eater Egg Fresh Mart - Operations & Audit Portal

A comprehensive digital checklist, SOP (Standard Operating Procedure), gamification, and branch audit platform built for **Eater Egg Fresh Mart**. Developed with Next.js App Router, Supabase, and Drizzle ORM, this platform replaces traditional paper logs with a real-time, role-based operational workflow.

---

## 🚀 Key Features

### 1. 📋 Digital Shift Checklists & SOP
- **Shift Routines**: Tailored checklist templates for Morning (`กะเช้า`), Afternoon (`กะบ่าย`), and Full-day shifts.
- **Role-specific Duties**: Custom tasks per staff role (Cashier, Stock/Merchandiser, QC, Assistant Manager).
- **Automated Deadline & Lateness Tracking**: Evaluates checklist timestamps against task time windows, highlighting delayed tasks with a red `(ล่าช้า)` (Late) badge.
- **User-Isolated State**: Clean, per-user state management ensuring separate shift sessions and checklists when switching accounts on shared devices.

### 2. 🔔 Realtime Notification System
- **Supabase Realtime Push**: Instant Postgres changes subscription (`notifications` table) updating bell counts and alerts without manual refreshes.
- **Shift Lifecycle Alerts**:
  - **Shift Started**: Alerts employee upon commencing work.
  - **Checklist 100% Completed**: Reminds employee to submit and alerts branch management.
  - **Shift Ended & Submitted**: Dispatches submission report to managers.
  - **Assistant Manager Verification**: Notifies employee of preliminary review and routes task to the **Store Manager** for final sign-off.
  - **Manager Final Approval**: Rewards points and alerts employee.

### 3. 🎮 Gamification: Points, Streaks & Leaderboards
- **Points Economy**: Earn points for timely shift completions, zero-late checklist items, and streak milestones.
- **Daily Streaks**: Maintains streak status (Perfect vs. Flawed) and awards tier badges.
- **Branch & Global Leaderboard**: Real-time rank tracking to motivate staff engagement.

### 4. ❄️ Refrigerator & Cold Chain Temperature Control
- Dedicated temperature logging for chillers and freezers (0°C – 4°C standard).
- Visual warning indicators and alerts for temperature deviations.

### 5. 🛡️ Executive, Manager & Central Audit Portal
- **Role Hierarchy**:
  - **Employee**: Completes daily assigned routines.
  - **Assistant Manager (`manager_assistant`)**: Preliminary task verification.
  - **Store Manager (`manager`)**: Final approval and branch oversight.
  - **General Manager / Committee / Central Admin**: Multi-branch audit, user management, branch creation, task assignment, and compliance reporting.
- **Deep Audit History & Calendar Selection**: Rolling 14-day cached operational history paired with an arbitrary date-picker for database audit queries.
- **Strict Thailand Timezone Enforcement**: Bounded to `Asia/Bangkok` (UTC+7) across all shift evaluations.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Modern Design Tokens (High-contrast, accessible UI)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Realtime**: `@supabase/ssr` / `@supabase/supabase-js` Channel Subscriptions
- **Architecture**: Dependency Injection (DI) service container pattern (`src/services/container.ts`)

---

## 📁 Project Architecture

```text
src/
├── actions/        # Next.js Server Actions (Auth, Checklist, Branch, Notifications, Points)
├── app/            # Next.js App Router (pages & route handlers)
├── components/     # UI Components
│   ├── auth/       # Login & Registration flows
│   ├── common/     # Reusable components (Notifications, Badges, Brand, Modals)
│   ├── manager/    # Manager & Executive approval dashboards
│   └── staff/      # Shift selection & Checklist pages
├── context/        # AppContext (user session, active shifts, client state)
├── db/             # Drizzle ORM schema, migrations, and Supabase client
├── services/       # Core Business Logic Layer (DI Container)
│   ├── AuthService.ts
│   ├── BranchService.ts
│   ├── ChecklistService.ts
│   ├── ManagerService.ts
│   ├── NotificationService.ts
│   ├── PointService.ts
│   └── RefrigeratorService.ts
└── types/          # Unified TypeScript interfaces and models
```

---

## 📦 Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL / Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require

# Supabase Client & Realtime
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[ANON-KEY]
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm run start
```
