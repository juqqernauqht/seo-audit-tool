import { fetchUrl } from "./fetcher";
import { XMLParser } from "fast-xml-parser";

export async function fetchSitemapUrls(
  sitemapUrl: string,
  maxUrls = 200
): Promise<string[]> {
  const result = await fetchUrl(sitemapUrl);
  if (!result.html) return [];

  return parseSitemap(result.html, maxUrls);
}

export function parseSitemap(xml: string, maxUrls = 200): string[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  let urls: string[] = [];

  try {
    const parsed = parser.parse(xml);

    // Sitemap index
    if (parsed.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      // İlk 5 sitemap'i al (index durumunda)
      for (const sm of sitemaps.slice(0, 5)) {
        const loc = sm.loc;
        if (loc) urls.push(loc);
      }
      return urls;
    }

    // Regular sitemap
    if (parsed.urlset?.url) {
      const urlList = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];

      for (const u of urlList) {
        if (u.loc) urls.push(u.loc);
      }
    }
  } catch {
    // XML parse hatası — regex fallback
    const matches = xml.match(/<loc>([^<]+)<\/loc>/g);
    if (matches) {
      urls = matches
        .map((m) => m.replace(/<\/?loc>/g, "").trim())
        .filter((u) => u.startsWith("http"));
    }
  }

  return urls.slice(0, maxUrls);
}
