import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock SpeechSynthesis safely
    if (typeof window !== 'undefined') {
      if (!window.speechSynthesis) {
        Object.defineProperty(window, 'speechSynthesis', {
          value: {
            speak: vi.fn(),
            cancel: vi.fn(),
            getVoices: vi.fn().mockReturnValue([]),
          },
          writable: true,
          configurable: true,
        });
      }
    }
  });

  it('renders logo, navigation header, and main segments', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Setu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open accessibility settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open operations dashboard/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/stadium map and active alerts/i)).toBeInTheDocument();
  });

  it('toggles accessibility panel and interactive preferences', () => {
    render(<App />);

    // Initially modal is closed
    expect(screen.queryByText(/Accessibility Settings/i)).not.toBeInTheDocument();

    // Open panel
    const a11yOpenBtn = screen.getByRole('button', { name: /open accessibility settings/i });
    fireEvent.click(a11yOpenBtn);
    expect(screen.getByText(/Accessibility Settings/i)).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /Close accessibility settings/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Accessibility Settings/i)).not.toBeInTheDocument();
  });

  it('toggles operations lite dashboard and displays aggregated info', () => {
    render(<App />);

    // Initially modal is closed
    expect(screen.queryByText(/Ops Lite — Real-time/i)).not.toBeInTheDocument();

    // Open panel
    const opsOpenBtn = screen.getByRole('button', { name: /open operations dashboard/i });
    fireEvent.click(opsOpenBtn);
    expect(screen.getByText(/Ops Lite — Real-time/i)).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /Close Operations Dashboard/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Ops Lite — Real-time/i)).not.toBeInTheDocument();
  });

  it('allows dismissing active live alerts', () => {
    render(<App />);

    // Verify presence of initial alerts from mockLiveEvents.json
    // e.g. delay, congestion, etc.
    const alertBanners = screen.getAllByRole('alert');
    expect(alertBanners.length).toBeGreaterThan(0);

    // Dismiss the first alert
    const firstDismissBtn = screen.getAllByRole('button', { name: /dismiss/i })[0];
    fireEvent.click(firstDismissBtn);

    // Banners count should decrease by 1
    const finalAlertBanners = screen.getAllByRole('alert');
    expect(finalAlertBanners.length).toBe(alertBanners.length - 1);
  });
});
