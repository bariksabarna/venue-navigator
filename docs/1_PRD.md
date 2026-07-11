# Product Requirements Document (PRD)
## Setu — AI Stadium Concierge for FIFA World Cup 2026
**Event:** Hack2Skill × Google for Developers — "Prompt Wars: Build with AI"
**Challenge:** Challenge 4 — Smart Stadiums & Tournament Operations
**Doc version:** 1.0 · **Date:** 11 July 2026
**Team:** Hack Orbit (Sabarna Barik)

---

## 1. Why this document exists

This PRD is the single source of truth for *what* we're building and *why*. Antigravity (our coding agent) and Stitch (our UI generator) will both be prompted using this document as ground truth. If a feature isn't in here, it doesn't go in the repo — scope creep is the #1 way hackathon submissions lose points on Code Quality and Efficiency.

---

## 2. Problem statement (as given)

> Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff. The solution must leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support during the FIFA World Cup 2026.

## 3. Chosen persona & vertical (locked — do not change mid-build)

| | Decision | Reasoning |
|---|---|---|
| **Persona** | **Fans / Spectators**, specifically the "high-need" fan on match day: international, non-English-speaking, possibly elderly or disabled, time-pressured, in or near the stadium | Broadest, most demoable, most emotionally legible to judges. Every other persona (volunteer, organizer, staff) is included only as a *thin secondary view*, never the anchor. |
| **Primary vertical** | **Navigation & Real-Time Decision Support**, delivered through a **multilingual, accessibility-first conversational concierge** | Navigation is the one vertical where "did the AI actually help me get somewhere" is trivially demoable in a 3-minute pitch, and it naturally *requires* multilingual + accessibility + real-time context to be done well — so we get 4 of the 8 listed verticals for free, coherently, instead of bolting on unrelated features. |
| **Secondary verticals (supporting, not primary)** | Crowd management + operational intelligence (via an opt-in "Ops Lite" read-only view built from anonymized, aggregated fan questions) · Sustainability (contextual nudges, e.g. nearest water-refill station) | These reuse the *same* data the fan-facing assistant already produces — no separate feature to build, no extra attack surface, no scope creep. |

**Single-sentence pitch:** *Setu is a multilingual, accessibility-aware AI concierge that a FIFA World Cup 2026 fan opens on their phone, asks anything in their own language or voice, and gets a grounded, context-aware answer — a walking route that respects their mobility needs, a safety heads-up about the gate they're headed to, or a straight answer to "where's the nearest accessible restroom" — with zero app download and zero language barrier.*

---

## 4. Goals & success metrics

| Goal | Metric (how we'll demonstrate it to judges) |
|---|---|
| Understand a fan in *any* language without a separate translation step | Live demo in 3+ languages (e.g. English, Hindi, Spanish) using the same input box |
| Give genuinely useful navigation, not generic chatbot text | Deterministic shortest-path route rendered on the map + spoken/written turn-by-turn, not just prose |
| Be usable by fans with disabilities | Lighthouse Accessibility score ≥ 95, full keyboard + screen-reader walkthrough recorded as demo proof |
| Be fast and cheap enough to run at stadium scale on free tiers | P50 AI response < 3s using Gemini Flash; response caching cuts repeat-query API calls |
| Work when stadium Wi-Fi is bad | PWA shell + knowledge base cached offline; app shows a graceful "offline mode" instead of breaking |
| Be safe to put in front of strangers | No PII stored, no exposed API keys, sanitized model output, scoped system prompt (see SRS §7) |
| Prove real-world usefulness beyond the happy path | 8–10 scripted test scenarios covering edge cases (no results, out-of-scope question, accessibility mode, offline) |

---

## 5. Target users & core scenarios

1. **Priya**, 24, from India, first World Cup trip, doesn't speak fluent English. Opens the app, types in Hindi: *"मुझे गेट 4 से मेरी सीट तक कैसे जाना है?"* → gets step-by-step directions in Hindi, plus an English caption underneath for anyone helping her.
2. **Robert**, 61, wheelchair user. Turns on "step-free routes" in his accessibility profile once. Every future route Setu gives him automatically avoids stairs and prefers ramps/elevators, without him having to ask each time.
3. **Amara**, low vision. Uses voice input and voice output end-to-end; UI respects high-contrast + large-text mode; every AI response is announced via an ARIA live region for her screen reader.
4. **Diego**, a volunteer at Gate 7. Opens the (secondary) Ops Lite view and sees, in real time, that "nearest restroom" and "Gate 3 congestion" are the top two questions fans near his zone are asking — useful signal without any fan's raw conversation being exposed to him.

---

## 6. Feature scope (MoSCoW)

### Must have (MVP — judged core)
1. **Multilingual conversational concierge** — auto-detects the fan's language from free text or voice, replies in the same language, no separate translation API call (Gemini's native multilingual reasoning does this).
2. **Context-aware navigation** — fan states current location (gate/section) and destination; a deterministic graph pathfinder computes the actual shortest walkable route; Gemini turns that route into a natural, friendly, correctly-languaged explanation and highlights it on a custom SVG stadium map.
3. **Accessibility profile** — one-time setup (wheelchair / low vision / deaf-or-hard-of-hearing / cognitive-sensory-friendly / none) that changes both the **route logic** (step-free preference) and the **UI** (contrast, text size, sentence simplicity, captions).
4. **Real-time decision support** — a simulated live "stadium events" feed (gate congestion, weather, delays) that the assistant proactively factors into its answers ("Gate 3 is busy right now, Gate 5 is 2 minutes further but faster").
5. **Grounded FAQ answers** — a small curated knowledge base (tickets, prohibited items, transit, amenities) is retrieved and given to Gemini as context, so answers are grounded instead of hallucinated.

### Should have
6. Voice input/output via the browser's native Web Speech API (free, no extra service).
7. Installable, offline-capable PWA (cached app shell + knowledge base) — genuinely useful given real stadium connectivity, and doubles as our "efficiency/sustainability" story (fewer repeat network calls).
8. **Ops Lite** secondary view: anonymized, aggregated counts of what fans are asking about, grouped by zone/topic — no raw text, no user identifiers.

### Could have (stretch, only if MVP is solid and time remains)
9. Sustainability nudges (nearest refill station, recycling point) surfaced opportunistically in relevant answers.
10. Simple-icon / pictogram mode for very low-literacy or very young fans.

### Won't have (explicitly out of scope this cycle)
- Real ticketing/payment integration
- Live integration with an actual stadium's official data systems
- Native iOS/Android apps (PWA only)
- Login/accounts — accessibility & language prefs are stored client-side only

---

## 7. Assumptions (state these plainly in the README — judges expect this)

- Because no real FIFA/stadium operations API is publicly available, **venue map, FAQ content, and "live" congestion/weather data are curated demo datasets**, clearly labeled as sample data, modeled on one representative host stadium.
- The build targets the **Gemini Developer API free tier via Firebase AI Logic**, which requires no billing account or credit card — chosen specifically so any team member can redeploy without payment friction.
- "Real-time" means the architecture is wired to consume a live feed (Firestore doc or polled JSON) — for the demo, that feed is manually/programmatically updated to simulate real events, not sourced from live IoT sensors.
- Single representative stadium map is used for depth over breadth; the data model is generic enough to add more venues later (documented as future work).

---

## 8. Evaluation alignment matrix

| Rubric criterion | How the product addresses it |
|---|---|
| **Problem Statement Alignment** | Directly built around one persona (fan) + one primary vertical (navigation/real-time decision support), explicitly touching multilingual, accessibility, crowd management, and sustainability as coherent extensions — not disconnected bolt-ons. |
| **Code Quality** | TypeScript, modular structure (`lib/`, `components/`, `hooks/`, `data/`), ESLint + Prettier enforced in CI, deterministic pathfinding logic kept separate from AI/prompt logic. |
| **Security** | Gemini key never touches the client (Firebase AI Logic + App Check); model output sanitized before render; scoped system prompt; no PII; Firestore rules lock down the one write path used for anonymized analytics. |
| **Efficiency** | Gemini Flash model, response caching, offline PWA shell, client-side deterministic pathfinding (zero API cost per route), code-split bundle, generous use of Google's genuinely free tiers (Firebase Spark, Gemini free tier, GitHub Actions on public repos). |
| **Testing** | Unit tests for pathfinding + prompt-formatting/parsing utilities, component tests for key UI states, automated accessibility checks (axe-core) in CI, a documented manual test-scenario matrix (see SRS §10). |
| **Accessibility** | WCAG 2.2 AA target, accessibility profile that changes real app behavior (not just a cosmetic toggle), full keyboard support, ARIA live regions, voice I/O. |

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gemini free-tier rate limits hit during judging/demo | Response caching + a small local fallback response set for the exact scripted demo queries |
| Model hallucinates a route or unsafe instruction | Routes are never generated by the LLM — they come from the deterministic pathfinder; the LLM only explains/translates them |
| Repo exceeds 10 MB | No committed `node_modules`, no video/photo assets, SVG-only graphics, `.gitignore` enforced from commit #1 |
| Judges can't run it locally in time | Deploy a live demo on Firebase Hosting free tier in addition to the repo |
| Scope creep late in the build | This PRD is locked; anything not listed in §6 goes into a `FUTURE_WORK.md`, not the codebase |

---

## 10. What "done" looks like for submission

- [ ] Public single-branch GitHub repo, < 10 MB
- [ ] README covering: chosen vertical, approach/logic, how it works, assumptions (per submission instructions)
- [ ] Live demo link (Firebase Hosting) in addition to source
- [ ] CI green (lint + typecheck + unit tests + a11y checks) on the latest commit
- [ ] This PRD and the companion SRS included under `/docs`
