"use client";

import type { AuditReport } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  report: AuditReport;
}

const SCHEMA_BADGES: Record<string, string> = {
  LocalBusiness: "bg-green-500/20 text-green-400 border-green-500/30",
  Organization: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  WebSite: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Service: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  FAQPage: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Article: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  BreadcrumbList: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  invalid: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SchemaSection({ report }: Props) {
  const pagesWithSchema = report.pages.filter(
    (p) => p.pageData.schemas.length > 0
  );
  const pagesWithoutSchema = report.pages.filter(
    (p) => p.pageData.schemas.length === 0 && p.pageData.statusCode === 200
  );

  const schemaTypeCounts: Record<string, number> = {};
  for (const page of report.pages) {
    for (const schema of page.pageData.schemas) {
      schemaTypeCounts[schema.type] =
        (schemaTypeCounts[schema.type] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Schema Analizi</h2>
        <p className="text-gray-400 text-sm">
          Yapılandırılmış veri varlığı ve önerileri
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">
            {pagesWithSchema.length}
          </div>
          <div className="text-xs text-gray-500">Schema Var</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-400">
            {pagesWithoutSchema.length}
          </div>
          <div className="text-xs text-gray-500">Schema Yok</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-400">
            {
              Object.keys(schemaTypeCounts).filter((t) => t !== "invalid")
                .length
            }
          </div>
          <div className="text-xs text-gray-500">Farklı Tür</div>
        </div>
      </div>

      {Object.keys(schemaTypeCounts).length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-300 mb-3">
            Mevcut Schema Türleri
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(schemaTypeCounts).map(([type, count]) => (
              <span
                key={type}
                className={`text-xs px-2 py-1 rounded-full border ${
                  SCHEMA_BADGES[type] ??
                  "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }`}
              >
                {type} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-base font-semibold text-gray-300 mb-3">
          Sayfa Bazlı Schema Durumu
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {report.pages
            .filter((p) => p.pageData.statusCode === 200)
            .map((page) => (
              <div
                key={page.url}
                className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2"
              >
                {page.pageData.schemas.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 truncate">
                    {page.url}
                  </div>
                  <div className="text-xs text-gray-600">{page.pageType}</div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {page.pageData.schemas.map((s, i) => (
                    <span
                      key={i}
                      className={`text-xs px-1.5 py-0.5 rounded border ${
                        SCHEMA_BADGES[s.type] ??
                        "bg-gray-700 text-gray-400 border-gray-600"
                      }`}
                    >
                      {s.type.split(",")[0]}
                    </span>
                  ))}
                  {page.pageData.schemas.length === 0 && (
                    <span className="text-xs text-gray-600">Schema yok</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="card bg-purple-500/5 border-purple-500/20">
        <h3 className="text-purple-400 font-semibold mb-3">
          Schema Ekleme Öncelikleri
        </h3>
        <div className="space-y-2">
          {[
            {
              type: "LocalBusiness",
              desc: "Ana sayfa + iletişim sayfası için zorunlu",
              priority: "Kritik",
            },
            {
              type: "Service",
              desc: "Hizmet sayfaları için güçlü sinyal",
              priority: "Yüksek",
            },
            {
              type: "FAQPage",
              desc: "Soru-cevap bölümü olan sayfalarda",
              priority: "Orta",
            },
            {
              type: "Article",
              desc: "Blog yazıları için",
              priority: "Orta",
            },
            {
              type: "BreadcrumbList",
              desc: "Tüm iç sayfalar için navigasyon",
              priority: "Düşük",
            },
          ].map(({ type, desc, priority }) => (
            <div key={type} className="flex items-center gap-3 text-sm">
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full border ${
                  SCHEMA_BADGES[type] ?? ""
                }`}
              >
                {type}
              </span>
              <span className="text-gray-400 flex-1">{desc}</span>
              <span
                className={`text-xs shrink-0 ${
                  priority === "Kritik"
                    ? "text-red-400"
                    : priority === "Yüksek"
                    ? "text-orange-400"
                    : priority === "Orta"
                    ? "text-yellow-400"
                    : "text-gray-500"
                }`}
              >
                {priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
