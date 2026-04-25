"use client";

import type { AuditReport } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  report: AuditReport;
}

export default function InternalLinks({ report }: Props) {
  const { internalLinkData, scores } = report;

  const topLinked = internalLinkData.topLinkedPages.slice(0, 8);

  const depthData = Object.entries(
    Object.values(internalLinkData.clickDepth).reduce(
      (acc: Record<number, number>, depth) => {
        acc[depth] = (acc[depth] ?? 0) + 1;
        return acc;
      },
      {}
    )
  )
    .map(([depth, count]) => ({ depth: `Derinlik ${depth}`, count }))
    .sort(
      (a, b) =>
        parseInt(a.depth.split(" ")[1], 10) -
        parseInt(b.depth.split(" ")[1], 10)
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            İç Link Mimarisi
          </h2>
          <p className="text-gray-400 text-sm">Link akışı ve otorite dağılımı</p>
        </div>
        <ScoreCard label="İç Link Skoru" score={scores.internalLinks} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Toplam İç Link",
            value: internalLinkData.totalInternalLinks,
          },
          {
            label: "Ortalama Link/Sayfa",
            value: internalLinkData.avgLinksPerPage.toFixed(1),
          },
          {
            label: "Orphan Sayfa",
            value: internalLinkData.orphanPages.length,
          },
          {
            label: "Derin Sayfa (>4)",
            value: Object.values(internalLinkData.clickDepth).filter(
              (d) => d > 4
            ).length,
          },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {topLinked.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-300 mb-4">
            En Çok İç Link Alan Sayfalar
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topLinked} layout="vertical">
              <XAxis type="number" stroke="#6b7280" fontSize={11} />
              <YAxis
                type="category"
                dataKey="url"
                stroke="#6b7280"
                fontSize={9}
                width={160}
                tickFormatter={(val: string) => {
                  try {
                    return (
                      "/" +
                      new URL(val).pathname.replace(/\//g, "").slice(0, 20)
                    );
                  } catch {
                    return val.slice(0, 20);
                  }
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9ca3af", fontSize: 11 }}
                itemStyle={{ color: "#60a5fa" }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {topLinked.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#10b981" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {depthData.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-300 mb-4">
            Tıklama Derinliği Dağılımı
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={depthData}>
              <XAxis dataKey="depth" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#60a5fa" }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {internalLinkData.orphanPages.length > 0 && (
        <div className="card bg-red-500/5 border-red-500/20">
          <h3 className="text-red-400 font-semibold mb-2">
            Orphan Sayfalar ({internalLinkData.orphanPages.length})
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Bu sayfalar hiç iç bağlantı almıyor — Google onları zor bulur.
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {internalLinkData.orphanPages.map((url) => (
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

      <div className="card bg-blue-500/5 border-blue-500/20">
        <h3 className="text-blue-400 font-semibold mb-2">
          İç Link Mimarisi Önerileri
        </h3>
        <ul className="space-y-1.5 text-sm text-gray-400">
          {[
            "Blog yazılarından ilgili hizmet sayfalarına link ekleyin",
            "Hizmet sayfalarından lokasyon sayfalarına bağlantı kurun",
            "Breadcrumb navigasyonu tüm iç sayfalarda olmalı",
            "Orphan sayfaları site haritasına veya navigasyona ekleyin",
            "Ana para sayfalarına en az 3-5 iç link hedefleyin",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
