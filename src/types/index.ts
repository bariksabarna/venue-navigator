/**
 * @fileoverview Shared TypeScript type definitions for the Setu application.
 * These types form the data contract between all modules (pathfinding,
 * knowledge base, Gemini integration, and UI components).
 */

// ── Venue Graph ─────────────────────────────────────────────────────────────

/** Node types that can appear in the venue graph */
export type NodeType = 'gate' | 'section' | 'amenity' | 'food' | 'exit' | 'elevator';

/** A single node in the walkable venue graph */
export interface VenueNode {
  /** Unique identifier, e.g. "gate-4" */
  id: string;
  /** Display label, e.g. "Gate 4" */
  label: string;
  /** Category of the node */
  type: NodeType;
  /** SVG x-coordinate on the map canvas */
  x: number;
  /** SVG y-coordinate on the map canvas */
  y: number;
  /** Whether this node is accessible via step-free routes */
  stepFree: boolean;
}

/** A walkable edge between two venue nodes */
export interface VenueEdge {
  /** Source node id */
  from: string;
  /** Destination node id */
  to: string;
  /** Walking distance in meters */
  distance: number;
  /** Whether this edge is traversable without stairs */
  stepFree: boolean;
}

/** Full venue graph data structure */
export interface VenueGraph {
  nodes: VenueNode[];
  edges: VenueEdge[];
}

// ── Pathfinding ──────────────────────────────────────────────────────────────

/** Result of a successful pathfinding computation */
export interface PathResult {
  /** Ordered list of node ids forming the route */
  path: string[];
  /** Total walking distance in meters */
  totalDistance: number;
}

/** Possible errors from the pathfinder */
export type PathError =
  | { type: 'NODE_NOT_FOUND'; nodeId: string }
  | { type: 'NO_PATH_FOUND'; from: string; to: string }
  | { type: 'SAME_NODE' };

/** Union result type for pathfinding */
export type PathfindingResult =
  | { success: true; data: PathResult }
  | { success: false; error: PathError };

// ── FAQ / Knowledge Base ─────────────────────────────────────────────────────

/** A single FAQ entry from the local knowledge base */
export interface FaqEntry {
  /** Unique identifier */
  id: string;
  /** Topic category, e.g. "tickets", "transport" */
  topic: string;
  /** Searchable tags */
  tags: string[];
  /** English answer text */
  answer_en: string;
}

// ── Live Events ───────────────────────────────────────────────────────────────

/** Severity level of a live venue event */
export type EventSeverity = 'low' | 'medium' | 'high';

/** Event type categories */
export type EventType = 'congestion' | 'weather' | 'delay' | 'announcement' | 'medical';

/** A simulated real-time venue event */
export interface LiveEvent {
  id: string;
  /** Zone this event applies to, matches a VenueNode id */
  zone: string;
  type: EventType;
  severity: EventSeverity;
  /** Human-readable event description */
  message: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

// ── Gemini / AI ──────────────────────────────────────────────────────────────

/** Intent types the AI can detect from a fan query */
export type QueryIntent = 'navigate' | 'faq' | 'smalltalk' | 'out_of_scope';

/** Reading level for AI response generation */
export type ReadingLevel = 'simple' | 'standard';

/**
 * Structured output from the first Gemini call (intent parsing).
 * This is the contract the pathfinder and FAQ retriever consume.
 */
export interface ParsedIntent {
  /** BCP 47 language code detected from the user's query */
  language: string;
  /** The classified intent of the query */
  intent: QueryIntent;
  /** Target node id for navigation queries, null otherwise */
  destination_node_id: string | null;
  /** Current location node id for navigation queries, null otherwise */
  current_node_id: string | null;
  /** FAQ topic keyword, null for non-FAQ intents */
  faq_topic: string | null;
  /** Appropriate reading complexity level */
  reading_level: ReadingLevel;
}

// ── Accessibility ─────────────────────────────────────────────────────────────

/** Available accessibility profile presets */
export type AccessibilityProfile =
  | 'none'
  | 'wheelchair'
  | 'low_vision'
  | 'deaf_hoh'
  | 'cognitive_sensory';

/** Full persisted accessibility preferences */
export interface AccessibilityPrefs {
  /** Selected accessibility profile */
  profile: AccessibilityProfile;
  /** Whether to apply high-contrast theme */
  highContrast: boolean;
  /** Whether to enlarge text */
  largeText: boolean;
  /** Whether voice output (TTS) is enabled */
  voiceOutput: boolean;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

/** Role of a chat message participant */
export type MessageRole = 'user' | 'assistant' | 'system';

/** A single message in the chat conversation */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  role: MessageRole;
  /** The text content of the message */
  content: string;
  /** ISO 8601 timestamp of when the message was created */
  timestamp: string;
  /** Whether the message is still being generated */
  isLoading?: boolean;
  /** The computed route (if this message includes navigation) */
  route?: PathResult;
  /** Detected language of the message */
  language?: string;
}

// ── Ops Lite ─────────────────────────────────────────────────────────────────

/** Anonymized aggregated query count for Ops Lite dashboard */
export interface AggregatedCount {
  zone: string;
  topic: string;
  count: number;
  windowStart: string;
}
