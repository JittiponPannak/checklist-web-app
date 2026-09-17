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
      wrap: "bg-[#F7EFE9] text-[var(--color-text-muted)] border-[var(--color-border)] font-semibold",
      dot: "bg-[var(--color-text-muted)]",
    },
    muted: {
      wrap: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)] font-medium",
      dot: "bg-[var(--color-text-subtle)]",
    },
    red: {
      wrap: "bg-[var(--color-danger-glow)] text-[var(--color-danger)] border-[var(--color-danger)] font-semibold",
      dot: "bg-[var(--color-danger)]",
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
