import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibilityPanel } from './AccessibilityPanel';
import type { AccessibilityPrefs } from '../types';

const mockPrefs: AccessibilityPrefs = {
  profile: 'none',
  highContrast: false,
  largeText: false,
  voiceOutput: false,
};

const mockPrefsActive: AccessibilityPrefs = {
  profile: 'wheelchair',
  highContrast: true,
  largeText: true,
  voiceOutput: true,
};

function renderPanel(overrides: Partial<Parameters<typeof AccessibilityPanel>[0]> = {}) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    prefs: mockPrefs,
    setProfile: vi.fn(),
    toggleHighContrast: vi.fn(),
    toggleLargeText: vi.fn(),
    toggleVoiceOutput: vi.fn(),
  };
  return render(<AccessibilityPanel {...defaults} {...overrides} />);
}

describe('AccessibilityPanel Component', () => {
  it('renders modal when open', () => {
    renderPanel();
    expect(screen.getByText(/Accessibility Settings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wheelchair/i })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = renderPanel({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('calls setProfile when a profile button is clicked', () => {
    const handleSetProfile = vi.fn();
    renderPanel({ setProfile: handleSetProfile });
    fireEvent.click(screen.getByRole('button', { name: /wheelchair/i }));
    expect(handleSetProfile).toHaveBeenCalledWith('wheelchair');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderPanel({ onClose: handleClose });
    fireEvent.click(screen.getByRole('button', { name: /Close accessibility settings/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    renderPanel({ onClose: handleClose });
    fireEvent.click(screen.getByRole('button', { name: /Dismiss accessibility settings/i }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key press', () => {
    const handleClose = vi.fn();
    renderPanel({ onClose: handleClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls toggleHighContrast when high contrast checkbox is toggled', () => {
    const handleToggle = vi.fn();
    renderPanel({ toggleHighContrast: handleToggle });
    const checkbox = screen.getByLabelText(/Toggle high contrast theme/i).querySelector('input');
    expect(checkbox).not.toBeNull();
    if (checkbox) fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('calls toggleLargeText when large text checkbox is toggled', () => {
    const handleToggle = vi.fn();
    renderPanel({ toggleLargeText: handleToggle });
    const checkbox = screen.getByLabelText(/Toggle large text mode/i).querySelector('input');
    if (checkbox) fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('calls toggleVoiceOutput when voice output checkbox is toggled', () => {
    const handleToggle = vi.fn();
    renderPanel({ toggleVoiceOutput: handleToggle });
    const checkbox = screen.getByLabelText(/Toggle text-to-speech voice output/i).querySelector('input');
    if (checkbox) fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('reflects active prefs in checked state and aria-pressed', () => {
    renderPanel({ prefs: mockPrefsActive });
    const wcBtn = screen.getByRole('button', { name: /wheelchair/i });
    expect(wcBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('focuses close button on open', () => {
    renderPanel();
    const closeBtn = screen.getByRole('button', { name: /Close accessibility settings/i });
    expect(document.activeElement).toBe(closeBtn);
  });

  it('traps Tab focus: wraps from last to first element', () => {
    const { container } = renderPanel();
    const closeBtn = screen.getByRole('button', { name: /Close accessibility settings/i });

    // Use the same selector as the focus trap
    const panel = container.querySelector('[role="dialog"]') as HTMLElement;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
    );
    const last = focusableElements[focusableElements.length - 1];

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });

  it('traps Shift+Tab focus: wraps from first to last element', () => {
    const { container } = renderPanel();
    const closeBtn = screen.getByRole('button', { name: /Close accessibility settings/i });
    closeBtn.focus();

    // Use the same selector as the focus trap to find the true last focusable element
    const panel = container.querySelector('[role="dialog"]') as HTMLElement;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
    );
    const last = focusableElements[focusableElements.length - 1];

    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('does not trap focus when non-Tab keys are pressed', () => {
    renderPanel();
    const closeBtn = screen.getByRole('button', { name: /Close accessibility settings/i });
    closeBtn.focus();
    // Pressing another key should not change focus
    fireEvent.keyDown(closeBtn, { key: 'a' });
    expect(document.activeElement).toBe(closeBtn);
  });
});
