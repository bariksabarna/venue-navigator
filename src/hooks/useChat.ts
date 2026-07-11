/**
 * @fileoverview Core chat orchestration hook.
 *
 * Orchestrates the full two-call Gemini query flow:
 *   1. Sanitize input
 *   2. Check cache
 *   3. parseIntent → structured JSON
 *   4. Run pathfinder (if navigate intent)
 *   5. Retrieve FAQ entries (if faq intent)
 *   6. generateResponse → natural language
 *   7. Cache the response
 *   8. Update Firestore aggregate counters (Ops Lite, if available)
 *
 * Also manages the chat message history and online/offline state.
 *
 * @module useChat
 */

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from '../lib/uuid';
import { sanitizeInput } from '../lib/sanitize';
import { makeCacheKey, getCacheEntry, setCacheEntry } from '../lib/cache';
import { parseIntent, generateResponse } from '../lib/gemini';
import { findShortestPath, pathToLabels } from '../lib/pathfinding';
import { retrieveRelevantFaqs } from '../lib/knowledgeBase';
import type { ChatMessage, PathResult, AccessibilityPrefs, LiveEvent } from '../types';
import venueGraphData from '../data/venueGraph.json';
import faqData from '../data/faq.json';
import type { VenueGraph, FaqEntry } from '../types';

const venueGraph = venueGraphData as VenueGraph;
const allFaqs = faqData as FaqEntry[];

/**
 * Return type for the useChat hook.
 */
export interface UseChatReturn {
  /** All messages in the current conversation */
  messages: ChatMessage[];
  /** Whether the AI is currently generating a response */
  isLoading: boolean;
  /** Whether the app is currently offline */
  isOffline: boolean;
  /** Send a user query through the full AI pipeline */
  sendMessage: (query: string) => Promise<void>;
  /** Clear all messages and reset the conversation */
  clearMessages: () => void;
}

/**
 * Hook that manages the full chat pipeline including intent parsing,
 * pathfinding, FAQ retrieval, response generation, and caching.
 *
 * @param prefs      - Current accessibility preferences (drives step-free routing).
 * @param liveEvents - Active live venue events (injected into AI context).
 * @param onLanguageDetected - Callback fired with detected language code after intent parsing.
 * @param onRouteComputed    - Callback fired with the computed route for MapView rendering.
 * @returns Chat state and message-sending function.
 */
export function useChat(
  prefs: AccessibilityPrefs,
  liveEvents: LiveEvent[],
  onLanguageDetected: (lang: string) => void,
  onRouteComputed: (route: PathResult | null, labels: string[]) => void,
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // ── Online/offline detection ───────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Appends a new message to the conversation history.
   *
   * @param msg - The ChatMessage to add.
   */
  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /**
   * Replaces the last message in the conversation (used to swap a loading
   * placeholder with the completed response).
   *
   * @param msg - The replacement ChatMessage.
   */
  const replaceLastMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev.slice(0, -1), msg]);
  }, []);

  /**
   * Sends a user query through the full AI pipeline.
   * Handles caching, intent parsing, pathfinding, FAQ retrieval, and response generation.
   *
   * @param query - The raw user input string.
   */
  const sendMessage = useCallback(async (query: string) => {
    // ── Input validation & sanitization ──────────────────────────────────────
    const clean = sanitizeInput(query);
    if (!clean) return;

    // ── Add user message ──────────────────────────────────────────────────────
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // ── Offline mode: no AI calls possible ───────────────────────────────────
    if (isOffline) {
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: 'You appear to be offline. The map and basic venue information are still available. For AI assistance, please reconnect to the network.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── Loading placeholder ───────────────────────────────────────────────────
    const loadingMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    addMessage(loadingMsg);
    setIsLoading(true);

    try {
      // ── Step 1: Check cache ─────────────────────────────────────────────────
      // We don't know the language yet, so use 'unknown' as a pre-parse key
      // The real cache check happens after language detection below
      const preCacheKey = makeCacheKey(clean, 'unknown');
      const quickCached = getCacheEntry(preCacheKey);
      if (quickCached) {
        replaceLastMessage({
          id: uuidv4(),
          role: 'assistant',
          content: quickCached,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ── Step 2: Build live events context string ────────────────────────────
      const liveContext = liveEvents.length > 0
        ? liveEvents.map((e) => `[${e.zone}] ${e.message}`).join('\n')
        : '';

      // ── Step 3: Parse intent (Gemini call 1) ─────────────────────────────────
      const intent = await parseIntent(clean, liveContext);
      onLanguageDetected(intent.language);

      // ── Step 4: Language-specific cache check ─────────────────────────────
      const cacheKey = makeCacheKey(clean, intent.language);
      const cached = getCacheEntry(cacheKey);
      if (cached) {
        replaceLastMessage({
          id: uuidv4(),
          role: 'assistant',
          content: cached,
          timestamp: new Date().toISOString(),
          language: intent.language,
        });
        return;
      }

      // ── Step 5: Pathfinding (if navigate intent) ───────────────────────────
      let route: PathResult | undefined;
      let routeLabels: string[] = [];

      if (intent.intent === 'navigate' && intent.current_node_id && intent.destination_node_id) {
        const stepFreeOnly = prefs.profile === 'wheelchair' || prefs.profile === 'low_vision';
        const pathResult = findShortestPath(
          venueGraph,
          intent.current_node_id,
          intent.destination_node_id,
          stepFreeOnly
        );
        if (pathResult.success) {
          route = pathResult.data;
          routeLabels = pathToLabels(venueGraph, route.path);
          onRouteComputed(route, routeLabels);
        } else {
          onRouteComputed(null, []);
        }
      }

      // ── Step 6: FAQ retrieval (if faq intent) ─────────────────────────────
      let faqEntries: FaqEntry[] = [];
      if (intent.intent === 'faq') {
        faqEntries = retrieveRelevantFaqs(clean, allFaqs);
      }

      // ── Step 7: Filter relevant live events ───────────────────────────────
      const relevantEvents = route
        ? liveEvents.filter((e) => route!.path.includes(e.zone))
        : liveEvents.slice(0, 2); // Show top 2 events for non-navigate queries

      // ── Step 8: Generate response (Gemini call 2) ─────────────────────────
      const responseText = await generateResponse(clean, {
        intent,
        route,
        routeLabels,
        faqEntries,
        liveEvents: relevantEvents,
        prefs,
      });

      // ── Step 9: Cache the response ────────────────────────────────────────
      setCacheEntry(cacheKey, responseText);

      // ── Step 10: Replace loading message with final response ──────────────
      const finalMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        route,
        language: intent.language,
      };
      replaceLastMessage(finalMsg);

      // ── Voice output (if enabled) ─────────────────────────────────────────
      if (prefs.voiceOutput && prefs.profile !== 'deaf_hoh' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.lang = intent.language;
        window.speechSynthesis.speak(utterance);
      }

    } catch {
      replaceLastMessage({
        id: uuidv4(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or ask a stadium steward for assistance.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOffline, liveEvents, prefs, addMessage, replaceLastMessage, onLanguageDetected, onRouteComputed]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    onRouteComputed(null, []);
  }, [onRouteComputed]);

  return { messages, isLoading, isOffline, sendMessage, clearMessages };
}
