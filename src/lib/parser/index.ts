import * as cheerio from "cheerio";
import type { PageData, LinkItem, ImageItem, SchemaItem, HeadingItem } from "../types";
import type { FetchResult } from "../crawler/fetcher";
import { normalizeUrl, isSameDomain } from "../crawler/fetcher";

export function parsePage(fetchResult: FetchResult, baseDomain: string): PageData {
  const { url, finalUrl, statusCode, html, headers, responseTime, redirectChain, error } = fetchResult;

  if (!html) {
    return createEmptyPageData(url, finalUrl, statusCode, redirectChain, responseTime, error);
  }

  const htmlSize = Buffer.byteLength(html, "utf-8");
  const $ = cheerio.load(html);

  // Title
  const title = $("title").first().text().trim() || null;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[name="Description"]').attr("content")?.trim() ||
    null;

  // H1, H2, H3
  const h1: string[] = [];
  $("h1").each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1.push(text);
  });

  const h2s: string[] = [];
  $("h2").each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2s.push(text);
  });

  const h3s: string[] = [];
  $("h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) h3s.push(text);
  });

  // Heading outline
  const headingOutline: HeadingItem[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""));
    const text = $(el).text().trim();
    if (text) headingOutline.push({ level, text });
  });

  // Canonical
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() ||
    null;

  // Meta robots
  const metaRobots =
    $('meta[name="robots"]').attr("content")?.trim() ||
    $('meta[name="Robots"]').attr("content")?.trim() ||
    null;

  // Lang
  const lang = $("html").attr("lang")?.trim() || null;

  // Viewport
  const viewport = $('meta[name="viewport"]').attr("content")?.trim() || null;

  // Charset
  const charset =
    $("meta[charset]").attr("charset")?.trim() ||
    $('meta[http-equiv="Content-Type"]').attr("content")?.match(/charset=([^\s;]+)/)?.[1] ||
    null;

  // OG Meta
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;

  // Twitter Meta
  const twitterCard = $('meta[name="twitter:card"]').attr("content")?.trim() || null;
  const twitterTitle = $('meta[name="twitter:title"]').attr("content")?.trim() || null;

  // Favicon
  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    null;

  // Links
  const internalLinks: LinkItem[] = [];
  const externalLinks: LinkItem[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    const text = $(el).text().trim();
    const rel = $(el).attr("rel") ?? "";
    const isNoFollow = rel.includes("nofollow");
    const isImage = $(el).find("img").length > 0;

    const normalized = normalizeUrl(href, finalUrl);
    if (!normalized) return;

    const isInternal = isSameDomain(normalized, baseDomain);

    const linkItem: LinkItem = {
      href: normalized,
      text,
      isNoFollow,
      isInternal,
      isImage,
    };

    if (isInternal) {
      internalLinks.push(linkItem);
    } else if (normalized.startsWith("http")) {
      externalLinks.push(linkItem);
    }
  });

  // Images
  const images: ImageItem[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt") ?? null;
    images.push({
      src: normalizeUrl(src, finalUrl) ?? src,
      alt,
      hasAlt: alt !== null && alt.trim() !== "",
      loading: $(el).attr("loading") ?? null,
      width: $(el).attr("width") ?? null,
      height: $(el).attr("height") ?? null,
    });
  });

  const imagesWithoutAlt = images.filter((img) => !img.hasAlt).length;

  // Schema
  const schemas: SchemaItem[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html()?.trim() ?? "";
    try {
      const parsed = JSON.parse(raw);
      const type =
        parsed["@type"] ??
        (Array.isArray(parsed["@graph"])
          ? parsed["@graph"].map((g: Record<string, unknown>) => g["@type"]).join(",")
          : "Unknown");
      schemas.push({ type: String(type), raw, parsed });
    } catch {
      schemas.push({ type: "invalid", raw, parsed: null });
    }
  });

  // Body text
  $("script, style, nav, footer, header").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Performance basics
  const scriptCount = $("script[src]").length;
  const stylesheetCount = $('link[rel="stylesheet"]').length;

  return {
    url,
    finalUrl,
    statusCode,
    redirectChain,
    title,
    metaDescription,
    h1,
    h2s,
    h3s,
    canonical,
    metaRobots,
    lang,
    viewport,
    charset,
    wordCount,
    bodyText,
    headingOutline,
    internalLinks,
    externalLinks,
    images,
    imagesWithoutAlt,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    twitterTitle,
    schemas,
    favicon,
    responseTime,
    htmlSize,
    scriptCount,
    stylesheetCount,
    fetchError: error,
    crawledAt: new Date().toISOString(),
  };
}

function createEmptyPageData(
  url: string,
  finalUrl: string,
  statusCode: number,
  redirectChain: string[],
  responseTime: number,
  error: string | null
): PageData {
  return {
    url,
    finalUrl,
    statusCode,
    redirectChain,
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
