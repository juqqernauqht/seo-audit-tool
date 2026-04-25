"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuditStore } from "@/store/auditStore";
import AppShell from "@/components/layout/AppShell";
import OverviewSection from "@/components/dashboard/OverviewSection";
import TechnicalSEO from "@/components/dashboard/TechnicalSEO";
import URLTable from "@/components/dashboard/URLTable";
import IssueList from "@/components/dashboard/IssueList";
import SERPPreview from "@/components/dashboard/SERPPreview";
import LocalSEO from "@/components/dashboard/LocalSEO";
import InternalLinks from "@/components/dashboard/InternalLinks";
import SchemaSection from "@/components/dashboard/SchemaSection";
import QuickWins from "@/components/dashboard/QuickWins";
import { Loader2 } from "lucide-react";

export default function AuditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentReport, currentJob, activeSection, setCurrentJob, setCurrentReport } =
    useAuditStore();

  useEffect(() => {
    if (!currentReport && params.id) {
      // Sayfa yenilenmişse job'ı çek
      fetch(`/api/crawl/${params.id}`)
        .then((r) => r.json())
        .then((job) => {
          setCurrentJob(job);
          if (job.report) setCurrentReport(job.report);
          else router.push("/");
        })
        .catch(() => router.push("/"));
    }
  }, [params.id, currentReport, router, setCurrentJob, setCurrentReport]);

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const sectionMap: Record<string, React.ReactNode> = {
    overview: <OverviewSection report={currentReport} />,
    technical: <TechnicalSEO report={currentReport} />,
    serp: <SERPPreview report={currentReport} />,
    "internal-links": <InternalLinks report={currentReport} />,
    "local-seo": <LocalSEO report={currentReport} />,
    schema: <SchemaSection report={currentReport} />,
    urls: <URLTable report={currentReport} />,
    issues: <IssueList report={currentReport} />,
    "quick-wins": <QuickWins report={currentReport} />,
    export: <ExportSection jobId={params.id} />,
  };

  return (
    <AppShell report={currentReport}>
      <div className="p-6">
        {sectionMap[activeSection] ?? <OverviewSection report={currentReport} />}
      </div>
    </AppShell>
  );
}

function ExportSection({ jobId }: { jobId: string }) {
  const downloads = [
    { label: "JSON — Tam Rapor", href: `/api/export?id=${jobId}&format=json`, desc: "Tüm veri" },
    { label: "CSV — URL Tablosu", href: `/api/export?id=${jobId}&format=csv&type=urls`, desc: "Her sayfa için metrikler" },
    { label: "CSV — Sorun Listesi", href: `/api/export?id=${jobId}&format=csv&type=issues`, desc: "Önceliklendirilmiş sorunlar" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Dışa Aktar</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {downloads.map((d) => (
          <a
            key={d.href}
            href={d.href}
            download
            className="card hover:border-blue-500 transition-colors group"
          >
            <div className="text-blue-400 group-hover:text-blue-300 font-medium mb-1">{d.label}</div>
            <div className="text-gray-500 text-sm">{d.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
