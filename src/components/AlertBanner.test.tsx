import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';
import type { LiveEvent } from '../types';

const mockEvent: LiveEvent = {
  id: 'evt-1',
  type: 'congestion',
  severity: 'high',
  zone: 'gate-3',
  message: 'Heavy gate congestion, please use Gate 4.',
  updatedAt: new Date().toISOString(),
};

describe('AlertBanner Component', () => {
  it('renders alert message and correct icon', () => {
    const handleDismiss = vi.fn();
    render(<AlertBanner event={mockEvent} onDismiss={handleDismiss} />);
    
    expect(screen.getByText(/Heavy gate congestion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/High severity alert/i)).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const handleDismiss = vi.fn();
    render(<AlertBanner event={mockEvent} onDismiss={handleDismiss} />);
    
    const closeBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeBtn);
    
    expect(handleDismiss).toHaveBeenCalledWith('evt-1');
  });
});
