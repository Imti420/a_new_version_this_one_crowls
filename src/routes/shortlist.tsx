import { Link, createFileRoute } from "@tanstack/react-router";
import { NoteBox } from "@/components/actions";
import { PageHead, StatusPill } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { deriveStatus, nextRelevantDay } from "@/lib/status";
import { usePersonal } from "@/lib/store";

export const Route = createFileRoute("/shortlist")({
  head: () => ({ meta: [{ title: "My shortlist — ADMISSION//26" }] }),
  component: ShortlistPage,
});

function ShortlistPage() {
  const { universities, circulars } = useCatalog();
  const shortlist = usePersonal((s) => s.shortlist);
  const bookmarks = usePersonal((s) => s.bookmarks);
  const toggleShortlist = usePersonal((s) => s.toggleShortlist);
  const hydrated = usePersonal((s) => s.hydrated);
  const chosen = universities.filter((uni) => shortlist.includes(uni.id));
  const saved = universities.filter((uni) => bookmarks.includes(uni.id) && !shortlist.includes(uni.id));

  return (
    <div>
      <PageHead
        kicker="Personal"
        title="My shortlist"
        lede="Preferred universities for this season. Saved bookmarks that are not on the shortlist sit underneath. Both stay in this browser."
      />
      {!hydrated ? <p className="font-mono text-xs text-mute">RESTORING THIS DESK…</p> : null}
      {chosen.length === 0 ? (
        <p className="border border-ink p-4 text-sm">
          The shortlist is empty. Open a university and press Shortlist. The directory is at{" "}
          <Link to="/universities" className="underline">
            All universities
          </Link>
          .
        </p>
      ) : (
        <ol className="divide-y divide-ink border-y border-ink">
          {chosen.map((uni, index) => {
            const circular = circulars.find((item) => item.universityId === uni.id) ?? null;
            const next = circular ? nextRelevantDay(circular) : null;
            return (
              <li key={uni.id} className="grid gap-3 py-4 md:grid-cols-[3rem_8rem_1fr_auto] md:items-start">
                <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
                <Link to="/universities/$id" params={{ id: uni.id }} className="font-display text-4xl font-bold uppercase leading-none">
                  {uni.shortName}
                </Link>
                <div>
                  <Link to="/universities/$id" params={{ id: uni.id }} className="text-sm">
                    {uni.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {circular ? <StatusPill status={deriveStatus(circular)} /> : <span className="font-mono text-xs text-mute">NOT ANNOUNCED</span>}
                    <span className="font-mono text-xs">{next ? formatDay(next) : "NO DATE ON FILE"}</span>
                  </div>
                  <div className="mt-3 max-w-xl">
                    <NoteBox id={uni.id} label="Note" />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!hydrated}
                  onClick={() => toggleShortlist(uni.id)}
                  className="h-11 border border-ink px-3 font-mono text-xs tracking-widest"
                >
                  REMOVE
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {saved.length ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl font-bold uppercase">Saved, not shortlisted</h2>
          <ul className="mt-3 divide-y divide-ink border-y border-ink">
            {saved.map((uni) => (
              <li key={uni.id} className="flex items-center justify-between gap-3 py-3">
                <Link to="/universities/$id" params={{ id: uni.id }}>
                  <span className="font-display text-2xl font-bold uppercase">{uni.shortName}</span>
                  <span className="ml-3 text-sm">{uni.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
