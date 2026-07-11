import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpsLiteDashboard } from './OpsLiteDashboard';

describe('OpsLiteDashboard Component', () => {
  it('renders stats when open', () => {
    render(<OpsLiteDashboard isOpen={true} onClose={vi.fn()} messages={[]} />);
    expect(screen.getByText(/Ops Lite/i)).toBeInTheDocument();
    expect(screen.getByText(/Topic: Congestion/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<OpsLiteDashboard isOpen={false} onClose={vi.fn()} messages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<OpsLiteDashboard isOpen={true} onClose={handleClose} messages={[]} />);

    const closeBtn = screen.getByRole('button', { name: /Close Operations Dashboard/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(<OpsLiteDashboard isOpen={true} onClose={handleClose} messages={[]} />);

    const backdrop = screen.getByLabelText('Dismiss operations dashboard');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<OpsLiteDashboard isOpen={true} onClose={handleClose} messages={[]} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('tallies keywords from messages correctly', () => {
    const testMessages = [
      { content: 'Is there a long crowd or congestion at the entrance?', timestamp: new Date().toISOString() },
      { content: 'Where do I scan my QR code or ticket?', timestamp: new Date().toISOString() },
      { content: 'I need food and a water bottle.', timestamp: new Date().toISOString() },
      { content: 'Is this area wheelchair accessible?', timestamp: new Date().toISOString() },
    ];

    render(<OpsLiteDashboard isOpen={true} onClose={vi.fn()} messages={testMessages} />);

    // Baseline congestion is 18 + 1 = 19
    expect(screen.getByText('19')).toBeInTheDocument();
    // Baseline tickets is 24 + 1 = 25
    expect(screen.getByText('25')).toBeInTheDocument();
    // Baseline amenities is 32 + 1 = 33
    expect(screen.getByText('33')).toBeInTheDocument();
    // Baseline accessibility is 12 + 1 = 13
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('focuses close button upon opening and traps tab focus', () => {
    render(
      <div>
        <button data-testid="external-btn">External</button>
        <OpsLiteDashboard isOpen={true} onClose={vi.fn()} messages={[]} />
      </div>
    );

    const closeBtn = screen.getByRole('button', { name: /Close Operations Dashboard/i });
    expect(document.activeElement).toBe(closeBtn);

    // Simulate Tab key focus trapping
    const focusable = screen.getAllByRole('button');
    const last = focusable[focusable.length - 1]; // last button is last card or close button

    // Tab on last element should cycle back to first focusable element
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab', shiftKey: false });
    // First focusable element inside the modal should have focus (which is the close button, since backdrop has tabIndex={-1})
    expect(document.activeElement).toBe(closeBtn);
  });
});
