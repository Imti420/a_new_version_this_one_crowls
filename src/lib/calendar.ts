import type { Circular, Confidence } from "@/data/types";
import { monthMatrix, shiftMonth, toIcs, weekDays } from "@/lib/calendar-ics";
import { evidenceLabel, eventsFor, type RadarEvent } from "@/lib/status";

export { monthMatrix, shiftMonth, toIcs, weekDays };

export type CalendarKind = RadarEvent["kind"] | "other";
export type EventTone = "accent" | "ink" | "mute" | "signal";

export interface CalendarEvent {
  id: string;
  day: string;
  time: string | null;
  title: string;
  kind: CalendarKind;
  confidence: Confidence | "personal";
  confidenceLabel: string;
  universityId: string | null;
  circularId: string | null;
  personal: boolean;
  completed: boolean;
  notes: string;
  remindDays: number | null;
}

export function toneFor(kind: CalendarKind): EventTone {
  if (kind === "closes") return "accent";
  if (kind === "exam") return "ink";
  if (kind === "opens") return "mute";
  return "signal";
}

export function archiveEvents(circulars: Circular[], shortNames: Map<string, string>): CalendarEvent[] {
  return circulars.flatMap((circular) =>
    eventsFor(circular).map((event) => ({
      id: event.id,
      day: event.day,
      time: event.time,
      title: `${shortNames.get(circular.universityId) ?? "RECORD"} · ${event.label}`,
      kind: event.kind,
      confidence: circular.confidence,
      confidenceLabel: evidenceLabel(circular.confidence, circular.publication),
      universityId: circular.universityId,
      circularId: circular.id,
      personal: false,
      completed: false,
      notes: "",
      remindDays: null,
    })),
  );
}
