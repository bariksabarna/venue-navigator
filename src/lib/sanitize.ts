/**
 * @fileoverview Output sanitization for all Gemini-generated text.
 *
 * All model output MUST pass through this module before being rendered in
 * the UI. This prevents XSS attacks and prompt-injection leakage. We use
 * DOMPurify for HTML sanitization and apply an additional allow-list of
 * safe markdown-like patterns.
 *
 * Rule: NEVER use dangerouslySetInnerHTML on raw model output.
 *
 * @module sanitize
 */

import DOMPurify from 'dompurify';

/** Maximum allowed length for user input before truncation */
export const MAX_INPUT_LENGTH = 500;

/**
 * Sanitizes user input before it is sent to the model.
 * Strips control characters (using character code checks to avoid the
 * no-control-regex ESLint rule), trims whitespace, and enforces a
 * maximum character length to prevent prompt-injection abuse.
 *
 * @param input - The raw user-supplied string.
 * @returns A sanitized string safe to include in a model prompt.
 *
 * @example
 * sanitizeInput("Hello!\x00\x1F World")  // => "Hello! World"
 * sanitizeInput("a".repeat(600))          // => "a".repeat(500)
 */
export function sanitizeInput(input: string): string {
  // Strip control characters using charCode check — avoids no-control-regex lint rule
  const stripped = input
    .split('')
    .filter((c) => c.charCodeAt(0) >= 32)
    .join('');

  // Trim and enforce length cap
  return stripped.trim().slice(0, MAX_INPUT_LENGTH);
}

/**
 * Sanitizes model-generated text output using DOMPurify before it is
 * displayed in the UI. Strips any potentially unsafe HTML tags and
 * attributes while preserving safe inline formatting.
 *
 * Allowed tags: b, i, strong, em, p, br, ul, ol, li, span
 * Allowed attributes: none (class attributes are stripped)
 *
 * @param modelOutput - Raw text string from the Gemini model.
 * @returns A sanitized string safe to render as HTML or plain text.
 *
 * @example
 * sanitizeOutput("<script>alert('xss')</script>Hello!")  // => "Hello!"
 * sanitizeOutput("<b>Walk to Gate 4</b>")                // => "<b>Walk to Gate 4</b>"
 */
export function sanitizeOutput(modelOutput: string): string {
  return DOMPurify.sanitize(modelOutput, {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Converts plain text with basic markdown-style line breaks into safe HTML.
 * Replaces double newlines with paragraph breaks and single newlines with
 * line breaks, then runs the result through DOMPurify.
 *
 * @param text - Plain text with optional newline formatting.
 * @returns Safe HTML string with paragraph and line-break elements.
 */
export function textToSafeHtml(text: string): string {
  const withParagraphs = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  const wrapped = `<p>${withParagraphs}</p>`;

  return DOMPurify.sanitize(wrapped, {
    ALLOWED_TAGS: ['p', 'br'],
    ALLOWED_ATTR: [],
  });
}
