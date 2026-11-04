import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runDiscovery } from "./cycle.ts";
import { shouldStartCycle, systemStatus } from "./gate.ts";
import { scoreLink } from "./lexicon.ts";
import { parseRobots, robotsAllows } from "./robots.ts";
import { NO_DATE_NOTE, type CrawlState, type LiveFile, type SeedInstitution } from "./types.ts";
import { sameSite, siteKey } from "./url.ts";

const limits = {
  hostGapMs: 0,
  timeoutMs: 1000,
  maxBytes: 80_000,
  retries: 0,
  retryBaseMs: 0,
  maxExtraPages: 2,
  maxFetches: 20,
  concurrency: 2,
  maxDiscoveries: 100,
  maxEvents: 100,
};

const du: SeedInstitution = {
  id: "du",
  kind: "university",
  name: "University of Dhaka",
  shortName: "DU",
  website: "https://www.du.ac.bd",
};

const homeHtml = `<!doctype html><html><head>
<link rel="alternate" type="application/rss+xml" href="/news/feed.xml" />
</head><body>
<a href="/admissions/circular.pdf">ভর্তি বিজ্ঞপ্তি</a>
<a href="https://www.thedailystar.net/campus/admission">Daily Star admission</a>
<a href="/notices/undergraduate-admission">Undergraduate admission notice</a>
<a href="/library">Library catalog</a>
<a href="/secret/admission-circular">secret admission circular</a>
</body></html>`;

const noticeHtml = `<html><body><a href="/files/seat-plan.pdf">আসন সংখ্যা seat</a></body></html>`;
const sitemapXml = `<urlset>
<url><loc>https://www.du.ac.bd/files/admission-circular-2026.pdf</loc></url>
<url><loc>https://www.example.com/admission.pdf</loc></url>
</urlset>`;

function jsonResponse(body: string, status = 200, type = "text/html; charset=utf-8") {
  return new Response(body, { status, headers: { "content-type": type } });
}

describe("discovery crawler", () => {
  it("does not treat sau.edu.bd and sau.ac.bd as the same university", () => {
    assert.equal(siteKey("www.sau.edu.bd"), "sau.edu.bd");
    assert.equal(siteKey("www.sau.ac.bd"), "sau.ac.bd");
    assert.equal(sameSite("https://www.sau.edu.bd", "https://www.sau.ac.bd/admission"), false);
    assert.equal(sameSite("https://www.du.ac.bd", "https://admission.du.ac.bd/apply"), true);
  });

  it("scores Bangla and English admission wording above ordinary pages", () => {
    assert.ok(scoreLink("ভর্তি বিজ্ঞপ্তি", "https://www.du.ac.bd/a.pdf") >= 8);
    assert.ok(scoreLink("Undergraduate admission notice", "https://www.du.ac.bd/notices") >= 4);
    assert.equal(scoreLink("Library catalog", "https://www.du.ac.bd/library"), 0);
  });

  it("obeys robots.txt allow and disallow", () => {
    const file = parseRobots("User-agent: *\nDisallow: /secret\nAllow: /secret/public\nSitemap: https://www.du.ac.bd/sitemap.xml\n");
    assert.equal(robotsAllows(file, "/secret/admission", "ADMISSION26-discovery/1.0"), false);
    assert.equal(robotsAllows(file, "/secret/public", "ADMISSION26-discovery/1.0"), true);
    assert.equal(robotsAllows(file, "/notices", "ADMISSION26-discovery/1.0"), true);
    assert.equal(file.sitemaps.length, 1);
  });

  it("skips a cycle that is not due and does not fetch", async () => {
    let called = 0;
    const previous: CrawlState = {
      version: 1,
      intervalMinutes: 45,
      lastStartedAt: "2026-11-04T15:00:00.000Z",
      lastCompletedAt: "2026-11-04T15:10:00.000Z",
      lastStatus: "completed",
      cycleId: "cyc-old",
      cursor: 0,
      note: NO_DATE_NOTE,
    };
    const result = await runDiscovery({
      institutions: [du],
      previousRegistry: [],
      previousDiscoveries: [],
      previousState: previous,
      now: new Date("2026-11-04T15:30:00.000Z"),
      runner: "test",
      limits,
      fetchImpl: async () => {
        called += 1;
        return jsonResponse("no");
      },
    });
    assert.equal(result.skipped, true);
    assert.equal(result.bundle, null);
    assert.equal(called, 0);
  });

  it("records a 403 as a failure and not as unchanged", async () => {
    const result = await runDiscovery({
      institutions: [du, { id: "nau", kind: "university", name: "Naogaon University", shortName: "NaU", website: null }],
      previousRegistry: [],
      previousDiscoveries: [],
      previousState: null,
      now: new Date("2026-11-04T16:00:00.000Z"),
      runner: "test",
      limits,
      clock: () => new Date("2026-11-04T16:00:00.000Z"),
      fetchImpl: async (url) => {
        const target = String(url);
        if (target.endsWith("/robots.txt")) return jsonResponse("User-agent: *\nDisallow:\n", 200, "text/plain");
        return jsonResponse("blocked", 403);
      },
    });
    assert.equal(result.skipped, false);
    const live = result.bundle?.live;
    assert.ok(live);
    const homepage = live.sources.find((source) => source.universityId === "du" && source.type === "homepage");
    assert.equal(homepage?.reachability, "unreachable");
    assert.notEqual(homepage?.reachability, "no_change");
    assert.match(homepage?.note ?? "", /not a successful check|Not treated as unchanged|403/i);
    const missing = live.sources.find((source) => source.universityId === "nau");
    assert.equal(missing?.reachability, "no_official_url");
    assert.equal(live.counts.failed, 1);
    assert.equal(JSON.stringify(live).includes("applicationCloses"), false);
    assert.match(live.note, /No admission date/);
  });

  it("discovers same-site admission links and does not crawl news sites or disallowed paths", async () => {
    const fetched: string[] = [];
    const result = await runDiscovery({
      institutions: [du],
      previousRegistry: [],
      previousDiscoveries: [],
      previousState: null,
      now: new Date("2026-11-04T16:00:00.000Z"),
      force: true,
      runner: "test",
      limits,
      clock: () => new Date("2026-11-04T16:00:00.000Z"),
      fetchImpl: async (url) => {
        const target = new URL(String(url));
        fetched.push(target.href);
        if (target.pathname === "/robots.txt") {
          return jsonResponse("User-agent: *\nDisallow: /secret\nSitemap: https://www.du.ac.bd/sitemap.xml\n", 200, "text/plain");
        }
        if (target.pathname === "/" ) return jsonResponse(homeHtml);
        if (target.pathname.endsWith("/undergraduate-admission")) return jsonResponse(noticeHtml);
        if (target.pathname.endsWith("/sitemap.xml")) return jsonResponse(sitemapXml, 200, "application/xml");
        return jsonResponse("missing", 404);
      },
    });
    const live = result.bundle?.live as LiveFile;
    assert.equal(fetched.some((url) => url.includes("thedailystar")), false);
    assert.equal(fetched.some((url) => url.includes("/secret")), false);
    assert.equal(fetched.some((url) => url.endsWith(".pdf")), false);
    assert.equal(fetched.some((url) => url.endsWith("/undergraduate-admission")), true);
    const urls = live.discoveries.map((item) => item.url);
    assert.ok(urls.some((url) => url.endsWith("/admissions/circular.pdf")));
    assert.ok(urls.some((url) => url.endsWith("/files/seat-plan.pdf")));
    assert.ok(urls.some((url) => url.endsWith("/files/admission-circular-2026.pdf")));
    assert.equal(urls.some((url) => url.includes("example.com")), false);
    assert.equal(urls.some((url) => url.includes("thedailystar")), false);
    const home = live.sources.find((source) => source.type === "homepage");
    assert.equal(home?.reachability, "new_document");
    assert.equal(live.discoveries.every((item) => item.downloaded === false), true);
    assert.equal(JSON.stringify(live).includes("auto_applied"), false);
    assert.match(live.events.map((event) => event.message).join("\n"), /Starting discovery cycle/);
    assert.match(live.events.map((event) => event.message).join("\n"), /No admission date was published/);
  });

  it("does not show an old or finished cycle as currently running", () => {
    const base: LiveFile = {
      version: 1,
      generatedAt: "2026-11-04T16:00:00.000Z",
      status: "completed",
      runner: "test",
      intervalMinutes: 45,
      cycleId: "cyc",
      startedAt: "2026-11-04T15:50:00.000Z",
      completedAt: "2026-11-04T16:00:00.000Z",
      durationMs: 1,
      note: NO_DATE_NOTE,
      counts: {
        universities: 1,
        systems: 0,
        sources: 1,
        checked: 1,
        reached: 1,
        unchanged: 0,
        failed: 1,
        skipped: 0,
        notChecked: 0,
        newDocuments: 0,
        newPages: 0,
      },
      events: [],
      sources: [],
      discoveries: [],
    };
    assert.equal(systemStatus(base, new Date("2026-11-04T16:20:00.000Z")), "degraded");
    assert.equal(systemStatus({ ...base, status: "running", completedAt: null }, new Date("2026-11-04T18:00:00.000Z")), "failed");
    assert.equal(systemStatus(base, new Date("2026-11-04T20:00:00.000Z")), "stale");
    assert.equal(shouldStartCycle("2026-11-04T16:00:00.000Z", new Date("2026-11-04T16:20:00.000Z"), 45, "completed"), false);
    assert.equal(shouldStartCycle("2026-11-04T16:00:00.000Z", new Date("2026-11-04T16:50:00.000Z"), 45, "completed"), true);
    assert.equal(shouldStartCycle("2026-11-04T16:00:00.000Z", new Date("2026-11-04T16:10:00.000Z"), 45, "running"), true);
  });
});
