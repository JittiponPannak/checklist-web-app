import { ShiftType } from "../../types";

export function Badge({
  children,
  color = "muted",
  dot = true,
}: {
  children: React.ReactNode;
  color?: "green" | "amber" | "blue" | "muted" | "red";
  dot?: boolean;
}) {
  const styles = {
    green: {
      wrap: "bg-[var(--color-primary-glow)] text-[var(--color-text)] border-[var(--color-primary-dim)] font-semibold",
      dot: "bg-[var(--color-primary)]",
    },
    amber: {
      wrap: "bg-[var(--color-amber-glow)] text-[var(--color-text)] border-[var(--color-amber)] font-semibold",
      dot: "bg-[var(--color-amber)]",
    },
    blue: {
      wrap: "bg-sky-50 text-sky-950 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-800 font-semibold",
      dot: "bg-sky-600 dark:bg-sky-400",
    },
    muted: {
      wrap: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)] font-medium",
      dot: "bg-[var(--color-text-subtle)]",
    },
    red: {
      wrap: "bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800 font-semibold",
      dot: "bg-rose-600 dark:bg-rose-400",
    },
  }[color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-mono tracking-tight ${styles.wrap}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function getShiftBadge(shift: ShiftType) {
  if (shift === "morning") return <Badge color="amber">กะเช้า</Badge>;
  if (shift === "afternoon") return <Badge color="blue">กะบ่าย</Badge>;
  return <Badge color="muted">กะควบ</Badge>;
}

export function getShiftName(shift: ShiftType) {
  if (shift === "morning") return "กะเช้า";
  if (shift === "afternoon") return "กะบ่าย";
  return "กะควบ";
}

export function Divider() {
  return <div className="h-px bg-[var(--color-border)] w-full" />;
}
