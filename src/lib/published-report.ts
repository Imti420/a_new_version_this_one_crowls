import { create } from "zustand";
import { isReport, type VerificationReport } from "@/lib/verify-engine";

type Phase = "loading" | "ready" | "missing" | "invalid";

export const usePublishedReport = create<{
  report: VerificationReport | null;
  phase: Phase;
  load: () => Promise<void>;
}>((set) => ({
  report: null,
  phase: "loading",
  load: async () => {
    try {
      const response = await fetch("/verification/report.json", { cache: "no-store" });
      if (!response.ok) {
        set({ report: null, phase: "missing" });
        return;
      }
      const json: unknown = await response.json();
      if (!isReport(json)) {
        set({ report: null, phase: "invalid" });
        return;
      }
      set({ report: json, phase: "ready" });
    } catch {
      set({ report: null, phase: "missing" });
    }
  },
}));
