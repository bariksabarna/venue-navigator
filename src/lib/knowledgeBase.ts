/**
 * @fileoverview Local FAQ knowledge base retrieval.
 *
 * Provides a lightweight, zero-dependency relevance lookup over the local
 * faq.json file by matching query tokens against FAQ topic and tag fields.
 * This keeps knowledge grounded and avoids hallucination — Gemini is given
 * only matching FAQ entries as context, so it can never invent an answer
 * for which there's no source.
 *
 * @module knowledgeBase
 */

import type { FaqEntry } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes a string to lowercase tokens by splitting on whitespace and
 * punctuation, then removes duplicates. Used for both query and tag matching.
 *
 * @param text - Raw input string to tokenize.
 * @returns Array of unique lowercase tokens.
 *
 * @example
 * tokenize("Where's the Accessible Restroom?")
 * // => ["where's", "the", "accessible", "restroom"]
 */
export function tokenize(text: string): string[] {
  return [...new Set(text.toLowerCase().split(/[\s,./!?;:"()-]+/).filter(Boolean))];
}

/**
 * Computes a relevance score between a query and a single FAQ entry.
 * Scoring strategy:
 *   - +3 points for each query token that matches the FAQ topic
 *   - +2 points for each query token that appears in the FAQ tags array
 *   - +1 point for each query token found in the FAQ answer text
 *
 * This simple weighted approach is cheap, predictable, and fully testable
 * without any external embedding service.
 *
 * @param queryTokens - Pre-tokenized query terms.
 * @param entry       - The FAQ entry to score against.
 * @returns A non-negative relevance score (higher = more relevant).
 */
export function scoreFaqEntry(queryTokens: string[], entry: FaqEntry): number {
  let score = 0;

  const topicTokens = tokenize(entry.topic);
  const answerTokens = tokenize(entry.answer_en);
  const tagTokens = entry.tags.flatMap((tag) => tokenize(tag));

  for (const token of queryTokens) {
    // Topic match — strongest signal
    if (topicTokens.includes(token)) score += 3;
    // Tag match — strong signal
    if (tagTokens.includes(token)) score += 2;
    // Answer text match — weak signal
    if (answerTokens.includes(token)) score += 1;
  }

  return score;
}

/**
 * Retrieves the most relevant FAQ entries from the knowledge base for a
 * given free-text query. Returns an empty array if no entries meet the
 * minimum relevance threshold — the caller (Gemini) is then instructed to
 * respond with "I don't have that information" instead of hallucinating.
 *
 * @param query     - The fan's raw query string (any language).
 * @param entries   - The full FAQ knowledge base array.
 * @param topN      - Maximum number of results to return (default 3).
 * @param minScore  - Minimum relevance score to include a result (default 2).
 * @returns Ordered array of relevant FaqEntry objects (highest score first).
 *
 * @example
 * const results = retrieveRelevantFaqs("accessible toilet wheelchair", allFaqs);
 * // Returns entries about accessible restrooms and accessibility info
 */
export function retrieveRelevantFaqs(
  query: string,
  entries: FaqEntry[],
  topN: number = 3,
  minScore: number = 2
): FaqEntry[] {
  // Guard: empty query returns nothing
  if (!query.trim()) return [];

  const queryTokens = tokenize(query);

  // Score all entries and filter below threshold
  const scored = entries
    .map((entry) => ({ entry, score: scoreFaqEntry(queryTokens, entry) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score);

  // Return the top N most relevant entries
  return scored.slice(0, topN).map(({ entry }) => entry);
}

/**
 * Formats an array of FAQ entries into a single grounding context string
 * suitable for inclusion in a Gemini prompt. Each entry is separated by
 * a clear delimiter so the model can distinguish between different sources.
 *
 * @param entries - Array of relevant FAQ entries to format.
 * @returns A formatted string of FAQ content, or an empty string if no entries.
 */
export function formatFaqContext(entries: FaqEntry[]): string {
  if (entries.length === 0) return '';

  return entries
    .map((e) => `[${e.topic.toUpperCase()}] ${e.answer_en}`)
    .join('\n---\n');
}
