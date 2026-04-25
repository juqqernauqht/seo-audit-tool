"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";
import { Search } from "lucide-react";

interface Props {
  report: AuditReport;
}

export default function SERPPreview({ report }: Props) {
  const [search, setSearch] = useState("");

  const filtered = report.pages.filter(
    (p) =>
      p.pageData.statusCode === 200 &&
      (!search ||
        p.url.toLowerCase().includes(search.toLowerCase()) ||
        (p.pageData.title ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">SERP Önizleme</h2>
        <p className="text-gray-400 text-sm">Her sayfanın Google'da nasıl görüneceği</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Sayfa ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map((page) => {
          const serp = page.serpData;
          return (
            <div key={page.url} className="card space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    serp.ctrRisk === "high"
                      ? "badge-critical"
                      : serp.ctrRisk === "medium"
                      ? "badge-medium"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                >
                  CTR Riski:{" "}
                  {serp.ctrRisk === "high"
                    ? "Yüksek"
                    : serp.ctrRisk === "medium"
                    ? "Orta"
                    : "Düşük"}
                </span>
                {serp.titleSpamRisk && (
                  <span className="badge-high text-xs">Başlık Spam Riski</span>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 space-y-1">
                <div className="text-xs text-gray-500">{serp.displayUrl}</div>
                <div className="text-lg font-medium leading-snug text-blue-800">
                  {serp.currentTitle ? (
                    serp.titleTruncated ? (
                      serp.currentTitle.slice(0, 60) + "..."
                    ) : (
                      serp.currentTitle
                    )
                  ) : (
                    <span className="text-gray-400 italic">Title eksik</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {serp.currentDescription ? (
                    serp.descriptionTruncated ? (
                      serp.currentDescription.slice(0, 160) + "..."
                    ) : (
                      serp.currentDescription
                    )
                  ) : (
                    <span className="text-gray-400 italic">
                      Meta description eksik
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500">Title Uzunluğu</div>
                  <div
                    className={`font-bold ${
                      serp.titleLength > 60 || serp.titleLength < 30
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {serp.titleLength} karakter
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500">Desc. Uzunluğu</div>
                  <div
                    className={`font-bold ${
                      serp.descriptionLength > 160 || serp.descriptionLength < 70
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {serp.descriptionLength} karakter
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500">Slug Okunabilirlik</div>
                  <div
                    className={`font-bold ${
                      serp.slugReadabilityScore >= 80
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {serp.slugReadabilityScore}/100
                  </div>
                </div>
              </div>

              {(serp.ctrRisk !== "low" ||
                !serp.currentTitle ||
                !serp.currentDescription) && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
                  <div className="text-xs text-blue-400 font-medium">
                    💡 Önerilen Snippet
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Başlık</div>
                    <div className="text-sm text-blue-300">{serp.suggestedTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Açıklama</div>
                    <div className="text-sm text-gray-300">
                      {serp.suggestedDescription.slice(0, 160)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card text-center text-gray-500 py-10">
            Eşleşen sayfa bulunamadı
          </div>
        )}
      </div>
    </div>
  );
}
