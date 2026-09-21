---
trigger: always_on
---

# Agentic Engineering Standards

This project adheres strictly to **Agentic Engineering** principles, rejecting casual "vibe coding" (blindly generating code without specification, testing, or verification). Every task must be treated with engineering rigor, accountability, and production standards.

---

## 1. Core Principles

1. **Specification Before Implementation**:
   - Never rush to write code from vague requests.
   - Clarify edge cases, data types, authentication/authorization boundaries, and error conditions first.
   - Transform subjective expectations into objective, verifiable acceptance criteria.

2. **The "Powerful Intern" Mental Model**:
   - Treat AI generation as high-speed execution that requires human architectural governance and rigorous self-verification.
   - Always verify assumptions against real project files, schemas, and configurations.

3. **Closed Feedback Loops**:
   - Every code modification must be paired with verification (static typing, linting, build checks, and test suites).
   - When an error occurs, analyze root causes and feedback signals instead of guessing or patching symptoms.

---

## 2. Mandatory Workflow

```
[Requirement] -> [1. Specify & Scope] -> [2. Explore & Plan] -> [3. Implement] -> [4. Self-Verify] -> [5. Report/Review]
```

### Step 1: Specify & Scope
- Identify affected entities (Drizzle schema, Supabase auth/tables, Next.js Server Components / Client Components / Server Actions).
- Define constraints: validation (zod/types), permissions (RLS / session checks), error states, and rate limits where applicable.

### Step 2: Explore & Plan
- Inspect existing patterns in the codebase before inventing new conventions.
- Consult Next.js 16 breaking changes and project libraries (`@supabase/ssr`, `drizzle-orm`).
- Propose the implementation strategy before executing large changes.

### Step 3: Implement & Tool Use
- Write clean, modular, and typed TypeScript code.
- Keep components focused and maintain separation of concerns.

### Step 4: Self-Verification
Before declaring any task done, run the verification toolchain:
- **Type Safety**: `npx tsc --noEmit`
- **Linting**: `npm run lint`
- **Build / Runtime Check**: verify imports, syntax, and schema sync (`drizzle-kit`).

### Step 5: Review Readiness
- Clearly summarize what was done, any architectural choices made, and how verification was confirmed.
