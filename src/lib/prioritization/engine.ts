import type { SEOIssue } from "../types";

export function prioritizeIssues(issues: SEOIssue[]): SEOIssue[] {
  // Aynı ID grubunu tek issue'ya merge et (etkilenen URL listesini birleştir)
  const merged = mergeIssues(issues);

  // Priority score hesapla
  const scored = merged.map((issue) => {
    const severityWeight =
      issue.severity === "critical" ? 4 :
      issue.severity === "high" ? 3 :
      issue.severity === "medium" ? 2 : 1;

    const affectedWeight = Math.min(10, issue.affectedUrls.length) * 0.3;
    const impactScore = issue.impactScore * severityWeight + affectedWeight;
    const priorityScore = impactScore / Math.max(1, issue.difficultyScore);
    const isQuickWin = impactScore >= 15 && issue.difficultyScore <= 2;

    return { ...issue, priorityScore, isQuickWin };
  });

  // Severity önce, sonra priority score
  return scored.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.priorityScore - a.priorityScore;
  });
}

function mergeIssues(issues: SEOIssue[]): SEOIssue[] {
  // Aynı base ID'ye sahip issue'ları birleştir
  const groups = new Map<string, SEOIssue[]>();

  for (const issue of issues) {
    // UUID suffix'ini kaldır
    const baseId = issue.id.replace(/-[a-f0-9]{8}$/, "");
    if (!groups.has(baseId)) {
      groups.set(baseId, []);
    }
    groups.get(baseId)!.push(issue);
  }

  const merged: SEOIssue[] = [];
  for (const [baseId, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0]);
    } else {
      // En yüksek severity'li olanı al, URL'leri birleştir
      const worst = group.reduce((a, b) => {
        const order = { critical: 3, high: 2, medium: 1, low: 0 };
        return order[a.severity] >= order[b.severity] ? a : b;
      });

      const allUrls = [...new Set(group.flatMap((g) => g.affectedUrls))];

      merged.push({
        ...worst,
        id: baseId,
        affectedUrls: allUrls,
      });
    }
  }

  return merged;
}
