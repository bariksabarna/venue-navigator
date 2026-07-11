/**
 * @fileoverview Unit tests for the response cache module.
 * Tests: key generation, set/get, TTL expiry, max size eviction.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeCacheKey, setCacheEntry, getCacheEntry, clearCache, getCacheSize } from '../lib/cache';

describe('makeCacheKey', () => {
  it('produces a key combining language and normalized query', () => {
    const key = makeCacheKey('Where is Gate 4?', 'en');
    expect(key).toBe('en::where is gate 4?');
  });

  it('normalizes extra whitespace in the query', () => {
    const key1 = makeCacheKey('gate  4', 'en');
    const key2 = makeCacheKey('gate 4', 'en');
    expect(key1).toBe(key2);
  });

  it('lowercases both language code and query', () => {
    const key = makeCacheKey('GATE 4', 'EN');
    expect(key).toBe('en::gate 4');
  });

  it('produces different keys for different languages', () => {
    const enKey = makeCacheKey('gate 4', 'en');
    const hiKey = makeCacheKey('gate 4', 'hi');
    expect(enKey).not.toBe(hiKey);
  });

  it('produces different keys for different queries', () => {
    const k1 = makeCacheKey('gate 4', 'en');
    const k2 = makeCacheKey('gate 5', 'en');
    expect(k1).not.toBe(k2);
  });
});

describe('setCacheEntry / getCacheEntry', () => {
  beforeEach(() => clearCache());

  it('stores and retrieves a cached response', () => {
    setCacheEntry('test-key', 'Walk to Gate 4.');
    expect(getCacheEntry('test-key')).toBe('Walk to Gate 4.');
  });

  it('returns null for a key that was never set', () => {
    expect(getCacheEntry('nonexistent-key')).toBeNull();
  });

  it('returns null for an expired entry (TTL exceeded)', () => {
    // Use fake timers to control time
    vi.useFakeTimers();
    setCacheEntry('expiring-key', 'Soon to expire');
    // Advance time beyond TTL (11 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(getCacheEntry('expiring-key', 10 * 60 * 1000)).toBeNull();
    vi.useRealTimers();
  });

  it('returns the cached value when within TTL', () => {
    vi.useFakeTimers();
    setCacheEntry('fresh-key', 'Still fresh');
    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes — within default 10 min TTL
    expect(getCacheEntry('fresh-key')).toBe('Still fresh');
    vi.useRealTimers();
  });

  it('evicts the oldest entry when cache reaches MAX_ENTRIES (50)', () => {
    clearCache();
    // Fill the cache to max capacity
    for (let i = 0; i < 50; i++) {
      setCacheEntry(`key-${i}`, `value-${i}`);
    }
    expect(getCacheSize()).toBe(50);
    // Adding one more should evict 'key-0' (oldest)
    setCacheEntry('key-new', 'new-value');
    expect(getCacheEntry('key-0')).toBeNull();
    expect(getCacheEntry('key-new')).toBe('new-value');
    expect(getCacheSize()).toBe(50);
  });
});

describe('clearCache', () => {
  it('removes all entries from the cache', () => {
    setCacheEntry('a', 'alpha');
    setCacheEntry('b', 'beta');
    clearCache();
    expect(getCacheSize()).toBe(0);
    expect(getCacheEntry('a')).toBeNull();
  });
});

describe('getCacheSize', () => {
  beforeEach(() => clearCache());

  it('returns 0 for an empty cache', () => {
    expect(getCacheSize()).toBe(0);
  });

  it('increments as entries are added', () => {
    setCacheEntry('x', 'val');
    expect(getCacheSize()).toBe(1);
    setCacheEntry('y', 'val');
    expect(getCacheSize()).toBe(2);
  });
});
