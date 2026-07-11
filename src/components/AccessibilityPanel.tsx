/**
 * @fileoverview AccessibilityPanel Component.
 *
 * Modal panel for setting the fan's accessibility profile and UI preferences.
 * Changes are persisted to localStorage via the useAccessibilityProfile hook.
 * The panel traps focus when open (keyboard accessibility, SRS §9).
 * Profile selection changes both route constraints and UI appearance.
 *
 * @module AccessibilityPanel
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
 *
 * Includes keyboard accessibility: focus-trap, close on Escape, autofocus on open.
 */
export function AccessibilityPanel({
  isOpen, onClose, prefs, setProfile, toggleHighContrast, toggleLargeText, toggleVoiceOutput,
}: AccessibilityPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when panel opens
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="a11y-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
    >
      {/* Backdrop: a real <button> so keyboard/pointer closing is accessible */}
      <button
        type="button"
        className="a11y-backdrop"
        aria-label="Dismiss accessibility settings"
        onClick={onClose}
        tabIndex={-1}
      />
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

        <p className="a11y-panel-desc">
          Your profile is saved automatically and affects routes, UI, and language style.
        </p>

        <fieldset className="a11y-fieldset">
          <legend className="a11y-legend">
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
                <span className="profile-desc">{p.description}</span>
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
