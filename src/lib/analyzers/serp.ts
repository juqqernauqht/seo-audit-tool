import type { PageData, SERPData } from "../types";

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

export function analyzeSERP(page: PageData): SERPData {
  const title = page.title ?? "";
  const description = page.metaDescription ?? "";

  const titleLength = title.length;
  const descriptionLength = description.length;

  const titleTruncated = titleLength > TITLE_MAX;
  const descriptionTruncated = descriptionLength > DESC_MAX;

  let ctrRisk: "low" | "medium" | "high" = "low";

  if (!title || !description) {
    ctrRisk = "high";
  } else if (titleTruncated || descriptionTruncated || titleLength < TITLE_MIN) {
    ctrRisk = "medium";
  }

  const titleSpamRisk = checkTitleSpam(title);
  const hasBrandInTitle = checkBrandInTitle(title, page.url);

  const suggestedTitle = generateSuggestedTitle(page);
  const suggestedDescription = generateSuggestedDescription(page);

  const displayUrl = formatDisplayUrl(page.finalUrl);
  const slugReadabilityScore = scoreSlugReadability(page.url);

  return {
    url: page.url,
    displayUrl,
    currentTitle: title || null,
    currentDescription: description || null,
    titleLength,
    descriptionLength,
    titleTruncated,
    descriptionTruncated,
    suggestedTitle,
    suggestedDescription,
    slugReadabilityScore,
    ctrRisk,
    titleSpamRisk,
    hasBrandInTitle,
  };
}

function checkTitleSpam(title: string): boolean {
  // Aynı kelime 3+ kez tekrarlanıyor mu?
  const words = title.toLowerCase().split(/\s+/);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.values()].some((count) => count >= 3);
}

function checkBrandInTitle(title: string, url: string): boolean {
  try {
    const domain = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
    const brand = domain.replace("www.", "").split(".")[0];
    return title.toLowerCase().includes(brand.toLowerCase());
  } catch {
    return false;
  }
}

function generateSuggestedTitle(page: PageData): string {
  if (page.title && page.title.length >= 30 && page.title.length <= 60) {
    return page.title;
  }

  // H1 kullan
  if (page.h1.length > 0) {
    const h1 = page.h1[0];
    if (h1.length >= 30 && h1.length <= 60) return h1;
    if (h1.length > 60) return h1.slice(0, 57) + "...";
    // Çok kısa H1'e domain ekle
    try {
      const domain = new URL(page.url).hostname.replace("www.", "");
      const candidate = `${h1} | ${domain}`;
      if (candidate.length <= 60) return candidate;
    } catch {
      // ignore
    }
  }

  return page.title ? page.title.slice(0, 57) + "..." : "Title eksik";
}

function generateSuggestedDescription(page: PageData): string {
  if (
    page.metaDescription &&
    page.metaDescription.length >= 70 &&
    page.metaDescription.length <= 160
  ) {
    return page.metaDescription;
  }

  // Body text'ten ilk uygun cümleyi al
  const sentences = page.bodyText
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 160);

  if (sentences.length > 0) {
    const candidate = sentences[0];
    if (candidate.length <= 160) return candidate + ".";
  }

  if (page.metaDescription) {
    return page.metaDescription.slice(0, 157) + "...";
  }

  return "Meta description eksik — içeriği özetleyen 120-160 karakterlik bir açıklama yazın.";
}

function formatDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).replace(/-/g, " "))
      .join(" › ");
    return `${parsed.hostname}${path ? " › " + path : ""}`;
  } catch {
    return url;
  }
}

function scoreSlugReadability(url: string): number {
  try {
    const path = new URL(url).pathname;
    let score = 100;
    if (path.includes("_")) score -= 10;
    if (/\d{4,}/.test(path)) score -= 10; // uzun sayılar
    if (path.split("/").some((s) => s.length > 60)) score -= 20;
    if (/[A-Z]/.test(path)) score -= 10; // büyük harf
    if (path.includes("?")) score -= 15;
    return Math.max(0, score);
  } catch {
    return 50;
  }
}
