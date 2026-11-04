import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, PageHead } from "@/components/marks";
import { isLiveFile, systemStatus, type SystemStatus } from "@/lib/crawl/gate";
import type { LiveFile, Reachability, SourceRecord } from "@/lib/crawl/types";

export const Route = createFileRoute("/discovery")({
  head: () => ({ meta: [{ title: "Discovery log — ADMISSION//26" }] }),
  component: DiscoveryPage,
});

const RAW_LOG = "https://raw.githubusercontent.com/Imti420/turbo-timber-tundra-zephyr/main/public/ops/live.json";

const REACH_LABEL: Record<Reachability, string> = {
  not_yet_checked: "NOT YET CHECKED",
  success: "SUCCESS",
  no_change: "NO CHANGE",
  new_document: "NEW DOCUMENT",
  unreachable: "SOURCE UNREACHABLE",
  retry_scheduled: "RETRY SCHEDULED",
  source_broken: "SOURCE BROKEN",
  skipped_robots: "SKIPPED",
  no_official_url: "NO OFFICIAL URL",
};

const SYSTEM_LABEL: Record<SystemStatus, string> = {
  never: "IDLE",
  active: "ACTIVE",
  idle: "IDLE",
  degraded: "DEGRADED",
  failed: "FAILED",
  stale: "STALE",
};

function relativePast(iso: string | null, now: Date): string {
  if (!iso) return "NEVER";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "UNKNOWN";
  const minutes = Math.floor(Math.max(0, now.getTime() - then) / 60_000);
  if (minutes < 1) return "JUST NOW";
  if (minutes < 60) return `${minutes} MINUTE${minutes === 1 ? "" : "S"} AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} HOUR${hours === 1 ? "" : "S"} AGO`;
  const days = Math.floor(hours / 24);
  return `${days} DAY${days === 1 ? "" : "S"} AGO`;
}

async function pull(url: string): Promise<LiveFile | null> {
  try {
    const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const json: unknown = await response.json();
    return isLiveFile(json) ? json : null;
  } catch {
    return null;
  }
}

function newer(left: LiveFile | null, right: LiveFile | null): LiveFile | null {
  if (!left) return right;
  if (!right) return left;
  const a = Date.parse(left.generatedAt ?? "") || 0;
  const b = Date.parse(right.generatedAt ?? "") || 0;
  return b > a ? right : left;
}

function DiscoveryPage() {
  const [live, setLive] = useState<LiveFile | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "missing">("loading");
  const [now, setNow] = useState(() => new Date());
  const [seenAt, setSeenAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "failed" | "reached" | "new" | "unchecked">("all");

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const [local, remote] = await Promise.all([pull("/ops/live.json"), pull(RAW_LOG)]);
      const next = newer(local, remote);
      if (stop) return;
      setLive(next);
      setPhase(next ? "ready" : "missing");
      setSeenAt(new Date());
    };
    void load();
    const poll = window.setInterval(() => void load(), 120_000);
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      stop = true;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  const status = systemStatus(phase === "ready" ? live : null, now);
  const sources = useMemo(() => {
    const rows = live?.sources ?? [];
    const q = query.trim().toLowerCase();
    return rows.filter((source) => {
      if (filter === "failed" && !["unreachable", "retry_scheduled", "source_broken"].includes(source.reachability)) return false;
      if (filter === "reached" && !["success", "no_change", "new_document"].includes(source.reachability)) return false;
      if (filter === "new" && source.reachability !== "new_document") return false;
      if (filter === "unchecked" && source.reachability !== "not_yet_checked" && source.reachability !== "no_official_url") return false;
      if (!q) return true;
      return [source.universityName, source.shortName, source.sourceName, source.url ?? "", source.error ?? "", source.note]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [live, query, filter]);

  const nextAt = live?.completedAt ? new Date(Date.parse(live.completedAt) + 45 * 60_000) : null;

  return (
    <div>
      <PageHead
        kicker="Discovery"
        title="Discovery log"
        lede="What the crawler actually opened. This page does not start a scan, and it does not publish admission dates. The job runs on GitHub about every 45 minutes even if nobody has the site open. GitHub may start it late."
      />

      <StatusBanner status={status} phase={phase} live={live} now={now} seenAt={seenAt} nextAt={nextAt} />

      {live ? (
        <section className="mt-6 grid grid-cols-2 border border-ink md:grid-cols-4">
          <Stat k="Universities" v={String(live.counts.universities).padStart(2, "0")} hint={`${live.counts.systems} admission systems`} />
          <Stat k="Sources" v={String(live.counts.sources).padStart(2, "0")} hint={`${live.counts.checked} checked this cycle`} />
          <Stat k="Reached" v={String(live.counts.reached).padStart(2, "0")} hint={`${live.counts.failed} failed · ${live.counts.unchanged} unchanged`} />
          <Stat k="New links" v={String(live.counts.newDocuments + live.counts.newPages).padStart(2, "0")} hint={`${live.counts.newDocuments} documents · ${live.counts.newPages} pages`} />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-4xl font-bold uppercase">Activity</h2>
        <p className="mt-2 max-w-3xl text-sm">Only events written by the crawler. Nothing here is simulated.</p>
        <ol className="mt-4 max-h-96 overflow-y-auto border border-ink">
          {phase === "loading" ? (
            <li className="p-4 font-mono text-xs tracking-widest text-mute">WAITING FOR THE PUBLISHED LOG.</li>
          ) : (live?.events ?? []).length === 0 ? (
            <li className="p-4 font-mono text-xs tracking-widest text-mute">NO EVENTS HAVE BEEN RECORDED.</li>
          ) : (
            [...(live?.events ?? [])].reverse().map((event, index) => (
              <li key={`${event.at}-${index}`} className="grid gap-1 border-b border-ink px-3 py-2 font-mono text-xs md:grid-cols-[11rem_1fr]">
                <time dateTime={event.at}>{event.at.slice(11, 19)} UTC</time>
                <span className={event.level === "error" ? "text-accent" : ""}>{event.message}</span>
              </li>
            ))
          )}
        </ol>
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 border-b border-ink pb-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-4xl font-bold uppercase">Sources</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search university or URL"
            className="h-11 w-full border border-ink bg-paper px-3 font-sans text-sm md:max-w-xs"
            aria-label="Search sources"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["failed", "Failed"],
              ["reached", "Reached"],
              ["new", "New links"],
              ["unchecked", "Not checked"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`h-10 border px-3 font-mono text-xs tracking-widest ${filter === id ? "border-ink bg-ink text-paper" : "border-ink bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="mt-4 border-t border-ink">
          {phase === "loading" ? <li className="py-4 font-mono text-xs text-mute">WAITING FOR THE PUBLISHED LOG.</li> : null}
          {phase !== "loading" && live && live.sources.length === 0 ? (
            <li className="py-4 font-mono text-xs text-mute">THIS FILE HAS NO SOURCE LIST YET.</li>
          ) : null}
          {phase !== "loading" && (live?.sources.length ?? 0) > 0 && sources.length === 0 ? (
            <li className="py-4 font-mono text-xs text-mute">NO SOURCES MATCH.</li>
          ) : null}
          {sources.map((source) => (
            <SourceRow key={source.id} source={source} now={now} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusBanner({
  status,
  phase,
  live,
  now,
  seenAt,
  nextAt,
}: {
  status: SystemStatus;
  phase: "loading" | "ready" | "missing";
  live: LiveFile | null;
  now: Date;
  seenAt: Date | null;
  nextAt: Date | null;
}) {
  const tone = status === "failed" || status === "stale" ? "border-accent text-accent" : "border-ink";
  return (
    <div className={`border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-block h-3 w-3 border border-current ${status === "active" ? "crawl-live bg-accent" : "bg-transparent"}`} aria-hidden />
        <p className="font-display text-3xl font-bold uppercase leading-none">{phase === "loading" ? "LOADING" : SYSTEM_LABEL[status]}</p>
        <p className="font-mono text-xs tracking-widest">TARGET EVERY 45 MIN · NOT A GUARANTEED CLOCK</p>
      </div>
      {phase === "loading" ? <p className="mt-3 font-mono text-xs">Reading the last published cycle.</p> : null}
      {phase === "missing" ? (
        <p className="mt-3 font-mono text-xs">NO DISCOVERY FILE. NOTHING ON THIS PAGE IS A SCAN.</p>
      ) : null}
      {live ? (
        <p className="mt-3 font-mono text-xs leading-relaxed">
          LAST CYCLE {live.completedAt ? `${live.completedAt} · ${relativePast(live.completedAt, now)}` : "NOT FINISHED"}
          {nextAt ? ` · NEXT EXPECTED ${nextAt.toISOString().slice(0, 16)}Z` : ""}
          <br />
          FILE READ {seenAt ? relativePast(seenAt.toISOString(), now) : "—"} · BROWSER CLOCK {now.toISOString().slice(11, 19)}Z
          <br />
          {live.note}
        </p>
      ) : null}
      {status === "stale" ? <p className="mt-2 font-mono text-xs">THE LAST CYCLE IS OVER 90 MINUTES OLD. IT IS NOT RUNNING NOW.</p> : null}
      {status === "active" ? <p className="mt-2 font-mono text-xs">A CYCLE WAS MARKED IN PROGRESS. IF THAT STAMP IS OLD, THIS PAGE WILL NOT KEEP CALLING IT LIVE.</p> : null}
    </div>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint: string }) {
  return (
    <article className="border-ink border-r border-b p-4 md:border-b-0">
      <p className="font-display text-5xl font-bold leading-none tabular-nums">{v}</p>
      <h2 className="mt-2 font-display text-lg font-semibold uppercase leading-none">{k}</h2>
      <p className="mt-2 font-mono text-xs text-mute">{hint}</p>
    </article>
  );
}

function SourceRow({ source, now }: { source: SourceRecord; now: Date }) {
  const bad = ["unreachable", "retry_scheduled", "source_broken"].includes(source.reachability);
  return (
    <li className="border-b border-ink py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-3xl font-bold uppercase leading-none">{source.shortName}</p>
        <p className={`font-mono text-xs tracking-widest ${bad ? "text-accent" : ""}`}>{REACH_LABEL[source.reachability]}</p>
      </div>
      <p className="mt-1 text-sm">{source.sourceName}</p>
      <p className="mt-1 font-mono text-xs text-mute">
        {source.kind === "system" ? "ADMISSION SYSTEM · " : ""}
        {source.type.toUpperCase()} · CHECKED {relativePast(source.lastCheckedAt, now)}
        {source.lastSuccessAt ? ` · LAST SUCCESS ${relativePast(source.lastSuccessAt, now)}` : ""}
        {source.documentsFound ? ` · DOCUMENTS ${source.documentsFound}` : ""}
      </p>
      {source.url ? (
        <p className="mt-1 truncate font-mono text-xs">
          <ExternalLink href={source.url}>{source.url}</ExternalLink>
        </p>
      ) : null}
      {source.lastDiscoveredDocument ? (
        <p className="mt-1 truncate font-mono text-xs">
          LAST DOCUMENT <ExternalLink href={source.lastDiscoveredDocument}>{source.lastDiscoveredDocument}</ExternalLink>
        </p>
      ) : null}
      {source.error || source.note ? <p className="mt-1 text-sm">{source.error ? `${source.error}. ` : ""}{source.note}</p> : null}
    </li>
  );
}
