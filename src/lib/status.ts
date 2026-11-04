import type { AppStatus, Circular, Confidence, Publication } from "@/data/types";
import { atInstant, daysUntil } from "@/lib/dates";

export function deriveStatus(c: Circular, now = new Date()): AppStatus {
  const open = atInstant(c.applicationOpens, c.opensAt, "start");
  const close = atInstant(c.applicationCloses, c.closesAt, "end");
  if (open && close) {
    if (now < open) return "upcoming";
    if (now <= close) return "open";
    return "closed";
  }
  if (open && !close) return now >= open ? "open" : "upcoming";
  if (close && now > close) return "closed";
  if (close || c.examDate || c.units.some((u) => u.examDate)) return "upcoming";
  return "not_announced";
}

export function statusLabel(status: AppStatus): string {
  switch (status) {
    case "open":
      return "OPEN";
    case "upcoming":
      return "UPCOMING";
    case "closed":
      return "CLOSED";
    default:
      return "NOT ANNOUNCED";
  }
}

export function evidenceLabel(confidence: Confidence, publication: Publication): string {
  if (confidence === "not-announced") return "NOT ANNOUNCED";
  if (confidence === "preliminary") return "REPORTED · NOT FINAL";
  if (confidence === "reported") return "REPORTED";
  if (publication === "circular") return "CIRCULAR CITED";
  if (publication === "notice") return "OFFICIAL NOTICE CITED";
  return "DECISION CITED";
}

export interface RadarEvent {
  id: string;
  circularId: string;
  universityId: string;
  kind: "opens" | "closes" | "admit" | "exam" | "result" | "classes";
  day: string;
  time: string | null;
  label: string;
}

export function eventsFor(c: Circular): RadarEvent[] {
  const out: RadarEvent[] = [];
  if (c.applicationOpens) {
    out.push({
      id: `${c.id}-opens`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "opens",
      day: c.applicationOpens,
      time: c.opensAt,
      label: "Application opens",
    });
  }
  if (c.applicationCloses) {
    out.push({
      id: `${c.id}-closes`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "closes",
      day: c.applicationCloses,
      time: c.closesAt,
      label: "Application closes",
    });
  }
  if (c.admitCardOn) {
    out.push({
      id: `${c.id}-admit`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "admit",
      day: c.admitCardOn,
      time: null,
      label: "Admit card",
    });
  }
  const unitExams = c.units.filter((u) => u.examDate);
  if (unitExams.length) {
    for (const u of unitExams) {
      out.push({
        id: `${c.id}-exam-${u.code}`,
        circularId: c.id,
        universityId: c.universityId,
        kind: "exam",
        day: u.examDate as string,
        time: u.examTime,
        label: `Exam · ${u.code}`,
      });
    }
  } else if (c.examDate) {
    out.push({
      id: `${c.id}-exam`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "exam",
      day: c.examDate,
      time: c.examTime,
      label: "Admission test",
    });
  }
  if (c.resultOn) {
    out.push({
      id: `${c.id}-result`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "result",
      day: c.resultOn,
      time: null,
      label: "Result",
    });
  }
  if (c.classesBegin) {
    out.push({
      id: `${c.id}-classes`,
      circularId: c.id,
      universityId: c.universityId,
      kind: "classes",
      day: c.classesBegin,
      time: null,
      label: "Classes begin",
    });
  }
  return out;
}

export function isUrgent(event: RadarEvent, now = new Date()): boolean {
  const d = daysUntil(event.day, now);
  if (d < 0) return false;
  if (event.kind === "closes" && d <= 14) return true;
  if ((event.kind === "opens" || event.kind === "exam") && d <= 7) return true;
  return false;
}

export function nextRelevantDay(c: Circular, now = new Date()): string | null {
  const future = eventsFor(c)
    .filter((e) => daysUntil(e.day, now) >= 0)
    .sort((a, b) => a.day.localeCompare(b.day) || a.label.localeCompare(b.label));
  return future[0]?.day ?? eventsFor(c).sort((a, b) => b.day.localeCompare(a.day))[0]?.day ?? null;
}

export function publishedNotice(c: Circular): boolean {
  return c.publication === "notice" || c.publication === "circular";
}
