import type { PageData, InternalLinkData } from "../types";

export function analyzeInternalLinks(pages: PageData[]): InternalLinkData {
  const linkGraph: Record<string, string[]> = {};
  const incomingLinksCount: Record<string, number> = {};
  const outgoingLinksCount: Record<string, number> = {};

  const allUrls = new Set(pages.map((p) => p.url));

  for (const page of pages) {
    const from = page.url;
    linkGraph[from] = [];

    const internalLinks = page.internalLinks.filter((l) => allUrls.has(l.href));

    for (const link of internalLinks) {
      const to = link.href;
      if (!linkGraph[from].includes(to)) {
        linkGraph[from].push(to);
      }
      incomingLinksCount[to] = (incomingLinksCount[to] ?? 0) + 1;
    }

    outgoingLinksCount[from] = internalLinks.length;
  }

  // Tüm sayfaların incoming count'unu initialize et
  for (const url of allUrls) {
    if (!(url in incomingLinksCount)) {
      incomingLinksCount[url] = 0;
    }
  }

  // Orphan sayfalar
  const homepageUrl = pages.find((p) => {
    try {
      return new URL(p.url).pathname === "/";
    } catch { return false; }
  })?.url;

  const orphanPages = pages
    .filter((p) => p.url !== homepageUrl && (incomingLinksCount[p.url] ?? 0) === 0)
    .map((p) => p.url);

  // Top linked
  const topLinkedPages = Object.entries(incomingLinksCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }));

  // Low linked (0-2 incoming, hariç orphan)
  const lowLinkedPages = Object.entries(incomingLinksCount)
    .filter(([, count]) => count > 0 && count <= 2)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }));

  // Click depth (BFS'den)
  const clickDepth = calculateClickDepth(linkGraph, homepageUrl);

  const totalInternalLinks = Object.values(outgoingLinksCount).reduce((a, b) => a + b, 0);
  const avgLinksPerPage = pages.length > 0 ? totalInternalLinks / pages.length : 0;

  return {
    linkGraph,
    incomingLinksCount,
    outgoingLinksCount,
    orphanPages,
    topLinkedPages,
    lowLinkedPages,
    clickDepth,
    totalInternalLinks,
    avgLinksPerPage,
  };
}

function calculateClickDepth(
  linkGraph: Record<string, string[]>,
  startUrl?: string
): Record<string, number> {
  const depth: Record<string, number> = {};
  if (!startUrl) return depth;

  const queue: Array<[string, number]> = [[startUrl, 0]];
  depth[startUrl] = 0;

  while (queue.length > 0) {
    const [url, d] = queue.shift()!;
    for (const neighbor of linkGraph[url] ?? []) {
      if (!(neighbor in depth)) {
        depth[neighbor] = d + 1;
        queue.push([neighbor, d + 1]);
      }
    }
  }

  return depth;
}
