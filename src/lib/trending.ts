// In-memory trending searches (simple implementation)
// For production, use Redis with TTL or a database table

interface TrendingStore {
  searches: Map<string, number>;
  sortedCache: string[] | null;
  lastUpdate: number;
}

const store: TrendingStore = {
  searches: new Map(),
  sortedCache: null,
  lastUpdate: 0,
};

const CACHE_TTL_MS = 60_000; // 1 minute cache
const MAX_TRENDING = 10;

export function trackSearch(term: string): void {
  if (!term || term.trim().length < 2) return;

  const normalized = term.trim().toLowerCase();

  store.searches.set(normalized, (store.searches.get(normalized) || 0) + 1);
  store.sortedCache = null; // Invalidate cache
}

export function getTrendingSearches(): string[] {
  const now = Date.now();

  // Return cached sorted list if fresh
  if (store.sortedCache && now - store.lastUpdate < CACHE_TTL_MS) {
    return store.sortedCache;
  }

  // Sort by count descending, take top MAX_TRENDING
  const sorted = Array.from(store.searches.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TRENDING)
    .map(([term]) => term);

  store.sortedCache = sorted;
  store.lastUpdate = now;

  return sorted;
}

// Optional: clear trending data (for testing or scheduled reset)
export function clearTrending(): void {
  store.searches.clear();
  store.sortedCache = null;
  store.lastUpdate = 0;
}