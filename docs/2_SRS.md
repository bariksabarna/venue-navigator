# Software Requirements Specification (SRS)
## Setu — AI Stadium Concierge for FIFA World Cup 2026
**Doc version:** 1.0 · **Date:** 11 July 2026 · **Companion to:** `1_PRD.md`

---

## 1. Scope

This SRS translates the PRD into buildable requirements, architecture, data contracts, and non-functional targets for Antigravity's coding agent to implement. Anything ambiguous here should be resolved in favor of the PRD's locked persona/vertical (§3 of the PRD) and the "Won't have" list — when in doubt, cut scope, not corners on security/accessibility/testing.

---

## 2. System overview

```
┌─────────────────────────────┐        ┌────────────────────────────┐
│  Client (React PWA, TS)     │        │  Firebase (Spark/free tier) │
│                              │        │                              │
│  ChatConsole / MapView /    │  HTTPS │  App Check (reCAPTCHA v3)   │
│  AccessibilityPanel /       │◄──────►│  → Firebase AI Logic proxy  │
│  VoiceInput / OpsLite       │        │    → Gemini Developer API   │
│                              │        │      (gemini-2.5-flash /    │
│  lib/pathfinding.ts         │        │       latest flash model)   │
│  (deterministic, no API)    │        │                              │
│                              │        │  Firestore (optional,       │
│  data/venueGraph.json       │        │  anonymized analytics only) │
│  data/faq.json              │        │                              │
│  data/mockLiveEvents.json   │        │  Firebase Hosting (deploy)  │
└─────────────────────────────┘        └────────────────────────────┘
```

**Key architectural decision:** navigation is **not** delegated to the LLM. A deterministic graph pathfinder (Dijkstra over a small JSON venue graph) computes the actual route. Gemini's job is to (a) parse the fan's free-text/voice query into structured intent, (b) explain the computed route naturally, in the fan's language, at the right reading level, and (c) answer grounded FAQ questions. This keeps the system fast, cheap, testable, and immune to "the AI told me to walk into a wall" failure modes.

---

## 3. Tech stack (all Google-free-tier where possible)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | React 18 + TypeScript + Vite | Fast dev loop, small bundle, strong typing for code-quality scoring |
| Styling | Tailwind CSS | Speed + consistent design tokens, pairs well with Stitch export |
| UI design source | **Stitch** (stitch.withgoogle.com) | Generates the first-pass UI/UX; Antigravity re-implements cleanly as typed React components (Stitch output is a *design reference*, not shipped raw) |
| AI model access | **Firebase AI Logic Web SDK** → **Gemini Developer API free tier** | The officially recommended way to call Gemini from a browser without exposing the API key; free Spark plan, no billing account needed |
| Abuse protection | **Firebase App Check** (reCAPTCHA v3 provider for web) | Stops unauthorized clients from burning the free quota |
| Hosting | **Firebase Hosting** (Spark/free plan) | One-command deploy, free SSL, CDN |
| Optional data store | **Cloud Firestore** (free tier) | Only for anonymized aggregate counters powering Ops Lite — not required for MVP |
| CI/CD | **GitHub Actions** (free for public repos) | Lint + typecheck + unit tests + a11y checks on every push |
| Voice I/O | Browser-native **Web Speech API** | Zero-cost, no extra Google service needed |
| Coding agent | **Google Antigravity** | Scaffolds, implements, tests, and self-reviews the repo |
| Maps | *None for MVP* (custom SVG venue map + JSON graph) | Avoids requiring a Google Maps Platform billing account; keeps indoor navigation fully self-contained and demo-safe |

---

## 4. Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | The system shall accept a fan's query as free text or voice, in any supported language, without requiring the fan to select a language first. |
| FR-2 | The system shall detect the query's language and respond in that same language. |
| FR-3 | The system shall let a fan set an accessibility profile (wheelchair / low vision / deaf-or-hard-of-hearing / cognitive-sensory-friendly / none) that persists locally across sessions. |
| FR-4 | Given a start point and destination, the system shall compute a walkable route using a deterministic graph algorithm, honoring step-free constraints when the accessibility profile requires it. |
| FR-5 | The system shall render the computed route on an interactive SVG stadium map and simultaneously describe it in natural language via Gemini, in the fan's language and at an appropriate reading level. |
| FR-6 | The system shall incorporate simulated real-time venue signals (congestion, weather, delays) into route explanations and proactive alerts when relevant to the fan's query or route. |
| FR-7 | For general questions (tickets, prohibited items, transit, amenities), the system shall retrieve relevant entries from a local knowledge base and pass them to Gemini as grounding context before generating an answer. |
| FR-8 | The system shall refuse/deflect gracefully (not hallucinate) when a query is out of scope (e.g. medical emergencies → shows an explicit "call venue security / emergency services" message instead of AI-generated medical advice). |
| FR-9 | The system shall support voice input and text-to-speech voice output as an alternative to typing/reading. |
| FR-10 | The system shall function in a degraded "offline mode" (cached shell + knowledge base + last-known map) when network connectivity is unavailable, and shall clearly indicate this state to the user. |
| FR-11 | The system shall expose a secondary, read-only "Ops Lite" view showing anonymized, aggregated query topic/zone counts, with no raw query text or user identifiers visible. |
| FR-12 | The system shall cache repeated identical (query + language) requests client-side to avoid redundant API calls. |

## 5. Non-functional requirements

| Category | Requirement |
|---|---|
| **Performance** | P50 end-to-end AI response time < 3s on a typical 4G connection; Lighthouse Performance score ≥ 90 |
| **Accessibility** | WCAG 2.2 AA target; Lighthouse Accessibility score ≥ 95; full keyboard operability; ARIA live region announces new AI responses; automated axe-core scan passes in CI |
| **Security** | No secret keys in client bundle or git history; Gemini API key never leaves Firebase's server-side proxy; all model output HTML-escaped/sanitized before render (XSS protection); Firestore security rules restrict writes to the single anonymized-analytics path and disallow client reads of other users' data; App Check enforced on all AI Logic calls; input length-capped and trimmed before being sent to the model |
| **Privacy** | No account/login required for MVP; no PII collected or stored; accessibility/language preference stored in `localStorage` only |
| **Efficiency / resource use** | Gemini Flash (not Pro) as default model; response caching; code-split bundle target < 300 KB gzipped for initial route; PWA offline caching to cut repeat network/API usage |
| **Reliability** | Deterministic pathfinding never depends on the LLM being available — if Gemini is unreachable, the app still shows the computed route with a static template explanation |
| **Maintainability** | Strict TypeScript, ESLint + Prettier enforced via CI, one clear module per concern (`lib/pathfinding.ts`, `lib/gemini.ts`, `lib/sanitize.ts`, `lib/cache.ts`) |
| **Portability** | Runs as an installable PWA in any modern mobile/desktop browser; no native app required |
| **Repo constraints** | Public, single-branch, < 10 MB committed size — enforced via `.gitignore` (no `node_modules`, no build artifacts, no large media) |

---

## 6. Data model

### 6.1 `data/venueGraph.json` (deterministic pathfinding input)
```json
{
  "nodes": [
    { "id": "gate-4", "type": "gate", "label": "Gate 4", "x": 120, "y": 340, "stepFree": true },
    { "id": "sec-112", "type": "section", "label": "Section 112", "x": 260, "y": 300, "stepFree": false },
    { "id": "restroom-a", "type": "amenity", "label": "Accessible Restroom A", "x": 180, "y": 310, "stepFree": true }
  ],
  "edges": [
    { "from": "gate-4", "to": "sec-112", "distance": 85, "stepFree": false },
    { "from": "gate-4", "to": "restroom-a", "distance": 40, "stepFree": true }
  ]
}
```

### 6.2 `data/faq.json` (RAG-lite grounding source)
```json
[
  { "id": "faq-tickets-1", "topic": "tickets", "tags": ["mobile ticket","entry"], "answer_en": "Your mobile ticket is inside the official FIFA app or your ticket email — screenshots are not accepted at gates." }
]
```

### 6.3 `data/mockLiveEvents.json` (simulated real-time signal)
```json
[
  { "id": "evt-1", "zone": "gate-3", "type": "congestion", "severity": "high", "message": "Gate 3 queue is long right now.", "updatedAt": "2026-07-11T18:20:00Z" }
]
```

### 6.4 Gemini structured-output contract (intent parsing)
The model is prompted (via Gemini's structured/JSON output mode) to return:
```json
{
  "language": "hi",
  "intent": "navigate | faq | smalltalk | out_of_scope",
  "destination_node_id": "restroom-a",
  "current_node_id": "gate-4",
  "faq_topic": null,
  "reading_level": "simple | standard"
}
```
This structured object — not free-form text — drives the pathfinder and the FAQ retriever. The final natural-language answer is a *second* Gemini call that receives the computed route/FAQ result plus this structured intent and produces the user-facing message. Two small calls beat one big unreliable one: each step is independently testable.

### 6.5 Anonymized analytics document (Firestore, optional Ops Lite feature)
```json
{ "zone": "gate-3", "topic": "congestion", "count": 27, "windowStart": "2026-07-11T18:00:00Z" }
```
No query text, no session/user identifiers are ever written here — increment-only counters.

---

## 7. AI / prompting design

- **System prompt is scoped**: the assistant is instructed it is *only* a FIFA World Cup 2026 stadium concierge, must not answer unrelated general-knowledge questions, must not give medical/legal/emergency advice (defer to venue security/emergency services instead), and must always answer in the detected/selected language.
- **Grounding over generation**: FAQ answers are only ever built from retrieved `faq.json` entries in context — the model is instructed to say "I don't have that information" rather than invent an answer when nothing relevant is retrieved.
- **Accessibility-aware prompting**: when the fan's profile is "cognitive-sensory-friendly," the generation prompt requests short sentences, no idioms, and a calmer tone; when "deaf-or-hard-of-hearing," voice output is skipped in favor of clear captions.
- **Two-call pattern**: (1) intent parsing → structured JSON, (2) response generation → natural language, as in §6.4. This is deliberately not a single "do everything" prompt — it is easier to unit test, cheaper to cache, and safer (the model never has an opportunity to output raw route-finding logic incorrectly, since the route itself never comes from the model).

---

## 8. Security requirements detail

1. `.env` files are git-ignored; only `.env.example` (placeholder values) is committed.
2. Firebase web config values (`apiKey`, `projectId`, etc.) are safe to ship client-side by design — they are identifiers, not secrets — but every AI Logic call is gated behind **App Check**, and this must be verifiably enabled (not just configured) before submission.
3. All model-generated text is rendered through a sanitizing markdown renderer (e.g. escape + allow-list) — never `dangerouslySetInnerHTML` on raw model output.
4. Input to the model is length-capped (e.g. 500 chars) and stripped of control characters before being sent, as a basic prompt-injection/abuse guard.
5. Firestore security rules (if Ops Lite/Firestore is included) allow only increment-style writes to the anonymized counters collection and deny all client-side reads of any other collection.
6. Dependency install uses lockfiles; CI includes `npm audit --production` (or equivalent) as a non-blocking warning step.
7. No third-party analytics/tracking SDKs — reduces both privacy risk and bundle size.

---

## 9. Accessibility requirements detail

- Semantic landmarks (`<header>`, `<nav>`, `<main>`), skip-to-content link.
- Every interactive element reachable and operable by keyboard alone; visible focus states.
- AI responses appended into an `aria-live="polite"` region so screen readers announce new messages automatically.
- Color contrast meets WCAG AA in both default and high-contrast theme.
- Text scales via relative units (`rem`) up to at least 200% zoom without breaking layout.
- `prefers-reduced-motion` respected for all transitions/animations.
- All icons have accessible names (`aria-label` or visually-hidden text); no information conveyed by color alone.
- Voice input/output available as an alternative interaction path, not a replacement for text.

---

## 10. Testing strategy

| Test type | Tool | Coverage target |
|---|---|---|
| Unit — pathfinding | Vitest | Graph algorithm: shortest path, step-free constraint filtering, unreachable-node handling |
| Unit — prompt/response utilities | Vitest | JSON parsing/validation of Gemini structured output, sanitizer, cache key generation |
| Component tests | Vitest + React Testing Library | ChatConsole renders/announces messages, AccessibilityPanel changes persisted state, LanguageSwitch |
| Accessibility (automated) | axe-core (via `@axe-core/react` or CI plugin) | Zero critical/serious violations on key screens |
| Manual scenario matrix | Documented in `/docs/TEST_SCENARIOS.md` | See list below |
| CI | GitHub Actions | Lint + typecheck + unit tests + a11y check run on every push, required to pass before merge |

**Manual scenario matrix (minimum set):**
1. Navigation query in English, no accessibility profile
2. Navigation query in a non-English language (e.g. Hindi/Spanish), verify same-language response
3. Navigation query with "wheelchair" profile active → route avoids stairs
4. FAQ query with a grounded answer available
5. Out-of-scope query (e.g. general trivia) → graceful deflection, no hallucination
6. Simulated emergency-adjacent query → deflects to venue security/emergency services, does not attempt to help directly
7. Network offline → app still loads shell + shows cached info + clear offline indicator
8. Voice input → voice output round trip
9. Repeated identical query → served from cache, no duplicate API call (verify via network panel/log)
10. Ops Lite view shows aggregated counts only, no raw text

---

## 11. Constraints recap

- Public GitHub repo, **single branch**, **< 10 MB** committed.
- No paid services required to build, run, or judge the project (Gemini Developer API free tier + Firebase Spark plan + GitHub Actions on a public repo cover everything).
- Regular, incremental commits expected (this is also a submission rule) — Antigravity should commit after each meaningful unit of work, not as one giant final commit.
