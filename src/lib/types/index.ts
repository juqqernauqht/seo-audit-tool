export type CrawlMode = "single" | "sitemap" | "crawl";
export type Severity = "critical" | "high" | "medium" | "low";
export type IssueCategory =
  | "technical"
  | "onpage"
  | "local"
  | "internal-links"
  | "schema"
  | "performance"
  | "serp";

export interface CrawlConfig {
  domain: string;
  mode: CrawlMode;
  maxPages: number;
  respectRobots: boolean;
  useSitemap: boolean;
  localSeoMode: boolean;
  performanceAnalysis: boolean;
  startUrl?: string;
}

export interface LinkItem {
  href: string;
  text: string;
  isNoFollow: boolean;
  isInternal: boolean;
  isImage: boolean;
}

export interface ImageItem {
  src: string;
  alt: string | null;
  hasAlt: boolean;
  loading: string | null;
  width: string | null;
  height: string | null;
}

export interface SchemaItem {
  type: string;
  raw: string;
  parsed: Record<string, unknown> | null;
}

export interface HeadingItem {
  level: number;
  text: string;
}

export interface PageData {
  url: string;
  statusCode: number;
  redirectChain: string[];
  finalUrl: string;
  // meta
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2s: string[];
  h3s: string[];
  canonical: string | null;
  metaRobots: string | null;
  lang: string | null;
  viewport: string | null;
  charset: string | null;
  // content
  wordCount: number;
  bodyText: string;
  headingOutline: HeadingItem[];
  // links
  internalLinks: LinkItem[];
  externalLinks: LinkItem[];
  // images
  images: ImageItem[];
  imagesWithoutAlt: number;
  // meta extras
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  // schema
  schemas: SchemaItem[];
  // favicon
  favicon: string | null;
  // performance basics
  responseTime: number;
  htmlSize: number;
  scriptCount: number;
  stylesheetCount: number;
  // errors
  fetchError: string | null;
  crawledAt: string;
  html?: string;
}

export interface SEOIssue {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  affectedUrls: string[];
  severity: Severity;
  impactScore: number;
  difficultyScore: number;
  isQuickWin: boolean;
  solution: string;
  estimatedSeoImpact: string;
  priorityScore: number;
}

export interface SERPData {
  url: string;
  displayUrl: string;
  currentTitle: string | null;
  currentDescription: string | null;
  titleLength: number;
  descriptionLength: number;
  titleTruncated: boolean;
  descriptionTruncated: boolean;
  suggestedTitle: string;
  suggestedDescription: string;
  slugReadabilityScore: number;
  ctrRisk: "low" | "medium" | "high";
  titleSpamRisk: boolean;
  hasBrandInTitle: boolean;
}

export interface PageScores {
  technical: number;
  onPage: number;
  localSeo: number;
  schema: number;
  performance: number;
  serp: number;
}

export interface PageAnalysis {
  url: string;
  pageData: PageData;
  issues: SEOIssue[];
  serpData: SERPData;
  scores: PageScores;
  pageType: PageType;
}

export type PageType =
  | "homepage"
  | "service"
  | "location"
  | "service-location"
  | "blog"
  | "contact"
  | "about"
  | "other";

export interface GlobalScores {
  technical: number;
  indexability: number;
  onPage: number;
  internalLinks: number;
  localSeo: number;
  serp: number;
  performance: number;
}

export interface InternalLinkData {
  linkGraph: Record<string, string[]>;
  incomingLinksCount: Record<string, number>;
  outgoingLinksCount: Record<string, number>;
  orphanPages: string[];
  topLinkedPages: Array<{ url: string; count: number }>;
  lowLinkedPages: Array<{ url: string; count: number }>;
  clickDepth: Record<string, number>;
  totalInternalLinks: number;
  avgLinksPerPage: number;
}

export interface LocalSeoSummary {
  hasNAP: boolean;
  napConsistency: number;
  hasLocalSchema: boolean;
  hasContactPage: boolean;
  locationPagesCount: number;
  servicePagesCount: number;
  duplicateRiskUrls: string[];
  doorwayRiskUrls: string[];
  localIntentScore: number;
  cityMentions: Record<string, number>;
  missingLocalSignals: string[];
}

export interface AuditReport {
  id: string;
  domain: string;
  createdAt: string;
  config: CrawlConfig;
  summary: {
    totalPages: number;
    crawledPages: number;
    errorPages: number;
    indexablePages: number;
    noindexPages: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  pages: PageAnalysis[];
  allIssues: SEOIssue[];
  prioritizedIssues: SEOIssue[];
  quickWins: SEOIssue[];
  scores: GlobalScores;
  internalLinkData: InternalLinkData;
  localSeoSummary: LocalSeoSummary;
  robotsTxt: string | null;
  sitemapUrls: string[];
}

export interface CrawlJob {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
  pagesFound: number;
  pagesProcessed: number;
  currentUrl: string;
  report?: AuditReport;
  error?: string;
  createdAt: string;
}

export interface RankQueryResult {
  title: string;
  url: string;
  snippet: string;
  rank: number;
}

export interface RankQuery {
  id: string;
  keyword: string;
  domain: string;
  region: string;
  rank: number | null;
  foundUrl: string | null;
  queriedAt: string;
  results: RankQueryResult[];
}

