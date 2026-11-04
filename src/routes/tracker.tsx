import { Link, createFileRoute } from "@tanstack/react-router";
import { NoteBox, ProgressSelect } from "@/components/actions";
import { PageHead } from "@/components/marks";
import { PROGRESS_LABEL, type Progress } from "@/data/types";
import { useCatalog } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { usePersonal } from "@/lib/store";

export const Route = createFileRoute("/tracker")({
  head: () => ({ meta: [{ title: "Application tracker — ADMISSION//26" }] }),
  component: TrackerPage,
});

function TrackerPage() {
  const { circulars, byId, universities } = useCatalog();
  const progress = usePersonal((s) => s.progress);
  const shortlist = usePersonal((s) => s.shortlist);
  const hydrated = usePersonal((s) => s.hydrated);
  const setProgress = usePersonal((s) => s.setProgress);

  const trackedIds = new Set<string>([
    ...Object.keys(progress),
    ...shortlist.flatMap((id) => circulars.filter((item) => item.universityId === id).map((item) => item.id)),
  ]);
  const rows = circulars.filter((item) => trackedIds.has(item.id));
  const loose = shortlist.filter((id) => !circulars.some((item) => item.universityId === id));

  const counts = (Object.keys(PROGRESS_LABEL) as Progress[]).map((key) => ({
    key,
    n: Object.values(progress).filter((value) => value === key).length,
  }));

  return (
    <div>
      <PageHead
        kicker="Personal"
        title="Application tracker"
        lede="Mark what you have actually submitted. Shortlisted universities with a circular appear here automatically. Nothing is sent to a server."
      />
      <div className="grid grid-cols-2 border border-ink md:grid-cols-3 xl:grid-cols-5">
        {counts.map((item) => (
          <div key={item.key} className="border-ink border-r border-b p-3">
            <p className="font-display text-4xl font-bold tabular-nums">{String(item.n).padStart(2, "0")}</p>
            <p className="mt-1 font-mono text-xs tracking-widest text-mute">{PROGRESS_LABEL[item.key].toUpperCase()}</p>
          </div>
        ))}
      </div>

      {!hydrated ? <p className="mt-4 font-mono text-xs text-mute">RESTORING THIS DESK…</p> : null}

      {rows.length === 0 ? (
        <p className="mt-6 border border-ink p-4 text-sm">
          Nothing is being tracked. Shortlist a university or open a circular and set a progress mark.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-ink border-y border-ink">
          {rows.map((item) => {
            const uni = byId.get(item.universityId);
            return (
              <li key={item.id} className="grid gap-3 py-4 lg:grid-cols-[8rem_1fr_16rem]">
                <Link to="/universities/$id" params={{ id: item.universityId }} className="font-display text-4xl font-bold uppercase leading-none">
                  {uni?.shortName}
                </Link>
                <div>
                  <Link to="/circulars/$id" params={{ id: item.id }} className="text-sm hover:text-accent">
                    {item.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-mute">
                    CLOSES {formatDay(item.applicationCloses)} · EXAM {formatDay(item.examDate)}
                  </p>
                  <div className="mt-3 max-w-xl">
                    <NoteBox id={item.id} label="Application note" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <ProgressSelect id={item.id} />
                  <button
                    type="button"
                    className="h-11 border border-ink font-mono text-xs tracking-widest"
                    onClick={() => setProgress(item.id, null)}
                  >
                    CLEAR PROGRESS
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {loose.length ? (
        <section className="mt-8">
          <h2 className="font-display text-3xl font-bold uppercase">Shortlisted, no circular yet</h2>
          <ul className="mt-3 divide-y divide-ink border-y border-ink">
            {loose.map((id) => {
              const uni = universities.find((item) => item.id === id);
              if (!uni) return null;
              return (
                <li key={id} className="py-3">
                  <Link to="/universities/$id" params={{ id }} className="font-display text-2xl font-bold uppercase">
                    {uni.shortName}
                  </Link>
                  <span className="ml-3 text-sm">{uni.name}</span>
                  <p className="font-mono text-xs text-mute">LOG A CIRCULAR BEFORE YOU CAN MARK IT APPLIED.</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
