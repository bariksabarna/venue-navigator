/**
 * @fileoverview MapView Component.
 *
 * Renders an SVG-based venue map with all nodes as labelled, interactive points.
 * When a route is computed by the pathfinder, the route path is highlighted
 * with an animated dashed stroke. Nodes along the route pulse to indicate
 * the walking direction.
 *
 * This component never computes routes — it only renders what the pathfinder provides.
 * All navigation is keyboard-accessible: nodes are focusable and have aria-labels.
 * Clicking or pressing Enter/Space on a node pre-fills the chat input.
 *
 * @module MapView
 */

import type { PathResult, LiveEvent } from '../types';
import venueGraphData from '../data/venueGraph.json';
import type { VenueGraph } from '../types';

const graph = venueGraphData as VenueGraph;

/** Colour for each node type */
const NODE_COLORS: Record<string, string> = {
  gate:     '#4a9eff',
  section:  '#22c55e',
  amenity:  '#f59e0b',
  food:     '#ec4899',
  elevator: '#a78bfa',
  exit:     '#ef4444',
};

interface MapViewProps {
  route: PathResult | null;
  routeLabels: string[];
  liveEvents: LiveEvent[];
}

/**
 * MapView renders the SVG stadium map and highlights any active route.
 */
export function MapView({ route, routeLabels, liveEvents }: MapViewProps) {
  const routeSet = new Set(route?.path ?? []);
  const congestionZones = new Set(
    liveEvents
      .filter((e) => e.type === 'congestion' && e.severity === 'high')
      .map((e) => e.zone)
  );

  // Build edge segments to render
  const edges = graph.edges.map((edge, i) => {
    const from = graph.nodes.find((n) => n.id === edge.from);
    const to   = graph.nodes.find((n) => n.id === edge.to);
    if (!from || !to) return null;

    const isRouteEdge =
      route?.path.includes(edge.from) &&
      route?.path.includes(edge.to) &&
      Math.abs(route.path.indexOf(edge.from) - route.path.indexOf(edge.to)) === 1;

    return (
      <line
        key={`edge-${i}`}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isRouteEdge ? '#ffd700' : 'rgba(74,158,255,0.15)'}
        strokeWidth={isRouteEdge ? 3 : 1.5}
        className={isRouteEdge ? 'map-route-path' : ''}
      />
    );
  });

  const handleNodeClick = (nodeLabel: string) => {
    const event = new CustomEvent('set-chat-input', { detail: `Tell me about ${nodeLabel}` });
    window.dispatchEvent(event);
  };

  return (
    <div
      className="map-container"
      role="img"
      aria-label="Stadium venue map. Route is highlighted in gold when navigation is active."
    >
      <svg
        className="map-svg"
        viewBox="0 0 700 600"
        aria-hidden="false"
        focusable="false"
      >
        {/* Decorative stadium outline */}
        <ellipse cx="300" cy="300" rx="260" ry="240" fill="none" stroke="rgba(74,158,255,0.08)" strokeWidth="40" />
        <ellipse cx="300" cy="300" rx="160" ry="140" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="6 4" />

        {/* Edges */}
        {edges}

        {/* Nodes */}
        {graph.nodes.map((node) => {
          const isOnRoute = routeSet.has(node.id);
          const isStart   = route?.path[0] === node.id;
          const isEnd     = route?.path[route.path.length - 1] === node.id;
          const isCongested = congestionZones.has(node.id);
          const color = NODE_COLORS[node.type] ?? '#8aa4c8';
          const r = isOnRoute ? 9 : 7;

          return (
            <g
              key={node.id}
              className="map-node"
              tabIndex={0}
              role="button"
              aria-label={`${node.label}${node.stepFree ? ' (step-free)' : ''}${isCongested ? ' — high congestion' : ''}${isStart ? ' — start of route' : ''}${isEnd ? ' — destination' : ''}`}
              onClick={() => handleNodeClick(node.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNodeClick(node.label);
                }
              }}
            >
              {/* Outer glow for route nodes */}
              {isOnRoute && (
                <circle cx={node.x} cy={node.y} r={r + 5} fill={isEnd ? '#ffd70030' : '#4a9eff20'} />
              )}
              {/* Congestion indicator */}
              {isCongested && (
                <circle cx={node.x} cy={node.y} r={r + 4} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={isEnd ? '#ffd700' : isStart ? '#22c55e' : color}
                stroke={isOnRoute ? '#fff' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isOnRoute ? 2 : 1}
                opacity={isOnRoute ? 1 : 0.75}
              />
              {/* Step-free indicator */}
              {node.stepFree && !isOnRoute && (
                <circle cx={node.x + r - 2} cy={node.y - r + 2} r={3} fill="#22c55e" stroke="none" />
              )}
              {/* Node label */}
              <text
                x={node.x}
                y={node.y + r + 12}
                textAnchor="middle"
                fill={isOnRoute ? '#fff' : 'rgba(232,237,245,0.6)'}
                fontSize={isOnRoute ? '9' : '8'}
                fontWeight={isOnRoute ? '600' : '400'}
              >
                {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
              </text>
            </g>
          );
        })}

        {/* Route distance label */}
        {route && (
          <g>
            <rect x="10" y="10" width="220" height="46" rx="6" fill="rgba(15,32,64,0.9)" stroke="rgba(255,215,0,0.4)" strokeWidth="1" />
            <text x="20" y="28" fill="#ffd700" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
              🗺 Route: ~{Math.round(route.totalDistance)}m walk
            </text>
            <text x="20" y="46" fill="rgba(232,237,245,0.7)" fontSize="10" fontFamily="Inter, sans-serif">
              {routeLabels.length} stops: {routeLabels.join(' → ')}
            </text>
          </g>
        )}
      </svg>

      {/* Map legend */}
      <div className="map-legend" aria-label="Map legend">
        <div className="map-legend-item">
          <span className="map-legend-dot gate" aria-hidden="true" />
          Gates
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot start" aria-hidden="true" />
          Sections / Start
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot amenity" aria-hidden="true" />
          Amenities
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot destination" aria-hidden="true" />
          Destination
        </div>
        <div className="map-legend-item">
          <span className="map-legend-dot elevator" aria-hidden="true" />
          Elevators
        </div>
      </div>
    </div>
  );
}
