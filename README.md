# Eater Egg Fresh Mart - Operations & Audit Portal

A comprehensive digital checklist and standard operating procedure (SOP) management platform designed for the branch staff and executives at Eater Egg Fresh Mart. Built with Next.js, this application replaces traditional paper-based checklists with a real-time, tamper-proof, and roles-based digital workflow.

## 🚀 Features

- **Staff Task Checklists**: Employees (Cashier, Stock, Assistant Manager) can securely log in and check off their daily responsibilities based on shifts (Morning, Afternoon, Both).
- **Executive & Manager Dashboards**: Real-time queues showing live progress of operational tasks. Managers can instantly verify and approve submissions.
- **Role-based Workflows**: 
  - **Employee**: Can complete assigned operational tasks.
  - **Manager Assistant**: Has preliminary authority to verify staff tasks.
  - **Store Manager**: Final oversight and authoritative approval capabilities.
  - **General Manager / Committee / Admin**: Oversee all branches, conduct deep audits, and assess overall compliance.
- **Deep Audit History & Calendar Selection**: Features a 14-day cached rolling history of all store submissions to keep the dashboards performant, alongside a calendar picker to query deep historical records natively from the database.
- **Strict Timezone Enforcement**: Automatically bounds shift sessions and timestamps intrinsically to `Asia/Bangkok` (Thailand) limits to prevent cross-day timezone bleed.
- **Automated Deadline Tracking**: Dynamically highlights tasks that were completed after their designated time windows with a red `(ล่าช้า)` (Late) badge.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: PostgreSQL (via Supabase)
- **ORM / Query Builder**: [Drizzle ORM](https://orm.drizzle.team/)
- **Security**: Next.js Server Actions with strict server-side state enforcement.

## 📦 Getting Started

First, ensure your environment variables are configured (e.g. database connection URLs for Drizzle & Supabase).

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.

## 🗄️ Database Workflow

The application currently relies heavily on server-actions inside the `src/actions` directory to interact securely with the PostgreSQL database.
- Ensure the schema matches the entities defined in `src/db/schema.ts`.
- Run migrations or Drizzle `push` to synchronize your database when new Schema properties (like `isLate` triggers) are added.
