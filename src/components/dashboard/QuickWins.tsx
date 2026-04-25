"use client";

import type { AuditReport } from "@/lib/types";
import { Zap } from "lucide-react";

interface Props {
  report: AuditReport;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Teknik SEO",
  onpage: "On-Page",
  local: "Yerel SEO",
  "internal-links": "İç Link",
  schema: "Schema",
  performance: "Performans",
  serp: "SERP",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "KRİTİK",
  high: "YÜKSEK",
  medium: "ORTA",
  low: "DÜŞÜK",
};

export default function QuickWins({ report }: Props) {
  const wins = report.quickWins;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          ⚡ Hızlı Kazanımlar ({wins.length})
        </h2>
        <p className="text-gray-400 text-sm">
          Düşük efor, yüksek etki. Bu düzeltmeler en kısa sürede SEO değeri sağlar.
        </p>
      </div>

      {wins.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-green-400 text-lg mb-2">🎉 Harika!</div>
          <p className="text-gray-400">
            Kolay düzeltilebilecek kritik sorun bulunamadı.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {wins.map((win, i) => (
            <div key={win.id} className="card bg-yellow-500/5 border-yellow-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-yellow-400 font-bold text-sm">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge-${win.severity}`}>
                      {SEVERITY_LABELS[win.severity]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {CATEGORY_LABELS[win.category]}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">
                    {win.title}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {win.description}
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                    <div className="flex items-start gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-yellow-400 font-medium mb-0.5">
                          Nasıl Düzeltilir
                        </div>
                        <div className="text-xs text-gray-300">
                          {win.solution}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>
                      SEO Etkisi:{" "}
                      <strong className="text-green-400">
                        {win.estimatedSeoImpact}
                      </strong>
                    </span>
                    <span>
                      Etkilenen:{" "}
                      <strong className="text-white">
                        {win.affectedUrls.length} URL
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
