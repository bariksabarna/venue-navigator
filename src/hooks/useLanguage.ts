/**
 * @fileoverview Custom hook for language detection and management.
 *
 * Tracks the currently detected language from Gemini intent parsing
 * and exposes it for display in the LanguageIndicator component.
 * Language detection is automatic — the fan never needs to select a language.
 *
 * @module useLanguage
 */

import { useState, useCallback } from 'react';

/** Well-known BCP 47 language codes with display names */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  pt: 'Português',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  it: 'Italiano',
  ru: 'Русский',
};

/**
 * Return type for the useLanguage hook.
 */
export interface UseLanguageReturn {
  /** Current BCP 47 language code (e.g. "en", "hi") */
  language: string;
  /** Human-readable display name for the current language */
  languageDisplayName: string;
  /** Update the detected language (called after Gemini intent parsing) */
  setDetectedLanguage: (lang: string) => void;
}

/**
 * Hook that tracks the currently detected language from the fan's queries.
 * Defaults to English. Language is updated after each Gemini intent parse.
 *
 * @returns Language state and setter.
 */
export function useLanguage(): UseLanguageReturn {
  const [language, setLanguage] = useState<string>('en');

  /**
   * Updates the detected language code.
   * Normalizes by taking only the primary language subtag (e.g. "zh-TW" → "zh").
   *
   * @param lang - BCP 47 language code from the model's intent output.
   */
  const setDetectedLanguage = useCallback((lang: string) => {
    // Take only the primary subtag for display purposes
    const primary = lang.split('-')[0].toLowerCase();
    setLanguage(primary);
  }, []);

  const languageDisplayName = LANGUAGE_NAMES[language] ?? language.toUpperCase();

  return { language, languageDisplayName, setDetectedLanguage };
}
