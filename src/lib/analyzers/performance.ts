import type { PageData, SEOIssue } from "../types";
import { v4 as uuidv4 } from "uuid";

export function analyzePerformance(page: PageData): SEOIssue[] {
  const issues: SEOIssue[] = [];

  // Yavaş response time
  if (page.responseTime > 3000) {
    issues.push(makeIssue({
      id: "perf-slow-ttfb",
      category: "performance",
      title: "Yüksek sunucu yanıt süresi",
      description: `Sayfa ${page.responseTime}ms'de yanıt verdi (maks. 3000ms önerilir)`,
      affectedUrls: [page.url],
      severity: page.responseTime > 6000 ? "high" : "medium",
      impactScore: 7,
      difficultyScore: 4,
      isQuickWin: false,
      solution: "Sunucu kapasitesini artırın, CDN kullanın veya cache ekleyin",
      estimatedSeoImpact: "Core Web Vitals iyileşir",
    }));
  }

  // Büyük HTML
  if (page.htmlSize > 200 * 1024) {
    issues.push(makeIssue({
      id: "perf-large-html",
      category: "performance",
      title: "HTML boyutu çok büyük",
      description: `HTML ${Math.round(page.htmlSize / 1024)}KB (maks. 200KB önerilir)`,
      affectedUrls: [page.url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Inline CSS/JS'i harici dosyalara taşıyın, gzip sıkıştırma açın",
      estimatedSeoImpact: "Sayfa hızı artar",
    }));
  }

  // Çok fazla script
  if (page.scriptCount > 15) {
    issues.push(makeIssue({
      id: "perf-too-many-scripts",
      category: "performance",
      title: "Fazla JavaScript dosyası",
      description: `${page.scriptCount} adet harici script yükleniyor`,
      affectedUrls: [page.url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Script'leri birleştirin veya gereksizleri kaldırın",
      estimatedSeoImpact: "Render engelleme azalır",
    }));
  }

  // Lazy loading eksik
  const imagesWithoutLazy = page.images.filter(
    (img) => !img.loading || img.loading !== "lazy"
  );
  if (imagesWithoutLazy.length > 5) {
    issues.push(makeIssue({
      id: "perf-missing-lazy",
      category: "performance",
      title: "Görsellerde lazy loading eksik",
      description: `${imagesWithoutLazy.length} görselde loading="lazy" yok`,
      affectedUrls: [page.url],
      severity: "low",
      impactScore: 4,
      difficultyScore: 1,
      isQuickWin: true,
      solution: 'Görsellere loading="lazy" özelliği ekleyin',
      estimatedSeoImpact: "LCP iyileşebilir",
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
