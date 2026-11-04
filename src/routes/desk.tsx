import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHead, StatusPill, TextButton, controlClass } from "@/components/marks";
import {
  DESK_SECTION_LABEL,
  NOTE_KIND_LABEL,
  PROGRESS_LABEL,
  type DeskNote,
  type DeskSectionId,
  type NoteKind,
  type Progress,
} from "@/data/types";
import { useCatalog } from "@/lib/catalog";
import { formatDay, todayISO } from "@/lib/dates";
import { usePublishedReport } from "@/lib/published-report";
import { deriveStatus, eventsFor } from "@/lib/status";
import { usePersonal } from "@/lib/store";

export const Route = createFileRoute("/desk")({
  head: () => ({ meta: [{ title: "My admission desk — ADMISSION//26" }] }),
  component: DeskPage,
});

const STAGES: { label: string; test: (progress: Progress | undefined) => boolean }[] = [
  { label: "Not started", test: (progress) => !progress },
  { label: "Researching", test: (progress) => progress === "planning" || progress === "researching" },
  { label: "Ready to apply", test: (progress) => progress === "ready" },
  { label: "Applied", test: (progress) => progress === "applied" },
  { label: "Admit card collected", test: (progress) => progress === "admit" },
  { label: "Examination completed", test: (progress) => progress === "appeared" || progress === "result" },
];

function DeskPage() {
  const personal = usePersonal();
  const review = usePublishedReport((s) => s.report?.summary.reviewRequired ?? 0);
  const layout = personal.deskLayout;
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  return (
    <div>
      <PageHead
        kicker="Personal"
        title="My admission desk"
        lede="Your command center for this season. Shortlist, deadlines, progress and notes stay in this browser. The archive underneath is unchanged until you edit it."
      />
      {!personal.hydrated ? <p className="mb-4 font-mono text-xs text-mute">RESTORING THIS DESK…</p> : null}
      <div className="grid gap-8">
        {layout.map((section, index) =>
          section.hidden ? null : (
            <section key={section.id} id={section.id === "notes" ? "desk-notes" : undefined} className="border border-ink p-4">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-2">
                <h2 className="font-display text-4xl font-bold uppercase">{DESK_SECTION_LABEL[section.id]}</h2>
                <div className="flex gap-2">
                  <button type="button" className="h-11 border border-ink px-3 font-mono text-xs" onClick={() => move(layout, index, -1, personal.setDeskLayout)} disabled={index === 0}>
                    UP
                  </button>
                  <button type="button" className="h-11 border border-ink px-3 font-mono text-xs" onClick={() => move(layout, index, 1, personal.setDeskLayout)} disabled={index === layout.length - 1}>
                    DOWN
                  </button>
                  <button type="button" className="h-11 border border-ink px-3 font-mono text-xs" onClick={() => personal.setDeskLayout(layout.map((item) => (item.id === section.id ? { ...item, hidden: true } : item)))}>
                    HIDE
                  </button>
                </div>
              </div>
              <SectionBody id={section.id} showAllDeadlines={showAllDeadlines} onToggleDeadlines={() => setShowAllDeadlines((value) => !value)} review={review} />
            </section>
          ),
        )}
      </div>
      {layout.some((section) => section.hidden) ? (
        <div className="mt-6 border border-ink p-4">
          <p className="font-mono text-xs tracking-widest text-mute">HIDDEN SECTIONS</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {layout.filter((section) => section.hidden).map((section) => (
              <TextButton key={section.id} tone="paper" onClick={() => personal.setDeskLayout(layout.map((item) => (item.id === section.id ? { ...item, hidden: false } : item)))}>
                Show {DESK_SECTION_LABEL[section.id]}
              </TextButton>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionBody({
  id,
  showAllDeadlines,
  onToggleDeadlines,
  review,
}: {
  id: DeskSectionId;
  showAllDeadlines: boolean;
  onToggleDeadlines: () => void;
  review: number;
}) {
  const catalog = useCatalog();
  const shortlist = usePersonal((s) => s.shortlist);
  const progress = usePersonal((s) => s.progress);
  const today = todayISO();
  if (id === "actions") return <QuickActions review={review} universities={catalog.universities} />;
  if (id === "deadlines") {
    return <Deadlines showAll={showAllDeadlines} onToggle={onToggleDeadlines} today={today} catalog={catalog} shortlist={shortlist} />;
  }
  if (id === "shortlist") return <ShortlistBlock catalog={catalog} shortlist={shortlist} today={today} />;
  if (id === "progress") return <ProgressBlock catalog={catalog} shortlist={shortlist} progress={progress} />;
  if (id === "dates") return <DatesBlock catalog={catalog} />;
  return <NotesBlock />;
}

function move(layout: { id: DeskSectionId; hidden: boolean }[], index: number, delta: number, setDeskLayout: (layout: { id: DeskSectionId; hidden: boolean }[]) => void) {
  const next = index + delta;
  if (next < 0 || next >= layout.length) return;
  const copy = [...layout];
  const [item] = copy.splice(index, 1);
  if (!item) return;
  copy.splice(next, 0, item);
  setDeskLayout(copy);
}

function QuickActions({
  review,
  universities,
}: {
  review: number;
  universities: { id: string; shortName: string; name: string }[];
}) {
  const shortlist = usePersonal((s) => s.shortlist);
  const toggleShortlist = usePersonal((s) => s.toggleShortlist);
  const [pick, setPick] = useState(universities.find((uni) => !shortlist.includes(uni.id))?.id ?? "");
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Link to="/calendar" hash="new-event" className="inline-flex h-11 items-center border border-ink bg-ink px-3 font-display text-sm font-semibold uppercase tracking-widest text-paper">
          Add a personal event
        </Link>
        <a href="#desk-notes" className="inline-flex h-11 items-center border border-ink px-3 font-display text-sm font-semibold uppercase tracking-widest">
          Add a note
        </a>
        <Link to="/circulars" className="inline-flex h-11 items-center border border-ink px-3 font-display text-sm font-semibold uppercase tracking-widest">
          Circular archive
        </Link>
        <Link to="/monitor" className="inline-flex h-11 items-center border border-accent px-3 font-display text-sm font-semibold uppercase tracking-widest text-accent">
          New findings {review > 0 ? `(${review})` : ""}
        </Link>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (pick) toggleShortlist(pick);
        }}
      >
        <select className={controlClass} value={pick} onChange={(event) => setPick(event.target.value)}>
          {universities.map((uni) => (
            <option key={uni.id} value={uni.id}>
              {shortlist.includes(uni.id) ? "ON LIST · " : ""}
              {uni.shortName} — {uni.name}
            </option>
          ))}
        </select>
        <TextButton type="submit">{shortlist.includes(pick) ? "Remove from shortlist" : "Add to shortlist"}</TextButton>
      </form>
    </div>
  );
}

function Deadlines({
  showAll,
  onToggle,
  today,
  catalog,
  shortlist,
}: {
  showAll: boolean;
  onToggle: () => void;
  today: string;
  catalog: ReturnType<typeof useCatalog>;
  shortlist: string[];
}) {
  const rows = catalog.circulars
    .flatMap((circular) => eventsFor(circular).filter((event) => event.kind === "closes" || event.kind === "exam").map((event) => ({ event, circular })))
    .filter((row) => row.event.day >= today)
    .sort((a, b) => a.event.day.localeCompare(b.event.day));
  const preferred = rows.filter((row) => shortlist.includes(row.circular.universityId));
  const shown = showAll ? rows : preferred.length ? preferred : rows.slice(0, 6);
  return (
    <div>
      <button type="button" className="font-mono text-xs underline" onClick={onToggle}>
        {showAll ? "SHOW SHORTLIST FIRST" : "SHOW ALL DEADLINES"}
      </button>
      <ol className="mt-3 divide-y divide-ink border-y border-ink">
        {shown.length === 0 ? <li className="py-3 text-sm">No upcoming deadlines are stored.</li> : null}
        {shown.map(({ event, circular }) => {
          const uni = catalog.byId.get(circular.universityId);
          return (
            <li key={event.id} className="grid gap-2 py-3 md:grid-cols-[8rem_1fr]">
              <span className="font-mono text-xs">{formatDay(event.day)}</span>
              <Link to="/circulars/$id" params={{ id: circular.id }} className="hover:text-accent">
                <span className="font-display text-2xl font-bold uppercase leading-none">{uni?.shortName}</span>
                <span className="mt-1 block text-sm">{event.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ShortlistBlock({
  catalog,
  shortlist,
  today,
}: {
  catalog: ReturnType<typeof useCatalog>;
  shortlist: string[];
  today: string;
}) {
  const rows = catalog.universities.filter((uni) => shortlist.includes(uni.id));
  if (rows.length === 0) {
    return (
      <p className="text-sm">
        The shortlist is empty. Add one above, or open the <Link to="/universities" className="underline">directory</Link>.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-ink border-y border-ink">
      {rows.map((uni) => {
        const circular = catalog.circulars.find((item) => item.universityId === uni.id);
        const next = circular
          ? eventsFor(circular).filter((event) => event.day >= today).sort((a, b) => a.day.localeCompare(b.day))[0]
          : null;
        return (
          <li key={uni.id} className="grid gap-2 py-3 md:grid-cols-[8rem_1fr_auto]">
            <Link to="/universities/$id" params={{ id: uni.id }} className="font-display text-3xl font-bold uppercase leading-none">
              {uni.shortName}
            </Link>
            <div>
              <p className="text-sm">{uni.name}</p>
              <p className="mt-1 font-mono text-xs text-mute">{next ? `${next.label.toUpperCase()} ${formatDay(next.day)}` : "NO DATED EVENT ON FILE"}</p>
            </div>
            {circular ? <StatusPill status={deriveStatus(circular)} /> : <span className="font-mono text-xs text-mute">NO CIRCULAR</span>}
          </li>
        );
      })}
    </ol>
  );
}

function ProgressBlock({
  catalog,
  shortlist,
  progress,
}: {
  catalog: ReturnType<typeof useCatalog>;
  shortlist: string[];
  progress: Record<string, Progress>;
}) {
  const rows = useMemo(() => {
    const ids = new Set<string>([
      ...Object.keys(progress),
      ...shortlist.flatMap((id) => catalog.circulars.filter((item) => item.universityId === id).map((item) => item.id)),
    ]);
    return catalog.circulars.filter((item) => ids.has(item.id));
  }, [catalog.circulars, progress, shortlist]);
  return (
    <div>
      <div className="grid grid-cols-2 border border-ink md:grid-cols-3">
        {STAGES.map((stage) => (
          <div key={stage.label} className="border-ink border-r border-b p-3">
            <p className="font-display text-4xl font-bold tabular-nums">{String(rows.filter((row) => stage.test(progress[row.id])).length).padStart(2, "0")}</p>
            <p className="mt-1 font-mono text-xs tracking-widest text-mute">{stage.label.toUpperCase()}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-ink border-y border-ink">
        {rows.length === 0 ? <li className="py-3 text-sm">Shortlist a university or set a progress mark to fill this board.</li> : null}
        {rows.map((row) => {
          const uni = catalog.byId.get(row.universityId);
          const mark = progress[row.id];
          return (
            <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <Link to="/circulars/$id" params={{ id: row.id }} className="font-display text-2xl font-bold uppercase">
                {uni?.shortName}
              </Link>
              <span className="font-mono text-xs tracking-widest">{mark ? PROGRESS_LABEL[mark].toUpperCase() : "NOT STARTED"}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 font-mono text-xs text-mute">
        Admitted and not-selected marks stay on the <Link to="/tracker" className="underline">application tracker</Link>.
      </p>
    </div>
  );
}

function DatesBlock({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const events = usePersonal((s) => s.personalEvents);
  const pinned = usePersonal((s) => s.pinnedIds);
  const pinnedEvents = catalog.circulars
    .filter((circular) => pinned.includes(circular.id))
    .flatMap((circular) => eventsFor(circular).map((event) => ({ id: event.id, day: event.day, title: event.label, circularId: circular.id, universityId: circular.universityId })));
  const mine = [...events].sort((a, b) => a.day.localeCompare(b.day));
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="font-mono text-xs tracking-widest text-mute">PERSONAL</p>
        {mine.length === 0 ? <p className="mt-2 text-sm">No personal dates yet.</p> : null}
        <ul className="mt-2 divide-y divide-ink border-y border-ink">
          {mine.map((event) => (
            <li key={event.id} className="py-2">
              <Link to="/calendar" className="font-display text-2xl font-bold uppercase">{event.title}</Link>
              <p className="font-mono text-xs text-mute">{formatDay(event.day)}{event.completed ? " · DONE" : ""}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-mono text-xs tracking-widest text-mute">PINNED CIRCULARS</p>
        {pinnedEvents.length === 0 ? <p className="mt-2 text-sm">Pin a deadline from a circular to park it here.</p> : null}
        <ul className="mt-2 divide-y divide-ink border-y border-ink">
          {pinnedEvents.map((event) => (
            <li key={event.id} className="py-2">
              <Link to="/circulars/$id" params={{ id: event.circularId }} className="text-sm">{catalog.byId.get(event.universityId)?.shortName} · {event.title}</Link>
              <p className="font-mono text-xs text-mute">{formatDay(event.day)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NotesBlock() {
  const notes = usePersonal((s) => s.deskNotes);
  const addDeskNote = usePersonal((s) => s.addDeskNote);
  const updateDeskNote = usePersonal((s) => s.updateDeskNote);
  const deleteDeskNote = usePersonal((s) => s.deleteDeskNote);
  const universities = useCatalog().universities;
  const [kind, setKind] = useState<NoteKind>("comparison");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [universityId, setUniversityId] = useState("");

  return (
    <div>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !body.trim()) return;
          const note: DeskNote = {
            id: `note-${Date.now().toString(36)}`,
            kind,
            title: title.trim(),
            body: body.trim(),
            universityId: universityId || null,
            updatedAt: todayISO(),
          };
          addDeskNote(note);
          setTitle("");
          setBody("");
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <select className={controlClass} value={kind} onChange={(event) => setKind(event.target.value as NoteKind)}>
            {(Object.keys(NOTE_KIND_LABEL) as NoteKind[]).map((key) => (
              <option key={key} value={key}>{NOTE_KIND_LABEL[key]}</option>
            ))}
          </select>
          <select className={controlClass} value={universityId} onChange={(event) => setUniversityId(event.target.value)}>
            <option value="">No university</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>{uni.shortName}</option>
            ))}
          </select>
        </div>
        <input className={controlClass} placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea className={`${controlClass} h-28 py-2`} placeholder="Comparison, eligibility, reminder, strategy" value={body} onChange={(event) => setBody(event.target.value)} />
        <TextButton type="submit">Add note</TextButton>
      </form>
      <ul className="mt-4 divide-y divide-ink border-y border-ink">
        {notes.length === 0 ? <li className="py-3 text-sm">No desk notes yet.</li> : null}
        {notes.map((note) => (
          <li key={note.id} className="py-3">
            <p className="font-mono text-xs tracking-widest text-mute">{NOTE_KIND_LABEL[note.kind].toUpperCase()} · {formatDay(note.updatedAt)}</p>
            <input className={`${controlClass} mt-2`} value={note.title} onChange={(event) => updateDeskNote(note.id, { title: event.target.value, updatedAt: todayISO() })} />
            <textarea className={`${controlClass} mt-2 h-24 py-2`} value={note.body} onChange={(event) => updateDeskNote(note.id, { body: event.target.value, updatedAt: todayISO() })} />
            <button type="button" className="mt-2 font-mono text-xs underline" onClick={() => deleteDeskNote(note.id)}>
              DELETE NOTE
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
