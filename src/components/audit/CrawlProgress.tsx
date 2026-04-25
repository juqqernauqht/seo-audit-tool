"use client";

import { useEffect, useState } from "react";
import type { CrawlJob } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface Props {
  jobId: string;
}

export default function CrawlProgress({ jobId }: Props) {
  const [job, setJob] = useState<CrawlJob | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/crawl/${jobId}`);
        const data: CrawlJob = await res.json();
        setJob(data);
        if (data.status === "completed" || data.status === "error") {
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const steps = [
    "robots.txt okunuyor",
    "sitemap.xml analiz ediliyor",
    "Sayfalar taranıyor",
    "HTML parse ediliyor",
    "SEO analizi yapılıyor",
    "Rapor hazırlanıyor",
  ];

  const progress = job?.progress ?? 0;
  const currentStep = Math.min(
    Math.floor((progress / 100) * steps.length),
    steps.length - 1
  );

  return (
    <div className="card text-center space-y-6">
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{progress}%</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-1">Tarama Devam Ediyor</h2>
        <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          {job?.currentUrl ?? "Başlatılıyor..."}
        </p>
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{job?.pagesFound ?? 0}</div>
          <div className="text-gray-500">Bulunan</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{job?.pagesProcessed ?? 0}</div>
          <div className="text-gray-500">İşlenen</div>
        </div>
      </div>

      <div className="space-y-2 text-left">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-2 text-sm transition-colors ${
              i < currentStep
                ? "text-green-400"
                : i === currentStep
                ? "text-blue-400"
                : "text-gray-600"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                i < currentStep
                  ? "bg-green-400"
                  : i === currentStep
                  ? "bg-blue-400 animate-pulse"
                  : "bg-gray-700"
              }`}
            />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
