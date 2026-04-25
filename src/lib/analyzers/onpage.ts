import type { PageData, SEOIssue, PageType } from "../types";
import { v4 as uuidv4 } from "uuid";

export function analyzeOnPage(page: PageData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const url = page.url;

  if (!page.html || page.statusCode !== 200) return issues;

  // Thin content
  const pt = detectPageType(page);
  const minWords = pt === "blog" ? 600 : pt === "homepage" ? 300 : 200;

  if (page.wordCount < minWords && page.wordCount > 0) {
    issues.push(makeIssue({
      id: "onpage-thin-content",
      category: "onpage",
      title: "İnce içerik (Thin Content)",
      description: `Sayfa yalnızca ${page.wordCount} kelime içeriyor (${pt} için min. ${minWords} önerilir)`,
      affectedUrls: [url],
      severity: page.wordCount < 100 ? "high" : "medium",
      impactScore: 7,
      difficultyScore: 4,
      isQuickWin: false,
      solution: "İçeriği kullanıcı niyetiyle uyumlu, özgün ve kapsamlı şekilde genişletin",
      estimatedSeoImpact: "Sayfa kalitesi artar",
    }));
  }

  // Title - H1 uyumu
  if (page.title && page.h1.length > 0) {
    const similarity = textSimilarity(page.title, page.h1[0]);
    if (similarity < 0.3) {
      issues.push(makeIssue({
        id: "onpage-title-h1-mismatch",
        category: "onpage",
        title: "Title ve H1 uyumsuz",
        description: "Title ile H1 arasında yeterli kelime örtüşmesi yok",
        affectedUrls: [url],
        severity: "medium",
        impactScore: 5,
        difficultyScore: 2,
        isQuickWin: true,
        solution: "Title ve H1'in aynı anahtar kelimeyi içerdiğinden emin olun",
        estimatedSeoImpact: "Konu uyumu artar",
      }));
    }
  }

  // Heading hiyerarşisi bozuk mu
  if (page.headingOutline.length > 0) {
    let prev = 0;
    for (const h of page.headingOutline) {
      if (h.level - prev > 1) {
        issues.push(makeIssue({
          id: "onpage-heading-hierarchy",
          category: "onpage",
          title: "Başlık hiyerarşisi bozuk",
          description: `H${prev} → H${h.level} atlaması var (${h.text.slice(0, 40)}...)`,
          affectedUrls: [url],
          severity: "low",
          impactScore: 3,
          difficultyScore: 2,
          isQuickWin: true,
          solution: "Başlık seviyeleri sıralı olmalı: H1 → H2 → H3",
          estimatedSeoImpact: "İçerik yapısı iyileşir",
        }));
        break;
      }
      prev = h.level;
    }
  }

  // İç link az
  if (page.internalLinks.length < 2 && pt !== "contact") {
    issues.push(makeIssue({
      id: "onpage-few-internal-links",
      category: "onpage",
      title: "Az iç link",
      description: `Sayfa yalnızca ${page.internalLinks.length} iç link içeriyor`,
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "İlgili hizmet, lokasyon veya blog sayfalarına iç link ekleyin",
      estimatedSeoImpact: "Link juice dağılımı iyileşir",
    }));
  }

  // Generic anchor kullanımı
  const genericAnchors = ["tıklayın", "devamı", "daha fazla", "click here", "buraya", "okuyun"];
  const genericCount = page.internalLinks.filter((l) =>
    genericAnchors.some((a) => l.text.toLowerCase().includes(a))
  ).length;

  if (genericCount > 2) {
    issues.push(makeIssue({
      id: "onpage-generic-anchor",
      category: "onpage",
      title: "Generic anchor text kullanımı",
      description: `${genericCount} iç link jenerik anchor text kullanıyor`,
      affectedUrls: [url],
      severity: "low",
      impactScore: 4,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "Anchor text'leri açıklayıcı ve anahtar kelime içerir hale getirin",
      estimatedSeoImpact: "Link relevance artar",
    }));
  }

  // OG meta eksik
  if (!page.ogTitle || !page.ogDescription) {
    issues.push(makeIssue({
      id: "onpage-missing-og",
      category: "onpage",
      title: "Open Graph meta etiketi eksik",
      description: "Sosyal medya paylaşımları için OG meta etiketleri yok",
      affectedUrls: [url],
      severity: "low",
      impactScore: 3,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "og:title, og:description, og:image meta etiketleri ekleyin",
      estimatedSeoImpact: "Sosyal paylaşım CTR artar",
    }));
  }

  return issues;
}

export function detectPageType(page: PageData): PageType {
  const url = page.url.toLowerCase();
  const title = (page.title ?? "").toLowerCase();
  const h1 = (page.h1[0] ?? "").toLowerCase();
  const text = title + " " + h1 + " " + url;

  const cityKeywords = /istanbul|ankara|izmir|antalya|bursa|adana|konya|kayseri|eskişehir|gaziantep|mersin/i;
  const serviceKeywords = /hizmet|servis|tamir|kurulum|montaj|nakliye|temizlik|bakım|tadilat|boya|elektrik|tesisatçı|boyacı/i;
  const blogKeywords = /blog|makale|haber|rehber|ipucu|nasıl|nedir/i;
  const contactKeywords = /iletişim|contact|bize ulaşın/i;
  const aboutKeywords = /hakkımız|hakkında|about|biz kimiz/i;

  const hasCity = cityKeywords.test(text);
  const hasService = serviceKeywords.test(text);

  if (contactKeywords.test(url) || contactKeywords.test(text)) return "contact";
  if (aboutKeywords.test(url) || aboutKeywords.test(text)) return "about";
  if (blogKeywords.test(url) || blogKeywords.test(title)) return "blog";

  const pathSegments = new URL(page.url.startsWith("http") ? page.url : "https://x.com" + page.url).pathname
    .split("/")
    .filter(Boolean);

  if (pathSegments.length === 0) return "homepage";

  if (hasCity && hasService) return "service-location";
  if (hasCity && !hasService) return "location";
  if (hasService && !hasCity) return "service";

  return "other";
}

function textSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const bWords = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function makeIssue(data: Omit<SEOIssue, "priorityScore">): SEOIssue {
  return {
    ...data,
    id: data.id + "-" + uuidv4().slice(0, 8),
    priorityScore: data.impactScore / data.difficultyScore,
  };
}
