"use client";

import type { AuditReport } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Props {
  report: AuditReport;
}

export default function LocalSEO({ report }: Props) {
  const { localSeoSummary, scores } = report;

  const checks = [
    { label: "NAP Bilgisi (Telefon/Adres)", ok: localSeoSummary.hasNAP },
    { label: "LocalBusiness Schema", ok: localSeoSummary.hasLocalSchema },
    { label: "İletişim Sayfası", ok: localSeoSummary.hasContactPage },
    { label: "Lokasyon Sayfası", ok: localSeoSummary.locationPagesCount > 0 },
    {
      label: "Şehir Anahtar Kelimesi",
      ok: Object.keys(localSeoSummary.cityMentions).length > 0,
    },
  ];

  const localIssues = report.prioritizedIssues.filter(
    (i) => i.category === "local"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Yerel SEO Analizi</h2>
          <p className="text-gray-400 text-sm">
            Yerel hizmet varlığı ve sinyal değerlendirmesi
          </p>
        </div>
        <ScoreCard label="Yerel SEO Skoru" score={scores.localSeo} />
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-300 mb-3">
          Temel Kontroller
        </h3>
        <div className="space-y-2">
          {checks.map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-3">
              {ok ? (
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className={`text-sm ${ok ? "text-gray-300" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {localSeoSummary.missingLocalSignals.length > 0 && (
        <div className="card bg-orange-500/5 border-orange-500/20">
          <h3 className="text-orange-400 font-semibold mb-2">
            Eksik Yerel Sinyaller
          </h3>
          <ul className="space-y-1">
            {localSeoSummary.missingLocalSignals.map((sig) => (
              <li
                key={sig}
                className="text-sm text-gray-400 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                {sig}
              </li>
            ))}
          </ul>
        </div>
      )}

      {localSeoSummary.doorwayRiskUrls.length > 0 && (
        <div className="card bg-red-500/5 border-red-500/30">
          <h3 className="text-red-400 font-semibold mb-2">
            ⚠ Doorway Page Riski ({localSeoSummary.doorwayRiskUrls.length} URL)
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Bu sayfalar yalnızca şehir/ilçe adı değiştirilerek çoğaltılmış
            olabilir. Google bu tür sayfaları spam olarak değerlendirebilir.
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {localSeoSummary.doorwayRiskUrls.map((url) => (
              <div
                key={url}
                className="text-xs text-gray-400 truncate bg-gray-800 rounded px-2 py-1"
              >
                {url}
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(localSeoSummary.cityMentions).length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-300 mb-3">
            Şehir/İlçe Anahtar Kelime Dağılımı
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(localSeoSummary.cityMentions)
              .sort(([, a], [, b]) => b - a)
              .map(([city, count]) => (
                <span
                  key={city}
                  className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs px-2 py-1 rounded-full"
                >
                  {city} ({count})
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="card bg-purple-500/5 border-purple-500/20">
        <h3 className="text-purple-400 font-semibold mb-3">
          Google Business Profile Önerileri
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          {[
            "Sitedeki NAP bilgisi GBP profiliyle birebir eşleşmeli",
            "GBP'de hizmet kategorileri site içeriğiyle uyumlu olmalı",
            "GBP'deki web sitesi URL'si canonical URL olmalı",
            "GBP'ye düzenli fotoğraf ve gönderi eklenmeli",
            "Müşteri yorumlarına yanıt verilmeli",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-purple-400 shrink-0">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {localIssues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-gray-300">
            Tespit Edilen Yerel SEO Sorunları ({localIssues.length})
          </h3>
          {localIssues.map((issue) => (
            <div
              key={issue.id}
              className="card border-l-2 border-orange-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge-${issue.severity}`}>
                  {issue.severity.toUpperCase().slice(0, 3)}
                </span>
                <span className="text-sm font-medium text-white">
                  {issue.title}
                </span>
              </div>
              <p className="text-sm text-gray-400">{issue.description}</p>
              <p className="text-sm text-blue-400 mt-2">💡 {issue.solution}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
