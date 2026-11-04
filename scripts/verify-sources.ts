import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assembleReport,
  classifySource,
  isReport,
  mapPool,
  mergeSnapshot,
  notCheckedSource,
  parseCatalogSources,
  readHit,
  type ChangeLogEntry,
  type SnapshotFile,
  type SourceManifest,
  type VerificationReport,
} from "../src/lib/verify-engine.ts";

const root = resolve(import.meta.dirname, "..");
const manifestOnly = process.argv.includes("--manifest-only");
const userAgent = "ADMISSION26-monitor/2.0 (educational archive; admission source check)";

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function fetchSource(url: string, previous: SnapshotFile["sources"][string] | undefined) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": userAgent,
        accept: "text/html,application/pdf,application/json;q=0.9,*/*;q=0.8",
        ...(previous?.etag ? { "if-none-match": previous.etag } : {}),
        ...(previous?.lastModified ? { "if-modified-since": previous.lastModified } : {}),
      },
    });
    return await readHit(response);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      httpStatus: null,
      finalUrl: url,
      etag: null,
      lastModified: null,
      contentType: null,
      bodyText: null,
      contentHash: null,
      error: aborted ? "timeout" : error instanceof Error ? error.message : "request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

const universities = readFileSync(resolve(root, "src/data/universities.ts"), "utf8");
const circulars = readFileSync(resolve(root, "src/data/circulars.ts"), "utf8");
const manifest: SourceManifest = parseCatalogSources(universities, circulars);
const manifestPath = resolve(root, "src/data/source-manifest.ts");
const manifestBody = `import type { SourceManifest } from "@/lib/verify-engine";\n\nexport const sourceManifest: SourceManifest = ${JSON.stringify(manifest, null, 2)};\n`;
mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, manifestBody);
mkdirSync(resolve(root, "public/verification"), { recursive: true });
mkdirSync(resolve(root, "data/verification"), { recursive: true });
writeFileSync(resolve(root, "public/verification/sources.json"), JSON.stringify(manifest, null, 2));

if (manifestOnly) {
  console.log(`manifest ${manifest.sources.length} sources, ${manifest.facts.length} circulars`);
  process.exit(0);
}

const snapshot = readJson<SnapshotFile>(resolve(root, "data/verification/snapshot.json"), { version: 1, sources: {} });
const previousReport = readJson<VerificationReport | null>(resolve(root, "public/verification/report.json"), null);
const previousChangelog: ChangeLogEntry[] = previousReport && isReport(previousReport) ? previousReport.changelog : [];
const now = new Date().toISOString();

const classified = await mapPool(manifest.sources, 6, async (source) => {
  const hit = await fetchSource(source.url, snapshot.sources[source.id]);
  return classifySource({ source, hit, previous: snapshot.sources[source.id] ?? null, facts: manifest.facts, now });
});

const runner = process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "manual-script";
const report = assembleReport({
  classified,
  previousChangelog,
  now,
  runner,
  note: "Fingerprint and header comparison only. Stored admission dates change solely through a structured official block or a human approval. HTTP 200 is not a verification.",
});
const nextSnapshot = mergeSnapshot(snapshot, classified);
writeFileSync(resolve(root, "public/verification/report.json"), JSON.stringify(report, null, 2));
writeFileSync(resolve(root, "public/verification/applied.json"), JSON.stringify(report.applied, null, 2));
writeFileSync(resolve(root, "data/verification/snapshot.json"), JSON.stringify(nextSnapshot, null, 2));
console.log(
  JSON.stringify({
    runner,
    reached: report.summary.reached,
    failed: report.summary.failed,
    review: report.summary.reviewRequired,
    applied: report.applied.length,
    unchanged: report.summary.unchanged,
  }),
);
