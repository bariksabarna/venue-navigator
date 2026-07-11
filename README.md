# Setu — AI Stadium Concierge | FIFA World Cup 2026

**Setu** is an intelligent indoor navigation and informational concierge for the FIFA World Cup 2026, built for international fans and accessibility-priority attendees. It combines deterministic graph-based pathfinding with Gemini's natural-language generation to deliver safe, fast, multilingual stadium guidance.

🔗 **Live Demo**: [https://prompt-wars-493211.web.app](https://prompt-wars-493211.web.app)  
🐙 **GitHub**: [https://github.com/bariksabarna/venue-navigator](https://github.com/bariksabarna/venue-navigator)

---

## 🎯 Chosen Vertical & Persona

| | |
| :--- | :--- |
| **Vertical** | Smart Stadiums & Tournament Operations (Challenge 4) |
| **Primary Persona** | International fans needing multilingual guidance & step-free accessibility routing |
| **Secondary Persona** | Stadium stewards needing a read-only operational dashboard |

---

## 💡 Approach & Architecture

> **Key principle:** Navigation is **never** delegated to the LLM. A deterministic Dijkstra pathfinder computes routes. Gemini's only job is to parse intent and *explain* results.

```
┌───────────────────────────────────────────────────────────────┐
│                    Fan Query (Voice / Text)                    │
└───────────────────────────────┬───────────────────────────────┘
                                │
                        ┌───────▼────────┐
                        │  CALL 1        │  ← Firebase AI Logic
                        │  parseIntent() │    (Gemini 2.0 Flash)
                        │  → ParsedIntent│
                        └───────┬────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
     ┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼───────┐
     │  Dijkstra    │  │  FAQ Retriever│  │  Live Events  │
     │  Pathfinder  │  │ knowledgeBase │  │  (mockJSON)   │
     │  (local, TS) │  │  (local, TS)  │  │               │
     └───────┬──────┘  └────────┬──────┘  └───────┬───────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                        ┌───────▼────────┐
                        │  CALL 2        │  ← Firebase AI Logic
                        │ generateResponse│   (Gemini 2.0 Flash)
                        │  → Safe HTML   │
                        └───────┬────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
       ┌──────▼─────┐  ┌────────▼──────┐  ┌───────▼──────┐
       │  SVG Map   │  │ Chat Bubble   │  │  TTS Output  │
       │  (Route    │  │ (aria-live)   │  │ (SpeechSynth)│
       │   Highlight│  │               │  │              │
       └────────────┘  └───────────────┘  └──────────────┘
```

### Why Two Calls?
1. **Safety** — The pathfinder is deterministic. The LLM cannot invent or alter routes.
2. **Testability** — Each call has a clear input/output contract that is independently unit-testable.
3. **Cost efficiency** — Gemini Flash + response caching keeps costs minimal on free tier.

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
| :--- | :--- | :--- |
| Frontend | React 18 + TypeScript + Vite | Fast build, strict typing, small bundle |
| Styling | Vanilla CSS with CSS custom properties | No runtime overhead, full design-token control |
| AI Access | Firebase AI Logic → Gemini 2.0 Flash | API key never in client bundle; free tier |
| Abuse Prevention | Firebase App Check (reCAPTCHA v3) | Prevents quota harvesting |
| Offline | `vite-plugin-pwa` Service Worker | Caches shell + static data for stadium Wi-Fi gaps |
| Navigation | Dijkstra over `venueGraph.json` | Deterministic, zero LLM dependency |
| FAQ Retrieval | Tag-overlap scoring over `faq.json` | No embedding service needed; fast and free |
| Deployment | Firebase Hosting | Fully static CDN deployment; zero cost, fast load times |
| CI | GitHub Actions | Lint + typecheck + test coverage on every push |

---

## 🚀 Setup & Run Locally

```bash
# 1. Install dependencies
cd setu
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your Firebase web config values (public identifiers — not secrets)
# and your reCAPTCHA v3 site key

# 3. Start dev server
npm run dev

# 4. Run checks
npm run lint        # ESLint, 0 warnings allowed
npm run typecheck   # TypeScript strict mode
npm run test        # 99 unit tests
npm run test:coverage  # Coverage report
```

---

## ♿ Accessibility Features

- **Accessibility Profile** — wheelchair (step-free routing), low vision (high contrast + TTS), deaf/HoH (no voice, caption-first), cognitive/sensory (simple language).
- **Keyboard operable** — every interactive element is reachable and operable by Tab/Enter/Escape alone.
- **`aria-live` regions** — new AI responses are announced automatically by screen readers.
- **Skip-to-content link** — first focusable element in the DOM.
- **`prefers-reduced-motion`** — all animations disabled when system preference is set.
- **WCAG AA contrast** — verified in both default dark and high-contrast themes.

---

## 🔒 Security Model

| Threat | Mitigation |
| :--- | :--- |
| API key exposure | Key lives only in Firebase AI Logic server proxy — never in bundle |
| XSS from LLM output | All model text sanitized through `DOMPurify` allow-list before render |
| Quota abuse | Firebase App Check (reCAPTCHA v3) enforced on every AI Logic call |
| Prompt injection | Input capped at 500 chars and stripped of control characters before sending |
| Firestore data leakage | Rules allow only increment-writes to anonymized counters; reads denied |

---

## 📋 Assumptions

1. **Mock venue data** — `venueGraph.json` and `faq.json` represent a single representative stadium. Real deployment would ingest venue-specific data at build time.
2. **No authentication required** — fans use the app anonymously; no PII is collected or stored.
3. **Web Speech API** — voice input runs browser-native; no additional Google service cost.
4. **Free tier throughout** — Gemini Developer API + Firebase Spark plan + Cloud Run (scale-to-zero) cover all infrastructure with no billing surprises.

---

## 📁 Repository Layout

```
setu/
├── .env.example                 ← Public placeholder; real .env is git-ignored
├── Dockerfile                   ← Multi-stage build → Nginx Alpine serve
├── docs/
│   ├── 1_PRD.md                 ← Product Requirements Document
│   ├── 2_SRS.md                 ← Software Requirements Specification
│   ├── TEST_SCENARIOS.md        ← Manual scenario matrix (all 10 pass)
│   ├── FUTURE_WORK.md           ← Deliberate scope cuts
│   └── design-reference/        ← Stitch-generated UI screens (reference only)
├── .github/workflows/ci.yml     ← GitHub Actions CI pipeline
├── src/
│   ├── components/              ← ChatConsole, MapView, AccessibilityPanel, …
│   ├── hooks/                   ← useChat, useAccessibilityProfile, useLanguage
│   ├── lib/                     ← pathfinding, knowledgeBase, gemini, sanitize, cache
│   ├── data/                    ← venueGraph.json, faq.json, mockLiveEvents.json
│   └── types/                   ← Shared TypeScript interfaces
└── firestore.rules              ← Anonymized-analytics-only security rules
```

## 🧪 Test Coverage

| Module / Component | Statement Coverage | Branch Coverage | Function Coverage |
| :--- | :--- | :--- | :--- |
| `lib/pathfinding` | 100% | 89.36% | 100% |
| `lib/knowledgeBase` | 100% | 100% | 100% |
| `lib/sanitize` | 100% | 100% | 100% |
| `lib/cache` | 100% | 100% | 100% |
| `lib/uuid` | 100% | 100% | 100% |
| `hooks/useChat` | 100% | 97.36% | 100% |
| `components/MapView` | 100% | 96.82% | 100% |
| `components/OpsLiteDashboard` | 100% | 87.17% | 100% |
| `components/VoiceInputButton` | 100% | 96.55% | 100% |
| **Overall Project Total** | **99.13%** | **94.86%** | **98.18%** |

**153 unit and integration tests across 16 test files — 100% passing.**

---

## 🎯 Problem Statement Alignment

Setu directly solves **Challenge 4: Smart Stadiums & Tournament Operations** by addressing key operational friction points for the FIFA World Cup 2026:

1. **Multilingual Inclusivity & Translation**:
   - International fans can query in their native language (e.g. Hindi, Spanish).
   - The dual-call AI pipeline detects query language instantly (`onLanguageDetected`) and generates Gemini-composed translated text response back.

2. **Smart, Step-Free Accessibility Routing**:
   - The Dijkstra pathfinder supports routing constraints. Wheelchair and priority profiles compute step-free pathways (avoiding stairs, utilizing elevators/ramps).
   - High-contrast, large text, and text-to-speech toggles accommodate visual/hearing-impaired fans dynamically.

3. **Real-time Crowds & Delays Mitigation**:
   - Live events (congestion, weather alerts, gate delays) are injected into the navigation context.
   - Pathfinder automatically routes around high-congestion zones in real-time, preventing bottleneck formations.

4. **Robust Operational Steward Controls**:
   - Includes a read-only Ops Lite Dashboard for stewards, consolidating live crowd severity levels, queue wait times, active emergency alerts, and transit details.

5. **Hallucination-Free AI Integration**:
   - Deterministic operations (Dijkstra navigation and local database matching) are handled in local TypeScript code.
   - Natural language generation (Gemini) is strictly limited to explaining computed results, ensuring safety.

6. **Free-Tier/No-Billing Design**:
   - Avoids expensive cloud compute resources. Operates fully client-side and deployed on Firebase Hosting's permanently free tier.

