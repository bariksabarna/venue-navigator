import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibilityProfile } from './useAccessibilityProfile';

describe('useAccessibilityProfile hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useAccessibilityProfile());
    expect(result.current.prefs.profile).toBe('none');
    expect(result.current.prefs.highContrast).toBe(false);
    expect(result.current.prefs.largeText).toBe(false);
    expect(result.current.prefs.voiceOutput).toBe(false);
    expect(result.current.requiresStepFree).toBe(false);
  });

  it('loads existing valid preferences from localStorage', () => {
    const saved = {
      profile: 'deaf_hoh',
      highContrast: true,
      largeText: false,
      voiceOutput: false,
    };
    localStorage.setItem('setu-accessibility-prefs', JSON.stringify(saved));

    const { result } = renderHook(() => useAccessibilityProfile());
    expect(result.current.prefs.profile).toBe('deaf_hoh');
    expect(result.current.prefs.highContrast).toBe(true);
  });

  it('falls back to default preferences on JSON parse error', () => {
    localStorage.setItem('setu-accessibility-prefs', 'invalid-json-{');

    const { result } = renderHook(() => useAccessibilityProfile());
    expect(result.current.prefs.profile).toBe('none');
  });

  it('updates profile and derives correct options (wheelchair)', () => {
    const { result } = renderHook(() => useAccessibilityProfile());
    act(() => {
      result.current.setProfile('wheelchair');
    });
    expect(result.current.prefs.profile).toBe('wheelchair');
    expect(result.current.requiresStepFree).toBe(true);
  });

  it('updates profile and derives correct options (low_vision)', () => {
    const { result } = renderHook(() => useAccessibilityProfile());
    act(() => {
      result.current.setProfile('low_vision');
    });
    expect(result.current.prefs.profile).toBe('low_vision');
    expect(result.current.prefs.highContrast).toBe(true);
    expect(result.current.prefs.largeText).toBe(true);
    expect(result.current.prefs.voiceOutput).toBe(true);
    expect(result.current.requiresStepFree).toBe(true);
  });

  it('toggles visual theme options independently', () => {
    const { result } = renderHook(() => useAccessibilityProfile());
    act(() => {
      result.current.toggleHighContrast();
    });
    expect(result.current.prefs.highContrast).toBe(true);
    act(() => {
      result.current.toggleLargeText();
    });
    expect(result.current.prefs.largeText).toBe(true);
    act(() => {
      result.current.toggleVoiceOutput();
    });
    expect(result.current.prefs.voiceOutput).toBe(true);
  });

  it('gracefully handles localStorage.setItem quota errors', () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useAccessibilityProfile());
    act(() => {
      result.current.toggleHighContrast();
    });

    // High Contrast state should still update in memory
    expect(result.current.prefs.highContrast).toBe(true);
    expect(setItemSpy).toHaveBeenCalled();
  });
});
