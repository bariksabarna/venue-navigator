/**
 * @fileoverview Deterministic Dijkstra pathfinding over the venue graph.
 *
 * Navigation is NEVER delegated to the LLM. This module computes the actual
 * shortest walkable route between any two nodes in the venue graph, with an
 * optional `stepFreeOnly` constraint for accessibility. Gemini's job is only
 * to explain the result in natural language — it never computes the path.
 *
 * @module pathfinding
 */

import type { VenueGraph, VenueNode, PathfindingResult } from '../types';

// ── Internal adjacency representation ───────────────────────────────────────

/** A single neighbor entry used in the adjacency list */
interface Neighbor {
  /** Neighboring node id */
  nodeId: string;
  /** Edge distance in meters */
  distance: number;
  /** Whether this edge is step-free */
  stepFree: boolean;
}

/** Adjacency list keyed by node id */
type AdjacencyList = Map<string, Neighbor[]>;

/**
 * Builds a bidirectional adjacency list from the venue graph edges.
 * Each edge is added in both directions (from→to and to→from) because
 * the venue is assumed to be a bidirectional walking graph.
 *
 * @param graph - The full venue graph data structure.
 * @returns A Map from node id to array of neighbor entries.
 */
export function buildAdjacencyList(graph: VenueGraph): AdjacencyList {
  const adj: AdjacencyList = new Map();

  // Initialize every node with an empty neighbor list
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  // Add bidirectional edges
  for (const edge of graph.edges) {
    adj.get(edge.from)?.push({ nodeId: edge.to, distance: edge.distance, stepFree: edge.stepFree });
    adj.get(edge.to)?.push({ nodeId: edge.from, distance: edge.distance, stepFree: edge.stepFree });
  }

  return adj;
}

/**
 * Looks up a node by id in the venue graph.
 *
 * @param graph - The venue graph to search.
 * @param nodeId - The node identifier to find.
 * @returns The matching VenueNode, or undefined if not found.
 */
export function findNode(graph: VenueGraph, nodeId: string): VenueNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

/**
 * Finds all nodes of a given type (e.g. all amenity nodes).
 *
 * @param graph - The venue graph to search.
 * @param type - The node type to filter on.
 * @returns Array of matching VenueNode objects.
 */
export function findNodesByType(graph: VenueGraph, type: string): VenueNode[] {
  return graph.nodes.filter((n) => n.type === type);
}

/**
 * Computes the shortest walkable path between two venue nodes using Dijkstra's
 * algorithm. Optionally restricts traversal to step-free edges only, which is
 * used when the fan's accessibility profile requires wheelchair-compatible routes.
 *
 * @param graph      - The full venue graph (nodes + edges).
 * @param fromId     - The id of the starting node (e.g. "gate-4").
 * @param toId       - The id of the destination node (e.g. "restroom-a").
 * @param stepFreeOnly - When true, only edges where stepFree===true are traversed.
 * @returns A PathfindingResult — either success with path+distance, or a typed error.
 *
 * @example
 * const result = findShortestPath(graph, 'gate-1', 'sec-101', false);
 * if (result.success) {
 *   console.log(result.data.path);        // ['gate-1', 'concourse-n', 'sec-101']
 *   console.log(result.data.totalDistance); // 120
 * }
 */
export function findShortestPath(
  graph: VenueGraph,
  fromId: string,
  toId: string,
  stepFreeOnly: boolean = false
): PathfindingResult {
  // ── Validation ────────────────────────────────────────────────────────────
  if (!findNode(graph, fromId)) {
    return { success: false, error: { type: 'NODE_NOT_FOUND', nodeId: fromId } };
  }
  if (!findNode(graph, toId)) {
    return { success: false, error: { type: 'NODE_NOT_FOUND', nodeId: toId } };
  }

  // ── Trivial case ──────────────────────────────────────────────────────────
  if (fromId === toId) {
    return { success: true, data: { path: [fromId], totalDistance: 0 } };
  }

  const adj = buildAdjacencyList(graph);

  // ── Dijkstra initialization ───────────────────────────────────────────────
  // dist[nodeId] = shortest known distance from fromId to that node
  const dist = new Map<string, number>();
  // prev[nodeId] = the predecessor node on the shortest path
  const prev = new Map<string, string | null>();
  // Simple min-priority queue using a sorted array (sufficient for small graphs <30 nodes)
  const unvisited = new Set<string>();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
    unvisited.add(node.id);
  }
  dist.set(fromId, 0);

  // ── Main Dijkstra loop ────────────────────────────────────────────────────
  while (unvisited.size > 0) {
    // Find the unvisited node with the smallest tentative distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const nodeId of unvisited) {
      const d = dist.get(nodeId) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        current = nodeId;
      }
    }

    // If all remaining nodes are unreachable, stop
    if (current === null || minDist === Infinity) break;

    // Reached the destination
    if (current === toId) break;

    unvisited.delete(current);

    // Relax each neighbor
    for (const neighbor of adj.get(current) ?? []) {
      // Skip non-step-free edges when constraint is active
      if (stepFreeOnly && !neighbor.stepFree) continue;
      if (!unvisited.has(neighbor.nodeId)) continue;

      const alt = (dist.get(current) ?? Infinity) + neighbor.distance;
      if (alt < (dist.get(neighbor.nodeId) ?? Infinity)) {
        dist.set(neighbor.nodeId, alt);
        prev.set(neighbor.nodeId, current);
      }
    }
  }

  // ── Path reconstruction ───────────────────────────────────────────────────
  const totalDistance = dist.get(toId) ?? Infinity;
  if (totalDistance === Infinity) {
    return { success: false, error: { type: 'NO_PATH_FOUND', from: fromId, to: toId } };
  }

  const path: string[] = [];
  let cursor: string | null = toId;
  while (cursor !== null) {
    path.unshift(cursor);
    cursor = prev.get(cursor) ?? null;
  }

  return { success: true, data: { path, totalDistance } };
}

/**
 * Converts a path result (array of node ids) into a human-readable list
 * of node labels, using the venue graph to look up each label.
 *
 * @param graph  - The venue graph containing node definitions.
 * @param path   - Ordered array of node ids representing the route.
 * @returns Array of node labels in route order (e.g. ["Gate 4", "South Concourse", "Restroom C"]).
 */
export function pathToLabels(graph: VenueGraph, path: string[]): string[] {
  return path.map((id) => findNode(graph, id)?.label ?? id);
}
