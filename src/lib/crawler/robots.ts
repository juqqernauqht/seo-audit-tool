import { fetchUrl } from "./fetcher";

export interface RobotsData {
  raw: string | null;
  sitemapUrls: string[];
  isAllowed: (url: string, userAgent?: string) => boolean;
  crawlDelay: number;
}

export async function fetchRobots(domain: string): Promise<RobotsData> {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const robotsUrl = `${base.replace(/\/$/, "")}/robots.txt`;

  const result = await fetchUrl(robotsUrl);

  if (result.statusCode !== 200 || !result.html) {
    return {
      raw: null,
      sitemapUrls: [],
      isAllowed: () => true,
      crawlDelay: 0,
    };
  }

  return parseRobots(result.html);
}

export function parseRobots(raw: string): RobotsData {
  const lines = raw.split("\n").map((l) => l.trim());
  const sitemapUrls: string[] = [];
  const rules: Array<{ ua: string; disallowed: string[]; allowed: string[] }> =
    [];
  let crawlDelay = 0;

  let currentUa: string | null = null;
  let currentDisallowed: string[] = [];
  let currentAllowed: string[] = [];

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      if (currentUa !== null && (currentDisallowed.length > 0 || currentAllowed.length > 0)) {
        rules.push({
          ua: currentUa,
          disallowed: [...currentDisallowed],
          allowed: [...currentAllowed],
        });
        currentUa = null;
        currentDisallowed = [];
        currentAllowed = [];
      }
      continue;
    }

    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    switch (key.toLowerCase().trim()) {
      case "user-agent":
        if (currentUa !== null) {
          rules.push({ ua: currentUa, disallowed: currentDisallowed, allowed: currentAllowed });
          currentDisallowed = [];
          currentAllowed = [];
        }
        currentUa = value.toLowerCase();
        break;
      case "disallow":
        if (value) currentDisallowed.push(value);
        break;
      case "allow":
        if (value) currentAllowed.push(value);
        break;
      case "sitemap":
        if (value) sitemapUrls.push(value);
        break;
      case "crawl-delay":
        crawlDelay = parseFloat(value) || 0;
        break;
    }
  }

  if (currentUa !== null) {
    rules.push({ ua: currentUa, disallowed: currentDisallowed, allowed: currentAllowed });
  }

  const isAllowed = (url: string, userAgent = "*"): boolean => {
    const uaLower = userAgent.toLowerCase();
    const rule =
      rules.find((r) => r.ua === uaLower) ||
      rules.find((r) => r.ua === "*");

    if (!rule) return true;

    let path: string;
    try {
      path = new URL(url).pathname;
    } catch {
      path = url;
    }

    // Allow önce kontrol edilir (daha spesifik)
    for (const allowed of rule.allowed) {
      if (path.startsWith(allowed)) return true;
    }

    for (const disallowed of rule.disallowed) {
      if (disallowed === "/") return false;
      if (path.startsWith(disallowed)) return false;
    }

    return true;
  };

  return { raw, sitemapUrls, isAllowed, crawlDelay };
}
