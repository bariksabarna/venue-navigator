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

describe('AccessibilityPanel Component', () => {
  it('renders modal when open', () => {
    const handleClose = vi.fn();
    const handleSetProfile = vi.fn();
    const handleToggleContrast = vi.fn();
    const handleToggleText = vi.fn();
    const handleToggleVoice = vi.fn();

    render(
      <AccessibilityPanel
        isOpen={true}
        onClose={handleClose}
        prefs={mockPrefs}
        setProfile={handleSetProfile}
        toggleHighContrast={handleToggleContrast}
        toggleLargeText={handleToggleText}
        toggleVoiceOutput={handleToggleVoice}
      />
    );

    expect(screen.getByText(/Accessibility Settings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wheelchair/i })).toBeInTheDocument();
  });

  it('calls setProfile when active profile is selected', () => {
    const handleClose = vi.fn();
    const handleSetProfile = vi.fn();
    const handleToggleContrast = vi.fn();
    const handleToggleText = vi.fn();
    const handleToggleVoice = vi.fn();

    render(
      <AccessibilityPanel
        isOpen={true}
        onClose={handleClose}
        prefs={mockPrefs}
        setProfile={handleSetProfile}
        toggleHighContrast={handleToggleContrast}
        toggleLargeText={handleToggleText}
        toggleVoiceOutput={handleToggleVoice}
      />
    );

    const wcBtn = screen.getByRole('button', { name: /wheelchair/i });
    fireEvent.click(wcBtn);
    expect(handleSetProfile).toHaveBeenCalledWith('wheelchair');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AccessibilityPanel
        isOpen={false}
        onClose={vi.fn()}
        prefs={mockPrefs}
        setProfile={vi.fn()}
        toggleHighContrast={vi.fn()}
        toggleLargeText={vi.fn()}
        toggleVoiceOutput={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
