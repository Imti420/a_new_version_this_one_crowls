# ADMISSION//26

The Bangladesh university admission archive for the 2026–27 session. An independent admission intelligence archive. Creator: Imti's creation.

A local desk: directory, circulars, deadline radar, calendar, shortlist, application tracker, personal desk and an information monitor. Personal marks stay in this browser. There is no account.

## Launch

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

The dev server listens on port 8080.

```bash
npm run build
npm run preview
```

Deploy the production build to Vercel the same way as any other TanStack Start app in this repository (`npm run build`). Scheduled verification does not run on Vercel. Vercel only serves the files the GitHub Action commits.

## What is stored

Seed records live in `src/data/universities.ts` and `src/data/circulars.ts`.

Unknown dates, fees, seats and eligibility are `null` and render as **NOT ANNOUNCED**. Do not fill a number from memory or from last year's circular.

Evidence grades:

- **Official notice cited** — a report quotes a university notice, press release, or signed decision. A PDF is linked only when this archive has a URL.
- **Reported** — a newsroom stated the date. The underlying document is not stored here.
- **Reported · not final** — the source itself calls the date proposed, probable, provisional or tentative.
- **Marked verified on this desk** — your own check. It does not change the source grade.

The 4 Nov 2026 seed uses the UGC public-university list for names and websites, and three Daily Star reports for dates. The monitor may re-read those URLs. It does not invent dates.

## Discovery log

`scripts/crawl-admissions.ts` opens the official homepages already stored for the 84 universities and 3 admission systems. From each page it keeps same-site links that look like admission notices in English or Bangla, and it records PDF links. It does not download those PDFs, and it does not publish dates.

- A failed or blocked site stays failed. It is not stored as "no change".
- `robots.txt` disallow rules are skipped.
- Sher-e-Bangla (`sau.edu.bd`) and Sylhet Agricultural (`sau.ac.bd`) are never treated as the same site.
- The public page is **Discovery log**. It only shows events the crawler wrote.

Files:

- `data/ops/state.json` — last cycle time, used to wait 45 minutes
- `data/ops/registry.json` — source health
- `data/ops/discoveries.json` — links found
- `data/ops/events.json` — the activity log
- `public/ops/live.json` — the copy the website reads

`.github/workflows/discover-admissions.yml` wakes every 15 minutes. Most wakes exit immediately because the last finished cycle is still inside 45 minutes. GitHub can start a scheduled job late. The workflow does not run on push.

To run it by hand: open the GitHub repository, click **Actions**, click **Discover admission sources**, click **Run workflow**, leave the force box off, then click the green **Run workflow** button. No token is required to read public pages. The only credential is GitHub's own token, used to commit the log.

Vercel skips a rebuild when a commit changes only `data/ops/` and `public/ops/`. The page then reads the newer log from GitHub.

```bash
node --experimental-strip-types scripts/crawl-admissions.ts
node --experimental-strip-types scripts/crawl-admissions.ts --force
```

## Calendar

The calendar is built from dates already on circulars, plus personal events stored in this browser. Opening a date shows its confidence. Personal events can be edited, deleted, completed and reminded inside the app. **Export .ics** downloads `admission26.ics` for Google Calendar and other clients. Times are floating local times, not UTC.

## Information monitor

`scripts/verify-sources.ts` reads official websites, admission URLs, cited reports and PDF links out of the seed files. It records status, `Last-Modified`, `ETag` and a content fingerprint.

- HTTP 200 by itself is not a successful verification.
- A failed or oversized response is **CHECK FAILED**. It is not treated as "no news".
- A changed page becomes **REVIEW REQUIRED** unless the page contains a structured official block.
- Structured auto-apply only happens for `admission26.notice.v1` JSON on the official host:

```html
<script type="application/json" data-admission26="notice">
{"schema":"admission26.notice.v1","circularId":"c-du","field":"applicationCloses","value":"2026-11-30"}
</script>
```

Allowed fields: `applicationOpens`, `applicationCloses`, `examDate`, `admitCardOn`, `resultOn`, `classesBegin`, `feeBdt`, `eligibility`. Anything else stays in review. Rejecting an overlay on the monitor keeps the previous value on this desk.

Published output:

- `public/verification/report.json` — what the website displays
- `public/verification/applied.json` — structured overlays only
- `public/verification/sources.json` — the URL list
- `data/verification/snapshot.json` — fingerprints for the next run
- `src/data/source-manifest.ts` — the same list, imported by Check now

Check now calls a server function with source ids from that manifest. It cannot be pointed at an arbitrary URL. It does not replace the published report.

### Scheduling

`.github/workflows/verify-admissions.yml` runs every 12 hours and on manual dispatch. It does **not** run on push, so committing a report cannot retrigger it. The commit message includes `[skip ci]`.

```bash
node --experimental-strip-types scripts/verify-sources.ts --manifest-only
node --experimental-strip-types scripts/verify-sources.ts
```

No token is required to read public pages. The workflow's only credential is the default `GITHUB_TOKEN` used to commit the report. Nothing in the frontend reads a token.

If `report.json` is missing, or `generatedAt` is older than 18 hours, the site shows a warning. It does not fill the dashboard with a fake all-clear.

## Backup

Settings → Export desk backup. Version 2 JSON restores bookmarks, notes, the shortlist, tracker progress, calendar events, desk notes and amendments. Version 1 backups still import. The merged catalog export is a readable snapshot and is not an import file.
