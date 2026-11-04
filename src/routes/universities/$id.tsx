import { Link, createFileRoute } from "@tanstack/react-router";
import { AmendUniversity } from "@/components/amend";
import { NoteBox, ProgressSelect, RecordActions } from "@/components/actions";
import { Announced, EvidenceStamp, ExternalLink, Fact, Monogram, SectionLabel, StatusPill } from "@/components/marks";
import { TRACK_LABEL } from "@/data/types";
import { blankCircular, useCatalog } from "@/lib/catalog";
import { usePersonal } from "@/lib/store";
import { deriveStatus, eventsFor } from "@/lib/status";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/universities/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id.toUpperCase()} — ADMISSION//26` }] }),
  component: UniversityPage,
});

function UniversityPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { universities, circulars } = useCatalog();
  const addCircular = usePersonal((s) => s.addCircular);
  const hideUniversity = usePersonal((s) => s.hideUniversity);
  const uni = universities.find((item) => item.id === id);
  if (!uni) {
    return (
      <div>
        <h1 className="font-display text-5xl font-bold uppercase">Not in the directory</h1>
        <Link to="/universities" className="mt-4 inline-block font-mono text-sm underline">
          Back to all universities
        </Link>
      </div>
    );
  }
  const related = circulars.filter((item) => item.universityId === uni.id);
  const primary = related[0] ?? null;
  const timeline = primary ? eventsFor(primary) : [];

  return (
    <article>
      <p className="font-mono text-xs tracking-widest text-mute">
        <Link to="/universities" className="underline underline-offset-4">
          ALL UNIVERSITIES
        </Link>
        {" / "}
        {uni.id.toUpperCase()}
      </p>
      <div className="mt-4 flex flex-col gap-4 border-b border-ink pb-6 md:flex-row md:items-end">
        <Monogram text={uni.shortName} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-6xl font-bold uppercase leading-none md:text-8xl">{uni.shortName}</h1>
          <p className="mt-2 text-lg">{uni.name}</p>
          {uni.nameBn ? <p className="text-sm text-mute">{uni.nameBn}</p> : null}
          <p className="mt-2 font-mono text-xs tracking-widest text-mute">
            {TRACK_LABEL[uni.track].toUpperCase()} · {uni.city.toUpperCase() || "CITY NOT LOGGED"} ·{" "}
            {uni.kind === "system" ? "SYSTEM" : "INSTITUTION"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RecordActions universityId={uni.id} circularId={primary?.id} />
        <button
          type="button"
          className="h-11 border border-ink px-3 font-display text-sm font-semibold uppercase tracking-widest hover:bg-ink hover:text-paper"
          onClick={() => {
            const circular = blankCircular(uni.id, `${uni.shortName} admission 2026–27`);
            addCircular(circular);
            void navigate({ to: "/circulars/$id", params: { id: circular.id } });
          }}
        >
          Log a circular
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <SectionLabel>Admission timeline</SectionLabel>
          {timeline.length === 0 ? (
            <p className="mt-4 border border-ink p-4 text-sm">
              No notice is on file for this record. Application dates, the admit card, the test and the fee are{" "}
              <span className="font-mono">NOT ANNOUNCED</span>.
            </p>
          ) : (
            <ol className="mt-4 border-t border-ink">
              {timeline.map((event, index) => (
                <li key={event.id} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-ink py-3">
                  <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-mono text-sm">{event.day ? event.label : event.label}</span>
                    <Announced day={event.day} time={event.time} />
                  </span>
                </li>
              ))}
            </ol>
          )}

          {primary ? (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={deriveStatus(primary)} />
                <EvidenceStamp circular={primary} />
              </div>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none">
                <Link to="/circulars/$id" params={{ id: primary.id }} className="hover:text-accent">
                  {primary.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-3xl text-sm text-pretty">{primary.summary}</p>
            </div>
          ) : null}

          {primary && primary.units.length ? (
            <div className="mt-8">
              <SectionLabel>Unit-wise requirements</SectionLabel>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-y border-ink font-mono text-xs tracking-widest text-mute">
                      <th className="py-2 pr-3 font-medium">UNIT</th>
                      <th className="py-2 pr-3 font-medium">WHAT IS KNOWN</th>
                      <th className="py-2 pr-3 font-medium">EXAM</th>
                      <th className="py-2 font-medium">CENTRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {primary.units.map((unit) => (
                      <tr key={unit.code} className="border-b border-ink align-top">
                        <td className="py-3 pr-3 font-display text-2xl font-bold uppercase">{unit.code}</td>
                        <td className="py-3 pr-3">{unit.detail || "NOT ANNOUNCED"}</td>
                        <td className="py-3 pr-3">
                          <Announced day={unit.examDate} time={unit.examTime} />
                        </td>
                        <td className="py-3">{unit.centre || "NOT ANNOUNCED"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <SectionLabel>Eligibility</SectionLabel>
            {primary && primary.eligibility.length ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {primary.eligibility.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-mono text-sm text-mute">NOT ANNOUNCED</p>
            )}
          </div>
        </div>

        <aside className="border border-ink p-4">
          <h2 className="font-display text-2xl font-bold uppercase">Record</h2>
          <Fact label="Application status">{primary ? <StatusPill status={deriveStatus(primary)} /> : "NOT ANNOUNCED"}</Fact>
          <Fact label="Opens">
            <Announced day={primary?.applicationOpens ?? null} time={primary?.opensAt} />
          </Fact>
          <Fact label="Closes">
            <Announced day={primary?.applicationCloses ?? null} time={primary?.closesAt} />
          </Fact>
          <Fact label="Admit card">
            <Announced day={primary?.admitCardOn ?? null} />
          </Fact>
          <Fact label="Fee">
            {primary?.feeBdt == null ? (
              <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
            ) : (
              <span className="font-mono text-sm">BDT {primary.feeBdt.toLocaleString("en-BD")}</span>
            )}
          </Fact>
          <Fact label="Seats">
            {primary?.seats == null ? (
              <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
            ) : (
              <span className="font-mono text-sm">{primary.seats.toLocaleString("en-BD")}</span>
            )}
          </Fact>
          <Fact label="Official website">
            {uni.website ? <ExternalLink href={uni.website}>{uni.website.replace(/^https?:\/\//, "")}</ExternalLink> : "NOT LISTED"}
          </Fact>
          <Fact label="Application portal">
            {uni.admissionUrl ? (
              <ExternalLink href={uni.admissionUrl}>{uni.admissionUrl.replace(/^https?:\/\//, "")}</ExternalLink>
            ) : (
              <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>
            )}
          </Fact>
          <Fact label="Official PDF">
            {primary?.pdfUrl ? (
              <ExternalLink href={primary.pdfUrl}>Open PDF</ExternalLink>
            ) : (
              <span className="font-mono text-sm text-mute">NOT ON FILE</span>
            )}
          </Fact>
          {uni.directoryNote ? <p className="mt-4 text-sm text-pretty">{uni.directoryNote}</p> : null}
        </aside>
      </div>

      <div className="mt-8 grid gap-6">
        <NoteBox id={uni.id} label="Personal note — stays on this computer" />
        {primary ? (
          <label className="max-w-sm">
            <span className="font-mono text-xs tracking-widest text-mute">APPLICATION PROGRESS</span>
            <ProgressSelect id={primary.id} />
          </label>
        ) : null}
        <AmendUniversity university={uni} />
        <button
          type="button"
          className="h-11 w-fit border border-ink px-3 font-mono text-xs tracking-widest text-accent"
          onClick={() => {
            if (confirm(`Hide ${uni.shortName} from this desk?`)) {
              hideUniversity(uni.id);
              void navigate({ to: "/universities" });
            }
          }}
        >
          HIDE FROM DIRECTORY
        </button>
      </div>
    </article>
  );
}
