/**
 * @fileoverview Custom hook for persisting and reading accessibility preferences.
 *
 * Stores the fan's accessibility profile in localStorage so it persists
 * across sessions. The profile drives both the route constraint (step-free)
 * and UI adaptations (contrast, text size, voice output).
 *
 * This satisfies FR-3 from the SRS.
 *
 * @module useAccessibilityProfile
 */

import { useState, useCallback } from 'react';
import type { AccessibilityPrefs, AccessibilityProfile } from '../types';

/** localStorage key for persisting accessibility preferences */
const STORAGE_KEY = 'setu-accessibility-prefs';

/**
 * Default accessibility preferences (no assistive modes active).
 */
const DEFAULT_PREFS: AccessibilityPrefs = {
  profile: 'none',
  highContrast: false,
  largeText: false,
  voiceOutput: false,
};

/**
 * Reads and parses accessibility preferences from localStorage.
 * Falls back to defaults on parse error or missing data.
 *
 * @returns Parsed AccessibilityPrefs or defaults.
 */
function loadPrefs(): AccessibilityPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(stored) as Partial<AccessibilityPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Return type for the useAccessibilityProfile hook.
 */
export interface UseAccessibilityProfileReturn {
  /** Current accessibility preferences */
  prefs: AccessibilityPrefs;
  /** Update the accessibility profile preset and derive appropriate defaults */
  setProfile: (profile: AccessibilityProfile) => void;
  /** Toggle high-contrast visual theme */
  toggleHighContrast: () => void;
  /** Toggle large-text mode */
  toggleLargeText: () => void;
  /** Toggle voice output (TTS) */
  toggleVoiceOutput: () => void;
  /** Whether step-free route constraint is currently active */
  requiresStepFree: boolean;
}

/**
 * Hook that manages accessibility preferences with localStorage persistence.
 * Preference changes are immediately reflected in the returned `prefs` object
 * and persisted so they survive page refreshes.
 *
 * Usage:
 * ```tsx
 * const { prefs, setProfile, requiresStepFree } = useAccessibilityProfile();
 * ```
 *
 * @returns AccessibilityProfile state and mutation helpers.
 */
export function useAccessibilityProfile(): UseAccessibilityProfileReturn {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(loadPrefs);

  /**
   * Persists updated preferences to both state and localStorage.
   *
   * @param updated - The new preferences to save.
   */
  const persist = useCallback((updated: AccessibilityPrefs) => {
    setPrefs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage may be full or blocked; silently continue
    }
  }, []);

  /**
   * Sets the accessibility profile preset and derives appropriate defaults.
   * For example, 'wheelchair' automatically enables step-free routing;
   * 'low_vision' defaults to high-contrast and large text.
   *
   * @param profile - The new accessibility profile to apply.
   */
  const setProfile = useCallback((profile: AccessibilityProfile) => {
    const updated: AccessibilityPrefs = {
      ...prefs,
      profile,
      // Derive sensible defaults from the selected profile
      highContrast: profile === 'low_vision' || prefs.highContrast,
      largeText: profile === 'low_vision' || profile === 'cognitive_sensory' || prefs.largeText,
      voiceOutput: profile === 'low_vision' || prefs.voiceOutput,
    };
    persist(updated);
  }, [prefs, persist]);

  const toggleHighContrast = useCallback(() => {
    persist({ ...prefs, highContrast: !prefs.highContrast });
  }, [prefs, persist]);

  const toggleLargeText = useCallback(() => {
    persist({ ...prefs, largeText: !prefs.largeText });
  }, [prefs, persist]);

  const toggleVoiceOutput = useCallback(() => {
    persist({ ...prefs, voiceOutput: !prefs.voiceOutput });
  }, [prefs, persist]);

  // Step-free routing is required for wheelchair and low-vision profiles
  const requiresStepFree = prefs.profile === 'wheelchair' || prefs.profile === 'low_vision';

  return { prefs, setProfile, toggleHighContrast, toggleLargeText, toggleVoiceOutput, requiresStepFree };
}
