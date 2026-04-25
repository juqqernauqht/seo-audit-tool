import type { CrawlJob } from "./types";

// Global singleton store — swap with Redis in production
const g = globalThis as typeof globalThis & {
  _seoJobStore?: Map<string, CrawlJob>;
};
if (!g._seoJobStore) {
  g._seoJobStore = new Map<string, CrawlJob>();
}

export const jobStore = g._seoJobStore;

export function getJob(id: string): CrawlJob | undefined {
  return jobStore.get(id);
}

export function setJob(id: string, job: CrawlJob): void {
  jobStore.set(id, job);
}

export function updateJob(id: string, updates: Partial<CrawlJob>): void {
  const existing = jobStore.get(id);
  if (existing) {
    jobStore.set(id, { ...existing, ...updates });
  }
}
