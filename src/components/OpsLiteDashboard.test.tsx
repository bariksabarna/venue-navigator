import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
