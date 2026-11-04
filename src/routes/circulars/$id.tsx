import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AmendCircular } from "@/components/amend";
import { NoteBox, ProgressSelect, RecordActions } from "@/components/actions";
import { Announced, EvidenceStamp, ExternalLink, Fact, SectionLabel, StatusPill } from "@/components/marks";
import { useCatalog } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { usePublishedReport } from "@/lib/published-report";
import { usePersonal } from "@/lib/store";
import { deriveStatus, eventsFor } from "@/lib/status";

export const Route = createFileRoute("/circulars/$id")({
  head: () => ({ meta: [{ title: "Circular — ADMISSION//26" }] }),
  component: CircularPage,
});

function CircularPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { circulars, byId } = useCatalog();
  const hideCircular = usePersonal((s) => s.hideCircular);
  const verifiedOn = usePersonal((s) => s.verifiedOn);
  const decisions = usePersonal((s) => s.proposalDecisions);
  const appliedAll = usePublishedReport((s) => s.report?.applied);
  const applied = (appliedAll ?? []).filter((item) => item.circularId === id && item.reliable && decisions[item.id] !== "rejected");
  const amended = usePersonal((s) => Boolean(s.circularPatches[id]) || s.customCirculars.some((item) => item.id === id));
  const circular = circulars.find((item) => item.id === id);
  if (!circular) {
    return (
      <div>
        <h1 className="font-display text-5xl font-bold uppercase">Circular not on file</h1>
        <Link to="/circulars" className="mt-4 inline-block font-mono text-sm underline">
          Back to the archive
        </Link>
      </div>
    );
  }
  const uni = byId.get(circular.universityId);
  const timeline = eventsFor(circular);

  return (
    <article>
      <p className="font-mono text-xs tracking-widest text-mute">
        <Link to="/circulars" className="underline underline-offset-4">
          CIRCULAR ARCHIVE
        </Link>
        {uni ? (
          <>
            {" / "}
            <Link to="/universities/$id" params={{ id: uni.id }} className="underline underline-offset-4">
              {uni.shortName}
            </Link>
          </>
        ) : null}
      </p>
      <header className="mt-4 border-b border-ink pb-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill status={deriveStatus(circular)} />
          <EvidenceStamp circular={circular} />
          {amended ? <span className="font-mono text-xs tracking-widest text-accent">DESK COPY</span> : null}
          {applied.length ? (
            <span className="font-mono text-xs tracking-widest text-signal">STRUCTURED OVERLAY</span>
          ) : null}
        </div>
        <p className="mt-4 font-display text-5xl font-bold uppercase leading-none md:text-7xl">{uni?.shortName}</p>
        <h1 className="mt-2 max-w-4xl font-display text-3xl font-semibold uppercase leading-tight md:text-5xl">{circular.title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-pretty">{circular.summary}</p>
      </header>

      <div className="mt-4">
        <RecordActions universityId={uni?.id} circularId={circular.id} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <SectionLabel>Timeline</SectionLabel>
          <ol className="mt-4 border-t border-ink">
            {timeline.map((event, index) => (
              <li key={event.id} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-ink py-3 md:grid-cols-[2.5rem_14rem_1fr]">
                <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
                <Announced day={event.day} time={event.time} />
                <span className="text-sm">{event.label}</span>
              </li>
            ))}
            {!circular.admitCardOn ? (
              <li className="grid grid-cols-[2.5rem_1fr] border-b border-ink py-3">
                <span className="font-mono text-xs text-mute">—</span>
                <span>
                  <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
                  <span className="mt-1 block text-sm">Admit card</span>
                </span>
              </li>
            ) : null}
          </ol>

          <div className="mt-8">
            <SectionLabel>Eligibility</SectionLabel>
            {circular.eligibility.length ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {circular.eligibility.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-mono text-sm text-mute">NOT ANNOUNCED</p>
            )}
          </div>

          {circular.units.length ? (
            <div className="mt-8">
              <SectionLabel>Units</SectionLabel>
              <ul className="mt-3 divide-y divide-ink border-y border-ink">
                {circular.units.map((unit) => (
                  <li key={unit.code} className="grid gap-1 py-3 md:grid-cols-[6rem_1fr]">
                    <span className="font-display text-2xl font-bold uppercase">{unit.code}</span>
                    <span>
                      <span className="block text-sm">{unit.detail || "NOT ANNOUNCED"}</span>
                      <span className="mt-1 block font-mono text-xs text-mute">
                        {formatDay(unit.examDate)}
                        {unit.examTime ? ` · ${unit.examTime}` : ""} · {unit.centre || "CENTRE NOT STATED"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {circular.notes.length ? (
            <div className="mt-8">
              <SectionLabel>Desk notes from the source</SectionLabel>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {circular.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8">
            <SectionLabel>Sources</SectionLabel>
            <p className="mt-3 text-sm">{circular.confidenceNote}</p>
            {circular.sources.length === 0 ? (
              <p className="mt-3 font-mono text-sm text-mute">NO SOURCE URL LOGGED</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink border-y border-ink">
                {circular.sources.map((source) => (
                  <li key={source.url} className="py-3">
                    <ExternalLink href={source.url}>{source.label}</ExternalLink>
                    <p className="mt-1 font-mono text-xs text-mute">PUBLISHED {formatDay(source.published)}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 font-mono text-xs text-mute">
              LAST CITED {formatDay(circular.updatedOn)}
              {verifiedOn[circular.id] ? ` · MARKED VERIFIED ON THIS DESK ${formatDay(verifiedOn[circular.id])}` : " · NOT VERIFIED ON THIS DESK"}
            </p>
          </div>
        </div>

        <aside className="h-fit border border-ink p-4">
          <h2 className="font-display text-2xl font-bold uppercase">Docket</h2>
          <Fact label="Session">{circular.session}</Fact>
          <Fact label="Opens">
            <Announced day={circular.applicationOpens} time={circular.opensAt} />
          </Fact>
          <Fact label="Closes">
            <Announced day={circular.applicationCloses} time={circular.closesAt} />
          </Fact>
          <Fact label="Admit card">
            <Announced day={circular.admitCardOn} />
          </Fact>
          <Fact label="Result">
            <Announced day={circular.resultOn} />
          </Fact>
          <Fact label="Classes">
            <Announced day={circular.classesBegin} />
          </Fact>
          <Fact label="Fee">
            {circular.feeBdt == null ? (
              <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
            ) : (
              <span className="font-mono text-sm">
                BDT {circular.feeBdt.toLocaleString("en-BD")} {circular.feeNote}
              </span>
            )}
          </Fact>
          <Fact label="Seats">
            {circular.seats == null ? <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span> : circular.seats}
          </Fact>
          <Fact label="Official PDF">
            {circular.pdfUrl ? <ExternalLink href={circular.pdfUrl}>Open PDF</ExternalLink> : <span className="font-mono text-sm text-mute">NOT ON FILE</span>}
          </Fact>
          <Fact label="Application portal">
            {uni?.admissionUrl ? (
              <ExternalLink href={uni.admissionUrl}>Open portal</ExternalLink>
            ) : (
              <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
            )}
          </Fact>
        </aside>
      </div>

      <div className="mt-8 grid max-w-xl gap-4">
        <label>
          <span className="font-mono text-xs tracking-widest text-mute">YOUR PROGRESS</span>
          <ProgressSelect id={circular.id} />
        </label>
        <NoteBox id={circular.id} label="Personal note" />
      </div>
      <div className="mt-6">
        <AmendCircular circular={circular} />
      </div>
      <button
        type="button"
        className="mt-4 h-11 border border-ink px-3 font-mono text-xs tracking-widest text-accent"
        onClick={() => {
          if (confirm("Remove this circular from the desk?")) {
            hideCircular(circular.id);
            void navigate({ to: "/circulars" });
          }
        }}
      >
        REMOVE FROM ARCHIVE
      </button>
    </article>
  );
}
