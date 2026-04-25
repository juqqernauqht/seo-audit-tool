import type { PageData, SEOIssue } from "../types";
import { v4 as uuidv4 } from "uuid";
import { detectPageType } from "./onpage";

const SCHEMA_RECOMMENDATIONS: Record<string, string[]> = {
  homepage: ["Organization", "WebSite"],
  service: ["Service", "LocalBusiness", "FAQPage"],
  location: ["LocalBusiness", "Service"],
  "service-location": ["LocalBusiness", "Service", "FAQPage"],
  blog: ["Article", "BreadcrumbList"],
  contact: ["LocalBusiness"],
  about: ["Organization"],
  other: ["WebPage"],
};

export function analyzeSchema(page: PageData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const pageType = detectPageType(page);
  const existing = page.schemas.map((s) => s.type);
  const recommended = SCHEMA_RECOMMENDATIONS[pageType] ?? [];

  const missing = recommended.filter(
    (rec) => !existing.some((ex) => ex.toLowerCase().includes(rec.toLowerCase()))
  );

  if (missing.length > 0) {
    issues.push(makeIssue({
      id: "schema-missing",
      category: "schema",
      title: `Eksik schema: ${missing.join(", ")}`,
      description: `${pageType} türündeki sayfada ${missing.join(", ")} schema önerilir`,
      affectedUrls: [page.url],
      severity: missing.includes("LocalBusiness") || missing.includes("Organization") ? "high" : "medium",
      impactScore: 6,
      difficultyScore: 2,
      isQuickWin: true,
      solution: `Sayfaya ${missing.join(", ")} JSON-LD bloğu ekleyin`,
      estimatedSeoImpact: "Rich snippet + yapılandırılmış veri",
    }));
  }

  // Invalid schema
  const invalid = page.schemas.filter((s) => s.type === "invalid");
  if (invalid.length > 0) {
    issues.push(makeIssue({
      id: "schema-invalid-json",
      category: "schema",
      title: "Geçersiz JSON-LD schema",
      description: `${invalid.length} schema bloğu geçersiz JSON içeriyor`,
      affectedUrls: [page.url],
      severity: "high",
      impactScore: 7,
      difficultyScore: 2,
      isQuickWin: false,
      solution: "JSON-LD sözdizimini doğrulayın, virgül ve tırnak hatalarını giderin",
      estimatedSeoImpact: "Schema hataları giderilir",
    }));
  }

  return issues;
}

function makeIssue(data: Omit<SEOIssue, "priorityScore">): SEOIssue {
  return {
    ...data,
    id: data.id + "-" + uuidv4().slice(0, 8),
    priorityScore: data.impactScore / data.difficultyScore,
  };
}
