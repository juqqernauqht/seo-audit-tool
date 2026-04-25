import type { PageAnalysis, GlobalScores, InternalLinkData, LocalSeoSummary } from "../types";

export function calculateGlobalScores(
  pages: PageAnalysis[],
  internalLinkData: InternalLinkData,
  localSeoSummary: LocalSeoSummary
): GlobalScores {
  const avgScore = (key: keyof PageAnalysis["scores"]) => {
    if (pages.length === 0) return 100;
    const sum = pages.reduce((acc, p) => acc + p.scores[key], 0);
    return Math.round(sum / pages.length);
  };

  const technical = avgScore("technical");
  const onPage = avgScore("onPage");
  const schema = avgScore("schema");
  const performance = avgScore("performance");
  const serp = avgScore("serp");
  const localSeo = localSeoSummary.localIntentScore;

  // Indexability
  const indexable = pages.filter(
    (p) =>
      p.pageData.statusCode === 200 &&
      !p.pageData.metaRobots?.includes("noindex")
  ).length;
  const indexability = pages.length > 0 ? Math.round((indexable / pages.length) * 100) : 100;

  // Internal links score
  const orphanRatio =
    pages.length > 0 ? internalLinkData.orphanPages.length / pages.length : 0;
  const avgLinks = internalLinkData.avgLinksPerPage;
  const internalLinks = Math.round(
    Math.max(0, 100 - orphanRatio * 50 - Math.max(0, 5 - avgLinks) * 5)
  );

  return {
    technical,
    indexability,
    onPage,
    internalLinks,
    localSeo,
    serp,
    performance,
  };
}
