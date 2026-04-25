export class CrawlQueue {
  private queue: string[] = [];
  private visited: Set<string> = new Set();
  private inProgress: Set<string> = new Set();

  constructor(private maxPages: number) {}

  enqueue(url: string): void {
    const normalized = this.normalizeForQueue(url);
    if (
      !this.visited.has(normalized) &&
      !this.inProgress.has(normalized) &&
      !this.queue.includes(normalized) &&
      this.totalProcessed() < this.maxPages
    ) {
      this.queue.push(normalized);
    }
  }

  enqueueMany(urls: string[]): void {
    for (const url of urls) {
      this.enqueue(url);
    }
  }

  dequeue(): string | null {
    const url = this.queue.shift() ?? null;
    if (url) {
      this.inProgress.add(url);
    }
    return url;
  }

  markDone(url: string): void {
    const normalized = this.normalizeForQueue(url);
    this.inProgress.delete(normalized);
    this.visited.add(normalized);
  }

  markError(url: string): void {
    const normalized = this.normalizeForQueue(url);
    this.inProgress.delete(normalized);
    this.visited.add(normalized);
  }

  hasMore(): boolean {
    return this.queue.length > 0 && this.totalProcessed() < this.maxPages;
  }

  isVisited(url: string): boolean {
    return this.visited.has(this.normalizeForQueue(url));
  }

  totalProcessed(): number {
    return this.visited.size;
  }

  queueSize(): number {
    return this.queue.length;
  }

  private normalizeForQueue(url: string): string {
    try {
      const u = new URL(url);
      u.hash = "";
      // Parametreli URL'leri normalize et (sıralı params)
      const params = new URLSearchParams(u.search);
      const sortedParams = new URLSearchParams(
        [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
      );
      u.search = sortedParams.toString();
      return u.href.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }
}
