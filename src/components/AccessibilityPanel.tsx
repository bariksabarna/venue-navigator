/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
/**
 * AccessibilityPanel Component
 *
 * Modal panel for setting the fan's accessibility profile and UI preferences.
 * Changes are persisted to localStorage via the useAccessibilityProfile hook.
 * The panel traps focus when open (keyboard accessibility, SRS §9).
 * Profile selection changes both route constraints and UI appearance.
 *
 * @component
 * @param {boolean}  props.isOpen   - Whether the panel is visible.
 * @param {Function} props.onClose  - Called when the panel should close.
 * @param {object}   props.prefs    - Current accessibility preferences.
 * @param {Function} props.setProfile       - Sets the accessibility profile.
 * @param {Function} props.toggleHighContrast - Toggles high-contrast theme.
 * @param {Function} props.toggleLargeText    - Toggles large text mode.
 * @param {Function} props.toggleVoiceOutput  - Toggles TTS voice output.
 */

import { useEffect, useRef } from 'react';
import type { AccessibilityPrefs, AccessibilityProfile } from '../types';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: AccessibilityPrefs;
  setProfile: (p: AccessibilityProfile) => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleVoiceOutput: () => void;
}

/** Profile options displayed in the selection grid */
const PROFILES: { id: AccessibilityProfile; icon: string; label: string; description: string }[] = [
  { id: 'none',             icon: '👤', label: 'None',            description: 'Standard mode' },
  { id: 'wheelchair',       icon: '♿', label: 'Wheelchair',       description: 'Step-free routes' },
  { id: 'low_vision',       icon: '👁️', label: 'Low Vision',      description: 'High contrast + TTS' },
  { id: 'deaf_hoh',         icon: '🦻', label: 'Deaf / HoH',      description: 'Captions, no voice' },
  { id: 'cognitive_sensory',icon: '🧠', label: 'Cognitive/Sensory',description: 'Simple language' },
];

/**
 * AccessibilityPanel renders a modal for choosing accessibility profile and UI options.
 */
export function AccessibilityPanel({
  isOpen, onClose, prefs, setProfile, toggleHighContrast, toggleLargeText, toggleVoiceOutput,
}: AccessibilityPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when panel opens
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="a11y-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="a11y-panel-inner">
        <div className="a11y-panel-header">
          <h2 id="a11y-panel-title" className="a11y-panel-title">
            ♿ Accessibility Settings
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Your profile is saved automatically and affects routes, UI, and language style.
        </p>

        <fieldset style={{ border: 'none' }}>
          <legend style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            Accessibility Profile
          </legend>
          <div className="profile-grid">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`profile-btn${prefs.profile === p.id ? ' active' : ''}`}
                onClick={() => setProfile(p.id)}
                aria-pressed={prefs.profile === p.id}
              >
                <span className="profile-icon" aria-hidden="true">{p.icon}</span>
                <strong>{p.label}</strong>
                <span style={{ color: 'var(--color-text-muted)' }}>{p.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="toggle-row">
          <span className="toggle-label">🎨 High Contrast</span>
          <label className="toggle" aria-label="Toggle high contrast theme">
            <input type="checkbox" checked={prefs.highContrast} onChange={toggleHighContrast} />
            <span className="toggle-track" aria-hidden="true" />
            <span className="toggle-thumb" aria-hidden="true" />
          </label>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">🔡 Large Text</span>
          <label className="toggle" aria-label="Toggle large text mode">
            <input type="checkbox" checked={prefs.largeText} onChange={toggleLargeText} />
            <span className="toggle-track" aria-hidden="true" />
            <span className="toggle-thumb" aria-hidden="true" />
          </label>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">🔊 Voice Output (TTS)</span>
          <label className="toggle" aria-label="Toggle text-to-speech voice output">
            <input type="checkbox" checked={prefs.voiceOutput} onChange={toggleVoiceOutput} />
            <span className="toggle-track" aria-hidden="true" />
            <span className="toggle-thumb" aria-hidden="true" />
          </label>
        </div>
      </div>
    </div>
  );
}
