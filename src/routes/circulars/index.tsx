import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SYSTEM_LABEL, type AdmissionSystem } from "@/data/types";
import { EvidenceStamp, PageHead, StatusPill, controlClass } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { deriveStatus, publishedNotice } from "@/lib/status";

export const Route = createFileRoute("/circulars/")({
  head: () => ({ meta: [{ title: "Circular archive — ADMISSION//26" }] }),
  component: CircularArchive,
});

type View = "all" | "upcoming" | "published";

function CircularArchive() {
  const { circulars, byId, universities } = useCatalog();
  const [view, setView] = useState<View>("all");
  const [q, setQ] = useState("");
  const [system, setSystem] = useState("all");
  const [status, setStatus] = useState("all");
  const [universityId, setUniversityId] = useState("all");
  const [sort, setSort] = useState("latest");
  const [hasExam, setHasExam] = useState(false);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const now = new Date();
    return circulars
      .filter((item) => {
        const app = deriveStatus(item, now);
        if (view === "upcoming" && app !== "upcoming" && app !== "open") return false;
        if (view === "published" && !publishedNotice(item)) return false;
        if (system !== "all" && item.system !== system) return false;
        if (status !== "all" && app !== status) return false;
        if (universityId !== "all" && item.universityId !== universityId) return false;
        if (hasExam && !item.examDate && !item.units.some((unit) => unit.examDate)) return false;
        if (!query) return true;
        const uni = byId.get(item.universityId);
        return [item.title, item.summary, uni?.name, uni?.shortName].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (sort === "deadline") return (a.applicationCloses ?? "9999").localeCompare(b.applicationCloses ?? "9999");
        if (sort === "exam") return (a.examDate ?? "9999").localeCompare(b.examDate ?? "9999");
        if (sort === "name") {
          const an = byId.get(a.universityId)?.name ?? "";
          const bn = byId.get(b.universityId)?.name ?? "";
          return an.localeCompare(bn);
        }
        return b.updatedOn.localeCompare(a.updatedOn);
      });
  }, [circulars, byId, view, q, system, status, universityId, sort, hasExam]);

  const views: { id: View; label: string }[] = [
    { id: "all", label: "All circulars" },
    { id: "upcoming", label: "Upcoming" },
    { id: "published", label: "Published" },
  ];

  return (
    <div>
      <PageHead
        kicker="Archive"
        title="Circular archive"
        lede="Only records with a cited report or a note you logged yourself. Universities without a notice stay in the directory — they are not turned into fake circulars."
      />
      <div className="flex flex-wrap gap-2">
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`h-11 border px-3 font-display text-sm font-semibold uppercase tracking-widest ${
              view === item.id ? "border-ink bg-ink text-paper" : "border-ink bg-paper"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 border border-ink p-3 md:grid-cols-3">
        <label className="md:col-span-3">
          <span className="font-mono text-xs tracking-widest text-mute">SEARCH</span>
          <input className={controlClass} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">UNIVERSITY</span>
          <select className={controlClass} value={universityId} onChange={(e) => setUniversityId(e.target.value)}>
            <option value="all">ALL</option>
            {universities
              .filter((uni) => circulars.some((item) => item.universityId === uni.id) || uni.kind === "system")
              .map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.shortName} — {uni.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">CLUSTER / SYSTEM</span>
          <select className={controlClass} value={system} onChange={(e) => setSystem(e.target.value)}>
            <option value="all">ALL SYSTEMS</option>
            {(Object.keys(SYSTEM_LABEL) as AdmissionSystem[]).map((item) => (
              <option key={item} value={item}>
                {SYSTEM_LABEL[item].toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">APPLICATION STATUS</span>
          <select className={controlClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">ALL</option>
            <option value="open">OPEN</option>
            <option value="upcoming">UPCOMING</option>
            <option value="closed">CLOSED</option>
            <option value="not_announced">NOT ANNOUNCED</option>
          </select>
        </label>
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">SORT</span>
          <select className={controlClass} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="latest">LATEST ANNOUNCEMENT</option>
            <option value="deadline">NEAREST DEADLINE</option>
            <option value="exam">EXAMINATION DATE</option>
            <option value="name">UNIVERSITY NAME</option>
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 border border-ink px-3 font-mono text-xs tracking-widest">
          <input type="checkbox" checked={hasExam} onChange={(e) => setHasExam(e.target.checked)} />
          HAS AN EXAM DATE
        </label>
        <p className="flex items-center font-mono text-xs text-mute">{String(rows.length).padStart(2, "0")} CIRCULARS</p>
      </div>

      <ol className="mt-4 divide-y divide-ink border-y border-ink">
        {rows.map((item) => {
          const uni = byId.get(item.universityId);
          return (
            <li key={item.id}>
              <Link to="/circulars/$id" params={{ id: item.id }} className="grid gap-2 py-4 hover:bg-panel md:grid-cols-[7rem_1fr_auto]">
                <span className="font-display text-4xl font-bold uppercase leading-none">{uni?.shortName}</span>
                <span>
                  <span className="block text-sm">{item.title}</span>
                  <span className="mt-1 block font-mono text-xs text-mute">
                    CLOSES {formatDay(item.applicationCloses)} · EXAM {formatDay(item.examDate)} · CITED {formatDay(item.updatedOn)}
                  </span>
                </span>
                <span className="flex flex-wrap items-start gap-2">
                  <StatusPill status={deriveStatus(item)} />
                  <EvidenceStamp circular={item} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {rows.length === 0 ? <p className="mt-4 font-mono text-xs text-mute">NO CIRCULAR MATCHES THESE FILTERS.</p> : null}
    </div>
  );
}
