import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { CrawlConfig } from "@/lib/types";
import { setJob, updateJob } from "@/lib/jobStore";
import { runCrawl } from "@/lib/crawler";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let config: CrawlConfig;

  try {
    config = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  if (!config.domain) {
    return NextResponse.json({ error: "Domain zorunlu" }, { status: 400 });
  }

  // Domain normalize et
  config.domain = config.domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .trim();

  if (!config.maxPages || config.maxPages < 1) config.maxPages = 10;
  if (config.maxPages > 50) config.maxPages = 50;

  const jobId = uuidv4();

  setJob(jobId, {
    id: jobId,
    status: "pending",
    progress: 0,
    pagesFound: 0,
    pagesProcessed: 0,
    currentUrl: "Başlatılıyor...",
    createdAt: new Date().toISOString(),
  });

  // Crawl'ı başlat
  try {
    updateJob(jobId, { status: "running" });
    const report = await runCrawl(config, jobId);
    updateJob(jobId, {
      status: "completed",
      progress: 100,
      report,
      pagesProcessed: report.summary.crawledPages,
    });

    return NextResponse.json({ jobId, status: "completed", reportId: report.id, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    updateJob(jobId, { status: "error", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
