"use client";

import type { AuditReport } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import { AlertTriangle, CheckCircle, XCircle, Globe } from "lucide-react";

interface Props {
  report: AuditReport;
}

const SCORE_LABELS: Record<string, string> = {
  technical: "Teknik SEO",
  indexability: "İndexlenebilirlik",
  onPage: "On-Page",
  internalLinks: "İç Link",
  localSeo: "Yerel SEO",
  serp: "SERP/CTR",
  performance: "Performans",
};

export default function OverviewSection({ report }: Props) {
  const { scores, summary } = report;

  const topIssues = report.prioritizedIssues
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Genel Bakış</h2>
        <p className="text-gray-400 text-sm">
          {report.domain} — {new Date(report.createdAt).toLocaleString("tr-TR")}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Taranan Sayfa", value: summary.crawledPages, icon: Globe, color: "text-blue-400" },
          { label: "İndexlenebilir", value: summary.indexablePages, icon: CheckCircle, color: "text-green-400" },
          { label: "Kritik Sorun", value: summary.criticalIssues, icon: XCircle, color: "text-red-400" },
          { label: "Toplam Sorun", value: summary.totalIssues, icon: AlertTriangle, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <Icon className={`w-8 h-8 ${color} shrink-0`} />
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Score Cards */}
      <div>
        <h3 className="text-base font-semibold text-gray-300 mb-3">Boyutsal Skorlar</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(scores).map(([key, value]) => (
            <ScoreCard key={key} label={SCORE_LABELS[key] ?? key} score={value} />
          ))}
        </div>
      </div>

      {/* Kritik Sorunlar */}
      {topIssues.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-300 mb-3">
            Kritik ve Yüksek Öncelikli Sorunlar
          </h3>
          <div className="space-y-2">
            {topIssues.map((issue) => (
              <div
                key={issue.id}
                className="card flex items-start gap-3 border-l-2 border-red-500"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        issue.severity === "critical"
                          ? "badge-critical"
                          : "badge-high"
                      }`}
                    >
                      {issue.severity === "critical" ? "KRİTİK" : "YÜKSEK"}
                    </span>
                    <span className="text-xs text-gray-500">{issue.category}</span>
                  </div>
                  <div className="text-sm font-medium text-white">{issue.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{issue.description}</div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  {issue.affectedUrls.length} URL
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hızlı Kazanımlar Özet */}
      {report.quickWins.length > 0 && (
        <div className="card bg-yellow-500/5 border-yellow-500/20">
          <h3 className="text-yellow-400 font-semibold mb-2">
            ⚡ {report.quickWins.length} Hızlı Kazanım Mevcut
          </h3>
          <p className="text-gray-400 text-sm">
            Düşük efor, yüksek etki potansiyelli düzeltmeler mevcut. 
            Hızlı kazanımlar sekmesinden detayları görün.
          </p>
        </div>
      )}
    </div>
  );
}
