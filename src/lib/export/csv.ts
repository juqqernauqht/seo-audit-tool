import Papa from "papaparse";
import type { AuditReport } from "../types";

export function exportUrlTableCSV(report: AuditReport): string {
  const rows = report.pages.map((page) => ({
    URL: page.url,
    "HTTP Durum": page.pageData.statusCode,
    "Sayfa Tipi": page.pageType,
    Title: page.pageData.title ?? "",
    "Title Uzunluğu": page.pageData.title?.length ?? 0,
    "Meta Desc.": page.pageData.metaDescription ?? "",
    "Meta Desc. Uzunluğu": page.pageData.metaDescription?.length ?? 0,
    H1: page.pageData.h1.join(" | "),
    "H1 Sayısı": page.pageData.h1.length,
    "Kelime Sayısı": page.pageData.wordCount,
    "İç Link Sayısı": page.pageData.internalLinks.length,
    "Görsel Sayısı": page.pageData.images.length,
    "Alt Eksik Görsel": page.pageData.imagesWithoutAlt,
    Canonical: page.pageData.canonical ?? "",
    "Meta Robots": page.pageData.metaRobots ?? "",
    "Schema Türleri": page.pageData.schemas.map((s) => s.type).join(" | "),
    "Yanıt Süresi (ms)": page.pageData.responseTime,
    "HTML Boyutu (KB)": Math.round(page.pageData.htmlSize / 1024),
    "Teknik Skoru": page.scores.technical,
    "On-Page Skoru": page.scores.onPage,
    "Yerel SEO Skoru": page.scores.localSeo,
    "Schema Skoru": page.scores.schema,
    "Sorun Sayısı": page.issues.length,
    "Kritik Sorun": page.issues.filter((i) => i.severity === "critical").length,
    "Yüksek Sorun": page.issues.filter((i) => i.severity === "high").length,
  }));

  return Papa.unparse(rows, { delimiter: "," });
}

export function exportIssuesCSV(report: AuditReport): string {
  const rows = report.prioritizedIssues.map((issue) => ({
    ID: issue.id,
    Kategori: issue.category,
    Başlık: issue.title,
    Açıklama: issue.description,
    Önem: issue.severity,
    "Etki Puanı": issue.impactScore,
    "Zorluk Puanı": issue.difficultyScore,
    "Öncelik Puanı": issue.priorityScore.toFixed(2),
    "Hızlı Kazanım": issue.isQuickWin ? "Evet" : "Hayır",
    Çözüm: issue.solution,
    "SEO Etkisi": issue.estimatedSeoImpact,
    "Etkilenen URL Sayısı": issue.affectedUrls.length,
    "Etkilenen URLler": issue.affectedUrls.slice(0, 5).join(" | "),
  }));

  return Papa.unparse(rows, { delimiter: "," });
}
