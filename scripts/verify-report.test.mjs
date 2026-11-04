import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("published verification output", () => {
  it("does not count failures as reached and does not auto-apply unconfirmed dates", () => {
    const report = JSON.parse(readFileSync(new URL("../public/verification/report.json", import.meta.url), "utf8"));
    const { reached, failed, notChecked, unchanged, fingerprinted, changed, structuredApplied } = report.summary;
    assert.equal(reached + failed + notChecked, report.sources.length);
    assert.equal(reached, unchanged + fingerprinted + changed + structuredApplied);
    assert.equal(report.applied.every((item) => item.reliable && item.status === "auto_applied"), true);
    assert.equal(report.proposals.every((item) => item.reliable === false && item.status === "review_required"), true);
    assert.equal(report.sources.some((item) => item.status === "check_failed" && item.note.toLowerCase().includes("not evidence")), true);
    assert.equal(report.generatedAt == null || typeof report.generatedAt === "string", true);
  });

  it("schedules the GitHub Action every 12 hours without a push trigger", () => {
    const yaml = readFileSync(new URL("../.github/workflows/verify-admissions.yml", import.meta.url), "utf8");
    assert.match(yaml, /cron:\s*"0 \*\/12 \* \* \*"/);
    assert.match(yaml, /workflow_dispatch:/);
    assert.doesNotMatch(yaml, /\n\s*push:/);
    assert.match(yaml, /verify-sources\.ts/);
    assert.match(yaml, /\[skip ci\]/);
  });
});
