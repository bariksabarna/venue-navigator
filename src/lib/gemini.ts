/**
 * @fileoverview Firebase AI Logic integration for Gemini model access.
 *
 * This module provides the two-call Gemini pattern defined in SRS §6.4:
 *   1. parseIntent(query, context) → ParsedIntent (structured JSON)
 *   2. generateResponse(intent, routeContext, faqContext) → string (natural language)
 *
 * Key security properties:
 *   - The Gemini API key NEVER appears in this file or anywhere in the client bundle.
 *     It lives exclusively inside Firebase's server-side AI Logic proxy.
 *   - All model output is sanitized before returning (caller must also sanitize before render).
 *   - Structured JSON output from call 1 is defensively parsed with fallback on malformed output.
 *   - App Check is enforced at the Firebase project level — unauthorized callers are rejected.
 *
 * @module gemini
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { ParsedIntent, PathResult, FaqEntry, AccessibilityPrefs, LiveEvent } from '../types';
import { sanitizeOutput } from './sanitize';

// ── Firebase configuration (public identifiers, not secrets) ─────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// ── Firebase singleton initialization ────────────────────────────────────────

/** Lazily initialized Firebase app instance */
let app: FirebaseApp | null = null;

/**
 * Gets or initializes the Firebase app singleton.
 * Avoids double-initialization which would throw an error in development
 * with React's StrictMode double-mount behavior.
 *
 * @returns The initialized FirebaseApp instance.
 */
function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize App Check with reCAPTCHA v3 — this enforces that only this
  // authorized web app can call Firebase AI Logic. Must be configured before
  // any AI calls are made.
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;
  if (recaptchaKey && recaptchaKey !== 'your-recaptcha-v3-site-key') {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  return app;
}

/**
 * Creates and returns the Gemini generative model via Firebase AI Logic.
 * Uses gemini-2.5-flash (or latest flash) as specified in the SRS —
 * flash is fast, cheap, and sufficient for the two-call pattern.
 *
 * @returns A GenerativeModel instance ready for generateContent calls.
 */
function getModel() {
  const firebaseApp = getFirebaseApp();
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, { model: 'gemini-2.0-flash' });
}

// ── System prompt ─────────────────────────────────────────────────────────────

/**
 * The scoped system prompt that constrains Gemini to the concierge role.
 * This is intentionally narrow — the model must refuse off-topic queries
 * rather than attempt to be helpful beyond the stadium context.
 */
const SYSTEM_PROMPT = `You are Setu, a helpful multilingual AI concierge for the FIFA World Cup 2026 stadium.
Your role is strictly limited to:
- Stadium navigation (helping fans get from one place to another)
- General stadium FAQs (tickets, prohibited items, transit, amenities, accessibility)
- Real-time venue information (congestion, delays, weather alerts)
- Answering in the same language the fan uses

You MUST NOT:
- Answer questions unrelated to the stadium or World Cup experience
- Provide medical, legal, or emergency advice — always defer to venue staff/emergency services
- Generate routes or directions yourself — routes are computed by a deterministic pathfinder
- Hallucinate answers — if no grounding context is provided, say "I don't have that information"

Always respond in the language detected in the user's message.
Be friendly, concise, and calm. Use simple language when requested.`;

// ── Intent parsing (Call 1) ───────────────────────────────────────────────────

/** The JSON schema for the structured intent the model must return */
const INTENT_SCHEMA = `Return ONLY a valid JSON object with this exact structure:
{
  "language": "<BCP47 language code, e.g. 'en', 'hi', 'es', 'fr', 'ar'>",
  "intent": "<one of: navigate | faq | smalltalk | out_of_scope>",
  "destination_node_id": "<node id from the venue graph, or null>",
  "current_node_id": "<node id from the venue graph, or null>",
  "faq_topic": "<topic keyword, or null>",
  "reading_level": "<simple | standard>"
}`;

/** Available node IDs for the intent parser to reference */
const NODE_IDS = [
  'gate-1','gate-2','gate-3','gate-4','gate-5','gate-6',
  'concourse-n','concourse-e','concourse-s','concourse-w','center-hub',
  'sec-101','sec-102','sec-201','sec-202',
  'restroom-a','restroom-b','restroom-c','restroom-d',
  'food-1','food-2','food-3','medical-1',
  'elevator-n','elevator-s','water-refill',
].join(', ');

/**
 * Parses a fan's free-text query into a structured intent object.
 * This is the FIRST of the two Gemini calls. The result drives the
 * deterministic pathfinder and FAQ retriever — the model never computes
 * the actual route or answer itself.
 *
 * Defensively parses the JSON output and falls back to an out_of_scope
 * intent if the model returns malformed JSON.
 *
 * @param query   - The raw fan query (any language, max 500 chars after sanitization).
 * @param context - Additional context like live events.
 * @returns A ParsedIntent struct validated against the expected schema.
 */
export async function parseIntent(query: string, context: string = ''): Promise<ParsedIntent> {
  const model = getModel();

  const prompt = `${SYSTEM_PROMPT}

Available venue node IDs: ${NODE_IDS}

Fan query: "${query}"
${context ? `Additional context: ${context}` : ''}

${INTENT_SCHEMA}
Do not include any text outside the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from the response (handle cases where model wraps in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in model response');

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedIntent>;

    // Defensive validation — ensure required fields exist with safe defaults
    return {
      language: typeof parsed.language === 'string' ? parsed.language : 'en',
      intent: ['navigate', 'faq', 'smalltalk', 'out_of_scope'].includes(parsed.intent ?? '')
        ? (parsed.intent as ParsedIntent['intent'])
        : 'out_of_scope',
      destination_node_id: typeof parsed.destination_node_id === 'string' ? parsed.destination_node_id : null,
      current_node_id: typeof parsed.current_node_id === 'string' ? parsed.current_node_id : null,
      faq_topic: typeof parsed.faq_topic === 'string' ? parsed.faq_topic : null,
      reading_level: parsed.reading_level === 'simple' ? 'simple' : 'standard',
    };
  } catch {
    // Graceful fallback on any parse or network error
    return {
      language: 'en',
      intent: 'out_of_scope',
      destination_node_id: null,
      current_node_id: null,
      faq_topic: null,
      reading_level: 'standard',
    };
  }
}

// ── Response generation (Call 2) ──────────────────────────────────────────────

/**
 * Context object passed to the response generator.
 * Bundles all computed data so the model can explain it naturally.
 */
export interface ResponseContext {
  /** The structured intent from call 1 */
  intent: ParsedIntent;
  /** The computed route (if any) from the deterministic pathfinder */
  route?: PathResult;
  /** Human-readable route node labels */
  routeLabels?: string[];
  /** Relevant FAQ entries retrieved from the knowledge base */
  faqEntries?: FaqEntry[];
  /** Active live events that may be relevant to this query */
  liveEvents?: LiveEvent[];
  /** The fan's accessibility preferences */
  prefs?: AccessibilityPrefs;
}

/**
 * Generates the final natural-language response to display to the fan.
 * This is the SECOND of the two Gemini calls. It receives the computed
 * route and/or FAQ grounding context and produces a friendly, correctly-
 * languaged explanation.
 *
 * The model is NEVER asked to compute a route — only to explain one.
 *
 * @param originalQuery - The fan's original query (for reference).
 * @param ctx           - All computed context for this query.
 * @returns A sanitized natural-language response string.
 */
export async function generateResponse(
  originalQuery: string,
  ctx: ResponseContext
): Promise<string> {
  const model = getModel();
  const { intent, route, routeLabels, faqEntries, liveEvents, prefs } = ctx;

  // ── Build the generation prompt ───────────────────────────────────────────
  const parts: string[] = [SYSTEM_PROMPT, ''];

  // Reading level instruction
  if (intent.reading_level === 'simple' || prefs?.profile === 'cognitive_sensory') {
    parts.push('Use very short, simple sentences. Avoid idioms. Be calm and clear.');
  }

  // Original query for reference
  parts.push(`Fan's original question (in ${intent.language}): "${originalQuery}"`);
  parts.push(`Respond in: ${intent.language}`);
  parts.push('');

  // ── Intent-specific context ───────────────────────────────────────────────
  if (intent.intent === 'navigate' && route && routeLabels) {
    // Navigation: explain the pre-computed route
    parts.push('NAVIGATION RESULT (computed by deterministic pathfinder — do not alter the route):');
    parts.push(`Route: ${routeLabels.join(' → ')}`);
    parts.push(`Total walking distance: approximately ${Math.round(route.totalDistance)} meters`);
    parts.push('Give step-by-step directions based on this route. Be specific and friendly.');

  } else if (intent.intent === 'navigate' && !route) {
    // Navigation but no route found (e.g. no step-free path)
    parts.push('No step-free route could be found for this query.');
    parts.push('Apologize and suggest the fan ask a steward for personal assistance.');

  } else if (intent.intent === 'faq' && faqEntries && faqEntries.length > 0) {
    // FAQ: answer from grounding context only
    parts.push('GROUNDING CONTEXT (use only this information to answer — do not invent facts):');
    for (const entry of faqEntries) {
      parts.push(`[${entry.topic}]: ${entry.answer_en}`);
    }
    parts.push('Answer the fan\'s question based only on the context above.');

  } else if (intent.intent === 'out_of_scope') {
    // Out of scope: graceful deflection
    parts.push('This question is outside the scope of the stadium concierge.');
    parts.push('Politely explain that you can only help with stadium navigation and FIFA World Cup questions.');
    parts.push('If the question involves an emergency, direct the fan to the nearest steward or call emergency services.');

  } else {
    // Smalltalk or no context available
    parts.push('Respond helpfully within your role as a stadium concierge.');
    parts.push('Offer to help with navigation, stadium FAQs, or real-time venue information.');
  }

  // ── Live events context ───────────────────────────────────────────────────
  if (liveEvents && liveEvents.length > 0) {
    parts.push('');
    parts.push('RELEVANT LIVE VENUE ALERTS (incorporate naturally if relevant to the question):');
    for (const event of liveEvents) {
      parts.push(`[${event.type.toUpperCase()} - ${event.severity}] ${event.message}`);
    }
  }

  try {
    const result = await model.generateContent(parts.join('\n'));
    const rawText = result.response.text();
    // Sanitize model output before returning — XSS protection
    return sanitizeOutput(rawText);
  } catch {
    // Graceful fallback: static response when AI is unreachable
    if (route && routeLabels) {
      return `Please follow this route: ${routeLabels.join(' → ')} (approximately ${Math.round(route.totalDistance)} meters).`;
    }
    return 'I\'m having trouble connecting right now. Please ask a stadium steward for assistance.';
  }
}
