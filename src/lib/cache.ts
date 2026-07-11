/**
 * @fileoverview Client-side response cache for Gemini query results.
 *
 * Caches completed AI responses keyed by a normalized (query + language)
 * string to avoid redundant API calls for repeated identical questions.
 * The cache is held in memory only — it does not persist to localStorage
 * (privacy: no query text is ever stored client-side beyond the session).
 *
 * This satisfies FR-12 from the SRS.
 *
 * @module cache
 */

/** A single cached response entry */
interface CacheEntry {
  /** The AI-generated response text */
  response: string;
  /** Unix timestamp when this entry was stored */
  storedAt: number;
}

/** Default cache TTL: 10 minutes (in milliseconds) */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

/** Maximum number of entries to keep in memory before evicting the oldest */
const MAX_ENTRIES = 50;

// ── Cache store (module-level singleton) ─────────────────────────────────────
// Map preserves insertion order, making LRU eviction straightforward.
const cache = new Map<string, CacheEntry>();

/**
 * Generates a normalized cache key from a query string and language code.
 * Normalizes by lowercasing and collapsing whitespace so minor differences
 * in spacing don't produce cache misses.
 *
 * @param query    - The user's raw query text.
 * @param language - BCP 47 language code (e.g. "en", "hi", "es").
 * @returns A stable cache key string.
 *
 * @example
 * makeCacheKey("Where is Gate 4?", "en")
 * // => "en::where is gate 4?"
 */
export function makeCacheKey(query: string, language: string): string {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  return `${language.toLowerCase()}::${normalizedQuery}`;
}

/**
 * Stores a response in the cache under a given key.
 * If the cache has reached MAX_ENTRIES, the oldest entry is evicted first
 * (the Map's first key in insertion order).
 *
 * @param key      - The cache key (use makeCacheKey to generate).
 * @param response - The AI response text to cache.
 */
export function setCacheEntry(key: string, response: string): void {
  // Evict the oldest entry if the cache is full
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }

  cache.set(key, { response, storedAt: Date.now() });
}

/**
 * Retrieves a cached response if it exists and has not expired.
 * Expired entries are deleted on access (lazy eviction).
 *
 * @param key    - The cache key to look up.
 * @param ttlMs  - Time-to-live in milliseconds (default: 10 minutes).
 * @returns The cached response string, or null if not found or expired.
 *
 * @example
 * const cached = getCacheEntry("en::where is gate 4?");
 * if (cached) { useDirectly(cached); }
 */
export function getCacheEntry(key: string, ttlMs: number = DEFAULT_TTL_MS): string | null {
  const entry = cache.get(key);
  if (!entry) return null;

  // Lazy expiry: delete and return null if TTL exceeded
  if (Date.now() - entry.storedAt > ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

/**
 * Clears all entries from the cache. Used in tests and when the user
 * explicitly resets their session.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Returns the current number of entries in the cache.
 * Primarily useful for testing and debugging.
 *
 * @returns The number of cached entries.
 */
export function getCacheSize(): number {
  return cache.size;
}
