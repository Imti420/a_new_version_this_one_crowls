export const INTERVAL_MINUTES = 45;
export const STALE_AFTER_MS = 90 * 60_000;
export const RUNNING_TOO_LONG_MS = 30 * 60_000;

export type InstitutionKind = "university" | "system";

export type SourceType = "homepage" | "discovered-page" | "discovered-document" | "feed" | "sitemap";

export type SourceOrigin = "seed" | "discovered";

export type Reachability =
  | "not_yet_checked"
  | "success"
  | "no_change"
  | "new_document"
  | "unreachable"
  | "retry_scheduled"
  | "source_broken"
  | "skipped_robots"
  | "no_official_url";

export type CycleStatus = "never" | "running" | "completed" | "skipped";

export interface SeedInstitution {
  id: string;
  kind: InstitutionKind;
  name: string;
  shortName: string;
  website: string | null;
}

export interface SourceRecord {
  id: string;
  universityId: string;
  universityName: string;
  shortName: string;
  kind: InstitutionKind;
  sourceName: string;
  url: string | null;
  type: SourceType;
  reliability: "official" | "official-linked";
  extraction: "html-links" | "not-fetched" | "feed" | "sitemap";
  origin: SourceOrigin;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastCheckedAt: string | null;
  lastDiscoveredDocument: string | null;
  documentsFound: number;
  reachability: Reachability;
  httpStatus: number | null;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  error: string | null;
  note: string;
}

export interface DiscoveryRecord {
  id: string;
  url: string;
  universityId: string;
  shortName: string;
  foundOn: string;
  foundAt: string;
  title: string;
  kind: "pdf" | "page" | "feed" | "sitemap";
  score: number;
  sameSite: boolean;
  downloaded: false;
}

export interface CrawlEvent {
  at: string;
  level: "info" | "warn" | "error";
  type:
    | "cycle_start"
    | "cycle_end"
    | "connect"
    | "fetched"
    | "no_change"
    | "discover"
    | "skip"
    | "fail"
    | "cap";
  universityId: string | null;
  sourceId: string | null;
  url: string | null;
  message: string;
}

export interface CrawlCounts {
  universities: number;
  systems: number;
  sources: number;
  checked: number;
  reached: number;
  unchanged: number;
  failed: number;
  skipped: number;
  notChecked: number;
  newDocuments: number;
  newPages: number;
}

export interface CrawlState {
  version: 1;
  intervalMinutes: number;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastStatus: CycleStatus | "failed";
  cycleId: string | null;
  cursor: number;
  note: string;
}

export interface LiveFile {
  version: 1;
  generatedAt: string | null;
  status: CycleStatus | "failed";
  runner: "github-actions" | "manual-script" | "test";
  intervalMinutes: number;
  cycleId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  note: string;
  counts: CrawlCounts;
  events: CrawlEvent[];
  sources: SourceRecord[];
  discoveries: DiscoveryRecord[];
}

export interface OpsBundle {
  state: CrawlState;
  registry: SourceRecord[];
  discoveries: DiscoveryRecord[];
  events: CrawlEvent[];
  live: LiveFile;
}

export interface CrawlLimits {
  hostGapMs: number;
  timeoutMs: number;
  maxBytes: number;
  retries: number;
  retryBaseMs: number;
  maxExtraPages: number;
  maxFetches: number;
  concurrency: number;
  maxDiscoveries: number;
  maxEvents: number;
}

export const PRODUCTION_LIMITS: CrawlLimits = {
  hostGapMs: 1500,
  timeoutMs: 10000,
  maxBytes: 500_000,
  retries: 1,
  retryBaseMs: 700,
  maxExtraPages: 2,
  maxFetches: 320,
  concurrency: 4,
  maxDiscoveries: 2000,
  maxEvents: 400,
};

export const USER_AGENT =
  "ADMISSION26-discovery/1.0 (educational archive; +https://turbo-timber-tundra-zephyr.vercel.app/discovery)";

export const NO_DATE_NOTE =
  "Discovery only. No admission date was extracted or published by this cycle.";
