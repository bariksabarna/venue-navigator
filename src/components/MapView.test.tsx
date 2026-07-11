import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapView } from './MapView';
import type { PathResult, LiveEvent } from '../types';

const mockRoute: PathResult = {
  path: ['gate-4', 'concourse-w', 'restroom-a'],
  totalDistance: 120,
};

const mockLiveEvents: LiveEvent[] = [
  {
    id: 'evt-1',
    type: 'congestion',
    zone: 'sec-101',
    severity: 'high',
    message: 'Congestion near Section 101',
    updatedAt: new Date().toISOString(),
  },
];

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

  it('dispatches set-chat-input event when node is clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<MapView route={null} routeLabels={[]} liveEvents={[]} />);

    // Click the first node button
    const nodeButtons = screen.getAllByRole('button');
    expect(nodeButtons.length).toBeGreaterThan(0);
    fireEvent.click(nodeButtons[0]);

    // Check that a CustomEvent was dispatched
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe('set-chat-input');
    dispatchSpy.mockRestore();
  });

  it('dispatches set-chat-input event on Enter key press', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<MapView route={null} routeLabels={[]} liveEvents={[]} />);

    const nodeButtons = screen.getAllByRole('button');
    fireEvent.keyDown(nodeButtons[0], { key: 'Enter' });

    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe('set-chat-input');
    dispatchSpy.mockRestore();
  });

  it('dispatches set-chat-input event on Space key press', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<MapView route={null} routeLabels={[]} liveEvents={[]} />);

    const nodeButtons = screen.getAllByRole('button');
    fireEvent.keyDown(nodeButtons[0], { key: ' ' });

    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('does not dispatch event on irrelevant key press', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<MapView route={null} routeLabels={[]} liveEvents={[]} />);

    const nodeButtons = screen.getAllByRole('button');
    fireEvent.keyDown(nodeButtons[0], { key: 'Escape' });

    // dispatchEvent should NOT have been called for Escape
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  it('renders with live events showing congestion indicator', () => {
    render(<MapView route={null} routeLabels={[]} liveEvents={mockLiveEvents} />);
    // The congestion zone node (sec-101) should have a congestion aria label
    const congestedNode = screen.getByRole('button', { name: /high congestion/i });
    expect(congestedNode).toBeInTheDocument();
  });
});
