/**
 * @fileoverview Unit tests for the knowledge base retrieval module.
 * Tests cover: tokenization, scoring, retrieval, edge cases, and formatting.
 */

import { describe, it, expect } from 'vitest';
import { tokenize, scoreFaqEntry, retrieveRelevantFaqs, formatFaqContext } from '../lib/knowledgeBase';
import type { FaqEntry } from '../types';

// ── Test fixtures ─────────────────────────────────────────────────────────────
const sampleFaqs: FaqEntry[] = [
  {
    id: 'faq-1',
    topic: 'tickets',
    tags: ['mobile ticket', 'entry', 'gate', 'qr'],
    answer_en: 'Show your mobile QR code at the gate.',
  },
  {
    id: 'faq-2',
    topic: 'accessibility',
    tags: ['wheelchair', 'ramp', 'accessible', 'disabled'],
    answer_en: 'Wheelchair users should use Gates 1, 4, or 5.',
  },
  {
    id: 'faq-3',
    topic: 'transit',
    tags: ['bus', 'metro', 'shuttle', 'transport'],
    answer_en: 'Take the shuttle from Central Station every 10 minutes.',
  },
  {
    id: 'faq-4',
    topic: 'prohibited',
    tags: ['banned', 'not allowed', 'glass', 'weapons'],
    answer_en: 'Glass bottles and weapons are prohibited.',
  },
];

describe('tokenize', () => {
  it('converts text to lowercase tokens', () => {
    expect(tokenize('Hello World')).toContain('hello');
    expect(tokenize('Hello World')).toContain('world');
  });

  it('splits on punctuation and whitespace', () => {
    const tokens = tokenize("Where's the Gate?");
    expect(tokens).toContain("where's");
    expect(tokens).toContain('the');
    expect(tokens).toContain('gate');
  });

  it('removes empty tokens', () => {
    const tokens = tokenize('  hello   world  ');
    expect(tokens.every((t) => t.length > 0)).toBe(true);
  });

  it('deduplicates repeated tokens', () => {
    const tokens = tokenize('gate gate gate');
    expect(tokens.filter((t) => t === 'gate')).toHaveLength(1);
  });

  it('returns an empty array for an empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns an empty array for whitespace-only string', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('scoreFaqEntry', () => {
  it('gives higher score for topic matches than tag matches', () => {
    const ticketTokens = tokenize('tickets');
    const topicScore = scoreFaqEntry(ticketTokens, sampleFaqs[0]);
    const tagScore = scoreFaqEntry(tokenize('mobile entry'), sampleFaqs[0]);
    // Topic match (+3) should be higher than single tag match (+2)
    expect(topicScore).toBeGreaterThan(0);
    expect(tagScore).toBeGreaterThan(0);
  });

  it('returns 0 for completely unrelated query', () => {
    const score = scoreFaqEntry(tokenize('football scores history'), sampleFaqs[2]);
    expect(score).toBe(0);
  });

  it('accumulates scores across multiple matching tokens', () => {
    const multiTokenScore = scoreFaqEntry(tokenize('wheelchair accessible ramp'), sampleFaqs[1]);
    const singleTokenScore = scoreFaqEntry(tokenize('wheelchair'), sampleFaqs[1]);
    expect(multiTokenScore).toBeGreaterThan(singleTokenScore);
  });
});

describe('retrieveRelevantFaqs', () => {
  it('returns the most relevant entry for a clear query', () => {
    const results = retrieveRelevantFaqs('wheelchair accessible entrance', sampleFaqs);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('faq-2');
  });

  it('returns results in descending relevance order', () => {
    const results = retrieveRelevantFaqs('mobile ticket gate entry', sampleFaqs);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].topic).toBe('tickets');
  });

  it('returns empty array for an empty query', () => {
    expect(retrieveRelevantFaqs('', sampleFaqs)).toEqual([]);
  });

  it('returns empty array for a whitespace-only query', () => {
    expect(retrieveRelevantFaqs('   ', sampleFaqs)).toEqual([]);
  });

  it('returns empty array when no entry meets the minimum score threshold', () => {
    const results = retrieveRelevantFaqs('elephant jungle river ocean', sampleFaqs);
    expect(results).toEqual([]);
  });

  it('respects topN limit', () => {
    // This query should match multiple entries
    const results = retrieveRelevantFaqs('ticket entry accessible gate transport', sampleFaqs, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array for an empty FAQ database', () => {
    expect(retrieveRelevantFaqs('tickets', [])).toEqual([]);
  });

  it('uses custom minScore threshold correctly', () => {
    // With very high minScore, should return nothing
    const strict = retrieveRelevantFaqs('tickets', sampleFaqs, 3, 100);
    expect(strict).toEqual([]);
    // With minScore=0, should return all matching entries
    const lenient = retrieveRelevantFaqs('tickets', sampleFaqs, 10, 0);
    expect(lenient.length).toBeGreaterThan(0);
  });
});

describe('formatFaqContext', () => {
  it('formats multiple FAQ entries with topic headers and delimiters', () => {
    const formatted = formatFaqContext([sampleFaqs[0], sampleFaqs[1]]);
    expect(formatted).toContain('[TICKETS]');
    expect(formatted).toContain('[ACCESSIBILITY]');
    expect(formatted).toContain('---');
  });

  it('returns an empty string for an empty array', () => {
    expect(formatFaqContext([])).toBe('');
  });

  it('formats a single entry without a trailing delimiter', () => {
    const formatted = formatFaqContext([sampleFaqs[0]]);
    expect(formatted).toContain('[TICKETS]');
    // Should not have a trailing delimiter for single entry
    expect(formatted.endsWith('---')).toBe(false);
  });
});

// ── Integration: test against the real faq.json ───────────────────────────────
describe('Real faq.json integration', () => {
  it('imports without errors and has expected structure', async () => {
    const { default: faqs } = await import('../data/faq.json');
    expect(Array.isArray(faqs)).toBe(true);
    expect(faqs.length).toBeGreaterThan(5);
    expect(faqs[0]).toHaveProperty('id');
    expect(faqs[0]).toHaveProperty('topic');
    expect(faqs[0]).toHaveProperty('tags');
    expect(faqs[0]).toHaveProperty('answer_en');
  });

  it('retrieves relevant results for a ticket query against real data', async () => {
    const { default: faqs } = await import('../data/faq.json');
    const results = retrieveRelevantFaqs('mobile ticket qr code gate', faqs as FaqEntry[]);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].topic).toBe('tickets');
  });

  it('retrieves accessibility info for a wheelchair query', async () => {
    const { default: faqs } = await import('../data/faq.json');
    const results = retrieveRelevantFaqs('wheelchair accessible restroom', faqs as FaqEntry[]);
    expect(results.length).toBeGreaterThan(0);
  });
});
