export interface IcsEvent {
  id: string;
  day: string;
  time: string | null;
  title: string;
  confidenceLabel: string;
  personal: boolean;
  notes: string;
}

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthMatrix(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days: string[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(iso(day));
  }
  return days;
}

export function weekDays(anchor: string): string[] {
  const [y, m, d] = anchor.split("-").map(Number);
  const date = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setDate(date.getDate() + index);
    return iso(day);
  });
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  return parts.join("\r\n");
}

function dateStamp(day: string, time: string | null): { start: string; end: string } {
  const compact = day.replace(/-/g, "");
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const hhmm = time.replace(":", "");
    return { start: `DTSTART:${compact}T${hhmm}00`, end: `DTEND:${compact}T${hhmm}00` };
  }
  const [y, m, d] = day.split("-").map(Number);
  const next = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + 1);
  return { start: `DTSTART;VALUE=DATE:${compact}`, end: `DTEND;VALUE=DATE:${iso(next).replace(/-/g, "")}` };
}

export function toIcs(events: IcsEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IMTI//ADMISSION26//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ADMISSION//26",
  ];
  for (const event of events) {
    const when = dateStamp(event.day, event.time);
    const description = [
      event.confidenceLabel,
      event.personal ? "Personal desk event." : "From the ADMISSION//26 archive. Confirm against the cited source.",
      event.notes,
    ]
      .filter(Boolean)
      .join("\\n");
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:${icsEscape(event.id)}@admission26.imti`));
    lines.push(fold(`SUMMARY:${icsEscape(event.title)}`));
    lines.push(when.start);
    lines.push(when.end);
    lines.push(fold(`DESCRIPTION:${description}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
