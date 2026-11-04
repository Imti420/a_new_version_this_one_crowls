import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHead } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { daysUntil, formatDay, relativeDay, todayISO } from "@/lib/dates";
import { eventsFor, isUrgent, type RadarEvent } from "@/lib/status";
import { usePersonal } from "@/lib/store";

export const Route = createFileRoute("/radar")({
  head: () => ({ meta: [{ title: "Deadline radar — ADMISSION//26" }] }),
  component: RadarPage,
});

function RadarPage() {
  const { circulars, byId } = useCatalog();
  const pinned = usePersonal((s) => s.pinnedIds);
  const togglePin = usePersonal((s) => s.togglePin);
  const hydrated = usePersonal((s) => s.hydrated);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [kind, setKind] = useState("all");
  const today = todayISO();

  const events = useMemo(() => {
    return circulars
      .flatMap((item) => eventsFor(item))
      .filter((event) => (onlyPinned ? pinned.includes(event.circularId) : true))
      .filter((event) => (kind === "all" ? true : event.kind === kind))
      .sort((a, b) => a.day.localeCompare(b.day) || a.label.localeCompare(b.label));
  }, [circulars, onlyPinned, pinned, kind]);

  const ahead = events.filter((event) => event.day >= today);
  const elapsed = events.filter((event) => event.day < today).reverse();
  const clashes = useMemo(() => clashDays(circulars.flatMap((item) => eventsFor(item)), byId), [circulars, byId]);

  return (
    <div>
      <PageHead
        kicker="Calendar"
        title="Deadline radar"
        lede="Nearest windows first. Red means a close date inside 14 days, or an opening or an exam inside 7 days. A clash is two institutions on the same test day."
      />
      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All marks"],
          ["opens", "Opens"],
          ["closes", "Closes"],
          ["exam", "Exams"],
          ["admit", "Admit cards"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={`h-11 border px-3 font-display text-sm uppercase tracking-widest ${kind === id ? "border-ink bg-ink text-paper" : "border-ink"}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlyPinned((value) => !value)}
          className={`h-11 border px-3 font-display text-sm uppercase tracking-widest ${onlyPinned ? "border-accent bg-accent text-paper" : "border-ink"}`}
        >
          Pinned only
        </button>
      </div>

      {clashes.length ? (
        <section className="mt-8 border border-ink p-4">
          <h2 className="font-display text-3xl font-bold uppercase">Clash register</h2>
          <ul className="mt-3 divide-y divide-ink">
            {clashes.map((clash) => (
              <li key={clash.day} className="py-3">
                <p className="font-mono text-xs">{formatDay(clash.day)}</p>
                <p className="mt-1 text-sm">{clash.labels.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <EventList title="Ahead" events={ahead} byId={byId} pinned={pinned} togglePin={togglePin} hydrated={hydrated} />
      <EventList title="Elapsed" events={elapsed} byId={byId} pinned={pinned} togglePin={togglePin} hydrated={hydrated} />
    </div>
  );
}

function EventList({
  title,
  events,
  byId,
  pinned,
  togglePin,
  hydrated,
}: {
  title: string;
  events: RadarEvent[];
  byId: Map<string, { shortName: string; name: string }>;
  pinned: string[];
  togglePin: (id: string) => void;
  hydrated: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-ink pb-2 font-display text-4xl font-bold uppercase">{title}</h2>
      {events.length === 0 ? <p className="py-4 font-mono text-xs text-mute">NOTHING IN THIS COLUMN.</p> : null}
      <ol>
        {events.map((event) => {
          const uni = byId.get(event.universityId);
          const hot = isUrgent(event);
          const delta = daysUntil(event.day);
          return (
            <li key={event.id} className="grid grid-cols-1 gap-2 border-b border-ink py-3 md:grid-cols-[9rem_6rem_1fr_auto] md:items-center">
              <Link to="/circulars/$id" params={{ id: event.circularId }} className={hot ? "text-accent" : ""}>
                <span className="block font-mono text-sm">{formatDay(event.day)}</span>
                <span className="font-mono text-xs">{relativeDay(event.day)}</span>
              </Link>
              <span className="font-display text-3xl font-bold uppercase leading-none">{uni?.shortName}</span>
              <Link to="/circulars/$id" params={{ id: event.circularId }} className="text-sm hover:text-accent">
                {event.label}
                {event.time ? <span className="font-mono text-xs text-mute"> · {event.time}</span> : null}
                <span className="mt-1 block font-mono text-xs text-mute">{uni?.name}</span>
              </Link>
              <button
                type="button"
                disabled={!hydrated}
                onClick={() => togglePin(event.circularId)}
                className="h-11 border border-ink px-3 font-mono text-xs tracking-widest disabled:opacity-40"
              >
                {pinned.includes(event.circularId) ? "PINNED" : delta >= 0 ? "PIN" : "PIN"}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function clashDays(events: RadarEvent[], byId: Map<string, { shortName: string }>) {
  const exams = events.filter((event) => event.kind === "exam");
  const groups = new Map<string, RadarEvent[]>();
  for (const event of exams) {
    const list = groups.get(event.day) ?? [];
    list.push(event);
    groups.set(event.day, list);
  }
  return [...groups.entries()]
    .map(([day, list]) => {
      const unis = [...new Set(list.map((event) => event.universityId))];
      return {
        day,
        labels: unis.map((id) => {
          const bits = list.filter((event) => event.universityId === id).map((event) => event.label);
          const name = byId.get(id)?.shortName ?? id.toUpperCase();
          return `${name} ${bits.join(", ")}`;
        }),
        count: unis.length,
      };
    })
    .filter((clash) => clash.count > 1)
    .sort((a, b) => a.day.localeCompare(b.day));
}
