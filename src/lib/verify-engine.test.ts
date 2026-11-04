import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  applyOverlays,
  assembleReport,
  classifySource,
  extractStructured,
  isMonitorStale,
  parseCatalogSources,
  summarize,
  type MonitorSource,
  type StoredFact,
} from "./verify-engine.ts";

const source: MonitorSource = {
  id: "site-du",
  url: "https://www.du.ac.bd",
  kind: "official-site",
  label: "DU official website",
  universityIds: ["du"],
  circularIds: ["c-du"],
  primaryUniversityId: "du",
  primaryName: "University of Dhaka",
  shortName: "DU",
  officialHosts: ["www.du.ac.bd"],
};

const fact: StoredFact = {
  circularId: "c-du",
  universityId: "du",
  universityName: "University of Dhaka",
  shortName: "DU",
  applicationOpens: "2026-11-11",
  applicationCloses: "2026-11-25",
  examDate: "2026-12-05",
  admitCardOn: null,
  resultOn: null,
  classesBegin: "2027-03-28",
  feeBdt: null,
};

const now = "2026-11-04T12:00:00.000Z";

describe("verification integrity", () => {
  it("does not treat HTTP 200 as a confirmation that dates are unchanged", () => {
    const result = classifySource({
      source,
      previous: null,
      facts: [fact],
      now,
      hit: {
        httpStatus: 200,
        finalUrl: source.url,
        etag: null,
        lastModified: null,
        contentType: "text/html",
        bodyText: "<html><title>University of Dhaka</title></html>",
        contentHash: "abc",
        error: null,
      },
    });
    assert.equal(result.check.status, "fingerprinted");
    assert.equal(result.applied.length, 0);
    assert.match(result.check.note, /does not confirm/i);
  });

  it("keeps a failed request out of the unchanged bucket and does not drop the stored date", () => {
    const stored = { ...fact };
    const result = classifySource({
      source,
      previous: { contentHash: "abc", etag: null, lastModified: null, checkedAt: now, httpStatus: 200, finalUrl: source.url },
      facts: [stored],
      now,
      hit: { httpStatus: 503, finalUrl: source.url, etag: null, lastModified: null, contentType: null, bodyText: null, contentHash: null, error: null },
    });
    assert.equal(result.check.status, "check_failed");
    assert.equal(result.snapshot, null);
    assert.equal(stored.applicationCloses, "2026-11-25");
    const summary = summarize([result.check], []);
    assert.equal(summary.failed, 1);
    assert.equal(summary.unchanged, 0);
    assert.equal(summary.reached, 0);
  });

  it("holds an unconfirmed scraped date for review and does not write it onto the record", () => {
    const record = {
      id: "c-du",
      applicationOpens: fact.applicationOpens,
      applicationCloses: fact.applicationCloses,
      examDate: fact.examDate,
      admitCardOn: fact.admitCardOn,
      resultOn: fact.resultOn,
      classesBegin: fact.classesBegin,
      feeBdt: null as number | null,
      eligibility: [] as string[],
    };
    const result = classifySource({
      source,
      previous: { contentHash: "old", etag: null, lastModified: null, checkedAt: now, httpStatus: 200, finalUrl: source.url },
      facts: [fact],
      now,
      hit: {
        httpStatus: 200,
        finalUrl: source.url,
        etag: '"1"',
        lastModified: "Tue, 04 Nov 2026 00:00:00 GMT",
        contentType: "text/html",
        bodyText: "<p>University of Dhaka admission test date 18 December 2026 for the new notice.</p>",
        contentHash: "new-hash",
        error: null,
      },
    });
    assert.equal(result.check.status, "changed");
    assert.equal(result.applied.length, 0);
    assert.ok(result.proposals.some((item) => item.status === "review_required" && item.detectedValue === "2026-12-18" && item.reliable === false));
    const overlaid = applyOverlays([record], result.applied, new Set());
    assert.equal(overlaid[0]?.examDate, "2026-12-05");
  });

  it("applies only a structured notice published on the official host", () => {
    const html =
      '<script type="application/json" data-admission26="notice">{"schema":"admission26.notice.v1","circularId":"c-du","field":"applicationCloses","value":"2026-11-30"}</script>';
    assert.equal(extractStructured(html)[0]?.value, "2026-11-30");
    const official = classifySource({
      source,
      previous: null,
      facts: [fact],
      now,
      hit: { httpStatus: 200, finalUrl: source.url, etag: null, lastModified: null, contentType: "text/html", bodyText: html, contentHash: "s", error: null },
    });
    assert.equal(official.applied.length, 1);
    assert.equal(official.applied[0]?.reliable, true);
    const news = classifySource({
      source: { ...source, id: "news", kind: "cited-report", url: "https://www.thedailystar.net/x", officialHosts: [] },
      previous: null,
      facts: [fact],
      now,
      hit: {
        httpStatus: 200,
        finalUrl: "https://www.thedailystar.net/x",
        etag: null,
        lastModified: null,
        contentType: "text/html",
        bodyText: html,
        contentHash: "s2",
        error: null,
      },
    });
    assert.equal(news.applied.length, 0);
    assert.equal(news.proposals[0]?.status, "review_required");
    const record = {
      id: "c-du",
      applicationOpens: "2026-11-11",
      applicationCloses: "2026-11-25",
      examDate: "2026-12-05",
      admitCardOn: null,
      resultOn: null,
      classesBegin: null,
      feeBdt: null as number | null,
      eligibility: ["old"],
    };
    const next = applyOverlays([record], official.applied, new Set());
    assert.equal(next[0]?.applicationCloses, "2026-11-30");
    const rejected = applyOverlays([record], official.applied, new Set([official.applied[0]!.id]));
    assert.equal(rejected[0]?.applicationCloses, "2026-11-25");
  });

  it("treats 304 without a fingerprint as a failed check", () => {
    const result = classifySource({
      source,
      previous: null,
      facts: [fact],
      now,
      hit: { httpStatus: 304, finalUrl: source.url, etag: '"x"', lastModified: null, contentType: null, bodyText: null, contentHash: null, error: null },
    });
    assert.equal(result.check.status, "check_failed");
  });

  it("flags a missing or old report as a stopped monitor", () => {
    assert.equal(isMonitorStale(null, new Date("2026-11-04T12:00:00.000Z")), true);
    assert.equal(isMonitorStale("2026-11-04T00:00:00.000Z", new Date("2026-11-04T12:00:00.000Z")), false);
    assert.equal(isMonitorStale("2026-11-03T00:00:00.000Z", new Date("2026-11-04T12:00:00.000Z")), true);
  });

  it("reads the seeded directory without inventing websites", () => {
    const manifest = parseCatalogSources(
      readFileSync(new URL("../data/universities.ts", import.meta.url), "utf8"),
      readFileSync(new URL("../data/circulars.ts", import.meta.url), "utf8"),
    );
    const du = manifest.sources.find((item) => item.id === "site-du");
    assert.equal(du?.url, "https://www.du.ac.bd");
    assert.equal(du?.kind, "official-site");
    const duFact = manifest.facts.find((item) => item.circularId === "c-du");
    assert.equal(duFact?.applicationCloses, "2026-11-25");
    assert.equal(duFact?.applicationOpens, "2026-11-11");
    assert.equal(manifest.facts.find((item) => item.circularId === "c-dghs")?.examDate, "2026-12-04");
    assert.equal(manifest.sources.some((item) => item.url.includes("example.com")), false);
    const report = assembleReport({
      classified: [],
      untouched: manifest.sources.map((item) => ({
        sourceId: item.id,
        url: item.url,
        kind: item.kind,
        label: item.label,
        universityIds: item.universityIds,
        circularIds: item.circularIds,
        primaryUniversityId: item.primaryUniversityId,
        primaryName: item.primaryName,
        shortName: item.shortName,
        status: "not_checked",
        httpStatus: null,
        lastModified: null,
        etag: null,
        contentHash: null,
        previousHash: null,
        checkedAt: null,
        error: null,
        note: "No check has been published for this source.",
      })),
      previousChangelog: [],
      now: null,
      runner: "none",
      note: "not run",
    });
    assert.equal(report.generatedAt, null);
    assert.equal(report.summary.reached, 0);
    assert.equal(report.summary.failed, 0);
    assert.ok(report.summary.notChecked > 10);
  });
});
