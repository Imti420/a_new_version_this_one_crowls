const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "NOT ANNOUNCED";
  const dt = parseDay(iso);
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dd} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function formatDayTime(day: string | null, time: string | null): string {
  const base = formatDay(day);
  if (!day) return base;
  return time ? `${base} · ${time}` : base;
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntil(day: string, now = new Date()): number {
  const target = parseDay(day).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function relativeDay(day: string, now = new Date()): string {
  const n = daysUntil(day, now);
  if (n === 0) return "TODAY";
  if (n === 1) return "TOMORROW";
  if (n === -1) return "YESTERDAY";
  if (n > 1) return `IN ${n} DAYS`;
  return `${Math.abs(n)} DAYS AGO`;
}

export function atInstant(day: string | null, time: string | null, bound: "start" | "end"): Date | null {
  if (!day) return null;
  const dt = parseDay(day);
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const [h, min] = time.split(":").map(Number);
    dt.setHours(h ?? 0, min ?? 0, 0, 0);
    return dt;
  }
  if (bound === "end") dt.setHours(23, 59, 59, 999);
  else dt.setHours(0, 0, 0, 0);
  return dt;
}

export function shiftDays(iso: string, days: number): string {
  const dt = parseDay(iso);
  dt.setDate(dt.getDate() + days);
  return todayISO(dt);
}
