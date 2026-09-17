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
      wrap: "bg-amber-100 text-[#2B1413] border-amber-300 font-semibold",
      dot: "bg-amber-600",
    },
    amber: {
      wrap: "bg-amber-100 text-[#2B1413] border-amber-300 font-semibold",
      dot: "bg-amber-500",
    },
    blue: {
      wrap: "bg-[#F7EFE9] text-[#78483B] border-[#EADBCE] font-semibold",
      dot: "bg-[#78483B]",
    },
    muted: {
      wrap: "bg-[#FAF4EC] text-[#78483B] border-[#EADBCE] font-medium",
      dot: "bg-[#9C6C60]",
    },
    red: {
      wrap: "bg-rose-50 text-rose-900 border-rose-200 font-semibold",
      dot: "bg-rose-600",
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
  return <div className="h-px bg-slate-200/80 w-full" />;
}
