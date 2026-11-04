import type { Proposal, VerificationReport } from "@/lib/verify-engine";
import { daysUntil } from "@/lib/dates";

export interface DeskEvent {
  id: string;
  title: string;
  day: string;
  remindDays: number | null;
  completed: boolean;
}

export interface Notice {
  id: string;
  tone: "confirmed" | "unverified" | "desk";
  title: string;
  body: string;
  href: "/monitor" | "/calendar";
  at: string;
}

export function buildNotices(input: {
  report: VerificationReport | null;
  decisions: Record<string, "approved" | "rejected">;
  events: DeskEvent[];
  now?: Date;
}): Notice[] {
  const now = input.now ?? new Date();
  const notices: Notice[] = [];
  const report = input.report;
  if (report) {
    for (const item of report.changelog) {
      if (item.field === "page") {
        notices.push({
          id: `log:${item.id}`,
          tone: "unverified",
          title: `${item.universityName} page changed`,
          body: "Fingerprint changed. No admission date was confirmed from it.",
          href: "/monitor",
          at: item.detectedAt,
        });
        continue;
      }
      const decision = input.decisions[item.id];
      if (decision === "rejected") continue;
      const confirmed = item.verificationStatus === "auto_applied" || decision === "approved";
      notices.push({
        id: `log:${item.id}`,
        tone: confirmed ? "confirmed" : "unverified",
        title: confirmed ? `${item.universityName} ${item.field} updated` : `${item.universityName} ${item.field} needs review`,
        body: `${item.previousValue} → ${item.detectedValue}`,
        href: item.verificationStatus === "auto_applied" ? "/monitor" : "/monitor",
        at: item.detectedAt,
      });
    }
    for (const item of report.proposals) {
      if (input.decisions[item.id]) continue;
      if (notices.some((notice) => notice.id === `log:${item.id}`)) continue;
      notices.push(proposalNotice(item));
    }
  }
  for (const event of input.events) {
    if (event.completed || event.remindDays == null) continue;
    const left = daysUntil(event.day, now);
    if (left < 0 || left > event.remindDays) continue;
    notices.push({
      id: `remind:${event.id}:${event.day}`,
      tone: "desk",
      title: event.title,
      body: left === 0 ? "Personal reminder · today" : `Personal reminder · ${left} day${left === 1 ? "" : "s"} left`,
      href: "/calendar",
      at: event.day,
    });
  }
  return notices.sort((a, b) => b.at.localeCompare(a.at));
}

function proposalNotice(item: Proposal): Notice {
  return {
    id: `proposal:${item.id}`,
    tone: "unverified",
    title: `${item.universityName} needs review`,
    body: `${item.field}: ${item.previousValue} → ${item.detectedValue}. Not applied.`,
    href: "/monitor",
    at: item.detectedAt,
  };
}
