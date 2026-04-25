import type { PageData, SEOIssue } from "../types";
import { v4 as uuidv4 } from "uuid";

export function analyzeTechnical(page: PageData, allPages: PageData[]): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const url = page.url;

  // 4xx/5xx hata
  if (page.statusCode >= 400 && page.statusCode < 600) {
    issues.push(makeIssue({
      id: `tech-status-${page.statusCode}`,
      category: "technical",
      title: `HTTP ${page.statusCode} hatası`,
      description: `Sayfa ${page.statusCode} durum kodu döndürüyor`,
      affectedUrls: [url],
      severity: page.statusCode >= 500 ? "critical" : "high",
      impactScore: 9,
      difficultyScore: 3,
      isQuickWin: false,
      solution: page.statusCode === 404
        ? "Sayfayı geri getirin ya da 301 redirect ekleyin"
        : "Sunucu hatasını giderin",
      estimatedSeoImpact: "İndex kaybı önlenir",
    }));
  }

  // Fetch hatası
  if (page.fetchError) {
    issues.push(makeIssue({
      id: `tech-fetch-error`,
      category: "technical",
      title: "Sayfa erişim hatası",
      description: `Sayfaya erişilemedi: ${page.fetchError}`,
      affectedUrls: [url],
      severity: "critical",
      impactScore: 10,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Sunucu erişimini, SSL sertifikasını ve DNS ayarlarını kontrol edin",
      estimatedSeoImpact: "Crawlability sıfır",
    }));
  }

  // Eksik title
  if (!page.title) {
    issues.push(makeIssue({
      id: "tech-missing-title",
      category: "technical",
      title: "Title etiketi eksik",
      description: "Sayfada <title> etiketi bulunamadı",
      affectedUrls: [url],
      severity: "critical",
      impactScore: 10,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Benzersiz, anahtar kelime içeren bir title ekleyin (50-60 karakter)",
      estimatedSeoImpact: "SERP görünürlüğü kritik",
    }));
  }

  // Çok kısa title
  if (page.title && page.title.length < 20) {
    issues.push(makeIssue({
      id: "tech-short-title",
      category: "technical",
      title: "Title çok kısa",
      description: `Title yalnızca ${page.title.length} karakter (min. 20 önerilir)`,
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Title'ı 50-60 karakter arasına getirin",
      estimatedSeoImpact: "CTR +10%",
    }));
  }

  // Çok uzun title
  if (page.title && page.title.length > 65) {
    issues.push(makeIssue({
      id: "tech-long-title",
      category: "technical",
      title: "Title çok uzun — SERP'te kesilebilir",
      description: `Title ${page.title.length} karakter (maks. 60 önerilir)`,
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Title'ı 50-60 karakter arasına kısaltın",
      estimatedSeoImpact: "CTR +5-10%",
    }));
  }

  // Eksik meta description
  if (!page.metaDescription) {
    issues.push(makeIssue({
      id: "tech-missing-meta-desc",
      category: "technical",
      title: "Meta description eksik",
      description: "Sayfada meta description bulunamadı",
      affectedUrls: [url],
      severity: "high",
      impactScore: 7,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "120-160 karakter arası, eylem içeren bir meta description yazın",
      estimatedSeoImpact: "CTR +15%",
    }));
  }

  // Uzun meta description
  if (page.metaDescription && page.metaDescription.length > 165) {
    issues.push(makeIssue({
      id: "tech-long-meta-desc",
      category: "technical",
      title: "Meta description çok uzun",
      description: `Meta description ${page.metaDescription.length} karakter (maks. 160 önerilir)`,
      affectedUrls: [url],
      severity: "low",
      impactScore: 3,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Meta description'ı 120-160 karaktere kısaltın",
      estimatedSeoImpact: "Snippet kesintisi önlenir",
    }));
  }

  // Eksik H1
  if (page.h1.length === 0) {
    issues.push(makeIssue({
      id: "tech-missing-h1",
      category: "technical",
      title: "H1 etiketi eksik",
      description: "Sayfada H1 başlığı bulunamadı",
      affectedUrls: [url],
      severity: "high",
      impactScore: 8,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Sayfanın ana konusunu yansıtan tek bir H1 ekleyin",
      estimatedSeoImpact: "Relevance sinyali",
    }));
  }

  // Birden fazla H1
  if (page.h1.length > 1) {
    issues.push(makeIssue({
      id: "tech-multiple-h1",
      category: "technical",
      title: "Birden fazla H1 etiketi",
      description: `${page.h1.length} adet H1 bulundu. Sayfada tek H1 olmalı.`,
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "Fazla H1 etiketlerini H2'ye dönüştürün",
      estimatedSeoImpact: "Konu netliği artar",
    }));
  }

  // Canonical yok
  if (!page.canonical && page.statusCode === 200) {
    issues.push(makeIssue({
      id: "tech-missing-canonical",
      category: "technical",
      title: "Canonical etiketi eksik",
      description: "Self-referencing canonical eksik, duplicate content riski var",
      affectedUrls: [url],
      severity: "medium",
      impactScore: 6,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Her sayfaya self-referencing canonical ekleyin",
      estimatedSeoImpact: "Duplicate risk azalır",
    }));
  }

  // Canonical farklı domain'e işaret ediyor
  if (page.canonical && page.canonical !== page.finalUrl) {
    try {
      const canonUrl = new URL(page.canonical);
      const pageUrl = new URL(page.finalUrl);
      if (canonUrl.hostname !== pageUrl.hostname) {
        issues.push(makeIssue({
          id: "tech-cross-domain-canonical",
          category: "technical",
          title: "Canonical farklı domain'e işaret ediyor",
          description: `Canonical: ${page.canonical} — Sayfa: ${page.finalUrl}`,
          affectedUrls: [url],
          severity: "critical",
          impactScore: 9,
          difficultyScore: 2,
          isQuickWin: false,
          solution: "Canonical'ın doğru URL'yi işaret ettiğinden emin olun",
          estimatedSeoImpact: "Index sinyali kayıp önlenir",
        }));
      }
    } catch {
      // URL parse hatası
    }
  }

  // Redirect zinciri
  if (page.redirectChain.length > 2) {
    issues.push(makeIssue({
      id: "tech-redirect-chain",
      category: "technical",
      title: "Uzun redirect zinciri",
      description: `${page.redirectChain.length} adımlı redirect zinciri (maks. 2 önerilir)`,
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Redirect zincirini tek adıma indirin",
      estimatedSeoImpact: "PageRank akışı iyileşir",
    }));
  }

  // noindex kritik sayfa kontrolü
  if (page.metaRobots?.includes("noindex")) {
    const isLikelyCritical = isLikelyCriticalPage(page.url);
    if (isLikelyCritical) {
      issues.push(makeIssue({
        id: "tech-noindex-critical",
        category: "technical",
        title: "Kritik sayfa noindex ile bloklanmış",
        description: "Önemli görünen bir sayfa noindex etiketi içeriyor",
        affectedUrls: [url],
        severity: "critical",
        impactScore: 10,
        difficultyScore: 1,
        isQuickWin: true,
        solution: "meta robots etiketini kontrol edin, noindex'i kaldırın",
        estimatedSeoImpact: "Sayfa Google'da görünür hale gelir",
      }));
    }
  }

  // Duplicate title kontrolü (diğer sayfalarla)
  if (page.title) {
    const duplicates = allPages.filter(
      (p) => p.url !== url && p.title === page.title
    );
    if (duplicates.length > 0) {
      issues.push(makeIssue({
        id: "tech-duplicate-title",
        category: "technical",
        title: "Tekrar eden title",
        description: `Bu title ${duplicates.length} başka sayfada da kullanılıyor`,
        affectedUrls: [url, ...duplicates.map((d) => d.url)],
        severity: "high",
        impactScore: 7,
        difficultyScore: 2,
        isQuickWin: false,
        solution: "Her sayfaya benzersiz title yazın",
        estimatedSeoImpact: "Cannibalization riski azalır",
      }));
    }
  }

  // Duplicate meta description
  if (page.metaDescription) {
    const duplicates = allPages.filter(
      (p) => p.url !== url && p.metaDescription === page.metaDescription
    );
    if (duplicates.length > 0) {
      issues.push(makeIssue({
        id: "tech-duplicate-meta",
        category: "technical",
        title: "Tekrar eden meta description",
        description: `Bu meta description ${duplicates.length} başka sayfada da kullanılıyor`,
        affectedUrls: [url, ...duplicates.map((d) => d.url)],
        severity: "medium",
        impactScore: 5,
        difficultyScore: 2,
        isQuickWin: false,
        solution: "Her sayfaya özgün meta description yazın",
        estimatedSeoImpact: "CTR'ı iyileştirir",
      }));
    }
  }

  // Büyük HTML
  if (page.htmlSize > 500 * 1024) {
    issues.push(makeIssue({
      id: "tech-large-html",
      category: "technical",
      title: "Büyük HTML boyutu",
      description: `HTML boyutu ${Math.round(page.htmlSize / 1024)}KB (maks. 500KB önerilir)`,
      affectedUrls: [url],
      severity: "low",
      impactScore: 3,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Gereksiz HTML ve inline script/style'ları temizleyin",
      estimatedSeoImpact: "Crawl bütçesi iyileşir",
    }));
  }

  // Viewport eksik
  if (!page.viewport) {
    issues.push(makeIssue({
      id: "tech-missing-viewport",
      category: "technical",
      title: "Viewport meta etiketi eksik",
      description: "Mobil uyumlu görünüm için gerekli viewport meta etiketi yok",
      affectedUrls: [url],
      severity: "high",
      impactScore: 8,
      difficultyScore: 1,
      isQuickWin: true,
      solution: '<meta name="viewport" content="width=device-width, initial-scale=1"> ekleyin',
      estimatedSeoImpact: "Mobil SEO sinyali",
    }));
  }

  // Alt eksik görseller
  if (page.imagesWithoutAlt > 0) {
    issues.push(makeIssue({
      id: "tech-missing-alt",
      category: "technical",
      title: `${page.imagesWithoutAlt} görselde alt etiketi eksik`,
      description: "Alt eksik görseller erişilebilirliği ve görsel SEO'yu zayıflatır",
      affectedUrls: [url],
      severity: page.imagesWithoutAlt > 5 ? "medium" : "low",
      impactScore: 4,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "Tüm görsellere açıklayıcı alt metni ekleyin",
      estimatedSeoImpact: "Görsel arama + erişilebilirlik",
    }));
  }

  // Lang eksik
  if (!page.lang) {
    issues.push(makeIssue({
      id: "tech-missing-lang",
      category: "technical",
      title: "HTML lang etiketi eksik",
      description: "Sayfa dili belirtilmemiş",
      affectedUrls: [url],
      severity: "low",
      impactScore: 3,
      difficultyScore: 1,
      isQuickWin: true,
      solution: '<html lang="tr"> ekleyin',
      estimatedSeoImpact: "Dil hedefleme sinyali",
    }));
  }

  return issues;
}

function isLikelyCriticalPage(url: string): boolean {
  const urlLower = url.toLowerCase();
  const homepagePatterns = [/\/$/, /\/index/, /\/home/];
  const servicePatterns = [/\/hizmet/, /\/service/, /\/urun/, /\/product/];
  return (
    homepagePatterns.some((p) => p.test(urlLower)) ||
    servicePatterns.some((p) => p.test(urlLower))
  );
}

function makeIssue(data: Omit<SEOIssue, "priorityScore">): SEOIssue {
  return {
    ...data,
    id: data.id + "-" + uuidv4().slice(0, 8),
    priorityScore: data.impactScore / data.difficultyScore,
  };
}
