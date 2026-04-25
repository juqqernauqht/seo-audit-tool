"use client";

import { useState } from "react";
import type { AuditReport, IssueCategory, Severity } from "@/lib/types";

interface Props {
  report: AuditReport;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "KRİTİK",
  high: "YÜKSEK",
  medium: "ORTA",
  low: "DÜŞÜK",
};

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  technical: "Teknik",
  onpage: "On-Page",
  local: "Yerel SEO",
  "internal-links": "İç Link",
  schema: "Schema",
  performance: "Performans",
  serp: "SERP",
};

export default function IssueList({ report }: Props) {
  const [cat, setCat] = useState<IssueCategory | "all">("all");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const issues = report.prioritizedIssues.filter(
    (i) =>
      (cat === "all" || i.category === cat) &&
      (sev === "all" || i.severity === sev)
  );

  const paginated = issues.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(issues.length / perPage);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Sorun Listesi ({issues.length})
        </h2>
        <p className="text-gray-400 text-sm">Öncelik sırasına göre sıralanmış</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={cat}
          onChange={(e) => {
            setCat(e.target.value as IssueCategory | "all");
            setPage(1);
          }}
          className="input w-auto text-sm"
        >
          <option value="all">Tüm Kategoriler</option>
          {(Object.entries(CATEGORY_LABELS) as [IssueCategory, string][]).map(
            ([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            )
          )}
        </select>

        <select
          value={sev}
          onChange={(e) => {
            setSev(e.target.value as Severity | "all");
            setPage(1);
          }}
          className="input w-auto text-sm"
        >
          <option value="all">Tüm Önem Seviyeleri</option>
          <option value="critical">Kritik</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>
      </div>

      <div className="space-y-2">
        {paginated.map((issue) => (
          <div
            key={issue.id}
            className={`card border-l-4 ${
              issue.severity === "critical"
                ? "border-red-500"
                : issue.severity === "high"
                ? "border-orange-500"
                : issue.severity === "medium"
                ? "border-yellow-500"
                : "border-blue-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge-${issue.severity}`}>
                    {SEVERITY_LABELS[issue.severity]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                  {issue.isQuickWin && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full border border-yellow-500/30">
                      ⚡ Hızlı Kazanım
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-white mb-1">
                  {issue.title}
                </div>
                <div className="text-xs text-gray-400">{issue.description}</div>
                <div className="text-xs text-blue-400 mt-1.5">
                  💡 {issue.solution}
                </div>
              </div>
              <div className="text-right shrink-0 text-xs text-gray-500 space-y-0.5">
                <div>Etki: {issue.impactScore}/10</div>
                <div>Zorluk: {issue.difficultyScore}/5</div>
                <div className="text-green-400">{issue.estimatedSeoImpact}</div>
              </div>
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <div className="card text-center text-gray-500 py-10">
            Bu filtrelerde sorun bulunamadı ✓
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
          >
            ← Önceki
          </button>
          <span className="text-gray-400 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}
