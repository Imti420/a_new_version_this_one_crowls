import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHead, TextButton, controlClass } from "@/components/marks";
import type { PersonalEvent, PersonalEventKind } from "@/data/types";
import { archiveEvents, monthMatrix, shiftMonth, toIcs, toneFor, weekDays, type CalendarEvent } from "@/lib/calendar";
import { useCatalog } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatDay, todayISO } from "@/lib/dates";
import { usePersonal } from "@/lib/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — ADMISSION//26" }] }),
  component: CalendarPage,
});

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const KINDS: { id: PersonalEventKind; label: string }[] = [
  { id: "closes", label: "Deadline" },
  { id: "exam", label: "Examination" },
  { id: "opens", label: "Application opens" },
  { id: "admit", label: "Admit card" },
  { id: "other", label: "Other" },
];

function CalendarPage() {
  const { circulars, byId } = useCatalog();
  const personal = usePersonal((s) => s.personalEvents);
  const shortlist = usePersonal((s) => s.shortlist);
  const hydrated = usePersonal((s) => s.hydrated);
  const addPersonalEvent = usePersonal((s) => s.addPersonalEvent);
  const updatePersonalEvent = usePersonal((s) => s.updatePersonalEvent);
  const deletePersonalEvent = usePersonal((s) => s.deletePersonalEvent);
  const today = todayISO();
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);
  const [scope, setScope] = useState<"all" | "shortlist">("all");
  const [hideDone, setHideDone] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const names = useMemo(() => new Map([...byId.values()].map((uni) => [uni.id, uni.shortName])), [byId]);
  const events = useMemo(() => {
    const archive = archiveEvents(circulars, names).filter((event) => scope === "all" || (event.universityId && shortlist.includes(event.universityId)));
    const mine = personal
      .filter((event) => scope === "all" || !event.universityId || shortlist.includes(event.universityId))
      .filter((event) => (hideDone ? !event.completed : true))
      .map((event) => toCalendar(event, event.universityId ? names.get(event.universityId) ?? null : null));
    return [...archive, ...mine].sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title));
  }, [circulars, names, personal, scope, shortlist, hideDone]);

  const year = Number(cursor.slice(0, 4));
  const month = Number(cursor.slice(5, 7)) - 1;
  const monthDays = monthMatrix(year, month);
  const week = weekDays(cursor);
  const monthKey = cursor.slice(0, 7);
  const visible =
    view === "month" ? events.filter((event) => event.day.startsWith(monthKey)) : view === "week" ? events.filter((event) => week.includes(event.day)) : events;
  const selectedEvents = events.filter((event) => event.day === selected);
  const active = events.find((event) => event.id === activeId) ?? null;

  const shift = (delta: number) => {
    if (view === "week") {
      const [y, m, d] = cursor.split("-").map(Number);
      const date = new Date(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + delta * 7);
      setCursor(todayISO(date));
      return;
    }
    const next = shiftMonth(year, month, delta);
    setCursor(todayISO(new Date(next.year, next.month, 1)));
  };

  const download = () => {
    const blob = new Blob([toIcs(events)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "admission26.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHead
        kicker="Planning instrument"
        title="Calendar"
        lede="Deadlines, examinations, openings and admit-card dates from the archive, plus events you add on this desk. A date with a thin confidence stamp has not been treated as final."
        aside={
          <div className="flex flex-wrap gap-2">
            <TextButton tone="paper" onClick={download}>
              Export .ics
            </TextButton>
            <TextButton
              tone="ghost"
              onClick={() => {
                setCursor(today);
                setSelected(today);
              }}
            >
              Today
            </TextButton>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(["month", "week", "agenda"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={cn("h-11 border px-3 font-display text-sm font-semibold uppercase tracking-widest", view === item ? "border-ink bg-ink text-paper" : "border-ink")}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
        <button type="button" className="h-11 border border-ink px-3 font-mono text-xs" onClick={() => shift(-1)}>
          PREV
        </button>
        <button type="button" className="h-11 border border-ink px-3 font-mono text-xs" onClick={() => shift(1)}>
          NEXT
        </button>
        <p className="font-display text-3xl font-bold uppercase">{view === "week" ? `${formatDay(week[0] ?? cursor)} – ${formatDay(week[6] ?? cursor)}` : formatDay(`${monthKey}-01`).slice(3)}</p>
        <select className={`${controlClass} h-11 w-auto`} value={scope} onChange={(event) => setScope(event.target.value as "all" | "shortlist")}>
          <option value="all">All archive dates</option>
          <option value="shortlist">Shortlist only</option>
        </select>
        <label className="flex h-11 items-center gap-2 border border-ink px-3 font-mono text-xs">
          <input type="checkbox" checked={hideDone} onChange={(event) => setHideDone(event.target.checked)} />
          HIDE COMPLETED
        </label>
      </div>

      <ul className="mt-4 flex flex-wrap gap-3 font-mono text-xs tracking-widest">
        <li className="flex items-center gap-2"><i className="inline-block h-3 w-3 bg-accent" /> DEADLINE</li>
        <li className="flex items-center gap-2"><i className="inline-block h-3 w-3 bg-ink" /> EXAMINATION</li>
        <li className="flex items-center gap-2"><i className="inline-block h-3 w-3 border border-ink bg-mute" /> OPENS</li>
        <li className="flex items-center gap-2"><i className="inline-block h-3 w-3 bg-signal" /> ADMIT / OTHER</li>
      </ul>

      {view === "month" ? (
        <div className="mt-4">
          <div className="grid grid-cols-7 border border-ink border-b-0">
            {WEEKDAYS.map((day) => (
              <p key={day} className="border-b border-ink px-1 py-2 text-center font-mono text-xs text-mute">{day}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 border border-ink border-t-0">
            {monthDays.map((day) => {
              const inMonth = day.startsWith(monthKey);
              const items = events.filter((event) => event.day === day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelected(day);
                    setActiveId(items[0]?.id ?? null);
                  }}
                  className={cn("min-h-16 border-t border-r border-ink p-1 text-left md:min-h-28", !inMonth && "bg-panel", selected === day && "outline outline-2 outline-accent")}
                >
                  <span className={cn("inline-flex h-7 min-w-7 items-center justify-center font-mono text-xs", day === today && "bg-accent text-paper")}>
                    {day.slice(8)}
                  </span>
                  <span className="mt-1 hidden md:block">
                    {items.slice(0, 3).map((event) => (
                      <EventChip key={event.id} event={event} />
                    ))}
                  </span>
                  <span className="mt-1 flex gap-1 md:hidden">
                    {items.slice(0, 4).map((event) => (
                      <i key={event.id} className={cn("h-2 w-2", dotClass(event))} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="mt-4 grid gap-px bg-ink md:grid-cols-7">
          {week.map((day) => (
            <section key={day} className={cn("bg-paper p-2", day === today && "outline outline-2 outline-accent")}>
              <button type="button" className="font-mono text-xs" onClick={() => setSelected(day)}>
                {WEEKDAYS[new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8))).getDay()]} {day.slice(8)}
              </button>
              <div className="mt-2 grid gap-1">
                {events.filter((event) => event.day === day).map((event) => (
                  <button key={event.id} type="button" className="text-left" onClick={() => { setSelected(day); setActiveId(event.id); }}>
                    <EventChip event={event} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {view === "agenda" ? (
        <ol className="mt-4 divide-y divide-ink border-y border-ink">
          {visible.length === 0 ? <li className="py-4 text-sm">Nothing dated in this range.</li> : null}
          {visible.map((event) => (
            <li key={event.id}>
              <button type="button" className="grid w-full gap-2 py-3 text-left md:grid-cols-[9rem_1fr_auto]" onClick={() => { setSelected(event.day); setActiveId(event.id); }}>
                <span className="font-mono text-xs">{formatDay(event.day)}{event.day === today ? " · TODAY" : ""}</span>
                <span className={cn("font-display text-2xl font-bold uppercase leading-none", event.completed && "line-through")}>{event.title}</span>
                <span className="font-mono text-xs text-mute">{event.confidenceLabel}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="border border-ink p-4">
          <p className="font-mono text-xs tracking-widest text-mute">{formatDay(selected)}{selected === today ? " · TODAY" : ""}</p>
          {selectedEvents.length === 0 ? <p className="mt-3 text-sm">No events on this day.</p> : null}
          <ul className="mt-3 divide-y divide-ink border-y border-ink">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <button type="button" className="w-full py-3 text-left" onClick={() => setActiveId(event.id)}>
                  <EventChip event={event} />
                  <span className="mt-1 block font-mono text-xs text-mute">{event.confidenceLabel}</span>
                </button>
              </li>
            ))}
          </ul>
          {active ? <EventDetail event={active} /> : null}
        </section>
        <EventForm
          hydrated={hydrated}
          universities={[...byId.values()]}
          editing={active?.personal ? personal.find((event) => event.id === active.id) ?? null : null}
          defaultDay={selected}
          onCreate={addPersonalEvent}
          onUpdate={updatePersonalEvent}
          onDelete={deletePersonalEvent}
        />
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: CalendarEvent }) {
  return (
    <div className="mt-4 border-t border-ink pt-3">
      <p className="font-display text-3xl font-bold uppercase leading-none">{event.title}</p>
      <p className="mt-2 font-mono text-xs tracking-widest">{event.confidenceLabel}</p>
      {event.time ? <p className="mt-2 font-mono text-xs">{event.time} · BANGLADESH LOCAL</p> : null}
      {event.notes ? <p className="mt-2 text-sm">{event.notes}</p> : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {event.circularId ? (
          <Link to="/circulars/$id" params={{ id: event.circularId }} className="font-mono text-xs underline">
            OPEN CIRCULAR
          </Link>
        ) : null}
        {event.universityId ? (
          <Link to="/universities/$id" params={{ id: event.universityId }} className="font-mono text-xs underline">
            OPEN UNIVERSITY
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function EventForm({
  hydrated,
  universities,
  editing,
  defaultDay,
  onCreate,
  onUpdate,
  onDelete,
}: {
  hydrated: boolean;
  universities: { id: string; shortName: string; name: string }[];
  editing: PersonalEvent | null;
  defaultDay: string;
  onCreate: (event: PersonalEvent) => void;
  onUpdate: (id: string, patch: Partial<PersonalEvent>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<PersonalEventKind>("other");
  const [notes, setNotes] = useState("");
  const [remind, setRemind] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "new-event") document.getElementById("new-event")?.scrollIntoView();
  }, []);

  useEffect(() => {
    if (!editing) {
      setDay(defaultDay);
      return;
    }
    setTitle(editing.title);
    setDay(editing.day);
    setTime(editing.time ?? "");
    setKind(editing.kind);
    setNotes(editing.notes);
    setRemind(editing.remindDays == null ? "" : String(editing.remindDays));
    setUniversityId(editing.universityId ?? "");
  }, [editing, defaultDay]);

  const clear = () => {
    setTitle("");
    setTime("");
    setNotes("");
    setRemind("");
    setUniversityId("");
    setKind("other");
    setError("");
  };

  return (
    <form
      id="new-event"
      className="border border-ink p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          setError("A personal event needs a title and a real date.");
          return;
        }
        const payload = {
          title: title.trim(),
          day,
          time: /^\d{2}:\d{2}$/.test(time) ? time : null,
          kind,
          notes: notes.trim(),
          remindDays: remind === "" ? null : Number(remind),
          universityId: universityId || null,
          circularId: null,
        };
        if (editing) onUpdate(editing.id, payload);
        else onCreate({ ...payload, id: `pe-${Date.now().toString(36)}`, completed: false });
        if (!editing) clear();
        setError("");
      }}
    >
      <h2 className="font-display text-3xl font-bold uppercase">{editing ? "Edit personal event" : "New personal event"}</h2>
      <p className="mt-2 text-sm">Archive dates are edited on the circular, not here. This form only writes events you own.</p>
      {!hydrated ? <p className="mt-3 font-mono text-xs text-mute">RESTORING THIS DESK…</p> : null}
      <div className="mt-4 grid gap-3">
        <input className={controlClass} placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className={controlClass} type="date" value={day} onChange={(event) => setDay(event.target.value)} />
        <input className={controlClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        <select className={controlClass} value={kind} onChange={(event) => setKind(event.target.value as PersonalEventKind)}>
          {KINDS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <select className={controlClass} value={universityId} onChange={(event) => setUniversityId(event.target.value)}>
          <option value="">No university link</option>
          {universities.map((uni) => (
            <option key={uni.id} value={uni.id}>{uni.shortName} — {uni.name}</option>
          ))}
        </select>
        <select className={controlClass} value={remind} onChange={(event) => setRemind(event.target.value)}>
          <option value="">No reminder</option>
          <option value="0">On the day</option>
          <option value="1">1 day before</option>
          <option value="3">3 days before</option>
          <option value="7">7 days before</option>
        </select>
        <textarea className={`${controlClass} h-24 py-2`} placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <TextButton type="submit" disabled={!hydrated}>{editing ? "Save event" : "Add event"}</TextButton>
          {editing ? (
            <TextButton
              tone="paper"
              onClick={() => onUpdate(editing.id, { completed: !editing.completed })}
            >
              {editing.completed ? "Mark open" : "Mark completed"}
            </TextButton>
          ) : null}
          {editing ? (
            <TextButton
              tone="ghost"
              onClick={() => {
                if (confirm("Delete this personal event?")) onDelete(editing.id);
              }}
            >
              Delete
            </TextButton>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function toCalendar(event: PersonalEvent, shortName: string | null): CalendarEvent {
  return {
    id: event.id,
    day: event.day,
    time: event.time,
    title: shortName ? `${shortName} · ${event.title}` : event.title,
    kind: event.kind,
    confidence: "personal",
    confidenceLabel: "PERSONAL DESK",
    universityId: event.universityId,
    circularId: event.circularId,
    personal: true,
    completed: event.completed,
    notes: event.notes,
    remindDays: event.remindDays,
  };
}

function dotClass(event: CalendarEvent): string {
  const tone = toneFor(event.kind);
  if (tone === "accent") return "bg-accent";
  if (tone === "ink") return "bg-ink";
  if (tone === "mute") return "bg-mute";
  return "bg-signal";
}

function EventChip({ event }: { event: CalendarEvent }) {
  const tone = toneFor(event.kind);
  return (
    <span className={cn("mt-1 block truncate border-l-4 px-1 font-mono text-xs leading-5", event.completed && "line-through", tone === "accent" && "border-accent", tone === "ink" && "border-ink", tone === "mute" && "border-mute text-mute", tone === "signal" && "border-signal text-signal")}>
      {event.title}
    </span>
  );
}
