"use client";

import { useState } from "react";
import type { AuditReport, Severity } from "@/lib/types";

interface Props {
  report: AuditReport;
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "KRİTİK",
  high: "YÜKSEK",
  medium: "ORTA",
  low: "DÜŞÜK",
};

export default function TechnicalSEO({ report }: Props) {
  const [filterSev, setFilterSev] = useState<Severity | "all">("all");
  const [filterCat, setFilterCat] = useState("all");

  const technical = report.prioritizedIssues.filter((i) =>
    ["technical", "schema", "performance"].includes(i.category)
  );

  const filtered = technical.filter((i) => {
    const sevOk = filterSev === "all" || i.severity === filterSev;
    const catOk = filterCat === "all" || i.category === filterCat;
    return sevOk && catOk;
  });

  const counts = SEVERITY_ORDER.reduce(
    (acc, s) => ({
      ...acc,
      [s]: technical.filter((i) => i.severity === s).length,
    }),
    {} as Record<Severity, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Teknik SEO Analizi</h2>
        <p className="text-gray-400 text-sm">{technical.length} sorun tespit edildi</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {SEVERITY_ORDER.map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSev(filterSev === sev ? "all" : sev)}
            className={`card text-center transition-all ${
              filterSev === sev ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                sev === "critical"
                  ? "text-red-400"
                  : sev === "high"
                  ? "text-orange-400"
                  : sev === "medium"
                  ? "text-yellow-400"
                  : "text-blue-400"
              }`}
            >
              {counts[sev]}
            </div>
            <div className="text-xs text-gray-500">{SEVERITY_LABELS[sev]}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "technical", "schema", "performance"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              filterCat === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {cat === "all"
              ? "Tümü"
              : cat === "technical"
              ? "Teknik"
              : cat === "schema"
              ? "Schema"
              : "Performans"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center text-gray-500 py-10">
            Bu kategoride sorun bulunamadı ✓
          </div>
        ) : (
          filtered.map((issue) => <IssueRow key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: AuditReport["prioritizedIssues"][0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <span className={`badge-${issue.severity} shrink-0 mt-0.5`}>
            {SEVERITY_LABELS[issue.severity]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">{issue.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {issue.affectedUrls.length} URL etkilendi
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {issue.isQuickWin && (
              <span className="text-yellow-400 text-xs">⚡ Hızlı</span>
            )}
            <span className="text-gray-500 text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-gray-800 pt-4 space-y-3">
          <p className="text-sm text-gray-400">{issue.description}</p>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="text-xs text-blue-400 font-medium mb-1">
              💡 Çözüm Önerisi
            </div>
            <p className="text-sm text-gray-300">{issue.solution}</p>
          </div>

          <div className="flex gap-4 text-xs text-gray-500">
            <span>Etki: <strong className="text-white">{issue.impactScore}/10</strong></span>
            <span>Zorluk: <strong className="text-white">{issue.difficultyScore}/5</strong></span>
            <span>SEO Etkisi: <strong className="text-green-400">{issue.estimatedSeoImpact}</strong></span>
          </div>

          {issue.affectedUrls.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Etkilenen URLler:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {issue.affectedUrls.slice(0, 10).map((url) => (
                  <div
                    key={url}
                    className="text-xs text-gray-400 truncate bg-gray-800 rounded px-2 py-1"
                  >
                    {url}
                  </div>
                ))}
                {issue.affectedUrls.length > 10 && (
                  <div className="text-xs text-gray-500">
                    +{issue.affectedUrls.length - 10} daha...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
