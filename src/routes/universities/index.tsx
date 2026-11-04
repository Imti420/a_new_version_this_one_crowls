import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TRACK_LABEL, type Track } from "@/data/types";
import { PageHead, StatusPill, controlClass } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { deriveStatus, nextRelevantDay } from "@/lib/status";

export const Route = createFileRoute("/universities/")({
  head: () => ({ meta: [{ title: "All universities — ADMISSION//26" }] }),
  component: UniversitiesPage,
});

const TRACKS = ["all", ...Object.keys(TRACK_LABEL)] as const;

function UniversitiesPage() {
  const { universities, circulars } = useCatalog();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<(typeof TRACKS)[number]>("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [engineeringOnly, setEngineeringOnly] = useState(false);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const mapped = universities
      .map((uni) => {
        const related = circulars.filter((item) => item.universityId === uni.id);
        const primary = [...related].sort((a, b) => b.updatedOn.localeCompare(a.updatedOn))[0] ?? null;
        const appStatus = primary ? deriveStatus(primary) : "not_announced";
        const next = primary ? nextRelevantDay(primary) : null;
        return { uni, primary, appStatus, next };
      })
      .filter(({ uni, appStatus }) => {
        if (track !== "all" && uni.track !== track) return false;
        if (engineeringOnly && uni.track !== "engineering" && !uni.tags.includes("engineering")) return false;
        if (status !== "all" && appStatus !== status) return false;
        if (!query) return true;
        return [uni.name, uni.shortName, uni.nameBn, uni.city, uni.id].join(" ").toLowerCase().includes(query);
      });
    mapped.sort((a, b) => {
      if (sort === "deadline") return (a.next ?? "9999").localeCompare(b.next ?? "9999");
      if (sort === "city") return a.uni.city.localeCompare(b.uni.city) || a.uni.name.localeCompare(b.uni.name);
      if (sort === "short") return a.uni.shortName.localeCompare(b.uni.shortName);
      return a.uni.name.localeCompare(b.uni.name);
    });
    return mapped;
  }, [universities, circulars, q, track, status, sort, engineeringOnly]);

  return (
    <div>
      <PageHead
        kicker="Directory"
        title="All universities"
        lede="Every public university on the UGC list is here, plus the three national admission systems and a set of private universities. A missing circular is a blank, not a rumour."
      />
      <div className="grid gap-3 border border-ink p-3 md:grid-cols-4">
        <label className="md:col-span-2">
          <span className="font-mono text-xs tracking-widest text-mute">SEARCH</span>
          <input className={controlClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, short name, city" />
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">CATEGORY</span>
          <select className={controlClass} value={track} onChange={(e) => setTrack(e.target.value as (typeof TRACKS)[number])}>
            {TRACKS.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "ALL CATEGORIES" : TRACK_LABEL[item as Track].toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">STATUS</span>
          <select className={controlClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">ALL STATUSES</option>
            <option value="open">OPEN</option>
            <option value="upcoming">UPCOMING</option>
            <option value="closed">CLOSED</option>
            <option value="not_announced">NOT ANNOUNCED</option>
          </select>
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">SORT</span>
          <select className={controlClass} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">UNIVERSITY NAME</option>
            <option value="short">SHORT NAME</option>
            <option value="deadline">NEAREST DATE</option>
            <option value="city">CITY</option>
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 border border-ink px-3 font-mono text-xs tracking-widest">
          <input type="checkbox" checked={engineeringOnly} onChange={(e) => setEngineeringOnly(e.target.checked)} />
          ENGINEERING INCL. PRIVATE
        </label>
        <p className="flex items-center font-mono text-xs text-mute md:col-span-2">
          {String(rows.length).padStart(2, "0")} RECORDS
        </p>
      </div>

      <div className="mt-4 hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-ink font-mono text-xs tracking-widest text-mute">
              <th className="py-2 pr-3 font-medium">ID</th>
              <th className="py-2 pr-3 font-medium">UNIVERSITY</th>
              <th className="py-2 pr-3 font-medium">CATEGORY</th>
              <th className="py-2 pr-3 font-medium">STATUS</th>
              <th className="py-2 font-medium">NEXT DATE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ uni, appStatus, next }) => (
              <tr key={uni.id} className="border-b border-ink hover:bg-panel">
                <td className="py-3 pr-3 font-display text-2xl font-bold uppercase leading-none">
                  <Link to="/universities/$id" params={{ id: uni.id }}>
                    {uni.shortName}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  <Link to="/universities/$id" params={{ id: uni.id }} className="text-sm">
                    {uni.name}
                  </Link>
                  <span className="mt-1 block font-mono text-xs text-mute">{uni.city}</span>
                </td>
                <td className="py-3 pr-3 font-mono text-xs">{TRACK_LABEL[uni.track].toUpperCase()}</td>
                <td className="py-3 pr-3">
                  <StatusPill status={appStatus} />
                </td>
                <td className="py-3 font-mono text-xs">{next ? formatDay(next) : "NOT ANNOUNCED"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-4 divide-y divide-ink border-y border-ink md:hidden">
        {rows.map(({ uni, appStatus, next }) => (
          <li key={uni.id}>
            <Link to="/universities/$id" params={{ id: uni.id }} className="block py-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-4xl font-bold uppercase leading-none">{uni.shortName}</span>
                <StatusPill status={appStatus} />
              </div>
              <p className="mt-2 text-sm">{uni.name}</p>
              <p className="mt-1 font-mono text-xs text-mute">
                {TRACK_LABEL[uni.track].toUpperCase()} · {uni.city} · {next ? formatDay(next) : "NOT ANNOUNCED"}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
