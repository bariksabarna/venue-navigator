import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapView } from './MapView';
import type { PathResult } from '../types';

const mockRoute: PathResult = {
  path: ['gate-4', 'concourse-w', 'restroom-a'],
  totalDistance: 120,
};

describe('MapView Component', () => {
  it('renders SVG element and map labels', () => {
    render(<MapView route={null} routeLabels={[]} liveEvents={[]} />);
    expect(screen.getByRole('img', { name: /Stadium venue map/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate 4/i)).toBeInTheDocument();
  });

  it('displays the route distance when route is active', () => {
    render(<MapView route={mockRoute} routeLabels={['Gate 4', 'Concourse W', 'Restroom A']} liveEvents={[]} />);
    expect(screen.getByText(/Route: ~120m walk/i)).toBeInTheDocument();
  });
});
