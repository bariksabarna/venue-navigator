/**
 * @fileoverview Unit tests for the sanitization module.
 * Tests: input sanitization, output sanitization, and HTML conversion.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeOutput, textToSafeHtml, MAX_INPUT_LENGTH } from '../lib/sanitize';

describe('sanitizeInput', () => {
  it('returns the input unchanged for normal safe text', () => {
    expect(sanitizeInput('Where is Gate 4?')).toBe('Where is Gate 4?');
  });

  it('strips control characters (ASCII < 32)', () => {
    // Use String.fromCharCode to avoid the no-control-regex lint rule
    const nullChar = String.fromCharCode(0);
    const bell = String.fromCharCode(7);
    const tab = String.fromCharCode(9); // tab is 9, below 32 but above 31
    const result = sanitizeInput(`Hello${nullChar}${bell}${tab}World`);
    // null and bell should be stripped; space (32) is kept
    expect(result).not.toContain(nullChar);
    expect(result).not.toContain(bell);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('enforces MAX_INPUT_LENGTH by truncating long strings', () => {
    const long = 'a'.repeat(MAX_INPUT_LENGTH + 100);
    const result = sanitizeInput(long);
    expect(result.length).toBe(MAX_INPUT_LENGTH);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('sanitizeOutput', () => {
  it('passes through safe plain text unchanged', () => {
    const text = 'Please walk to Gate 4.';
    expect(sanitizeOutput(text)).toBe(text);
  });

  it('strips script tags from model output', () => {
    const malicious = "<script>alert('xss')</script>Hello!";
    const result = sanitizeOutput(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello!');
  });

  it('strips onclick and other event attributes', () => {
    const malicious = '<b onclick="stealCookies()">Click me</b>';
    const result = sanitizeOutput(malicious);
    expect(result).not.toContain('onclick');
  });

  it('preserves allowed formatting tags like <b> and <em>', () => {
    const formatted = '<b>Turn left</b> at the <em>concourse</em>';
    const result = sanitizeOutput(formatted);
    expect(result).toContain('<b>');
    expect(result).toContain('<em>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeOutput('')).toBe('');
  });
});

describe('textToSafeHtml', () => {
  it('wraps text in paragraph tags', () => {
    const result = textToSafeHtml('Hello world');
    expect(result).toContain('<p>');
    expect(result).toContain('</p>');
  });

  it('converts double newlines to paragraph breaks', () => {
    const result = textToSafeHtml('Line one\n\nLine two');
    expect(result).toContain('</p><p>');
  });

  it('converts single newlines to line breaks', () => {
    const result = textToSafeHtml('Line one\nLine two');
    expect(result).toContain('<br>');
  });

  it('escapes HTML special characters in the input', () => {
    const result = textToSafeHtml('<script>bad</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
  });
});
