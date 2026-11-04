export const DATE_FIELDS = [
  "applicationOpens",
  "applicationCloses",
  "examDate",
  "admitCardOn",
  "resultOn",
  "classesBegin",
] as const;

export const FACT_FIELDS = [...DATE_FIELDS, "feeBdt", "eligibility"] as const;

export type DateField = (typeof DATE_FIELDS)[number];
export type FactField = (typeof FACT_FIELDS)[number];

export type SourceKind = "official-site" | "admission-page" | "cited-report" | "pdf";

export type CheckStatus =
  | "not_checked"
  | "check_failed"
  | "fingerprinted"
  | "unchanged"
  | "changed"
  | "structured_applied";

export interface MonitorSource {
  id: string;
  url: string;
  kind: SourceKind;
  label: string;
  universityIds: string[];
  circularIds: string[];
  primaryUniversityId: string;
  primaryName: string;
  shortName: string;
  officialHosts: string[];
}

export interface StoredFact {
  circularId: string;
  universityId: string;
  universityName: string;
  shortName: string;
  applicationOpens: string | null;
  applicationCloses: string | null;
  examDate: string | null;
  admitCardOn: string | null;
  resultOn: string | null;
  classesBegin: string | null;
  feeBdt: number | null;
}

export interface SnapshotEntry {
  contentHash: string;
  etag: string | null;
  lastModified: string | null;
  checkedAt: string;
  httpStatus: number;
  finalUrl: string;
}

export interface SnapshotFile {
  version: 1;
  sources: Record<string, SnapshotEntry>;
}

export interface SourceCheck {
  sourceId: string;
  url: string;
  kind: SourceKind;
  label: string;
  universityIds: string[];
  circularIds: string[];
  primaryUniversityId: string;
  primaryName: string;
  shortName: string;
  status: CheckStatus;
  httpStatus: number | null;
  lastModified: string | null;
  etag: string | null;
  contentHash: string | null;
  previousHash: string | null;
  checkedAt: string | null;
  error: string | null;
  note: string;
}

export interface Proposal {
  id: string;
  sourceId: string;
  universityId: string;
  universityName: string;
  circularId: string | null;
  field: string;
  previousValue: string;
  detectedValue: string;
  sourceUrl: string;
  detectedAt: string;
  status: "review_required" | "auto_applied";
  reliable: boolean;
  note: string;
}

export interface ChangeLogEntry {
  id: string;
  universityId: string;
  universityName: string;
  field: string;
  previousValue: string;
  detectedValue: string;
  sourceUrl: string;
  detectedAt: string;
  verificationStatus: "review_required" | "auto_applied";
  note: string;
}

export interface ReportSummary {
  monitoredUniversities: number;
  monitoredSources: number;
  reached: number;
  unchanged: number;
  fingerprinted: number;
  changed: number;
  structuredApplied: number;
  reviewRequired: number;
  failed: number;
  notChecked: number;
}

export interface VerificationReport {
  version: 1;
  generatedAt: string | null;
  runner: "github-actions" | "manual-script" | "desk" | "none";
  scheduleHours: 12;
  note: string;
  summary: ReportSummary;
  sources: SourceCheck[];
  proposals: Proposal[];
  applied: Proposal[];
  changelog: ChangeLogEntry[];
}

export interface SourceManifest {
  version: 1;
  sources: MonitorSource[];
  facts: StoredFact[];
}

export interface FetchHit {
  httpStatus: number | null;
  finalUrl: string | null;
  etag: string | null;
  lastModified: string | null;
  contentType: string | null;
  bodyText: string | null;
  contentHash: string | null;
  error: string | null;
}

const MONTH: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const FIELD_WINDOW: { field: DateField; pattern: RegExp }[] = [
  { field: "applicationCloses", pattern: /deadline|last date|closing date|applications? close|close on|closes on/i },
  { field: "applicationOpens", pattern: /applications? open|opens on|opening date|apply from/i },
  { field: "admitCardOn", pattern: /admit card/i },
  { field: "examDate", pattern: /admission test|exam(?:ination)? date|test on|test date/i },
  { field: "resultOn", pattern: /result (?:on|date)|results published/i },
  { field: "classesBegin", pattern: /classes begin|class starts/i },
];

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function inSeason(iso: string): boolean {
  return isISODate(iso) && iso >= "2026-01-01" && iso <= "2027-12-31";
}

export async function sha256Text(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function visibleText(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/&#39;|'/gi, "'")
    .replace(/"/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function emptySummary(): ReportSummary {
  return {
    monitoredUniversities: 0,
    monitoredSources: 0,
    reached: 0,
    unchanged: 0,
    fingerprinted: 0,
    changed: 0,
    structuredApplied: 0,
    reviewRequired: 0,
    failed: 0,
    notChecked: 0,
  };
}

export function summarize(sources: SourceCheck[], proposals: Proposal[]): ReportSummary {
  const universities = new Set<string>();
  const summary = emptySummary();
  summary.monitoredSources = sources.length;
  for (const source of sources) {
    for (const id of source.universityIds) universities.add(id);
    if (source.status === "check_failed") summary.failed += 1;
    else if (source.status === "not_checked") summary.notChecked += 1;
    else if (source.status === "unchanged") {
      summary.reached += 1;
      summary.unchanged += 1;
    } else if (source.status === "fingerprinted") {
      summary.reached += 1;
      summary.fingerprinted += 1;
    } else if (source.status === "changed") {
      summary.reached += 1;
      summary.changed += 1;
    } else if (source.status === "structured_applied") {
      summary.reached += 1;
      summary.structuredApplied += 1;
    }
  }
  summary.monitoredUniversities = universities.size;
  summary.reviewRequired = proposals.filter((item) => item.status === "review_required").length;
  return summary;
}

export function isMonitorStale(generatedAt: string | null, now = new Date(), scheduleHours = 12): boolean {
  if (!generatedAt) return true;
  const then = Date.parse(generatedAt);
  if (Number.isNaN(then)) return true;
  const graceMs = (scheduleHours + 6) * 60 * 60 * 1000;
  return now.getTime() - then > graceMs;
}

export function isReport(value: unknown): value is VerificationReport {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<VerificationReport>;
  return record.version === 1 && Array.isArray(record.sources) && Array.isArray(record.proposals) && Array.isArray(record.applied);
}

function blankFact(): Omit<StoredFact, "circularId" | "universityId" | "universityName" | "shortName"> {
  return {
    applicationOpens: null,
    applicationCloses: null,
    examDate: null,
    admitCardOn: null,
    resultOn: null,
    classesBegin: null,
    feeBdt: null,
  };
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function hashId(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

export function parseCatalogSources(universitiesSource: string, circularsSource: string): SourceManifest {
  const unis = new Map<string, { name: string; shortName: string; website: string | null; admissionUrl: string | null }>();

  const uniRe =
    /U\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"[^"]+"\s*,\s*"[^"]*"\s*,\s*(null|"(https?:\/\/[^"]+)")/g;
  for (const match of universitiesSource.matchAll(uniRe)) {
    unis.set(match[1] ?? "", {
      name: match[2] ?? "",
      shortName: match[3] ?? "",
      website: match[5] ?? null,
      admissionUrl: null,
    });
  }

  const systemRe =
    /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?shortName:\s*"([^"]+)"[\s\S]*?website:\s*(null|"(https?:\/\/[^"]+)")[\s\S]*?admissionUrl:\s*(null|"(https?:\/\/[^"]+)")/g;
  for (const match of universitiesSource.matchAll(systemRe)) {
    unis.set(match[1] ?? "", {
      name: match[2] ?? "",
      shortName: match[3] ?? "",
      website: match[5] ?? null,
      admissionUrl: match[7] ?? null,
    });
  }

  const facts: StoredFact[] = [];
  const chunks = circularsSource.split(/\n {2}C\(\{/);
  for (const chunk of chunks) {
    const id = chunk.match(/id:\s*"([^"]+)"/)?.[1];
    const universityId = chunk.match(/universityId:\s*"([^"]+)"/)?.[1];
    if (!id || !universityId || !id.startsWith("c-")) continue;
    const uni = unis.get(universityId);
    const fact: StoredFact = {
      circularId: id,
      universityId,
      universityName: uni?.name ?? universityId,
      shortName: uni?.shortName ?? universityId.toUpperCase(),
      ...blankFact(),
    };
    for (const field of DATE_FIELDS) {
      const found = chunk.match(new RegExp(`${field}:\\s*"(20\\d{2}-\\d{2}-\\d{2})"`));
      fact[field] = found?.[1] ?? null;
    }
    const fee = chunk.match(/feeBdt:\s*(\d+)/);
    fact.feeBdt = fee ? Number(fee[1]) : null;
    facts.push(fact);
  }

  const byUrl = new Map<string, MonitorSource>();

  const ensure = (url: string, seed: Omit<MonitorSource, "universityIds" | "circularIds" | "officialHosts"> & { officialHosts?: string[] }) => {
    const existing = byUrl.get(url);
    if (existing) return existing;
    const created: MonitorSource = {
      ...seed,
      url,
      universityIds: [],
      circularIds: [],
      officialHosts: seed.officialHosts ?? [],
    };
    byUrl.set(url, created);
    return created;
  };

  for (const [id, uni] of unis) {
    const officialHosts = [hostOf(uni.website), hostOf(uni.admissionUrl)].filter((item): item is string => Boolean(item));
    if (uni.website) {
      const source = ensure(uni.website, {
        id: `site-${id}`,
        kind: "official-site",
        label: `${uni.shortName} official website`,
        primaryUniversityId: id,
        primaryName: uni.name,
        shortName: uni.shortName,
        officialHosts,
      });
      pushUnique(source.universityIds, id);
      for (const host of officialHosts) pushUnique(source.officialHosts, host);
    }
    if (uni.admissionUrl) {
      const source = ensure(uni.admissionUrl, {
        id: `admit-${id}`,
        kind: "admission-page",
        label: `${uni.shortName} admission page`,
        primaryUniversityId: id,
        primaryName: uni.name,
        shortName: uni.shortName,
        officialHosts,
      });
      pushUnique(source.universityIds, id);
      for (const host of officialHosts) pushUnique(source.officialHosts, host);
    }
  }

  for (const chunk of chunks) {
    const circularId = chunk.match(/id:\s*"([^"]+)"/)?.[1];
    const universityId = chunk.match(/universityId:\s*"([^"]+)"/)?.[1];
    if (!circularId || !universityId || !circularId.startsWith("c-")) continue;
    const uni = unis.get(universityId);
    const officialHosts = uni ? [hostOf(uni.website), hostOf(uni.admissionUrl)].filter((item): item is string => Boolean(item)) : [];
    const urls = [...chunk.matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)].map((match) => match[1] ?? "");
    for (const url of urls) {
      const source = ensure(url, {
        id: `src-${hashId(url)}`,
        kind: "cited-report",
        label: chunk.match(/label:\s*"([^"]+)"/)?.[1] ?? url,
        primaryUniversityId: universityId,
        primaryName: uni?.name ?? universityId,
        shortName: uni?.shortName ?? universityId.toUpperCase(),
        officialHosts: [],
      });
      pushUnique(source.universityIds, universityId);
      pushUnique(source.circularIds, circularId);
      if (source.kind === "cited-report") source.officialHosts = [];
    }
    const pdf = chunk.match(/pdfUrl:\s*"(https?:\/\/[^"]+)"/)?.[1];
    if (pdf) {
      const source = ensure(pdf, {
        id: `pdf-${hashId(pdf)}`,
        kind: "pdf",
        label: `${uni?.shortName ?? universityId} circular PDF`,
        primaryUniversityId: universityId,
        primaryName: uni?.name ?? universityId,
        shortName: uni?.shortName ?? universityId.toUpperCase(),
        officialHosts,
      });
      pushUnique(source.universityIds, universityId);
      pushUnique(source.circularIds, circularId);
    }
    for (const source of byUrl.values()) {
      if (source.kind !== "cited-report" && source.universityIds.includes(universityId)) {
        pushUnique(source.circularIds, circularId);
      }
    }
  }

  return { version: 1, sources: [...byUrl.values()], facts };
}

function factValue(fact: StoredFact, field: FactField): string {
  if (field === "eligibility") return "NOT ANNOUNCED";
  const value = fact[field];
  if (value == null || value === "") return "NOT ANNOUNCED";
  return String(value);
}

function datesOn(fact: StoredFact): Set<string> {
  const set = new Set<string>();
  for (const field of DATE_FIELDS) {
    const value = fact[field];
    if (value) set.add(value);
  }
  return set;
}

export function findDates(text: string): { iso: string; index: number }[] {
  const found: { iso: string; index: number }[] = [];
  const isoRe = /\b(20\d{2}-\d{2}-\d{2})\b/g;
  for (const match of text.matchAll(isoRe)) {
    const iso = match[1] ?? "";
    if (inSeason(iso)) found.push({ iso, index: match.index ?? 0 });
  }
  const dmy = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(20\d{2})\b/gi;
  for (const match of text.matchAll(dmy)) {
    const month = MONTH[(match[2] ?? "").toLowerCase()];
    const iso = `${match[3]}-${month}-${String(match[1]).padStart(2, "0")}`;
    if (inSeason(iso)) found.push({ iso, index: match.index ?? 0 });
  }
  const mdy = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi;
  for (const match of text.matchAll(mdy)) {
    const month = MONTH[(match[1] ?? "").toLowerCase()];
    const iso = `${match[3]}-${month}-${String(match[2]).padStart(2, "0")}`;
    if (inSeason(iso)) found.push({ iso, index: match.index ?? 0 });
  }
  return found;
}

function near(text: string, index: number, needle: string): boolean {
  const pad = 140;
  const slice = text.slice(Math.max(0, index - pad), Math.min(text.length, index + pad)).toLowerCase();
  return slice.includes(needle.toLowerCase());
}

interface StructuredNotice {
  circularId: string;
  field: FactField;
  value: string;
}

export function extractStructured(html: string): StructuredNotice[] {
  const out: StructuredNotice[] = [];
  const re = /<script[^>]*data-admission26=["']notice["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    try {
      const parsed = JSON.parse(match[1] ?? "");
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const record = item as { schema?: unknown; circularId?: unknown; field?: unknown; value?: unknown };
        if (record.schema !== "admission26.notice.v1") continue;
        if (typeof record.circularId !== "string" || typeof record.field !== "string") continue;
        if (!FACT_FIELDS.includes(record.field as FactField)) continue;
        const field = record.field as FactField;
        if (field === "feeBdt") {
          const fee = typeof record.value === "number" ? record.value : Number(record.value);
          if (!Number.isInteger(fee) || fee < 0 || fee > 20000) continue;
          out.push({ circularId: record.circularId, field, value: String(fee) });
          continue;
        }
        if (field === "eligibility") {
          if (!Array.isArray(record.value) || record.value.some((line) => typeof line !== "string" || !line.trim())) continue;
          out.push({ circularId: record.circularId, field, value: record.value.join("\n") });
          continue;
        }
        if (typeof record.value !== "string" || !isISODate(record.value)) continue;
        out.push({ circularId: record.circularId, field, value: record.value });
      }
    } catch {
      continue;
    }
  }
  return out;
}

function proposalId(sourceId: string, circularId: string | null, field: string, detected: string): string {
  return `${sourceId}:${circularId ?? "none"}:${field}:${detected}`;
}

export function classifySource(input: {
  source: MonitorSource;
  hit: FetchHit;
  previous: SnapshotEntry | null;
  facts: StoredFact[];
  now: string;
}): {
  check: SourceCheck;
  proposals: Proposal[];
  applied: Proposal[];
  changelog: ChangeLogEntry[];
  snapshot: SnapshotEntry | null;
} {
  const { source, hit, previous, facts, now } = input;
  const linked = facts.filter(
    (fact) => source.circularIds.includes(fact.circularId) || (source.circularIds.length === 0 && source.universityIds.includes(fact.universityId)),
  );
  const base: SourceCheck = {
    sourceId: source.id,
    url: source.url,
    kind: source.kind,
    label: source.label,
    universityIds: source.universityIds,
    circularIds: source.circularIds,
    primaryUniversityId: source.primaryUniversityId,
    primaryName: source.primaryName,
    shortName: source.shortName,
    status: "check_failed",
    httpStatus: hit.httpStatus,
    lastModified: hit.lastModified,
    etag: hit.etag,
    contentHash: hit.contentHash,
    previousHash: previous?.contentHash ?? null,
    checkedAt: now,
    error: hit.error,
    note: "",
  };

  const fail = (note: string, error: string | null = hit.error) => {
    base.status = "check_failed";
    base.note = note;
    base.error = error;
    base.contentHash = null;
    return { check: base, proposals: [], applied: [], changelog: [], snapshot: null };
  };

  if (hit.error || hit.httpStatus == null) {
    return fail("The source could not be reached. This is not evidence that nothing changed.");
  }
  if (hit.httpStatus === 304) {
    if (!previous?.contentHash) {
      return fail("The server returned 304 but this archive has no stored fingerprint to confirm.", "304 without a stored fingerprint");
    }
    base.status = "unchanged";
    base.contentHash = previous.contentHash;
    base.note = "The server reported the representation unchanged (304). Admission dates were not re-read from a body.";
    return {
      check: base,
      proposals: [],
      applied: [],
      changelog: [],
      snapshot: { ...previous, checkedAt: now, httpStatus: 304, etag: hit.etag ?? previous.etag, lastModified: hit.lastModified ?? previous.lastModified },
    };
  }
  if (hit.httpStatus !== 200) {
    return fail(`HTTP ${hit.httpStatus}. A response that is not a readable document is not a successful verification.`);
  }
  if (!hit.contentHash || hit.bodyText == null) {
    return fail("HTTP 200 with an empty or unreadable body. Not treated as unchanged.");
  }

  const official =
    source.kind !== "cited-report" &&
    source.kind !== "pdf" &&
    source.officialHosts.includes((hostOf(hit.finalUrl || source.url) ?? "").toLowerCase());

  const proposals: Proposal[] = [];
  const applied: Proposal[] = [];
  const changelog: ChangeLogEntry[] = [];

  const addProposal = (proposal: Proposal, auto: boolean) => {
    if (auto) {
      proposal.status = "auto_applied";
      proposal.reliable = true;
      applied.push(proposal);
    } else {
      proposal.status = "review_required";
      proposal.reliable = false;
      proposals.push(proposal);
    }
    changelog.push({
      id: proposal.id,
      universityId: proposal.universityId,
      universityName: proposal.universityName,
      field: proposal.field,
      previousValue: proposal.previousValue,
      detectedValue: proposal.detectedValue,
      sourceUrl: proposal.sourceUrl,
      detectedAt: proposal.detectedAt,
      verificationStatus: proposal.status,
      note: proposal.note,
    });
  };

  if (source.kind !== "pdf" && hit.bodyText) {
    for (const notice of extractStructured(hit.bodyText)) {
      const fact = linked.find((item) => item.circularId === notice.circularId);
      if (!fact) continue;
      const previousValue = factValue(fact, notice.field);
      if (previousValue === notice.value) continue;
      const proposal: Proposal = {
        id: proposalId(source.id, fact.circularId, notice.field, notice.value),
        sourceId: source.id,
        universityId: fact.universityId,
        universityName: fact.universityName,
        circularId: fact.circularId,
        field: notice.field,
        previousValue,
        detectedValue: notice.value,
        sourceUrl: hit.finalUrl || source.url,
        detectedAt: now,
        status: "review_required",
        reliable: false,
        note: official
          ? "Structured admission26.notice.v1 block on the official host. Safe to apply without replacing the seed by hand."
          : "A structured block was present, but this URL is not the official host. Held for review.",
      };
      addProposal(proposal, official);
    }

    if (source.kind !== "pdf") {
      const text = visibleText(hit.bodyText);
      const dates = findDates(text);
      let emitted = 0;
      for (const spot of dates) {
        if (emitted >= 4) break;
        const windowText = text.slice(Math.max(0, spot.index - 80), Math.min(text.length, spot.index + 80));
        const matched = FIELD_WINDOW.find((item) => item.pattern.test(windowText));
        if (!matched) continue;
        const targets = linked.filter((fact) => {
          if (linked.length === 1) return true;
          return near(text, spot.index, fact.shortName) || near(text, spot.index, fact.universityName);
        });
        for (const fact of targets) {
          if (datesOn(fact).has(spot.iso)) continue;
          const previousValue = factValue(fact, matched.field);
          if (previousValue === spot.iso) continue;
          const id = proposalId(source.id, fact.circularId, matched.field, spot.iso);
          if (proposals.some((item) => item.id === id) || applied.some((item) => item.id === id)) continue;
          addProposal(
            {
              id,
              sourceId: source.id,
              universityId: fact.universityId,
              universityName: fact.universityName,
              circularId: fact.circularId,
              field: matched.field,
              previousValue,
              detectedValue: spot.iso,
              sourceUrl: hit.finalUrl || source.url,
              detectedAt: now,
              status: "review_required",
              reliable: false,
              note: "A date near an admission phrase differed from the stored record. Unconfirmed. Not applied.",
            },
            false,
          );
          emitted += 1;
        }
      }
    }
  }

  const same = previous?.contentHash === hit.contentHash;
  if (!previous) {
    base.status = applied.length ? "structured_applied" : "fingerprinted";
    base.note = applied.length
      ? "First fingerprint. A structured official value differed from the archive and was staged as an overlay. Other dates were not guessed."
      : "First fingerprint recorded. Reaching the page does not confirm the admission dates stored in the archive.";
  } else if (same) {
    base.status = applied.length ? "structured_applied" : "unchanged";
    base.note = "Content fingerprint matches the previous check. HTTP 200 alone was not treated as proof.";
  } else {
    base.status = applied.length ? "structured_applied" : "changed";
    base.note = applied.length
      ? "Fingerprint changed and a structured official value was staged."
      : "Fingerprint changed. No structured official field was established, so stored dates were left untouched.";
    if (!applied.length) {
      const entry: ChangeLogEntry = {
        id: proposalId(source.id, source.circularIds[0] ?? null, "page", hit.contentHash.slice(0, 12)),
        universityId: source.primaryUniversityId,
        universityName: source.primaryName,
        field: "page",
        previousValue: previous.contentHash.slice(0, 12),
        detectedValue: hit.contentHash.slice(0, 12),
        sourceUrl: hit.finalUrl || source.url,
        detectedAt: now,
        verificationStatus: "review_required",
        note: "Page fingerprint changed. This is not a new admission date.",
      };
      changelog.push(entry);
      proposals.push({
        id: entry.id,
        sourceId: source.id,
        universityId: source.primaryUniversityId,
        universityName: source.primaryName,
        circularId: source.circularIds.length === 1 ? source.circularIds[0] ?? null : null,
        field: "page",
        previousValue: entry.previousValue,
        detectedValue: entry.detectedValue,
        sourceUrl: entry.sourceUrl,
        detectedAt: now,
        status: "review_required",
        reliable: false,
        note: entry.note,
      });
    }
  }

  return {
    check: base,
    proposals,
    applied,
    changelog,
    snapshot: {
      contentHash: hit.contentHash,
      etag: hit.etag,
      lastModified: hit.lastModified,
      checkedAt: now,
      httpStatus: hit.httpStatus,
      finalUrl: hit.finalUrl || source.url,
    },
  };
}

export function assembleReport(input: {
  classified: ReturnType<typeof classifySource>[];
  untouched?: SourceCheck[];
  previousChangelog: ChangeLogEntry[];
  now: string | null;
  runner: VerificationReport["runner"];
  note: string;
}): VerificationReport {
  const sources = [...(input.untouched ?? []), ...input.classified.map((item) => item.check)];
  const proposals = input.classified.flatMap((item) => item.proposals);
  const applied = input.classified.flatMap((item) => item.applied);
  const fresh = input.classified.flatMap((item) => item.changelog);
  const seen = new Set<string>();
  const changelog: ChangeLogEntry[] = [];
  for (const entry of [...fresh].reverse().concat(input.previousChangelog)) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    changelog.push(entry);
  }
  changelog.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  return {
    version: 1,
    generatedAt: input.now,
    runner: input.runner,
    scheduleHours: 12,
    note: input.note,
    summary: summarize(sources, proposals),
    sources,
    proposals,
    applied,
    changelog: changelog.slice(0, 200),
  };
}

export function notCheckedSource(source: MonitorSource): SourceCheck {
  return {
    sourceId: source.id,
    url: source.url,
    kind: source.kind,
    label: source.label,
    universityIds: source.universityIds,
    circularIds: source.circularIds,
    primaryUniversityId: source.primaryUniversityId,
    primaryName: source.primaryName,
    shortName: source.shortName,
    status: "not_checked",
    httpStatus: null,
    lastModified: null,
    etag: null,
    contentHash: null,
    previousHash: null,
    checkedAt: null,
    error: null,
    note: "No check has been published for this source.",
  };
}

export async function readHit(response: Response, maxBytes = 700_000): Promise<FetchHit> {
  const etag = response.headers.get("etag");
  const lastModified = response.headers.get("last-modified");
  const contentType = response.headers.get("content-type");
  if (response.status === 304) {
    return { httpStatus: 304, finalUrl: response.url, etag, lastModified, contentType, bodyText: null, contentHash: null, error: null };
  }
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > maxBytes) {
    return {
      httpStatus: response.status,
      finalUrl: response.url,
      etag,
      lastModified,
      contentType,
      bodyText: null,
      contentHash: null,
      error: "body too large to fingerprint",
    };
  }
  const buf = await response.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    return {
      httpStatus: response.status,
      finalUrl: response.url,
      etag,
      lastModified,
      contentType,
      bodyText: null,
      contentHash: null,
      error: "body too large to fingerprint",
    };
  }
  if (buf.byteLength === 0) {
    return { httpStatus: response.status, finalUrl: response.url, etag, lastModified, contentType, bodyText: "", contentHash: null, error: "empty body" };
  }
  const hash = await sha256Text(new TextDecoder("utf-8", { fatal: false }).decode(buf));
  const isPdf = (contentType ?? "").includes("pdf") || response.url.toLowerCase().endsWith(".pdf");
  const bodyText = isPdf ? "" : new TextDecoder("utf-8", { fatal: false }).decode(buf);
  return { httpStatus: response.status, finalUrl: response.url, etag, lastModified, contentType, bodyText, contentHash: hash, error: null };
}

export function mergeSnapshot(previous: SnapshotFile, classified: ReturnType<typeof classifySource>[]): SnapshotFile {
  const sources = { ...previous.sources };
  for (const item of classified) {
    if (item.snapshot) sources[item.check.sourceId] = item.snapshot;
  }
  return { version: 1, sources };
}

export function applyOverlays<T extends { id: string; feeBdt: number | null; eligibility: string[] } & Record<DateField, string | null>>(
  circulars: T[],
  applied: Proposal[],
  rejected: Set<string>,
): T[] {
  if (!applied.length) return circulars;
  return circulars.map((circular) => {
    let next = circular;
    for (const item of applied) {
      if (item.circularId !== circular.id || !item.reliable || item.status !== "auto_applied") continue;
      if (rejected.has(item.id)) continue;
      if (DATE_FIELDS.includes(item.field as DateField)) {
        if (!isISODate(item.detectedValue)) continue;
        next = { ...next, [item.field]: item.detectedValue };
      } else if (item.field === "feeBdt") {
        const fee = Number(item.detectedValue);
        if (!Number.isInteger(fee)) continue;
        next = { ...next, feeBdt: fee };
      } else if (item.field === "eligibility") {
        const lines = item.detectedValue.split("\n").map((line) => line.trim()).filter(Boolean);
        if (!lines.length) continue;
        next = { ...next, eligibility: lines };
      }
    }
    return next;
  });
}

export const STALE_HOURS = 18;

export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index] as T, index);
    }
  });
  await Promise.all(workers);
  return out;
}
