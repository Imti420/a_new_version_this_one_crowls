import type { SeedInstitution, SourceRecord } from "./types.ts";
import { normalizeUrl } from "./url.ts";

export function sourceIdFor(universityId: string, url: string | null, type: SourceRecord["type"]): string {
  if (!url) return `missing-${universityId}`;
  const slug = url.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(-48);
  return `${type === "homepage" ? "home" : "found"}-${universityId}-${slug}`.slice(0, 96);
}

export function seedSources(institutions: SeedInstitution[]): SourceRecord[] {
  return institutions.map((institution) => {
    const url = institution.website ? normalizeUrl(institution.website) : null;
    return {
      id: sourceIdFor(institution.id, url, "homepage"),
      universityId: institution.id,
      universityName: institution.name,
      shortName: institution.shortName,
      kind: institution.kind,
      sourceName: url ? `${institution.shortName} official homepage` : `${institution.shortName} has no official website on file`,
      url,
      type: "homepage",
      reliability: "official",
      extraction: url ? "html-links" : "not-fetched",
      origin: "seed",
      lastSuccessAt: null,
      lastFailureAt: null,
      lastCheckedAt: null,
      lastDiscoveredDocument: null,
      documentsFound: 0,
      reachability: url ? "not_yet_checked" : "no_official_url",
      httpStatus: null,
      etag: null,
      lastModified: null,
      contentHash: null,
      error: url ? null : "No official website is registered. This source was not fetched.",
      note: url ? "Seeded from the directory. Not checked yet." : "UGC's public list did not include a website. Nothing was fetched.",
    };
  });
}

export function mergeRegistry(seed: SourceRecord[], previous: SourceRecord[]): SourceRecord[] {
  const byId = new Map<string, SourceRecord>();
  for (const source of seed) byId.set(source.id, source);
  for (const source of previous) {
    if (source.origin !== "discovered") {
      const seeded = byId.get(source.id);
      if (!seeded) continue;
      byId.set(source.id, { ...seeded, ...healthOf(source), id: seeded.id, url: seeded.url, type: seeded.type, origin: "seed" });
      continue;
    }
    if (!source.url) continue;
    const still = seed.some((item) => item.universityId === source.universityId);
    if (!still) continue;
    byId.set(source.id, source);
  }
  return [...byId.values()];
}

function healthOf(source: SourceRecord): Pick<
  SourceRecord,
  | "lastSuccessAt"
  | "lastFailureAt"
  | "lastCheckedAt"
  | "lastDiscoveredDocument"
  | "documentsFound"
  | "reachability"
  | "httpStatus"
  | "etag"
  | "lastModified"
  | "contentHash"
  | "error"
  | "note"
> {
  return {
    lastSuccessAt: source.lastSuccessAt,
    lastFailureAt: source.lastFailureAt,
    lastCheckedAt: source.lastCheckedAt,
    lastDiscoveredDocument: source.lastDiscoveredDocument,
    documentsFound: source.documentsFound,
    reachability: source.reachability,
    httpStatus: source.httpStatus,
    etag: source.etag,
    lastModified: source.lastModified,
    contentHash: source.contentHash,
    error: source.error,
    note: source.note,
  };
}
