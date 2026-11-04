import { createServerFn } from "@tanstack/react-start";
import { sourceManifest } from "@/data/source-manifest";
import { classifySource, readHit, type FetchHit } from "@/lib/verify-engine";

function failedHit(url: string, error: string): FetchHit {
  return {
    httpStatus: null,
    finalUrl: url,
    etag: null,
    lastModified: null,
    contentType: null,
    bodyText: null,
    contentHash: null,
    error,
  };
}

export const checkSourceBatch = createServerFn({ method: "POST" })
  .validator((data: { ids?: unknown }) => {
    const ids = Array.isArray(data?.ids) ? data.ids.filter((id): id is string => typeof id === "string") : [];
    if (ids.length < 1 || ids.length > 5) throw new Error("Send 1 to 5 source ids from the archive manifest.");
    return { ids };
  })
  .handler(async ({ data }) => {
    const now = new Date().toISOString();
    const results = [];
    for (const id of data.ids) {
      const source = sourceManifest.sources.find((item) => item.id === id);
      if (!source) {
        results.push({
          missing: true as const,
          id,
        });
        continue;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(source.url, {
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "user-agent": "ADMISSION26-desk/2.0",
            accept: "text/html,application/pdf,application/json;q=0.9,*/*;q=0.8",
          },
        });
        const hit = await readHit(response);
        results.push({ missing: false as const, classified: classifySource({ source, hit, previous: null, facts: sourceManifest.facts, now }) });
      } catch (error) {
        const message = error instanceof Error ? (error.name === "AbortError" ? "timeout" : error.message) : "request failed";
        results.push({
          missing: false as const,
          classified: classifySource({ source, hit: failedHit(source.url, message), previous: null, facts: sourceManifest.facts, now }),
        });
      } finally {
        clearTimeout(timer);
      }
    }
    return { checkedAt: now, results };
  });
