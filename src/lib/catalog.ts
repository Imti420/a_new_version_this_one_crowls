import { useMemo } from "react";
import { seedCirculars } from "@/data/circulars";
import type { Circular, University } from "@/data/types";
import { seedSystems, seedUniversities } from "@/data/universities";
import { usePersonal } from "@/lib/store";
import { usePublishedReport } from "@/lib/published-report";
import { applyOverlays, type Proposal } from "@/lib/verify-engine";

const noApplied: Proposal[] = [];

function mergeUni(base: University, patch?: Partial<University>): University {
  if (!patch) return base;
  return { ...base, ...patch, id: base.id, kind: patch.kind ?? base.kind };
}

function mergeCircular(base: Circular, patch?: Partial<Circular>): Circular {
  if (!patch) return base;
  return { ...base, ...patch, id: base.id };
}

export function buildCatalog(input: {
  customUniversities: University[];
  customCirculars: Circular[];
  universityPatches: Record<string, Partial<University>>;
  circularPatches: Record<string, Partial<Circular>>;
  hiddenUniversityIds: string[];
  hiddenCircularIds: string[];
  applied?: Proposal[];
  rejectedIds?: string[];
}) {
  const hiddenU = new Set(input.hiddenUniversityIds);
  const hiddenC = new Set(input.hiddenCircularIds);
  const rejected = new Set(input.rejectedIds ?? []);
  const universities = [...seedUniversities, ...seedSystems, ...input.customUniversities]
    .filter((item) => !hiddenU.has(item.id))
    .map((item) => mergeUni(item, input.universityPatches[item.id]));
  const overlaid = applyOverlays([...seedCirculars, ...input.customCirculars], input.applied ?? [], rejected);
  const circulars = overlaid
    .filter((item) => !hiddenC.has(item.id))
    .map((item) => mergeCircular(item, input.circularPatches[item.id]))
    .filter((item) => universities.some((uni) => uni.id === item.universityId));
  const byId = new Map(universities.map((uni) => [uni.id, uni]));
  return { universities, circulars, byId };
}

export function useCatalog() {
  const customUniversities = usePersonal((s) => s.customUniversities);
  const customCirculars = usePersonal((s) => s.customCirculars);
  const universityPatches = usePersonal((s) => s.universityPatches);
  const circularPatches = usePersonal((s) => s.circularPatches);
  const hiddenUniversityIds = usePersonal((s) => s.hiddenUniversityIds);
  const hiddenCircularIds = usePersonal((s) => s.hiddenCircularIds);
  const decisions = usePersonal((s) => s.proposalDecisions);
  const applied = usePublishedReport((s) => s.report?.applied ?? noApplied);
  const rejectedIds = useMemo(
    () =>
      Object.entries(decisions)
        .filter(([, decision]) => decision === "rejected")
        .map(([id]) => id),
    [decisions],
  );
  return useMemo(
    () =>
      buildCatalog({
        customUniversities,
        customCirculars,
        universityPatches,
        circularPatches,
        hiddenUniversityIds,
        hiddenCircularIds,
        applied,
        rejectedIds,
      }),
    [
      customUniversities,
      customCirculars,
      universityPatches,
      circularPatches,
      hiddenUniversityIds,
      hiddenCircularIds,
      applied,
      rejectedIds,
    ],
  );
}

export function isCustomUniversity(id: string): boolean {
  return usePersonal.getState().customUniversities.some((item) => item.id === id);
}

export function isCustomCircular(id: string): boolean {
  return usePersonal.getState().customCirculars.some((item) => item.id === id);
}

export function blankUniversity(name: string): University {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  return {
    id: `u-${slug || "record"}-${Date.now().toString(36)}`,
    kind: "university",
    name: name.trim() || "Untitled university",
    shortName: "NEW",
    nameBn: "",
    track: "general",
    tags: [],
    city: "",
    website: null,
    admissionUrl: null,
    directoryNote: "Added on this desk. No official 2026–27 notice is stored until you log a source.",
  };
}

export function blankCircular(universityId: string, title: string): Circular {
  return {
    id: `c-${universityId}-${Date.now().toString(36)}`,
    universityId,
    session: "2026-27",
    title: title.trim() || "Untitled notice",
    summary: "Logged on this desk. Fill only facts you have checked.",
    system: "own",
    publication: "none",
    confidence: "not-announced",
    confidenceNote: "Entered locally. Not yet tied to a source.",
    sources: [],
    updatedOn: new Date().toISOString().slice(0, 10),
    pdfUrl: null,
    applicationOpens: null,
    opensAt: null,
    applicationCloses: null,
    closesAt: null,
    admitCardOn: null,
    examDate: null,
    examTime: null,
    resultOn: null,
    classesBegin: null,
    feeBdt: null,
    feeNote: "",
    seats: null,
    eligibility: [],
    units: [],
    notes: [],
  };
}
