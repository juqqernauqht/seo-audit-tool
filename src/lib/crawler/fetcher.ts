import axios, { type AxiosResponse } from "axios";

export interface FetchResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  html: string | null;
  headers: Record<string, string>;
  responseTime: number;
  redirectChain: string[];
  error: string | null;
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://seoaudit.app)";

export async function fetchUrl(
  url: string,
  timeout = DEFAULT_TIMEOUT
): Promise<FetchResult> {
  const redirectChain: string[] = [];
  const start = Date.now();

  try {
    const response: AxiosResponse = await axios.get(url, {
      timeout,
      maxRedirects: 5,
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr,en;q=0.9",
      },
      validateStatus: () => true, // tüm status kodlarını kabul et
      beforeRedirect: (options: any) => {
        redirectChain.push(options.href || options.url || "");
      },
    });

    const responseTime = Date.now() - start;

    return {
      url,
      finalUrl: response.request?.res?.responseUrl ?? url,
      statusCode: response.status,
      html:
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
      headers: flattenHeaders(response.headers),
      responseTime,
      redirectChain,
      error: null,
    };
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const errorMessage =
      err instanceof Error ? err.message : "Bilinmeyen hata";

    return {
      url,
      finalUrl: url,
      statusCode: 0,
      html: null,
      headers: {},
      responseTime,
      redirectChain,
      error: errorMessage,
    };
  }
}

function flattenHeaders(
  headers: Record<string, unknown>
): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    flat[key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  }
  return flat;
}

export function normalizeUrl(url: string, base: string): string | null {
  try {
    const resolved = new URL(url, base);
    // Fragment'ları kaldır
    resolved.hash = "";
    // Trailing slash normalize
    if (
      resolved.pathname !== "/" &&
      resolved.pathname.endsWith("/") &&
      !resolved.pathname.includes(".")
    ) {
      resolved.pathname = resolved.pathname.slice(0, -1);
    }
    return resolved.href;
  } catch {
    return null;
  }
}

export function isSameDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    const domainParsed = new URL(
      domain.startsWith("http") ? domain : `https://${domain}`
    );
    return (
      parsed.hostname === domainParsed.hostname ||
      parsed.hostname === `www.${domainParsed.hostname}` ||
      `www.${parsed.hostname}` === domainParsed.hostname
    );
  } catch {
    return false;
  }
}

export function shouldSkipUrl(url: string): boolean {
  const skipExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".zip",
    ".rar",
    ".mp4",
    ".mp3",
    ".xml",
  ];

  const skipProtocols = ["mailto:", "tel:", "javascript:", "#", "data:"];

  if (skipProtocols.some((p) => url.startsWith(p))) return true;

  const lower = url.toLowerCase().split("?")[0];
  if (skipExtensions.some((ext) => lower.endsWith(ext))) return true;

  return false;
}
