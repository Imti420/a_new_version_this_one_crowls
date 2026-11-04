import { Link, createFileRoute } from "@tanstack/react-router";
import { watchItems } from "@/data/watch";
import { TRACK_LABEL } from "@/data/types";
import { Announced, EvidenceStamp, ExternalLink, SectionLabel, StatusPill } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { formatDay, relativeDay, todayISO } from "@/lib/dates";
import { deriveStatus, eventsFor, isUrgent, publishedNotice } from "@/lib/status";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Overview — ADMISSION//26" }] }),
  component: Overview,
});

function Overview() {
  const { universities, circulars, byId } = useCatalog();
  const now = new Date();
  const today = todayISO(now);
  const unis = universities.filter((item) => item.kind === "university");
  const published = circulars.filter(publishedNotice);
  const openCount = circulars.filter((item) => deriveStatus(item, now) === "open").length;
  const deadlines = circulars.filter((item) => item.applicationCloses && item.applicationCloses >= today);
  const exams = new Set(
    circulars.flatMap((item) =>
      eventsFor(item)
        .filter((event) => event.kind === "exam" && event.day >= today)
        .map((event) => event.id),
    ),
  );
  const recentCut = new Date(now);
  recentCut.setDate(recentCut.getDate() - 14);
  const recentCutISO = todayISO(recentCut);
  const recent = circulars.filter((item) => item.updatedOn >= recentCutISO);
  const latest = [...circulars].sort((a, b) => b.updatedOn.localeCompare(a.updatedOn)).slice(0, 6);
  const radar = circulars
    .flatMap((item) => eventsFor(item))
    .filter((event) => event.day >= today && (event.kind === "opens" || event.kind === "closes" || event.kind === "exam"))
    .sort((a, b) => a.day.localeCompare(b.day) || a.label.localeCompare(b.label))
    .slice(0, 8);

  const stats = [
    { k: "01", label: "Universities tracked", value: unis.length, hint: `${universities.length - unis.length} admission systems` },
    { k: "02", label: "Published circulars", value: published.length, hint: "Notice cited · PDF only if linked" },
    { k: "03", label: "Upcoming deadlines", value: deadlines.length, hint: "Close date still ahead" },
    { k: "04", label: "Open applications", value: openCount, hint: openCount ? "Window is live" : "None live today" },
    { k: "05", label: "Upcoming examinations", value: exams.size, hint: "Unit papers still ahead" },
    { k: "06", label: "Recent intelligence", value: recent.length, hint: "Updated in 14 days" },
  ];

  return (
    <div>
      <header className="border-b border-ink pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="font-mono text-xs tracking-widest text-mute">VOL. 01 · DHAKA DESK · {formatDay(today)}</p>
          <p className="font-mono text-xs tracking-widest text-accent">HSC 2026–27</p>
        </div>
        <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-none tracking-tight text-balance sm:text-7xl md:text-8xl">
          Admission<span className="text-accent">//</span>26
        </h1>
        <p className="mt-3 max-w-3xl font-display text-2xl uppercase leading-tight tracking-wide md:text-3xl">
          The Bangladesh university admission archive.
        </p>
        <p className="mt-4 max-w-2xl text-base text-pretty">
          A working desk for the whole season. Directory, circulars, deadlines and your own shortlist — with every
          unknown left blank instead of invented.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 border border-ink md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <article key={stat.k} className="border-ink border-r border-b p-4 xl:border-b-0">
            <p className="font-mono text-xs text-mute">{stat.k}</p>
            <p className="mt-3 font-display text-5xl font-bold leading-none tabular-nums">{String(stat.value).padStart(2, "0")}</p>
            <h2 className="mt-3 font-display text-lg font-semibold uppercase leading-none">{stat.label}</h2>
            <p className="mt-2 font-mono text-xs text-mute">{stat.hint}</p>
          </article>
        ))}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-ink pb-2">
            <SectionLabel index="07">Deadline radar</SectionLabel>
            <Link to="/radar" className="font-mono text-xs tracking-widest underline underline-offset-4">
              FULL RADAR
            </Link>
          </div>
          <ol>
            {radar.map((event, index) => {
              const uni = byId.get(event.universityId);
              const hot = isUrgent(event, now);
              return (
                <li key={event.id} className="border-b border-ink">
                  <Link
                    to="/circulars/$id"
                    params={{ id: event.circularId }}
                    className="grid grid-cols-[auto_1fr] gap-4 py-3 hover:bg-panel md:grid-cols-[4.5rem_7.5rem_1fr_auto]"
                  >
                    <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`font-mono text-xs ${hot ? "text-accent" : "text-ink"}`}>
                      {formatDay(event.day)}
                      <span className="mt-1 block">{relativeDay(event.day, now)}</span>
                    </span>
                    <span>
                      <span className="font-display text-3xl font-bold uppercase leading-none">{uni?.shortName}</span>
                      <span className="mt-1 block text-sm">{event.label}</span>
                    </span>
                    <span className={`font-mono text-xs ${hot ? "text-accent" : "text-mute"}`}>
                      {hot ? "URGENT" : "ON FILE"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-ink pb-2">
            <SectionLabel index="08">Recent intelligence</SectionLabel>
            <Link to="/circulars" className="font-mono text-xs tracking-widest underline underline-offset-4">
              ARCHIVE
            </Link>
          </div>
          <ol className="divide-y divide-ink border-b border-ink">
            {latest.map((item) => {
              const uni = byId.get(item.universityId);
              return (
                <li key={item.id}>
                  <Link to="/circulars/$id" params={{ id: item.id }} className="block py-3 hover:bg-panel">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-2xl font-bold uppercase leading-none">{uni?.shortName}</span>
                      <StatusPill status={deriveStatus(item, now)} />
                      {item.updatedOn >= recentCutISO ? (
                        <span className="font-mono text-xs text-accent">NEW</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm">{item.title}</p>
                    <p className="mt-1 font-mono text-xs text-mute">CITED {formatDay(item.updatedOn)}</p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="mt-10 border border-ink border-l-4 border-l-accent p-4 md:p-6">
        <p className="font-mono text-xs tracking-widest text-accent">WATCH ITEM · NOT A CONFIRMED CIRCULAR</p>
        {watchItems.map((item) => (
          <article key={item.id} className="mt-2">
            <h2 className="font-display text-4xl font-bold uppercase leading-none">{item.title}</h2>
            <p className="mt-3 max-w-4xl text-sm text-pretty">{item.body}</p>
            <p className="mt-3 font-mono text-xs">
              <ExternalLink href={item.sourceUrl}>{item.sourceLabel}</ExternalLink>
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <SectionLabel index="09">Systems on the desk</SectionLabel>
        <div className="mt-4 grid gap-px bg-ink md:grid-cols-3">
          {universities
            .filter((item) => item.kind === "system")
            .map((item) => {
              const circular = circulars.find((entry) => entry.universityId === item.id);
              return (
                <Link key={item.id} to="/universities/$id" params={{ id: item.id }} className="bg-paper p-4 hover:bg-panel">
                  <p className="font-mono text-xs text-mute">{TRACK_LABEL[item.track]}</p>
                  <h3 className="mt-2 font-display text-4xl font-bold uppercase leading-none">{item.shortName}</h3>
                  <p className="mt-2 text-sm">{item.name}</p>
                  {circular ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <EvidenceStamp circular={circular} />
                      <Announced day={circular.examDate} />
                    </div>
                  ) : null}
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
