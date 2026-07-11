/**
 * @fileoverview Unique identifier generation utility.
 *
 * Provides a cryptographically secure random UUID generator (RFC 4122 v4)
 * with a Math.random fallback for environments where crypto is not defined.
 *
 * @module uuid
 */

/**
 * Generates a RFC 4122 v4 UUID string.
 * Uses crypto.randomUUID() when available, falls back to Math.random.
 *
 * @returns A unique UUID string.
 */
export function v4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
