import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Circular, DeskNote, DeskSection, PersonalEvent, Progress, University } from "@/data/types";
import { DEFAULT_DESK_LAYOUT } from "@/data/types";
import { todayISO } from "@/lib/dates";

export interface PersonalData {
  version: 1;
  bookmarks: string[];
  shortlist: string[];
  readIds: string[];
  pinnedIds: string[];
  verifiedOn: Record<string, string>;
  progress: Record<string, Progress>;
  notes: Record<string, string>;
  universityPatches: Record<string, Partial<University>>;
  circularPatches: Record<string, Partial<Circular>>;
  customUniversities: University[];
  customCirculars: Circular[];
  hiddenUniversityIds: string[];
  hiddenCircularIds: string[];
  personalEvents: PersonalEvent[];
  deskNotes: DeskNote[];
  deskLayout: DeskSection[];
  readNoticeIds: string[];
  proposalDecisions: Record<string, "approved" | "rejected">;
}

export const emptyPersonal: PersonalData = {
  version: 1,
  bookmarks: [],
  shortlist: [],
  readIds: [],
  pinnedIds: [],
  verifiedOn: {},
  progress: {},
  notes: {},
  universityPatches: {},
  circularPatches: {},
  customUniversities: [],
  customCirculars: [],
  hiddenUniversityIds: [],
  hiddenCircularIds: [],
  personalEvents: [],
  deskNotes: [],
  deskLayout: DEFAULT_DESK_LAYOUT,
  readNoticeIds: [],
  proposalDecisions: {},
};

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

type Store = PersonalData & {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  toggleBookmark: (id: string) => void;
  toggleShortlist: (id: string) => void;
  toggleRead: (id: string) => void;
  markRead: (id: string) => void;
  togglePin: (id: string) => void;
  toggleVerified: (id: string) => void;
  setProgress: (id: string, progress: Progress | null) => void;
  setNote: (id: string, note: string) => void;
  saveUniversity: (id: string, patch: Partial<University>, custom: boolean) => void;
  saveCircular: (id: string, patch: Partial<Circular>, custom: boolean) => void;
  addUniversity: (university: University) => void;
  addCircular: (circular: Circular) => void;
  hideUniversity: (id: string) => void;
  hideCircular: (id: string) => void;
  addPersonalEvent: (event: PersonalEvent) => void;
  updatePersonalEvent: (id: string, patch: Partial<PersonalEvent>) => void;
  deletePersonalEvent: (id: string) => void;
  addDeskNote: (note: DeskNote) => void;
  updateDeskNote: (id: string, patch: Partial<DeskNote>) => void;
  deleteDeskNote: (id: string) => void;
  setDeskLayout: (layout: DeskSection[]) => void;
  markNoticeRead: (id: string) => void;
  markNoticesRead: (ids: string[]) => void;
  decideProposal: (id: string, decision: "approved" | "rejected") => void;
  replacePersonal: (data: PersonalData) => void;
  resetPersonal: () => void;
};

const memoryStore = new Map<string, string>();

const browserStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return memoryStore.get(name) ?? null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") memoryStore.set(name, value);
    else localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") memoryStore.delete(name);
    else localStorage.removeItem(name);
  },
};

export const usePersonal = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyPersonal,
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      toggleBookmark: (id) => set({ bookmarks: toggle(get().bookmarks, id) }),
      toggleShortlist: (id) => set({ shortlist: toggle(get().shortlist, id) }),
      toggleRead: (id) => set({ readIds: toggle(get().readIds, id) }),
      markRead: (id) => set({ readIds: get().readIds.includes(id) ? get().readIds : [...get().readIds, id] }),
      togglePin: (id) => set({ pinnedIds: toggle(get().pinnedIds, id) }),
      toggleVerified: (id) => {
        const next = { ...get().verifiedOn };
        if (next[id]) delete next[id];
        else next[id] = todayISO();
        set({ verifiedOn: next });
      },
      setProgress: (id, progress) => {
        const next = { ...get().progress };
        if (!progress) delete next[id];
        else next[id] = progress;
        set({ progress: next });
      },
      setNote: (id, note) => {
        const next = { ...get().notes };
        if (!note.trim()) delete next[id];
        else next[id] = note;
        set({ notes: next });
      },
      saveUniversity: (id, patch, custom) => {
        if (custom) {
          set({
            customUniversities: get().customUniversities.map((item) =>
              item.id === id ? { ...item, ...patch, id } : item,
            ),
          });
          return;
        }
        set({
          universityPatches: {
            ...get().universityPatches,
            [id]: { ...get().universityPatches[id], ...patch, id },
          },
        });
      },
      saveCircular: (id, patch, custom) => {
        if (custom) {
          set({
            customCirculars: get().customCirculars.map((item) =>
              item.id === id ? { ...item, ...patch, id } : item,
            ),
          });
          return;
        }
        set({
          circularPatches: {
            ...get().circularPatches,
            [id]: { ...get().circularPatches[id], ...patch, id },
          },
        });
      },
      addUniversity: (university) => set({ customUniversities: [...get().customUniversities, university] }),
      addCircular: (circular) => set({ customCirculars: [...get().customCirculars, circular] }),
      hideUniversity: (id) => {
        if (get().customUniversities.some((item) => item.id === id)) {
          set({ customUniversities: get().customUniversities.filter((item) => item.id !== id) });
          return;
        }
        set({ hiddenUniversityIds: [...new Set([...get().hiddenUniversityIds, id])] });
      },
      hideCircular: (id) => {
        if (get().customCirculars.some((item) => item.id === id)) {
          set({ customCirculars: get().customCirculars.filter((item) => item.id !== id) });
          return;
        }
        set({ hiddenCircularIds: [...new Set([...get().hiddenCircularIds, id])] });
      },
      addPersonalEvent: (event) => set({ personalEvents: [...get().personalEvents, event] }),
      updatePersonalEvent: (id, patch) =>
        set({
          personalEvents: get().personalEvents.map((event) => (event.id === id ? { ...event, ...patch, id } : event)),
        }),
      deletePersonalEvent: (id) => set({ personalEvents: get().personalEvents.filter((event) => event.id !== id) }),
      addDeskNote: (note) => set({ deskNotes: [note, ...get().deskNotes] }),
      updateDeskNote: (id, patch) =>
        set({
          deskNotes: get().deskNotes.map((note) => (note.id === id ? { ...note, ...patch, id } : note)),
        }),
      deleteDeskNote: (id) => set({ deskNotes: get().deskNotes.filter((note) => note.id !== id) }),
      setDeskLayout: (layout) => set({ deskLayout: normalizeLayout(layout) }),
      markNoticeRead: (id) => set({ readNoticeIds: get().readNoticeIds.includes(id) ? get().readNoticeIds : [...get().readNoticeIds, id] }),
      markNoticesRead: (ids) => set({ readNoticeIds: [...new Set([...get().readNoticeIds, ...ids])] }),
      decideProposal: (id, decision) => set({ proposalDecisions: { ...get().proposalDecisions, [id]: decision } }),
      replacePersonal: (data) => set({ ...emptyPersonal, ...normalizePersonal(data) }),
      resetPersonal: () => set({ ...emptyPersonal }),
    }),
    {
      name: "admission26.v1",
      storage: createJSONStorage(() => browserStorage),
      skipHydration: true,
      partialize: (state) => ({
        version: state.version,
        bookmarks: state.bookmarks,
        shortlist: state.shortlist,
        readIds: state.readIds,
        pinnedIds: state.pinnedIds,
        verifiedOn: state.verifiedOn,
        progress: state.progress,
        notes: state.notes,
        universityPatches: state.universityPatches,
        circularPatches: state.circularPatches,
        customUniversities: state.customUniversities,
        customCirculars: state.customCirculars,
        hiddenUniversityIds: state.hiddenUniversityIds,
        hiddenCircularIds: state.hiddenCircularIds,
        personalEvents: state.personalEvents,
        deskNotes: state.deskNotes,
        deskLayout: state.deskLayout,
        readNoticeIds: state.readNoticeIds,
        proposalDecisions: state.proposalDecisions,
      }),
      merge: (persisted, current) => {
        const data = normalizePersonal(persisted ?? {});
        return { ...current, ...data, hydrated: false };
      },
    },
  ),
);

export function personalSnapshot(state: Store): PersonalData {
  return {
    version: 1,
    bookmarks: state.bookmarks,
    shortlist: state.shortlist,
    readIds: state.readIds,
    pinnedIds: state.pinnedIds,
    verifiedOn: state.verifiedOn,
    progress: state.progress,
    notes: state.notes,
    universityPatches: state.universityPatches,
    circularPatches: state.circularPatches,
    customUniversities: state.customUniversities,
    customCirculars: state.customCirculars,
    hiddenUniversityIds: state.hiddenUniversityIds,
    hiddenCircularIds: state.hiddenCircularIds,
    personalEvents: state.personalEvents,
    deskNotes: state.deskNotes,
    deskLayout: state.deskLayout,
    readNoticeIds: state.readNoticeIds,
    proposalDecisions: state.proposalDecisions,
  };
}

export function parseBackup(raw: unknown): PersonalData | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { archive?: unknown; version?: unknown; personal?: unknown };
  if (record.archive !== "ADMISSION//26" || (record.version !== 1 && record.version !== 2)) return null;
  const personal = record.personal;
  if (!personal || typeof personal !== "object") return null;
  const data = personal as Partial<PersonalData>;
  if (!Array.isArray(data.bookmarks) || !Array.isArray(data.customUniversities) || !Array.isArray(data.customCirculars)) {
    return null;
  }
  return normalizePersonal(data);
}

const SECTION_IDS = new Set(DEFAULT_DESK_LAYOUT.map((item) => item.id));

export function normalizeLayout(layout: unknown): DeskSection[] {
  const incoming = Array.isArray(layout) ? layout : [];
  const seen = new Set<string>();
  const out: DeskSection[] = [];
  for (const item of incoming) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id !== "string" || !SECTION_IDS.has(id as DeskSection["id"]) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id: id as DeskSection["id"], hidden: Boolean((item as { hidden?: unknown }).hidden) });
  }
  for (const section of DEFAULT_DESK_LAYOUT) {
    if (!seen.has(section.id)) out.push({ ...section });
  }
  return out;
}

export function normalizePersonal(raw: Partial<PersonalData> | unknown): PersonalData {
  const data = raw && typeof raw === "object" ? (raw as Partial<PersonalData>) : {};
  return {
    ...emptyPersonal,
    ...data,
    version: 1,
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    shortlist: Array.isArray(data.shortlist) ? data.shortlist : [],
    readIds: Array.isArray(data.readIds) ? data.readIds : [],
    pinnedIds: Array.isArray(data.pinnedIds) ? data.pinnedIds : [],
    verifiedOn: data.verifiedOn && typeof data.verifiedOn === "object" ? data.verifiedOn : {},
    progress: data.progress && typeof data.progress === "object" ? data.progress : {},
    notes: data.notes && typeof data.notes === "object" ? data.notes : {},
    universityPatches: data.universityPatches && typeof data.universityPatches === "object" ? data.universityPatches : {},
    circularPatches: data.circularPatches && typeof data.circularPatches === "object" ? data.circularPatches : {},
    customUniversities: Array.isArray(data.customUniversities) ? data.customUniversities : [],
    customCirculars: Array.isArray(data.customCirculars) ? data.customCirculars : [],
    hiddenUniversityIds: Array.isArray(data.hiddenUniversityIds) ? data.hiddenUniversityIds : [],
    hiddenCircularIds: Array.isArray(data.hiddenCircularIds) ? data.hiddenCircularIds : [],
    personalEvents: Array.isArray(data.personalEvents) ? data.personalEvents : [],
    deskNotes: Array.isArray(data.deskNotes) ? data.deskNotes : [],
    deskLayout: normalizeLayout(data.deskLayout),
    readNoticeIds: Array.isArray(data.readNoticeIds) ? data.readNoticeIds : [],
    proposalDecisions: data.proposalDecisions && typeof data.proposalDecisions === "object" ? data.proposalDecisions : {},
  };
}
