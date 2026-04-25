"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuditForm from "@/components/audit/AuditForm";
import CrawlProgress from "@/components/audit/CrawlProgress";
import type { CrawlConfig } from "@/lib/types";
import { useAuditStore } from "@/store/auditStore";

type AppState = "form" | "crawling" | "done";

export default function HomePage() {
  const router = useRouter();
  const { setCurrentReport, setCurrentJob } = useAuditStore();
  const [appState, setAppState] = useState<AppState>("form");
  const [jobId, setJobId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleStartAudit = async (config: CrawlConfig) => {
    setError("");
    setAppState("crawling");

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Tarama başlatılamadı");
      }

      setJobId(data.jobId);

      // Job'ı polling ile takip et
      pollJob(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setAppState("form");
    }
  };

  const pollJob = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/crawl/${id}`);
        const job = await res.json();

        setCurrentJob(job);

        if (job.status === "completed" && job.report) {
          clearInterval(interval);
          setCurrentReport(job.report);
          setAppState("done");
          router.push(`/audit/${id}`);
        } else if (job.status === "error") {
          clearInterval(interval);
          setError(job.error ?? "Tarama hatası oluştu");
          setAppState("form");
        }
      } catch {
        clearInterval(interval);
        setError("Sunucuya bağlanılamadı");
        setAppState("form");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-white text-lg">SEO Denetim Aracı</span>
            <span className="text-gray-500 text-sm ml-2">— Google Bot Gözüyle Analiz</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {appState === "form" && (
            <>
              {/* Hero */}
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Sitenizi Google Bot Gözüyle Görün
                </h1>
                <p className="text-gray-400 text-lg">
                  Teknik SEO, yerel SEO, iç link mimarisi ve SERP analizi — tek raporda.
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <AuditForm onSubmit={handleStartAudit} />
            </>
          )}

          {appState === "crawling" && (
            <CrawlProgress jobId={jobId} />
          )}
        </div>
      </main>
    </div>
  );
}
