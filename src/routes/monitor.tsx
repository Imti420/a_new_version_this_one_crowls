import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, PageHead, TextButton } from "@/components/marks";
import { sourceManifest } from "@/data/source-manifest";
import type { Circular } from "@/data/types";
import { checkSourceBatch } from "@/lib/check-now";
import { isCustomCircular } from "@/lib/catalog";
import { formatDay } from "@/lib/dates";
import { usePublishedReport } from "@/lib/published-report";
import { usePersonal } from "@/lib/store";
import {
  DATE_FIELDS,
  assembleReport,
  isISODate,
  isMonitorStale,
  notCheckedSource,
  type Proposal,
  type SourceCheck,
  type VerificationReport,
} from "@/lib/verify-engine";

export const Route = createFileRoute("/monitor")({
  head: () => ({ meta: [{ title: "Information monitor — ADMISSION//26" }] }),
  component: MonitorPage,
});

function MonitorPage() {
  const published = usePublishedReport((s) => s.report);
  const phase = usePublishedReport((s) => s.phase);
  const reload = usePublishedReport((s) => s.load);
  const decisions = usePersonal((s) => s.proposalDecisions);
  const decideProposal = usePersonal((s) => s.decideProposal);
  const saveCircular = usePersonal((s) => s.saveCircular);
  const [desk, setDesk] = useState<VerificationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [includeCited, setIncludeCited] = useState(false);
  const [message, setMessage] = useState("");

  const listed = useMemo(() => sourceManifest.sources.map(notCheckedSource), []);
  const report = phase === "ready" ? published : null;
  const stale = phase !== "loading" && (phase !== "ready" || isMonitorStale(report?.generatedAt ?? null));

  const checkNow = async () => {
    const targets = sourceManifest.sources.filter((source) => includeCited || source.kind !== "cited-report");
    setRunning(true);
    setMessage("");
    setDesk(null);
    const classified = [];
    try {
      for (let index = 0; index < targets.length; index += 5) {
        const batch = targets.slice(index, index + 5);
        setProgress(`CHECKING ${Math.min(index + batch.length, targets.length)} / ${targets.length}. A failed batch is not recorded as clear.`);
        try {
          const response = await checkSourceBatch({ data: { ids: batch.map((source) => source.id) } });
          for (const item of response.results) {
            if (item.missing) continue;
            classified.push(reconcile(item.classified, report));
          }
        } catch (error) {
          const note = error instanceof Error ? error.message : "Desk check failed";
          for (const source of batch) {
            const blank = notCheckedSource(source);
            classified.push({
              check: { ...blank, status: "check_failed" as const, checkedAt: new Date().toISOString(), error: note, note: "This batch failed. It was not marked successful." },
              proposals: [],
              applied: [],
              changelog: [],
              snapshot: null,
            });
          }
        }
      }
      const next = assembleReport({
        classified,
        previousChangelog: [],
        now: new Date().toISOString(),
        runner: "desk",
        note: "Desk check from this browser session. It does not replace the published report, and it does not prove a date that was not structured.",
      });
      setDesk(next);
      for (const item of next.applied) {
        writeProposal(item, saveCircular);
        decideProposal(item.id, "approved");
      }
      if (next.applied.length) {
        setMessage(`${next.applied.length} structured official value${next.applied.length === 1 ? "" : "s"} applied on this desk. Unconfirmed findings were not written.`);
      }
    } finally {
      setRunning(false);
      setProgress("");
    }
  };

  return (
    <div>
      <PageHead
        kicker="Intelligence"
        title="Information monitor"
        lede="Compares official pages and cited sources with the archive. A page that answers is fingerprinted. That is not the same thing as a confirmed admission date."
        aside={
          <div className="flex flex-col items-start gap-2">
            <TextButton onClick={() => void checkNow()} disabled={running}>
              {running ? "Checking" : "Check now"}
            </TextButton>
            <label className="flex items-center gap-2 font-mono text-xs">
              <input type="checkbox" checked={includeCited} onChange={(event) => setIncludeCited(event.target.checked)} />
              INCLUDE CITED REPORTS
            </label>
          </div>
        }
      />

      {stale ? (
        <p className="border border-accent p-4 font-mono text-xs tracking-widest text-accent">
          {phase === "ready"
            ? `LAST PUBLISHED CHECK ${report?.generatedAt ?? "UNKNOWN"}. THE 12-HOUR JOB LOOKS STOPPED OR LATE.`
            : "NO PUBLISHED VERIFICATION REPORT. NOTHING BELOW IS A SUCCESSFUL CHECK."}
        </p>
      ) : (
        <p className="border border-ink p-4 font-mono text-xs tracking-widest">
          PUBLISHED {report?.generatedAt} · RUNNER {report?.runner?.toUpperCase()} · SCHEDULE EVERY {report?.scheduleHours}H
        </p>
      )}
      {progress ? <p className="mt-3 font-mono text-xs">{progress}</p> : null}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}

      <Stats report={report} listed={listed.length} universities={new Set(sourceManifest.sources.flatMap((source) => source.universityIds)).size} />

      <section className="mt-8">
        <h2 className="font-display text-4xl font-bold uppercase">Review required</h2>
        <p className="mt-2 max-w-3xl text-sm">Approving a date writes it on this desk only. Rejecting leaves the stored record alone. Page fingerprints cannot be approved into a date.</p>
        <ProposalTable
          rows={(report?.proposals ?? []).filter((item) => decisions[item.id] !== "rejected")}
          decisions={decisions}
          onApprove={(item) => {
            const wrote = writeProposal(item, saveCircular);
            if (!wrote && item.field !== "page") {
              setMessage("That value is not a date or fee this archive can store. Nothing was written.");
              return;
            }
            decideProposal(item.id, "approved");
            setMessage(item.field === "page" ? "Page change acknowledged. No admission field was changed." : "Approved on this desk.");
          }}
          onReject={(item) => {
            decideProposal(item.id, "rejected");
            setMessage("Rejected. The stored record was not replaced.");
          }}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-4xl font-bold uppercase">Change log</h2>
        <div className="mt-3 overflow-x-auto border border-ink">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-ink font-mono text-xs tracking-widest text-mute">
              <tr>
                <th className="p-2 font-medium">UNIVERSITY</th>
                <th className="p-2 font-medium">FIELD</th>
                <th className="p-2 font-medium">PREVIOUS</th>
                <th className="p-2 font-medium">DETECTED</th>
                <th className="p-2 font-medium">STATUS</th>
                <th className="p-2 font-medium">WHEN</th>
              </tr>
            </thead>
            <tbody>
              {(report?.changelog ?? []).length === 0 ? (
                <tr>
                  <td className="p-3 text-mute" colSpan={6}>No changes have been published.</td>
                </tr>
              ) : (
                report?.changelog.map((entry) => (
                  <tr key={entry.id} className="border-t border-ink align-top">
                    <td className="p-2">{entry.universityName}</td>
                    <td className="p-2 font-mono text-xs">{entry.field}</td>
                    <td className="p-2">{entry.previousValue}</td>
                    <td className="p-2">{entry.detectedValue}</td>
                    <td className="p-2 font-mono text-xs">{entry.verificationStatus === "auto_applied" ? "AUTO APPLIED" : "REVIEW REQUIRED"}</td>
                    <td className="p-2 font-mono text-xs">
                      {entry.detectedAt.slice(0, 16).replace("T", " ")}
                      <span className="mt-1 block">
                        <ExternalLink href={entry.sourceUrl}>SOURCE</ExternalLink>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <UniversityTable sources={report?.sources ?? listed} checked={phase === "ready"} />

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-4xl font-bold uppercase">This browser</h2>
          <button type="button" className="font-mono text-xs underline" onClick={() => void reload()}>
            RELOAD PUBLISHED REPORT
          </button>
        </div>
        {!desk ? <p className="mt-3 text-sm">Check now has not been run in this session. The figures above are only the published file.</p> : <DeskResult report={desk} />}
      </section>
    </div>
  );
}

function Stats({ report, listed, universities }: { report: VerificationReport | null; listed: number; universities: number }) {
  const cards = report
    ? [
        ["Universities monitored", String(report.summary.monitoredUniversities).padStart(2, "0"), "Distinct institutions in the source list"],
        ["Sources reached", String(report.summary.reached).padStart(2, "0"), "Fetched and fingerprinted. Not date-confirmed."],
        ["Review required", String(report.summary.reviewRequired).padStart(2, "0"), "Possible changes held for a person"],
        ["Failed attempts", String(report.summary.failed).padStart(2, "0"), "Unreachable, refused, or unreadable"],
        ["Unchanged fingerprint", String(report.summary.unchanged).padStart(2, "0"), "Same bytes as the previous check"],
        ["Structured updates", String(report.summary.structuredApplied).padStart(2, "0"), "Official machine-readable values only"],
      ]
    : [
        ["Universities on the list", String(universities).padStart(2, "0"), "Not checked"],
        ["Sources on the list", String(listed).padStart(2, "0"), "Not checked"],
        ["Sources reached", "—", "No published report"],
        ["Review required", "—", "No published report"],
        ["Failed attempts", "—", "Absence of a report is not a pass"],
        ["Structured updates", "—", "None published"],
      ];
  return (
    <section className="mt-6 grid border border-ink md:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, value, hint]) => (
        <article key={label} className="border-ink border-r border-b p-3">
          <p className="font-display text-5xl font-bold leading-none tabular-nums">{value}</p>
          <h2 className="mt-2 font-display text-lg font-semibold uppercase leading-none">{label}</h2>
          <p className="mt-2 font-mono text-xs text-mute">{hint}</p>
        </article>
      ))}
    </section>
  );
}

function ProposalTable({
  rows,
  decisions,
  onApprove,
  onReject,
}: {
  rows: Proposal[];
  decisions: Record<string, "approved" | "rejected">;
  onApprove: (item: Proposal) => void;
  onReject: (item: Proposal) => void;
}) {
  if (rows.length === 0) return <p className="mt-3 border border-ink p-4 text-sm">No open review items in the published report.</p>;
  return (
    <ol className="mt-3 divide-y divide-ink border-y border-ink">
      {rows.map((item) => (
        <li key={item.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_16rem]">
          <div>
            <p className="font-mono text-xs tracking-widest text-signal">{item.reliable ? "STRUCTURED" : "UNCONFIRMED"} · {decisions[item.id] === "approved" ? "APPROVED ON THIS DESK" : "REVIEW REQUIRED"}</p>
            <h3 className="mt-1 font-display text-3xl font-bold uppercase leading-none">{item.universityName}</h3>
            <p className="mt-2 text-sm">
              {item.field}: {item.previousValue} → {item.detectedValue}
            </p>
            <p className="mt-1 text-sm text-mute">{item.note}</p>
            <p className="mt-2 font-mono text-xs">
              <ExternalLink href={item.sourceUrl}>SOURCE</ExternalLink>
              {item.circularId ? (
                <>
                  {" · "}
                  <Link to="/circulars/$id" params={{ id: item.circularId }} className="underline">CIRCULAR</Link>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <TextButton onClick={() => onApprove(item)} disabled={decisions[item.id] === "approved"}>Approve</TextButton>
            <TextButton tone="ghost" onClick={() => onReject(item)}>Reject</TextButton>
          </div>
        </li>
      ))}
    </ol>
  );
}

function UniversityTable({ sources, checked }: { sources: SourceCheck[]; checked: boolean }) {
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; shortName: string; sources: SourceCheck[] }>();
    for (const source of sources) {
      const ids = source.universityIds.length ? source.universityIds : [source.primaryUniversityId];
      ids.forEach((id, index) => {
        const current = map.get(id) ?? {
          name: index === 0 ? source.primaryName : id.toUpperCase(),
          shortName: index === 0 ? source.shortName : id.toUpperCase(),
          sources: [],
        };
        if (id === source.primaryUniversityId) {
          current.name = source.primaryName;
          current.shortName = source.shortName;
        }
        current.sources.push(source);
        map.set(id, current);
      });
    }
    return [...map.entries()].sort((a, b) => a[1].shortName.localeCompare(b[1].shortName));
  }, [sources]);

  return (
    <section className="mt-8">
      <h2 className="font-display text-4xl font-bold uppercase">Last checked</h2>
      <div className="mt-3 overflow-x-auto border border-ink">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-ink font-mono text-xs tracking-widest text-mute">
            <tr>
              <th className="p-2 font-medium">UNIVERSITY</th>
              <th className="p-2 font-medium">LAST CHECK</th>
              <th className="p-2 font-medium">RESULT</th>
              <th className="p-2 font-medium">SOURCES</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, row]) => {
              const times = row.sources.map((source) => source.checkedAt).filter((value): value is string => Boolean(value)).sort();
              const last = times.at(-1) ?? null;
              const failed = row.sources.filter((source) => source.status === "check_failed").length;
              const reached = row.sources.filter((source) => source.status !== "check_failed" && source.status !== "not_checked").length;
              let result = "NOT CHECKED";
              if (checked && failed === row.sources.length) result = "CHECK FAILED";
              else if (checked && failed > 0 && reached > 0) result = "PARTIAL";
              else if (checked && reached === row.sources.length && reached > 0) result = "REACHED";
              return (
                <tr key={id} className="border-t border-ink">
                  <td className="p-2">
                    <Link to="/universities/$id" params={{ id }} className="font-display text-2xl font-bold uppercase">{row.shortName}</Link>
                  </td>
                  <td className="p-2 font-mono text-xs">{last ? formatDay(last.slice(0, 10)) : "—"}</td>
                  <td className="p-2 font-mono text-xs">{result}</td>
                  <td className="p-2 font-mono text-xs text-mute">{reached} REACHED · {failed} FAILED · {row.sources.length} LISTED</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeskResult({ report }: { report: VerificationReport }) {
  return (
    <div className="mt-3 border border-ink p-4">
      <p className="font-mono text-xs tracking-widest text-mute">DESK RUN {report.generatedAt} · NOT THE SCHEDULED JOB</p>
      <p className="mt-2 text-sm">{report.note}</p>
      <p className="mt-3 font-mono text-xs">
        REACHED {report.summary.reached} · FAILED {report.summary.failed} · REVIEW {report.summary.reviewRequired} · STRUCTURED {report.summary.structuredApplied}
      </p>
      <ul className="mt-3 divide-y divide-ink border-y border-ink">
        {report.proposals.slice(0, 8).map((item) => (
          <li key={item.id} className="py-2 text-sm">
            <span className="font-mono text-xs text-signal">UNVERIFIED</span> {item.universityName} · {item.field} · {item.previousValue} → {item.detectedValue}
          </li>
        ))}
        {report.proposals.length === 0 ? <li className="py-2 text-sm">No unconfirmed discoveries in this desk run.</li> : null}
      </ul>
    </div>
  );
}

function reconcile<T extends { check: SourceCheck; applied: Proposal[] }>(classified: T, published: VerificationReport | null): T {
  const previous = published?.sources.find((source) => source.sourceId === classified.check.sourceId);
  if (!previous?.contentHash || !classified.check.contentHash) return classified;
  if (previous.contentHash === classified.check.contentHash && classified.check.status === "fingerprinted") {
    return {
      ...classified,
      check: {
        ...classified.check,
        status: "unchanged" as const,
        previousHash: previous.contentHash,
        note: "Fingerprint matches the published report. Matching bytes are not a fresh confirmation of each admission date.",
      },
    };
  }
  if (previous.contentHash !== classified.check.contentHash) {
    return {
      ...classified,
      check: {
        ...classified.check,
        status: classified.applied.length ? ("structured_applied" as const) : ("changed" as const),
        previousHash: previous.contentHash,
      },
    };
  }
  return classified;
}

function writeProposal(item: Proposal, saveCircular: (id: string, patch: Partial<Circular>, custom: boolean) => void): boolean {
  if (!item.circularId || item.field === "page") return item.field === "page";
  if ((DATE_FIELDS as readonly string[]).includes(item.field)) {
    if (!isISODate(item.detectedValue)) return false;
    saveCircular(item.circularId, { [item.field]: item.detectedValue } as Partial<Circular>, isCustomCircular(item.circularId));
    return true;
  }
  if (item.field === "feeBdt") {
    const fee = Number(item.detectedValue);
    if (!Number.isInteger(fee)) return false;
    saveCircular(item.circularId, { feeBdt: fee }, isCustomCircular(item.circularId));
    return true;
  }
  if (item.field === "eligibility") {
    const lines = item.detectedValue.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return false;
    saveCircular(item.circularId, { eligibility: lines }, isCustomCircular(item.circularId));
    return true;
  }
  return false;
}
