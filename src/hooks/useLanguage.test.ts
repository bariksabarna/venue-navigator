import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanguage } from './useLanguage';

describe('useLanguage hook', () => {
  it('initializes to English', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe('en');
    expect(result.current.languageDisplayName).toBe('English');
  });

  it('updates detected language code and normalizes subtag', () => {
    const { result } = renderHook(() => useLanguage());
    act(() => {
      result.current.setDetectedLanguage('hi-IN');
    });
    expect(result.current.language).toBe('hi');
    expect(result.current.languageDisplayName).toBe('हिंदी');
  });

  it('falls back to capitalized code for unknown language', () => {
    const { result } = renderHook(() => useLanguage());
    act(() => {
      result.current.setDetectedLanguage('xyz');
    });
    expect(result.current.language).toBe('xyz');
    expect(result.current.languageDisplayName).toBe('XYZ');
  });
});
