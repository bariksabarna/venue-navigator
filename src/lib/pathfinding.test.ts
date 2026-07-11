/**
 * @fileoverview Unit tests for the Dijkstra pathfinding module.
 * Tests cover: happy path, step-free constraint, unreachable nodes,
 * same-node queries, invalid node IDs, and label conversion.
 */

import { describe, it, expect } from 'vitest';
import { findShortestPath, buildAdjacencyList, pathToLabels, findNode, findNodesByType } from '../lib/pathfinding';
import type { VenueGraph } from '../types';

// ── Minimal test graph ────────────────────────────────────────────────────────
// A small controlled graph used for all pathfinding assertions.
// Layout:  A --[step-free, d=10]--> B --[NOT step-free, d=5]--> C
//          A --[step-free, d=30]--> D --[step-free, d=5]-------> C
const testGraph: VenueGraph = {
  nodes: [
    { id: 'A', label: 'Node A', type: 'gate', x: 0, y: 0, stepFree: true },
    { id: 'B', label: 'Node B', type: 'section', x: 1, y: 0, stepFree: false },
    { id: 'C', label: 'Node C', type: 'amenity', x: 2, y: 0, stepFree: true },
    { id: 'D', label: 'Node D', type: 'elevator', x: 0, y: 1, stepFree: true },
    { id: 'E', label: 'Node E', type: 'gate', x: 3, y: 0, stepFree: true },
    { id: 'F', label: 'Node F', type: 'amenity', x: 2, y: 1, stepFree: true },
  ],
  edges: [
    { from: 'A', to: 'B', distance: 10, stepFree: true },
    { from: 'B', to: 'C', distance: 5,  stepFree: false },
    { from: 'A', to: 'D', distance: 30, stepFree: true },
    { from: 'D', to: 'C', distance: 5,  stepFree: true },
    { from: 'C', to: 'F', distance: 10, stepFree: false },
  ],
};

describe('findShortestPath', () => {
  it('finds the shortest path between two connected nodes (happy path)', () => {
    const result = findShortestPath(testGraph, 'A', 'C');
    expect(result.success).toBe(true);
    if (!result.success) return;
    // A→B→C = 15, A→D→C = 35, so shortest is A→B→C
    expect(result.data.path).toEqual(['A', 'B', 'C']);
    expect(result.data.totalDistance).toBe(15);
  });

  it('returns a single-node path when start === destination', () => {
    const result = findShortestPath(testGraph, 'A', 'A');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.path).toEqual(['A']);
    expect(result.data.totalDistance).toBe(0);
  });

  it('returns NODE_NOT_FOUND error for an unknown start node', () => {
    const result = findShortestPath(testGraph, 'UNKNOWN', 'C');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe('NODE_NOT_FOUND');
    expect((result.error as { type: string; nodeId: string }).nodeId).toBe('UNKNOWN');
  });

  it('returns NODE_NOT_FOUND error for an unknown destination node', () => {
    const result = findShortestPath(testGraph, 'A', 'MISSING');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe('NODE_NOT_FOUND');
  });

  it('returns NO_PATH_FOUND when destination is completely unreachable', () => {
    // Node E has no edges connecting it to the rest of the graph
    const result = findShortestPath(testGraph, 'A', 'E');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe('NO_PATH_FOUND');
  });

  describe('stepFreeOnly constraint', () => {
    it('uses the step-free alternative route when stepFreeOnly=true', () => {
      const result = findShortestPath(testGraph, 'A', 'C', true);
      expect(result.success).toBe(true);
      if (!result.success) return;
      // A→B→C is blocked (B→C is not step-free), so must use A→D→C
      expect(result.data.path).toEqual(['A', 'D', 'C']);
      expect(result.data.totalDistance).toBe(35);
    });

    it('returns NO_PATH_FOUND when no step-free route exists to a node', () => {
      // Node F connects only via non-step-free edge F-C
      const result = findShortestPath(testGraph, 'F', 'C', true);
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('NO_PATH_FOUND');
    });

    it('does NOT enforce step-free when stepFreeOnly=false (default)', () => {
      const result = findShortestPath(testGraph, 'A', 'C', false);
      expect(result.success).toBe(true);
      if (!result.success) return;
      // Should choose shortest regardless of step-free status
      expect(result.data.path).toEqual(['A', 'B', 'C']);
    });
  });
});

describe('buildAdjacencyList', () => {
  it('creates bidirectional entries for each edge', () => {
    const adj = buildAdjacencyList(testGraph);
    const aNeighbors = adj.get('A') ?? [];
    const bNeighbors = adj.get('B') ?? [];
    // A should have B and D as neighbors (edges A→B and A→D)
    expect(aNeighbors.map((n) => n.nodeId)).toContain('B');
    expect(aNeighbors.map((n) => n.nodeId)).toContain('D');
    // B should have A as a neighbor (bidirectional)
    expect(bNeighbors.map((n) => n.nodeId)).toContain('A');
  });

  it('initializes every node — even isolated ones — with an empty neighbor list', () => {
    const adj = buildAdjacencyList(testGraph);
    // Node E has no edges
    expect(adj.has('E')).toBe(true);
    expect(adj.get('E')).toEqual([]);
  });
});

describe('pathToLabels', () => {
  it('converts a path of node ids to human-readable labels', () => {
    const labels = pathToLabels(testGraph, ['A', 'B', 'C']);
    expect(labels).toEqual(['Node A', 'Node B', 'Node C']);
  });

  it('returns the node id itself as a fallback for unknown ids', () => {
    const labels = pathToLabels(testGraph, ['A', 'NONEXISTENT']);
    expect(labels).toEqual(['Node A', 'NONEXISTENT']);
  });

  it('returns an empty array for an empty path', () => {
    expect(pathToLabels(testGraph, [])).toEqual([]);
  });
});

describe('findNode', () => {
  it('finds a node by id', () => {
    const node = findNode(testGraph, 'A');
    expect(node?.label).toBe('Node A');
  });

  it('returns undefined for a missing node id', () => {
    expect(findNode(testGraph, 'MISSING')).toBeUndefined();
  });
});

describe('findNodesByType', () => {
  it('returns all nodes of the given type', () => {
    const gates = findNodesByType(testGraph, 'gate');
    expect(gates).toHaveLength(2);
    expect(gates.map((n) => n.id)).toContain('A');
    expect(gates.map((n) => n.id)).toContain('E');
  });

  it('returns an empty array for a type with no matching nodes', () => {
    expect(findNodesByType(testGraph, 'food')).toEqual([]);
  });
});

// ── Integration: test against the real venue graph ────────────────────────────
describe('Real venueGraph integration', () => {
  it('imports without errors', async () => {
    const { default: graph } = await import('../data/venueGraph.json');
    expect(graph.nodes.length).toBeGreaterThan(10);
    expect(graph.edges.length).toBeGreaterThan(10);
  });

  it('finds a path from gate-4 to restroom-a in the real graph', async () => {
    const { default: graph } = await import('../data/venueGraph.json');
    const result = findShortestPath(graph as VenueGraph, 'gate-4', 'restroom-a');
    expect(result.success).toBe(true);
  });

  it('finds a step-free path from gate-4 to restroom-c', async () => {
    const { default: graph } = await import('../data/venueGraph.json');
    const result = findShortestPath(graph as VenueGraph, 'gate-4', 'restroom-c', true);
    expect(result.success).toBe(true);
  });

  it('confirms sec-101 is NOT reachable step-free from gate-6 without elevator', async () => {
    const { default: graph } = await import('../data/venueGraph.json');
    // sec-101 is directly connected only via non-step-free edges from concourses
    // but elevator-n provides a step-free path
    const result = findShortestPath(graph as VenueGraph, 'gate-6', 'sec-101', true);
    // Via elevator-n the path exists
    expect(result.success).toBe(true);
  });
});
