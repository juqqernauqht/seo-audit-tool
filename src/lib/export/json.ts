import type { AuditReport } from "../types";

export function exportToJSON(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

export function exportSummaryJSON(report: AuditReport): string {
  const summary = {
    id: report.id,
    domain: report.domain,
    createdAt: report.createdAt,
    scores: report.scores,
    summary: report.summary,
    quickWins: report.quickWins,
    topIssues: report.prioritizedIssues.slice(0, 20),
    localSeo: report.localSeoSummary,
  };
  return JSON.stringify(summary, null, 2);
}
