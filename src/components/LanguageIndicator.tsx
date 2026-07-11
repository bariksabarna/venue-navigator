/**
 * LanguageIndicator Component
 *
 * Shows the currently auto-detected language as a small pill badge in the header.
 * Updates after each Gemini intent parse. Provides visual confirmation that
 * the multilingual detection is active.
 *
 * @component
 * @param {string} props.language        - BCP 47 language code (e.g. "hi").
 * @param {string} props.displayName     - Human-readable language name.
 */

interface LanguageIndicatorProps {
  language: string;
  displayName: string;
}

/**
 * LanguageIndicator renders a small pill showing the active language.
 */
export function LanguageIndicator({ language, displayName }: LanguageIndicatorProps) {
  return (
    <div
      className="lang-indicator"
      aria-label={`Detected language: ${displayName}`}
      title={`Auto-detected language: ${displayName}`}
    >
      <span className="lang-dot" aria-hidden="true" />
      <span aria-live="polite" aria-atomic="true">
        {/* Screen readers get language code + name; visually we show name only */}
        <span className="visually-hidden">Language: </span>
        {displayName}
        <span className="visually-hidden"> ({language})</span>
      </span>
    </div>
  );
}
