/**
 * Thailand (Asia/Bangkok) Date Utilities
 * Ensures consistent day-boundary and today-comparison logic across Client and Server.
 */

export function getThaiDateString(baseDate: Date | string | number = new Date()): string {
  try {
    const d = typeof baseDate === "string" || typeof baseDate === "number" ? new Date(baseDate) : baseDate;
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
  } catch {
    return "";
  }
}

export function isTodayThai(dateInput: Date | string | number | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const today = getThaiDateString();
    const target = getThaiDateString(dateInput);
    return Boolean(today && target && today === target);
  } catch {
    return false;
  }
}

export function getThaiStartAndEndOfDay(baseDate: Date | string | number = new Date()) {
  const d = typeof baseDate === "string" || typeof baseDate === "number" ? new Date(baseDate) : baseDate;
  const yElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric" }).format(d);
  const mElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", month: "2-digit" }).format(d);
  const dElement = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", day: "2-digit" }).format(d);

  const startStr = `${yElement}-${mElement}-${dElement}T00:00:00+07:00`;
  const endStr = `${yElement}-${mElement}-${dElement}T23:59:59.999+07:00`;

  return {
    startOfDay: new Date(startStr),
    endOfDay: new Date(endStr),
    dateStr: `${yElement}-${mElement}-${dElement}`,
  };
}
