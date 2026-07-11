import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibilityProfile } from './useAccessibilityProfile';

describe('useAccessibilityProfile hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useAccessibilityProfile());
    expect(result.current.prefs.profile).toBe('none');
    expect(result.current.prefs.highContrast).toBe(false);
    expect(result.current.prefs.largeText).toBe(false);
    expect(result.current.prefs.voiceOutput).toBe(false);
    expect(result.current.requiresStepFree).toBe(false);
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
  });
});
