import { extractAnchors, extractFeedUrls, extractSitemapLocs, looksLikeHtml } from "./html.ts";
import { shouldStartCycle } from "./gate.ts";
import { FOLLOW_SCORE, scoreLink } from "./lexicon.ts";
import { mergeRegistry, seedSources, sourceIdFor } from "./registry.ts";
import { parseRobots, robotsAllows, type RobotsFile } from "./robots.ts";
import {
  NO_DATE_NOTE,
  PRODUCTION_LIMITS,
  USER_AGENT,
  type CrawlCounts,
  type CrawlEvent,
  type CrawlLimits,
  type CrawlState,
  type DiscoveryRecord,
  type LiveFile,
  type OpsBundle,
  type Reachability,
  type SeedInstitution,
  type SourceRecord,
} from "./types.ts";
import { isDocumentUrl, isPdfUrl, normalizeUrl, sameSite } from "./url.ts";

export interface FetchHit {
  httpStatus: number | null;
  finalUrl: string;
  etag: string | null;
  lastModified: string | null;
  contentType: string | null;
  bodyText: string | null;
  contentHash: string | null;
  error: string | null;
  transient: boolean;
}

interface RunInput {
  institutions: SeedInstitution[];
  previousRegistry: SourceRecord[];
  previousDiscoveries: DiscoveryRecord[];
  previousState: CrawlState | null;
  now: Date;
  force?: boolean;
  runner: LiveFile["runner"];
  fetchImpl: typeof fetch;
  limits?: Partial<CrawlLimits>;
  clock?: () => Date;
}

class HostGate {
  private tails = new Map<string, Promise<void>>();
  private last = new Map<string, number>();

  async run<T>(host: string, gapMs: number, fn: () => Promise<T>): Promise<T> {
    const prev = this.tails.get(host) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.tails.set(host, prev.then(() => current));
    await prev;
    const wait = Math.max(0, (this.last.get(host) ?? 0) + gapMs - Date.now());
    if (wait) await sleep(wait);
    try {
      return await fn();
    } finally {
      this.last.set(host, Date.now());
      release();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readCapped(response: Response, maxBytes: number): Promise<{ text: string | null; hash: string | null; error: string | null }> {
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > maxBytes) return { text: null, hash: null, error: "body too large" };
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) return { text: null, hash: null, error: "body too large" };
  if (buffer.byteLength === 0) return { text: null, hash: null, error: "empty body" };
  const hash = await sha256(buffer);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  return { text, hash, error: null };
}

export async function fetchHit(
  fetchImpl: typeof fetch,
  url: string,
  limits: CrawlLimits,
  previous?: { etag: string | null; lastModified: string | null },
): Promise<FetchHit> {
  let attempt = 0;
  let lastError = "request failed";
  while (attempt <= limits.retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), limits.timeoutMs);
    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en,bn;q=0.8",
          ...(previous?.etag ? { "if-none-match": previous.etag } : {}),
          ...(previous?.lastModified ? { "if-modified-since": previous.lastModified } : {}),
        },
      });
      const etag = response.headers.get("etag");
      const lastModified = response.headers.get("last-modified");
      const contentType = response.headers.get("content-type");
      if (response.status === 304) {
        return { httpStatus: 304, finalUrl: response.url || url, etag, lastModified, contentType, bodyText: null, contentHash: null, error: null, transient: false };
      }
      if (response.status === 429 || response.status === 503 || response.status === 502) {
        lastError = `HTTP ${response.status}`;
        attempt += 1;
        if (attempt <= limits.retries) await sleep(limits.retryBaseMs * attempt);
        continue;
      }
      const body = response.status === 200 ? await readCapped(response, limits.maxBytes) : { text: null, hash: null, error: null };
      return {
        httpStatus: response.status,
        finalUrl: response.url || url,
        etag,
        lastModified,
        contentType,
        bodyText: body.text,
        contentHash: body.hash,
        error: body.error,
        transient: false,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      lastError = aborted ? "timeout" : error instanceof Error ? error.message : "request failed";
      attempt += 1;
      if (attempt <= limits.retries) await sleep(limits.retryBaseMs * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    httpStatus: null,
    finalUrl: url,
    etag: null,
    lastModified: null,
    contentType: null,
    bodyText: null,
    contentHash: null,
    error: lastError,
    transient: true,
  };
}

function emptyCounts(): CrawlCounts {
  return {
    universities: 0,
    systems: 0,
    sources: 0,
    checked: 0,
    reached: 0,
    unchanged: 0,
    failed: 0,
    skipped: 0,
    notChecked: 0,
    newDocuments: 0,
    newPages: 0,
  };
}

function count(sources: SourceRecord[]): CrawlCounts {
  const counts = emptyCounts();
  const universities = new Set<string>();
  const systems = new Set<string>();
  counts.sources = sources.length;
  for (const source of sources) {
    if (source.kind === "system") systems.add(source.universityId);
    else universities.add(source.universityId);
    if (source.reachability === "not_yet_checked") {
      counts.notChecked += 1;
      continue;
    }
    if (source.reachability === "no_official_url" || source.reachability === "skipped_robots") {
      counts.skipped += 1;
      continue;
    }
    counts.checked += 1;
    if (source.reachability === "success" || source.reachability === "no_change" || source.reachability === "new_document") {
      counts.reached += 1;
      if (source.reachability === "no_change") counts.unchanged += 1;
    } else {
      counts.failed += 1;
    }
  }
  counts.universities = universities.size;
  counts.systems = systems.size;
  return counts;
}

function applyHit(source: SourceRecord, hit: FetchHit, checkedAt: string): Reachability {
  source.lastCheckedAt = checkedAt;
  source.httpStatus = hit.httpStatus;
  source.error = hit.error;
  if (hit.error && hit.httpStatus == null) {
    source.reachability = hit.transient ? "retry_scheduled" : "unreachable";
    source.lastFailureAt = checkedAt;
    source.contentHash = null;
    source.note = hit.transient
      ? `${hit.error}. Will try again next cycle. This is not an unchanged page.`
      : `${hit.error}. The source could not be reached. This is not an unchanged page.`;
    return source.reachability;
  }
  if (hit.httpStatus === 304) {
    if (!source.contentHash) {
      source.reachability = "unreachable";
      source.lastFailureAt = checkedAt;
      source.note = "HTTP 304 without a stored fingerprint. Not treated as unchanged.";
      source.error = "304 without a stored fingerprint";
      return source.reachability;
    }
    source.reachability = "no_change";
    source.lastSuccessAt = checkedAt;
    source.note = "The server reported the page unchanged (304). Links were not re-read.";
    source.error = null;
    return source.reachability;
  }
  if (hit.httpStatus === 404 || hit.httpStatus === 410) {
    source.reachability = "source_broken";
    source.lastFailureAt = checkedAt;
    source.contentHash = null;
    source.note = `HTTP ${hit.httpStatus}. The registered URL looks broken.`;
    return source.reachability;
  }
  if (hit.httpStatus !== 200 || !hit.contentHash) {
    source.reachability = hit.httpStatus === 429 || hit.httpStatus === 503 ? "retry_scheduled" : "unreachable";
    source.lastFailureAt = checkedAt;
    source.contentHash = null;
    source.note = hit.error
      ? `${hit.error}. Not treated as unchanged.`
      : `HTTP ${hit.httpStatus ?? "none"}. A response that is not a readable document is not a successful check.`;
    return source.reachability;
  }
  const same = source.contentHash === hit.contentHash;
  source.etag = hit.etag;
  source.lastModified = hit.lastModified;
  source.contentHash = hit.contentHash;
  source.lastSuccessAt = checkedAt;
  source.error = null;
  source.reachability = same ? "no_change" : "success";
  source.note = same
    ? "Content fingerprint matches the previous check."
    : source.origin === "seed"
      ? "Homepage retrieved. Reaching it does not confirm any admission date."
      : "Linked page retrieved from the official site. No admission date was published.";
  return source.reachability;
}

function discoveryId(universityId: string, url: string): string {
  return `${universityId}:${url}`.slice(0, 180);
}

export async function runDiscovery(input: RunInput): Promise<{ skipped: boolean; reason: string; bundle: OpsBundle | null }> {
  const limits = { ...PRODUCTION_LIMITS, ...input.limits };
  const clock = input.clock ?? (() => new Date());
  const interval = input.previousState?.intervalMinutes ?? 45;
  if (!input.force && !shouldStartCycle(input.previousState?.lastCompletedAt ?? null, input.now, interval, input.previousState?.lastStatus)) {
    return {
      skipped: true,
      reason: `Last completed cycle was under ${interval} minutes ago. No scan was started.`,
      bundle: null,
    };
  }

  const events: CrawlEvent[] = [];
  const log = (event: Omit<CrawlEvent, "at">) => {
    events.push({ ...event, at: clock().toISOString() });
  };
  const started = clock();
  const cycleId = `cyc-${started.toISOString()}`;
  log({
    level: "info",
    type: "cycle_start",
    universityId: null,
    sourceId: null,
    url: null,
    message: input.previousState?.lastStatus === "running"
      ? "Previous cycle did not finish. Starting a new discovery cycle. No date will be published."
      : "Starting discovery cycle. No date will be published.",
  });

  const registry = mergeRegistry(seedSources(input.institutions), input.previousRegistry);
  const discoveries = [...input.previousDiscoveries];
  const knownDiscovery = new Set(discoveries.map((item) => item.id));
  const robotsCache = new Map<string, RobotsFile | null>();
  const pageCache = new Map<string, FetchHit>();
  const gate = new HostGate();
  let fetches = 0;
  let capped = false;

  const takeFetch = () => {
    if (fetches >= limits.maxFetches) {
      capped = true;
      return false;
    }
    fetches += 1;
    return true;
  };

  const loadRobots = async (pageUrl: string): Promise<RobotsFile | null> => {
    const origin = new URL(pageUrl).origin;
    if (robotsCache.has(origin)) return robotsCache.get(origin) ?? null;
    const robotsUrl = `${origin}/robots.txt`;
    if (!takeFetch()) {
      robotsCache.set(origin, null);
      return null;
    }
    const hit = await gate.run(new URL(pageUrl).hostname, limits.hostGapMs, () => fetchHit(input.fetchImpl, robotsUrl, limits));
    pageCache.set(robotsUrl, hit);
    if (hit.httpStatus === 200 && hit.bodyText) {
      const parsed = parseRobots(hit.bodyText);
      robotsCache.set(origin, parsed);
      return parsed;
    }
    robotsCache.set(origin, null);
    return null;
  };

  const retrieve = async (url: string, previous?: { etag: string | null; lastModified: string | null }): Promise<FetchHit | null> => {
    const cached = pageCache.get(url);
    if (cached) return cached;
    if (!takeFetch()) return null;
    const hit = await gate.run(new URL(url).hostname, limits.hostGapMs, () => fetchHit(input.fetchImpl, url, limits, previous));
    pageCache.set(url, hit);
    return hit;
  };

  const remember = (source: SourceRecord, item: Omit<DiscoveryRecord, "id" | "universityId" | "shortName" | "downloaded"> & { downloaded?: false }) => {
    const record: DiscoveryRecord = {
      ...item,
      id: discoveryId(source.universityId, item.url),
      universityId: source.universityId,
      shortName: source.shortName,
      downloaded: false,
    };
    if (knownDiscovery.has(record.id)) return false;
    knownDiscovery.add(record.id);
    discoveries.push(record);
    if (record.kind === "pdf") {
      source.documentsFound += 1;
      source.lastDiscoveredDocument = record.url;
    }
    return true;
  };

  const institutions = rotate(input.institutions, input.previousState?.cursor ?? 0);
  let inspected = 0;
  for (const institution of institutions) {
    const owned = registry.filter((source) => source.universityId === institution.id);
    const homepage = owned.find((source) => source.type === "homepage") ?? null;
    if (!homepage || !homepage.url) {
      log({
        level: "warn",
        type: "skip",
        universityId: institution.id,
        sourceId: homepage?.id ?? null,
        url: null,
        message: `${institution.name} has no official website on file. Skipped. Not marked unchanged.`,
      });
      continue;
    }
    inspected += 1;
    log({
      level: "info",
      type: "connect",
      universityId: institution.id,
      sourceId: homepage.id,
      url: homepage.url,
      message: `Connecting to ${institution.name} official homepage.`,
    });
    const robots = await loadRobots(homepage.url);
    if (capped && !pageCache.has(homepage.url)) {
      log({
        level: "warn",
        type: "cap",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: "Fetch cap reached. Remaining sources stay unchecked and were not marked successful.",
      });
      break;
    }
    const path = new URL(homepage.url).pathname || "/";
    if (robots && !robotsAllows(robots, path, USER_AGENT)) {
      homepage.reachability = "skipped_robots";
      homepage.lastCheckedAt = clock().toISOString();
      homepage.note = "robots.txt disallows this path. Not fetched.";
      homepage.error = "disallowed by robots.txt";
      log({
        level: "warn",
        type: "skip",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: `Skipped ${institution.shortName} homepage because robots.txt disallows it.`,
      });
      continue;
    }
    const hit = await retrieve(homepage.url, homepage);
    if (!hit) {
      log({
        level: "warn",
        type: "cap",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: "Fetch cap reached before this homepage. It was not marked successful.",
      });
      break;
    }
    const reach = applyHit(homepage, hit, clock().toISOString());
    if (reach === "no_change" && hit.httpStatus === 304) {
      log({
        level: "info",
        type: "no_change",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: `${institution.shortName} homepage is unchanged (304).`,
      });
      continue;
    }
    if (reach === "unreachable" || reach === "retry_scheduled" || reach === "source_broken") {
      log({
        level: "error",
        type: "fail",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: `${institution.shortName} homepage failed: ${homepage.note}`,
      });
      continue;
    }
    log({
      level: "info",
      type: "fetched",
      universityId: institution.id,
      sourceId: homepage.id,
      url: hit.finalUrl,
      message: reach === "no_change"
        ? `${institution.shortName} homepage matches the stored fingerprint.`
        : `Retrieved ${institution.shortName} homepage.`,
    });
    if (!hit.bodyText || !looksLikeHtml(hit.contentType, hit.finalUrl)) continue;
    if (!sameSite(homepage.url, hit.finalUrl)) {
      homepage.note = "Homepage redirected off the official site. Links on the destination were not treated as official.";
      log({
        level: "warn",
        type: "skip",
        universityId: institution.id,
        sourceId: homepage.id,
        url: hit.finalUrl,
        message: `${institution.shortName} redirected off its official site. Off-site page was not crawled.`,
      });
      continue;
    }
    const freshDocs = collectLinks(homepage, hit.bodyText, hit.finalUrl, remember);
    if (freshDocs.length) {
      homepage.reachability = "new_document";
      homepage.note = `Recorded ${freshDocs.length} new document link${freshDocs.length === 1 ? "" : "s"}. The files were not downloaded. No date was published.`;
      for (const doc of freshDocs) {
        log({
          level: "info",
          type: "discover",
          universityId: institution.id,
          sourceId: homepage.id,
          url: doc.url,
          message: `New document link on ${institution.shortName}: ${doc.title || doc.url}. Not downloaded.`,
        });
      }
    } else if (reach === "success" || reach === "no_change") {
      log({
        level: "info",
        type: "no_change",
        universityId: institution.id,
        sourceId: homepage.id,
        url: homepage.url,
        message: `No new documents on ${institution.shortName}.`,
      });
    }
    await followPages({
      homepage,
      html: hit.bodyText,
      finalUrl: hit.finalUrl,
      robots,
      registry,
      limits,
      clock,
      log,
      remember,
      retrieve,
      capped: () => capped,
    });
    if (robots) {
      const sitemap = robots.sitemaps.map((item) => normalizeUrl(item)).find((item) => item && sameSite(homepage.url!, item));
      if (sitemap) await readSitemap(homepage, sitemap, registry, limits, clock, log, remember, retrieve);
    }
  }

  const counts = count(registry);
  counts.newDocuments = events.filter((event) => event.type === "discover" && event.message.startsWith("New document")).length;
  counts.newPages = events.filter((event) => event.type === "discover" && event.message.startsWith("Recorded linked page")).length;
  const completed = clock();
  log({
    level: counts.failed && !counts.reached ? "error" : "info",
    type: "cycle_end",
    universityId: null,
    sourceId: null,
    url: null,
    message: `Discovery cycle finished. Checked ${counts.checked}, reached ${counts.reached}, failed ${counts.failed}. No admission date was published.`,
  });
  const state: CrawlState = {
    version: 1,
    intervalMinutes: 45,
    lastStartedAt: started.toISOString(),
    lastCompletedAt: completed.toISOString(),
    lastStatus: counts.checked > 0 && counts.reached === 0 && counts.failed > 0 ? "failed" : "completed",
    cycleId,
    cursor: inspected >= institutions.length ? 0 : (input.previousState?.cursor ?? 0) + inspected,
    note: NO_DATE_NOTE,
  };
  const live: LiveFile = {
    version: 1,
    generatedAt: completed.toISOString(),
    status: state.lastStatus,
    runner: input.runner,
    intervalMinutes: 45,
    cycleId,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: completed.getTime() - started.getTime(),
    note: NO_DATE_NOTE,
    counts,
    events: events.slice(-limits.maxEvents),
    sources: registry,
    discoveries: discoveries.slice(-200),
  };
  return {
    skipped: false,
    reason: "",
    bundle: {
      state,
      registry,
      discoveries: discoveries.slice(-limits.maxDiscoveries),
      events: events.slice(-limits.maxEvents),
      live,
    },
  };
}

function rotate<T>(items: T[], cursor: number): T[] {
  if (!items.length) return items;
  const index = ((cursor % items.length) + items.length) % items.length;
  return items.slice(index).concat(items.slice(0, index));
}

function collectLinks(
  source: SourceRecord,
  html: string,
  pageUrl: string,
  remember: (source: SourceRecord, item: Omit<DiscoveryRecord, "id" | "universityId" | "shortName" | "downloaded">) => boolean,
): DiscoveryRecord[] {
  const created: DiscoveryRecord[] = [];
  for (const link of extractAnchors(html, pageUrl)) {
    const score = scoreLink(link.text, link.url);
    const pdf = isPdfUrl(link.url) || isDocumentUrl(link.url);
    const onSite = sameSite(pageUrl, link.url);
    if (!onSite || !pdf || score < FOLLOW_SCORE) continue;
    const added = remember(source, {
      url: link.url,
      foundOn: pageUrl,
      foundAt: source.lastCheckedAt ?? new Date().toISOString(),
      title: link.text,
      kind: "pdf",
      score,
      sameSite: onSite,
    });
    if (added) {
      created.push({
        id: discoveryId(source.universityId, link.url),
        universityId: source.universityId,
        shortName: source.shortName,
        url: link.url,
        foundOn: pageUrl,
        foundAt: source.lastCheckedAt ?? "",
        title: link.text,
        kind: "pdf",
        score,
        sameSite: onSite,
        downloaded: false,
      });
    }
  }
  for (const feed of extractFeedUrls(html, pageUrl)) {
    if (!sameSite(pageUrl, feed)) continue;
    remember(source, {
      url: feed,
      foundOn: pageUrl,
      foundAt: source.lastCheckedAt ?? new Date().toISOString(),
      title: "RSS or Atom feed",
      kind: "feed",
      score: FOLLOW_SCORE,
      sameSite: true,
    });
  }
  return created;
}

async function followPages(input: {
  homepage: SourceRecord;
  html: string;
  finalUrl: string;
  robots: RobotsFile | null;
  registry: SourceRecord[];
  limits: CrawlLimits;
  clock: () => Date;
  log: (event: Omit<CrawlEvent, "at">) => void;
  remember: (source: SourceRecord, item: Omit<DiscoveryRecord, "id" | "universityId" | "shortName" | "downloaded">) => boolean;
  retrieve: (url: string, previous?: { etag: string | null; lastModified: string | null }) => Promise<FetchHit | null>;
  capped: () => boolean;
}) {
  const candidates = extractAnchors(input.html, input.finalUrl)
    .map((link) => ({ ...link, score: scoreLink(link.text, link.url) }))
    .filter((link) => link.score >= FOLLOW_SCORE && sameSite(input.finalUrl, link.url) && !isDocumentUrl(link.url))
    .filter((link) => normalizeUrl(link.url) !== normalizeUrl(input.homepage.url ?? ""))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limits.maxExtraPages);
  for (const candidate of candidates) {
    if (input.capped()) return;
    const path = new URL(candidate.url).pathname || "/";
    if (input.robots && !robotsAllows(input.robots, path, USER_AGENT)) {
      input.log({
        level: "warn",
        type: "skip",
        universityId: input.homepage.universityId,
        sourceId: input.homepage.id,
        url: candidate.url,
        message: `Skipped ${candidate.url} because robots.txt disallows it.`,
      });
      continue;
    }
    const existing = input.registry.find((source) => source.url === candidate.url && source.universityId === input.homepage.universityId);
    const page = existing ?? {
      ...input.homepage,
      id: sourceIdFor(input.homepage.universityId, candidate.url, "discovered-page"),
      sourceName: candidate.text || `${input.homepage.shortName} linked admission page`,
      url: candidate.url,
      type: "discovered-page" as const,
      reliability: "official-linked" as const,
      extraction: "html-links" as const,
      origin: "discovered" as const,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastCheckedAt: null,
      lastDiscoveredDocument: null,
      documentsFound: 0,
      reachability: "not_yet_checked" as const,
      httpStatus: null,
      etag: null,
      lastModified: null,
      contentHash: null,
      error: null,
      note: "Found on the official homepage during this cycle.",
    };
    if (!existing) input.registry.push(page);
    input.log({
      level: "info",
      type: "connect",
      universityId: page.universityId,
      sourceId: page.id,
      url: candidate.url,
      message: `Opening linked page for ${input.homepage.shortName}: ${candidate.text || candidate.url}`,
    });
    const hit = await input.retrieve(candidate.url, page);
    if (!hit) return;
    const reach = applyHit(page, hit, input.clock().toISOString());
    if (reach === "unreachable" || reach === "retry_scheduled" || reach === "source_broken") {
      input.log({
        level: "error",
        type: "fail",
        universityId: page.universityId,
        sourceId: page.id,
        url: candidate.url,
        message: `Linked page failed for ${input.homepage.shortName}: ${page.note}`,
      });
      continue;
    }
    if (hit.bodyText && looksLikeHtml(hit.contentType, hit.finalUrl) && sameSite(candidate.url, hit.finalUrl)) {
      const docs = collectLinks(page, hit.bodyText, hit.finalUrl, input.remember);
      if (docs.length) {
        page.reachability = "new_document";
        page.note = `Recorded ${docs.length} new document link${docs.length === 1 ? "" : "s"} from a page linked by the official site. Not downloaded.`;
        for (const doc of docs) {
          input.log({
            level: "info",
            type: "discover",
            universityId: page.universityId,
            sourceId: page.id,
            url: doc.url,
            message: `New document link on ${input.homepage.shortName}: ${doc.title || doc.url}. Not downloaded.`,
          });
        }
      }
    }
    const added = input.remember(input.homepage, {
      url: candidate.url,
      foundOn: input.finalUrl,
      foundAt: input.clock().toISOString(),
      title: candidate.text,
      kind: "page",
      score: candidate.score,
      sameSite: true,
    });
    if (added) {
      input.log({
        level: "info",
        type: "discover",
        universityId: page.universityId,
        sourceId: page.id,
        url: candidate.url,
        message: `Recorded linked page for ${input.homepage.shortName}: ${candidate.text || candidate.url}`,
      });
    }
  }
}

async function readSitemap(
  homepage: SourceRecord,
  sitemap: string,
  registry: SourceRecord[],
  limits: CrawlLimits,
  clock: () => Date,
  log: (event: Omit<CrawlEvent, "at">) => void,
  remember: (source: SourceRecord, item: Omit<DiscoveryRecord, "id" | "universityId" | "shortName" | "downloaded">) => boolean,
  retrieve: (url: string) => Promise<FetchHit | null>,
) {
  const source: SourceRecord = {
    ...homepage,
    id: sourceIdFor(homepage.universityId, sitemap, "sitemap"),
    sourceName: `${homepage.shortName} sitemap`,
    url: sitemap,
    type: "sitemap",
    reliability: "official-linked",
    extraction: "sitemap",
    origin: "discovered",
    lastSuccessAt: null,
    lastFailureAt: null,
    lastCheckedAt: null,
    contentHash: null,
    documentsFound: 0,
    lastDiscoveredDocument: null,
    reachability: "not_yet_checked",
    httpStatus: null,
    etag: null,
    lastModified: null,
    error: null,
    note: "Sitemap declared by robots.txt.",
  };
  if (!registry.some((item) => item.id === source.id)) registry.push(source);
  const hit = await retrieve(sitemap);
  if (!hit) return;
  applyHit(source, hit, clock().toISOString());
  if (!hit.bodyText) return;
  const locs = extractSitemapLocs(hit.bodyText)
    .filter((url) => sameSite(homepage.url ?? sitemap, url))
    .map((url) => ({ url, score: scoreLink(url, url) }))
    .filter((item) => item.score >= FOLLOW_SCORE || isPdfUrl(item.url))
    .sort((a, b) => b.score - a.score)
    .slice(0, limits.maxExtraPages);
  for (const loc of locs) {
    const added = remember(homepage, {
      url: loc.url,
      foundOn: sitemap,
      foundAt: clock().toISOString(),
      title: loc.url,
      kind: isPdfUrl(loc.url) ? "pdf" : "page",
      score: loc.score,
      sameSite: true,
    });
    if (!added) continue;
    if (isPdfUrl(loc.url) && homepage.reachability !== "unreachable") homepage.reachability = "new_document";
    log({
      level: "info",
      type: "discover",
      universityId: homepage.universityId,
      sourceId: source.id,
      url: loc.url,
      message: isPdfUrl(loc.url)
        ? `New document link on ${homepage.shortName}: ${loc.url}. Not downloaded.`
        : `Sitemap listed a page for ${homepage.shortName}: ${loc.url}. Not downloaded.`,
    });
  }
}

export function blankState(): CrawlState {
  return {
    version: 1,
    intervalMinutes: 45,
    lastStartedAt: null,
    lastCompletedAt: null,
    lastStatus: "never",
    cycleId: null,
    cursor: 0,
    note: "No discovery cycle has run.",
  };
}
