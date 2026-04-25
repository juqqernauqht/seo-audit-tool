import type { PageData, SEOIssue } from "../types";
import { v4 as uuidv4 } from "uuid";

const CITY_TERMS = [
  "istanbul", "ankara", "izmir", "antalya", "bursa", "adana", "konya",
  "kayseri", "eskişehir", "gaziantep", "mersin", "diyarbakır", "samsun",
  "denizli", "trabzon", "manisa", "kocaeli", "gebze", "pendik", "ümraniye",
  "kadıköy", "beşiktaş", "şişli", "maltepe", "kartal", "tuzla",
];

const SERVICE_TERMS = [
  "hizmet", "servis", "tamir", "kurulum", "montaj", "nakliye",
  "temizlik", "bakım", "tadilat", "boya", "elektrik", "tesisatçı",
  "boyacı", "teslimat", "sigorta", "danışmanlık",
];

const TRUST_SIGNALS = [
  "yıllık deneyim", "müşteri memnuniyeti", "garanti", "lisanslı",
  "sertifikalı", "ücretsiz keşif", "7/24", "hızlı hizmet",
  "referans", "google yorumlar",
];

export function analyzeLocalSeo(page: PageData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const url = page.url;
  const allText = [
    page.title ?? "",
    page.metaDescription ?? "",
    page.h1.join(" "),
    page.h2s.join(" "),
    page.bodyText,
  ].join(" ").toLowerCase();

  // Şehir adı title'da yok mu?
  const hasCityInTitle = CITY_TERMS.some((c) =>
    (page.title ?? "").toLowerCase().includes(c)
  );

  if (!hasCityInTitle) {
    issues.push(makeIssue({
      id: "local-city-not-in-title",
      category: "local",
      title: "Şehir/ilçe adı title'da yok",
      description: "Yerel hizmet sayfalarında title'ın şehir/ilçe adı içermesi önerilir",
      affectedUrls: [url],
      severity: "medium",
      impactScore: 6,
      difficultyScore: 1,
      isQuickWin: true,
      solution: 'Title\'a hedef şehri ekleyin: "Kombi Tamiri — İstanbul"',
      estimatedSeoImpact: "Yerel aramalar +20%",
    }));
  }

  // Hizmet terimi var mı?
  const hasServiceTerm = SERVICE_TERMS.some((s) => allText.includes(s));
  if (!hasServiceTerm) {
    issues.push(makeIssue({
      id: "local-no-service-term",
      category: "local",
      title: "Hizmet terimi içerikte yok",
      description: "Sayfa içeriğinde hizmet ifadesi tespit edilemedi",
      affectedUrls: [url],
      severity: "medium",
      impactScore: 5,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "İçeriğe sunulan hizmetin adını açıkça yazın",
      estimatedSeoImpact: "Yerel intent uyumu",
    }));
  }

  // Telefon numarası var mı?
  const phoneRegex = /(\+90|0)[\s-]?(\d{3})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})/;
  const hasPhone = phoneRegex.test(allText);
  if (!hasPhone) {
    issues.push(makeIssue({
      id: "local-no-phone",
      category: "local",
      title: "Telefon numarası bulunamadı",
      description: "Sayfada telefon numarası tespit edilemedi",
      affectedUrls: [url],
      severity: "medium",
      impactScore: 6,
      difficultyScore: 1,
      isQuickWin: true,
      solution: "Telefon numarasını görünür alana ekleyin ve tel: linki ile destekleyin",
      estimatedSeoImpact: "Dönüşüm + NAP sinyali",
    }));
  }

  // LocalBusiness schema var mı?
  const hasLocalSchema = page.schemas.some(
    (s) =>
      s.type.includes("LocalBusiness") ||
      s.type.includes("Organization") ||
      s.type.includes("Service")
  );

  if (!hasLocalSchema) {
    issues.push(makeIssue({
      id: "local-no-local-schema",
      category: "local",
      title: "Yerel schema eksik",
      description: "Sayfada LocalBusiness veya Service schema bulunamadı",
      affectedUrls: [url],
      severity: "high",
      impactScore: 8,
      difficultyScore: 2,
      isQuickWin: true,
      solution: "LocalBusiness JSON-LD ekleyin: name, address, telephone, openingHours",
      estimatedSeoImpact: "Rich result + yerel varlık",
    }));
  }

  // Güven sinyali var mı?
  const hasTrustSignal = TRUST_SIGNALS.some((t) => allText.includes(t));
  if (!hasTrustSignal) {
    issues.push(makeIssue({
      id: "local-no-trust-signal",
      category: "local",
      title: "Yerel güven sinyali eksik",
      description: "Deneyim, garanti veya referans ifadesi bulunamadı",
      affectedUrls: [url],
      severity: "low",
      impactScore: 4,
      difficultyScore: 3,
      isQuickWin: false,
      solution: "Yıllık deneyim, müşteri sayısı, garanti gibi güven unsurları ekleyin",
      estimatedSeoImpact: "E-E-A-T sinyali",
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
