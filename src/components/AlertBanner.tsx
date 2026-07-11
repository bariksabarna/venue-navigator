/**
 * AlertBanner Component
 *
 * Displays a single live venue alert (congestion, weather, delay, announcement).
 * Severity is indicated by border colour and icon. Dismissible via close button.
 * Colour is never the sole indicator — icon + text both convey severity (WCAG 1.4.1).
 *
 * @component
 * @param {LiveEvent} props.event    - The live event data to display.
 * @param {Function}  props.onDismiss - Called when the user closes this banner.
 */

import type { LiveEvent } from '../types';

interface AlertBannerProps {
  event: LiveEvent;
  onDismiss: (id: string) => void;
}

/** Maps event severity to an accessible icon + aria label */
const SEVERITY_ICONS: Record<string, { icon: string; label: string }> = {
  high:   { icon: '🔴', label: 'High severity alert' },
  medium: { icon: '🟡', label: 'Medium severity alert' },
  low:    { icon: '🔵', label: 'Low severity notice' },
};

/** Maps event type to a descriptive prefix for screen readers */
const TYPE_LABELS: Record<string, string> = {
  congestion:   'Congestion',
  weather:      'Weather',
  delay:        'Delay',
  announcement: 'Announcement',
  medical:      'Medical',
};

/**
 * AlertBanner renders a dismissible alert for a single live venue event.
 */
export function AlertBanner({ event, onDismiss }: AlertBannerProps) {
  const { icon, label } = SEVERITY_ICONS[event.severity] ?? SEVERITY_ICONS.low;
  const typeLabel = TYPE_LABELS[event.type] ?? event.type;

  return (
    <div
      className={`alert-banner ${event.severity}`}
      role="alert"
      aria-live="polite"
    >
      <span className="alert-banner-icon" aria-label={label} role="img">
        {icon}
      </span>
      <div>
        <strong>{typeLabel}: </strong>
        {event.message}
      </div>
      <button
        className="alert-banner-close"
        onClick={() => onDismiss(event.id)}
        aria-label={`Dismiss ${typeLabel.toLowerCase()} alert`}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
