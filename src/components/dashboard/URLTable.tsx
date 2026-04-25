"use client";

import { useState, useMemo } from "react";
import type { AuditReport } from "@/lib/types";
import { useAuditStore } from "@/store/auditStore";
import { Search } from "lucide-react";

interface Props {
  report: AuditReport;
}

type SortKey = "url" | "status" | "issues" | "words";

export default function URLTable({ report }: Props) {
  const { urlFilter, setUrlFilter } = useAuditStore();
  const [sortBy, setSortBy] = useState<SortKey>("issues");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return report.pages
      .filter((p) =>
        urlFilter
          ? p.url.toLowerCase().includes(urlFilter.toLowerCase())
          : true
      )
      .sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        if (sortBy === "url") {
          aVal = a.url;
          bVal = b.url;
        } else if (sortBy === "status") {
          aVal = a.pageData.statusCode;
          bVal = b.pageData.statusCode;
        } else if (sortBy === "issues") {
          aVal = a.issues.length;
          bVal = b.issues.length;
        } else if (sortBy === "words") {
          aVal = a.pageData.wordCount;
          bVal = b.pageData.wordCount;
        }

        if (typeof aVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal);
        }
        return sortDir === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
  }, [report.pages, urlFilter, sortBy, sortDir]);

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const selectedPageData = selectedPage
    ? report.pages.find((p) => p.url === selectedPage)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">URL Bazlı Denetim</h2>
        <p className="text-gray-400 text-sm">{filtered.length} sayfa gösteriliyor</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="URL filtrele..."
          value={urlFilter}
          onChange={(e) => setUrlFilter(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {(
                [
                  { key: "url" as const, label: "URL" },
                  { key: "status" as const, label: "Durum" },
                  { key: "issues" as const, label: "Sorun" },
                  { key: "words" as const, label: "Kelime" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-gray-400 font-medium cursor-pointer hover:text-gray-200"
                  onClick={() => handleSort(key)}
                >
                  {label}
                  {sortBy === key && (sortDir === "desc" ? " ↓" : " ↑")}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Notlar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((page) => {
              const critical = page.issues.filter(
                (i) => i.severity === "critical"
              ).length;
              const high = page.issues.filter(
                (i) => i.severity === "high"
              ).length;

              return (
                <tr
                  key={page.url}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                  onClick={() =>
                    setSelectedPage(
                      selectedPage === page.url ? null : page.url
                    )
                  }
                >
                  <td className="px-4 py-2.5 max-w-xs">
                    <div className="truncate text-gray-300 text-xs">{page.url}</div>
                    <div className="text-gray-600 text-xs">{page.pageType}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        page.pageData.statusCode === 200
                          ? "bg-green-500/20 text-green-400"
                          : page.pageData.statusCode >= 400
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {page.pageData.statusCode || "ERR"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {critical > 0 && (
                        <span className="badge-critical">{critical}</span>
                      )}
                      {high > 0 && <span className="badge-high">{high}</span>}
                      {page.issues.length === 0 && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {page.pageData.wordCount}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <div className="truncate text-gray-300 text-xs">
                      {page.pageData.title ?? (
                        <span className="text-red-400">Eksik</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {page.pageData.metaRobots?.includes("noindex") && (
                        <span className="badge-high text-xs">noindex</span>
                      )}
                      {!page.pageData.canonical && (
                        <span className="badge-low text-xs">no canonical</span>
                      )}
                      {page.pageData.schemas.length > 0 && (
                        <span className="bg-purple-500/20 text-purple-400 text-xs px-1.5 py-0.5 rounded-full border border-purple-500/30">
                          schema
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedPageData && (
        <div className="card space-y-3">
          <h3 className="font-medium text-white text-sm truncate">
            {selectedPageData.url}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Başlık", value: selectedPageData.pageData.title ?? "—" },
              {
                label: "Meta Desc.",
                value: selectedPageData.pageData.metaDescription
                  ? selectedPageData.pageData.metaDescription.slice(0, 60) + "..."
                  : "—",
              },
              { label: "H1", value: selectedPageData.pageData.h1[0] ?? "—" },
              {
                label: "Canonical",
                value: selectedPageData.pageData.canonical ?? "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-2">
                <div className="text-gray-500 mb-0.5">{label}</div>
                <div className="text-gray-200 truncate">{value}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {selectedPageData.issues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="flex items-center gap-2 text-xs">
                <span className={`badge-${issue.severity}`}>
                  {issue.severity.toUpperCase().slice(0, 3)}
                </span>
                <span className="text-gray-400">{issue.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
