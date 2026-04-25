import { v4 as uuidv4 } from "uuid";
import type { CrawlConfig, PageData, AuditReport, CrawlJob } from "../types";
import { fetchUrl, normalizeUrl, isSameDomain, shouldSkipUrl } from "./fetcher";
import { fetchRobots } from "./robots";
import { fetchSitemapUrls } from "./sitemap";
import { CrawlQueue } from "./queue";
import { parsePage } from "../parser";
import { analyzeTechnical } from "../analyzers/technical";
import { analyzeOnPage } from "../analyzers/onpage";
import { analyzeLocalSeo } from "../analyzers/localSeo";
import { analyzeSERP } from "../analyzers/serp";
import { analyzeSchema } from "../analyzers/schema";
import { analyzePerformance } from "../analyzers/performance";
import { analyzeInternalLinks } from "../analyzers/internalLinks";
import { calculateGlobalScores } from "../analyzers/scoring";
import { prioritizeIssues } from "../prioritization/engine";
import { detectPageType } from "../analyzers/onpage";
import { updateJob } from "../jobStore";

export async function runCrawl(
  config: CrawlConfig,
  jobId: string
): Promise<AuditReport> {
  const base = config.domain.startsWith("http")
    ? config.domain
    : `https://${config.domain}`;
  const startUrl = config.startUrl || base;

  // robots.txt
  updateJob(jobId, { status: "running", currentUrl: "robots.txt okunuyor..." });
  const robots = await fetchRobots(base);

  // sitemap
  let sitemapUrls: string[] = [];
  if (config.useSitemap) {
    updateJob(jobId, { currentUrl: "sitemap.xml okunuyor..." });
    const sitemapSources =
      robots.sitemapUrls.length > 0
        ? robots.sitemapUrls
        : [`${base.replace(/\/$/, "")}/sitemap.xml`];

    for (const smUrl of sitemapSources.slice(0, 3)) {
      const urls = await fetchSitemapUrls(smUrl, config.maxPages);
      sitemapUrls = [...sitemapUrls, ...urls];
    }
    sitemapUrls = [...new Set(sitemapUrls)];
  }

  updateJob(jobId, { pagesFound: sitemapUrls.length });

  // Queue başlat
  const queue = new CrawlQueue(config.maxPages);
  queue.enqueue(startUrl);

  if (config.mode === "sitemap" && sitemapUrls.length > 0) {
    queue.enqueueMany(sitemapUrls.filter((u) => isSameDomain(u, base)));
  }

  const crawledPages: PageData[] = [];

  while (queue.hasMore()) {
    const url = queue.dequeue();
    if (!url) break;

    updateJob(jobId, {
      currentUrl: url,
      pagesProcessed: queue.totalProcessed(),
      progress: Math.round(
        (queue.totalProcessed() / Math.min(config.maxPages, queue.totalProcessed() + queue.queueSize() + 1)) * 100
      ),
    });

    // robots.txt kontrolü
    if (config.respectRobots && !robots.isAllowed(url)) {
      queue.markDone(url);
      continue;
    }

    try {
      const fetchResult = await fetchUrl(url);
      queue.markDone(url);

      if (!fetchResult.html && fetchResult.statusCode === 0) {
        crawledPages.push(createErrorPage(url, fetchResult.error ?? "Erişim hatası", fetchResult.responseTime));
        continue;
      }

      const pageData = parsePage(fetchResult, base);
      crawledPages.push(pageData);

      // İç linkleri kuyruğa ekle (crawl modunda)
      if (config.mode !== "single") {
        for (const link of pageData.internalLinks) {
          if (
            !shouldSkipUrl(link.href) &&
            isSameDomain(link.href, base) &&
            !queue.isVisited(link.href)
          ) {
            queue.enqueue(link.href);
          }
        }
      }
    } catch {
      queue.markError(url);
      crawledPages.push(createErrorPage(url, "Parse hatası", 0));
    }
  }

  // Analiz aşaması
  updateJob(jobId, { currentUrl: "Analiz yapılıyor...", progress: 90 });

  const pageAnalyses = crawledPages.map((pageData) => {
    const issues = [
      ...analyzeTechnical(pageData, crawledPages),
      ...analyzeOnPage(pageData),
      ...(config.localSeoMode ? analyzeLocalSeo(pageData) : []),
      ...analyzeSchema(pageData),
      ...(config.performanceAnalysis ? analyzePerformance(pageData) : []),
    ];

    return {
      url: pageData.url,
      pageData,
      issues,
      serpData: analyzeSERP(pageData),
      scores: calculatePageScores(issues),
      pageType: detectPageType(pageData),
    };
  });

  // Global analizler
  const allIssues = pageAnalyses.flatMap((p) => p.issues);
  const serpIssues = pageAnalyses.flatMap((p) =>
    p.serpData.ctrRisk === "high"
      ? [
          {
            id: `serp-ctr-${p.url}`,
            category: "serp" as const,
            title: "Düşük CTR riski taşıyan snippet",
            description: `${p.url} sayfasının title veya meta description'ı yetersiz`,
            affectedUrls: [p.url],
            severity: "medium" as const,
            impactScore: 5,
            difficultyScore: 2,
            isQuickWin: true,
            solution: "Title ve meta description'ı güncelleyin",
            estimatedSeoImpact: "CTR +10-30%",
            priorityScore: 2.5,
          },
        ]
      : []
  );

  const internalLinkData = analyzeInternalLinks(pageAnalyses.map((p) => p.pageData));
  const internalLinkIssues = buildInternalLinkIssues(internalLinkData);

  const localSeoSummary = buildLocalSeoSummary(pageAnalyses.map((p) => p.pageData));
  const localSeoGlobalIssues = buildLocalSeoGlobalIssues(localSeoSummary);

  const combinedIssues = [
    ...allIssues,
    ...serpIssues,
    ...internalLinkIssues,
    ...localSeoGlobalIssues,
  ];

  const prioritized = prioritizeIssues(combinedIssues);
  const quickWins = prioritized.filter((i) => i.isQuickWin);

  const scores = calculateGlobalScores(pageAnalyses, internalLinkData, localSeoSummary);

  const errorPages = crawledPages.filter((p) => p.fetchError || p.statusCode >= 400);
  const indexablePages = crawledPages.filter(
    (p) => !p.metaRobots?.includes("noindex") && p.statusCode === 200
  );

  const report: AuditReport = {
    id: uuidv4(),
    domain: config.domain,
    createdAt: new Date().toISOString(),
    config,
    summary: {
      totalPages: crawledPages.length,
      crawledPages: crawledPages.length,
      errorPages: errorPages.length,
      indexablePages: indexablePages.length,
      noindexPages: crawledPages.filter((p) => p.metaRobots?.includes("noindex")).length,
      totalIssues: combinedIssues.length,
      criticalIssues: combinedIssues.filter((i) => i.severity === "critical").length,
      highIssues: combinedIssues.filter((i) => i.severity === "high").length,
      mediumIssues: combinedIssues.filter((i) => i.severity === "medium").length,
      lowIssues: combinedIssues.filter((i) => i.severity === "low").length,
    },
    pages: pageAnalyses,
    allIssues: combinedIssues,
    prioritizedIssues: prioritized,
    quickWins,
    scores,
    internalLinkData,
    localSeoSummary,
    robotsTxt: robots.raw,
    sitemapUrls,
  };

  return report;
}

function createErrorPage(url: string, error: string, responseTime: number): PageData {
  return {
    url,
    statusCode: 0,
    redirectChain: [],
    finalUrl: url,
    title: null,
    metaDescription: null,
    h1: [],
    h2s: [],
    h3s: [],
    canonical: null,
    metaRobots: null,
    lang: null,
    viewport: null,
    charset: null,
    wordCount: 0,
    bodyText: "",
    headingOutline: [],
    internalLinks: [],
    externalLinks: [],
    images: [],
    imagesWithoutAlt: 0,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: null,
    twitterTitle: null,
    schemas: [],
    favicon: null,
    responseTime,
    htmlSize: 0,
    scriptCount: 0,
    stylesheetCount: 0,
    fetchError: error,
    crawledAt: new Date().toISOString(),
  };
}

function calculatePageScores(issues: ReturnType<typeof analyzeTechnical>): import("../types").PageScores {
  const score = (category: string) => {
    const cat = issues.filter((i) => i.category === category);
    if (cat.length === 0) return 100;
    const penalty = cat.reduce((sum, i) => {
      const w = { critical: 25, high: 15, medium: 8, low: 3 }[i.severity] ?? 0;
      return sum + w;
    }, 0);
    return Math.max(0, 100 - penalty);
  };

  return {
    technical: score("technical"),
    onPage: score("onpage"),
    localSeo: score("local"),
    schema: score("schema"),
    performance: score("performance"),
    serp: score("serp"),
  };
}

function buildInternalLinkIssues(data: import("../types").InternalLinkData): import("../types").SEOIssue[] {
  const issues: import("../types").SEOIssue[] = [];

  if (data.orphanPages.length > 0) {
    issues.push({
      id: "il-orphan-pages",
      category: "internal-links",
      title: "Orphan sayfalar tespit edildi",
      description: `${data.orphanPages.length} sayfa hiç iç bağlantı almıyor. Google bu sayfaları bulmakta zorlanır.`,
      affectedUrls: data.orphanPages,
      severity: "high",
      impactScore: 7,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "İlgili sayfalara iç link ekleyin, özellikle ana navigasyon veya ilgili içerikten",
      estimatedSeoImpact: "İndexlenebilirlik +15%",
      priorityScore: 3.5,
    });
  }

  const deepPages = Object.entries(data.clickDepth)
    .filter(([, depth]) => depth > 4)
    .map(([url]) => url);

  if (deepPages.length > 0) {
    issues.push({
      id: "il-deep-pages",
      category: "internal-links",
      title: "Derin tıklama mesafesine sahip sayfalar",
      description: `${deepPages.length} sayfa ana sayfadan 4'ten fazla tıklama gerektiriyor`,
      affectedUrls: deepPages,
      severity: "medium",
      impactScore: 5,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Site mimarisini düzenleyin veya breadcrumb ekleyin",
      estimatedSeoImpact: "Crawl verimliliği +10%",
      priorityScore: 1.67,
    });
  }

  return issues;
}

function buildLocalSeoSummary(pages: PageData[]): import("../types").LocalSeoSummary {
  const cityPatterns = /istanbul|ankara|izmir|antalya|bursa|adana|konya|kayseri|eskişehir|gaziantep|mersin|diyarbakır|samsun|denizli|trabzon|erzurum|manisa|antep|kocaeli|gebze/gi;
  const cityMentions: Record<string, number> = {};

  let hasNAP = false;
  let hasLocalSchema = false;
  let hasContactPage = false;
  const duplicateRiskUrls: string[] = [];
  const doorwayRiskUrls: string[] = [];
  let servicePagesCount = 0;
  let locationPagesCount = 0;

  // Benzerlik kontrolü için title listesi
  const titleGroups: Record<string, string[]> = {};

  for (const page of pages) {
    const text = (page.bodyText + " " + (page.title ?? "")).toLowerCase();

    const cityMatches = text.match(cityPatterns);
    if (cityMatches) {
      for (const city of cityMatches) {
        cityMentions[city.toLowerCase()] = (cityMentions[city.toLowerCase()] ?? 0) + 1;
      }
    }

    if (text.includes("tel:") || /\b(0\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})\b/.test(text)) {
      hasNAP = true;
    }

    if (page.schemas.some((s) => s.type.includes("LocalBusiness") || s.type.includes("Service"))) {
      hasLocalSchema = true;
    }

    const urlLower = page.url.toLowerCase();
    if (urlLower.includes("iletisim") || urlLower.includes("contact")) {
      hasContactPage = true;
    }

    const pt = detectPageType(page);
    if (pt === "service" || pt === "service-location") servicePagesCount++;
    if (pt === "location" || pt === "service-location") locationPagesCount++;

    // Doorway kontrolü: title çok benziyorsa
    if (page.title) {
      const baseTitle = page.title.replace(cityPatterns, "ŞEHİR").toLowerCase().trim();
      if (!titleGroups[baseTitle]) titleGroups[baseTitle] = [];
      titleGroups[baseTitle].push(page.url);
    }
  }

  for (const [, urls] of Object.entries(titleGroups)) {
    if (urls.length >= 3) {
      doorwayRiskUrls.push(...urls);
    } else if (urls.length >= 2) {
      duplicateRiskUrls.push(...urls);
    }
  }

  const missingLocalSignals: string[] = [];
  if (!hasNAP) missingLocalSignals.push("NAP bilgisi (telefon/adres) bulunamadı");
  if (!hasLocalSchema) missingLocalSignals.push("LocalBusiness schema eksik");
  if (!hasContactPage) missingLocalSignals.push("İletişim sayfası bulunamadı");
  if (locationPagesCount === 0 && servicePagesCount > 0) {
    missingLocalSignals.push("Lokasyon sayfası yok");
  }

  const localIntentScore = Math.min(
    100,
    (hasNAP ? 20 : 0) +
    (hasLocalSchema ? 30 : 0) +
    (hasContactPage ? 15 : 0) +
    (locationPagesCount > 0 ? 20 : 0) +
    (Object.keys(cityMentions).length > 0 ? 15 : 0)
  );

  return {
    hasNAP,
    napConsistency: hasNAP ? 75 : 0,
    hasLocalSchema,
    hasContactPage,
    locationPagesCount,
    servicePagesCount,
    duplicateRiskUrls: [...new Set(duplicateRiskUrls)],
    doorwayRiskUrls: [...new Set(doorwayRiskUrls)],
    localIntentScore,
    cityMentions,
    missingLocalSignals,
  };
}

function buildLocalSeoGlobalIssues(summary: import("../types").LocalSeoSummary): import("../types").SEOIssue[] {
  const issues: import("../types").SEOIssue[] = [];

  if (!summary.hasLocalSchema) {
    issues.push({
      id: "local-no-schema",
      category: "local",
      title: "LocalBusiness schema eksik",
      description: "Sitede LocalBusiness yapılandırılmış veri bulunamadı. Google'ın yerel sinyalleri anlaması zorlaşır.",
      affectedUrls: [],
      severity: "high",
      impactScore: 8,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "Ana sayfa ve iletişim sayfasına LocalBusiness JSON-LD ekleyin",
      estimatedSeoImpact: "Yerel görünürlük +20%",
      priorityScore: 4,
    });
  }

  if (summary.doorwayRiskUrls.length > 0) {
    issues.push({
      id: "local-doorway-risk",
      category: "local",
      title: "Doorway page riski tespit edildi",
      description: `${summary.doorwayRiskUrls.length} URL sadece şehir adı değiştirilen tekrarlı içerik barındırıyor olabilir`,
      affectedUrls: summary.doorwayRiskUrls,
      severity: "critical",
      impactScore: 10,
      difficultyScore: 4,
      isQuickWin: false,
      solution: "Her lokasyon sayfasına özgün içerik, özgün başlık ve gerçek yerel bilgi ekleyin. Anlamsız şehir kopyalarını silin.",
      estimatedSeoImpact: "Google ceza riski azaltılır",
      priorityScore: 2.5,
    });
  }

  if (!summary.hasNAP) {
    issues.push({
      id: "local-no-nap",
      category: "local",
      title: "NAP bilgisi bulunamadı",
      description: "Sitede tutarlı telefon/adres bilgisi tespit edilemedi",
      affectedUrls: [],
      severity: "high",
      impactScore: 7,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Footer ve iletişim sayfasına tutarlı NAP bilgisi ekleyin",
      estimatedSeoImpact: "Yerel güven +15%",
      priorityScore: 7,
    });
  }

  return issues;
}
