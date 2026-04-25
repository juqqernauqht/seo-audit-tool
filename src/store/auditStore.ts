import { create } from "zustand";
import type { AuditReport, CrawlJob } from "@/lib/types";

interface AuditState {
  // Mevcut iş
  currentJob: CrawlJob | null;
  currentReport: AuditReport | null;
  // Dashboard seçili sekme
  activeSection: string;
  // URL table filtre
  urlFilter: string;
  severityFilter: string;
  // Actions
  setCurrentJob: (job: CrawlJob | null) => void;
  setCurrentReport: (report: AuditReport | null) => void;
  setActiveSection: (section: string) => void;
  setUrlFilter: (filter: string) => void;
  setSeverityFilter: (filter: string) => void;
  clearAudit: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  currentJob: null,
  currentReport: null,
  activeSection: "overview",
  urlFilter: "",
  severityFilter: "all",

  setCurrentJob: (job) => set({ currentJob: job }),
  setCurrentReport: (report) => set({ currentReport: report }),
  setActiveSection: (section) => set({ activeSection: section }),
  setUrlFilter: (filter) => set({ urlFilter: filter }),
  setSeverityFilter: (filter) => set({ severityFilter: filter }),
  clearAudit: () =>
    set({
      currentJob: null,
      currentReport: null,
      activeSection: "overview",
      urlFilter: "",
      severityFilter: "all",
    }),
}));
