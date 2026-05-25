"use client";

import { useAuditStore } from "@/store/auditStore";
import type { AuditReport } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, ShieldCheck, Search, Link2, MapPin,
  Code2, Globe, BarChart3, List, Zap, Download, ArrowLeft, TrendingUp
} from "lucide-react";

interface Props {
  report: AuditReport;
}

const NAV_ITEMS = [
  { id: "overview", label: "Genel Bakış", icon: LayoutDashboard },
  { id: "technical", label: "Teknik SEO", icon: ShieldCheck },
  { id: "serp", label: "SERP Önizleme", icon: Search },
  { id: "google-rank", label: "Google Sıralama", icon: TrendingUp },
  { id: "internal-links", label: "İç Link Yapısı", icon: Link2 },
  { id: "local-seo", label: "Yerel SEO", icon: MapPin },
  { id: "schema", label: "Schema", icon: Code2 },
  { id: "urls", label: "URL Denetimi", icon: Globe },
  { id: "issues", label: "Sorun Listesi", icon: List },
  { id: "quick-wins", label: "Hızlı Kazanımlar", icon: Zap },
  { id: "export", label: "Dışa Aktar", icon: Download },
];

function scoreBg(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export default function Sidebar({ report }: Props) {
  const { activeSection, setActiveSection } = useAuditStore();
  const router = useRouter();

  const overall = Math.round(
    Object.values(report.scores).reduce((a, b) => a + b, 0) /
      Object.values(report.scores).length
  );

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Yeni Tarama
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-white text-sm">SEO Denetim</span>
        </div>
        <div className="mt-2 text-xs text-gray-500 truncate">{report.domain}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreBg(overall)}`}>{overall}</span>
          <span className="text-gray-500 text-xs">/ 100</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
              activeSection === id
                ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {id === "quick-wins" && report.quickWins.length > 0 && (
              <span className="ml-auto bg-yellow-500 text-yellow-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {report.quickWins.length}
              </span>
            )}
            {id === "issues" && report.summary.criticalIssues > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {report.summary.criticalIssues}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Stats */}
      <div className="p-3 border-t border-gray-800 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Taranan Sayfa</span>
          <span className="text-gray-300">{report.summary.crawledPages}</span>
        </div>
        <div className="flex justify-between">
          <span>Toplam Sorun</span>
          <span className="text-red-400">{report.summary.totalIssues}</span>
        </div>
        <div className="flex justify-between">
          <span>Kritik</span>
          <span className="text-red-500 font-bold">{report.summary.criticalIssues}</span>
        </div>
      </div>
    </aside>
  );
}
