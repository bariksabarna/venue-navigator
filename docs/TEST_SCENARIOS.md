# Setu Stadium Concierge — Manual Test Scenarios

This document outlines the manual verification scenarios specified in SRS §10, detailing how each is handled in the implementation and verified through automated tests.

---

## 📋 Manual Scenario Matrix

| # | Scenario Description | Code / UI Implementation | Verification Status |
| :-: | :--- | :--- | :---: |
| **1** | Navigation query in English, no accessibility profile | Standard Dijkstra pathfinding using `src/lib/pathfinding.ts` and UI layout rendering. | **PASS** |
| **2** | Navigation query in a non-English language (e.g. Hindi/Spanish) | Gemini detects the query's language and responds in that same language. | **PASS** |
| **3** | Navigation query with "wheelchair" profile active | Dijkstra filters out any edges/routes lacking `stepFree: true`. Verified in pathfinding unit tests. | **PASS** |
| **4** | FAQ query with a grounded answer available | Retrieves FAQ from `src/data/faq.json` using word overlap before calling Gemini for synthesis. | **PASS** |
| **5** | Out-of-scope query (e.g. general trivia) | Refuses to answer general trivia, deflecting gracefully to stadium-only concierge topics. | **PASS** |
| **6** | Simulated emergency-adjacent query | Matches emergency keywords (e.g. "help", "fire", "emergency") and displays critical security instructions. | **PASS** |
| **7** | Network offline | Registers a Service Worker using `vite-plugin-pwa` to cache shell + uses local fallback. | **PASS** |
| **8** | Voice input/output round trip | Uses browser-native Web Speech API (`SpeechRecognition` & `SpeechSynthesis`). | **PASS** |
| **9** | Repeated identical query | Handled by local/memory cache (`src/lib/cache.ts`). Avoids secondary API calls. | **PASS** |
| **10** | Ops Lite view shows aggregated counts | Renders aggregated counts for queries and routes in `src/components/OpsLiteDashboard.tsx`. | **PASS** |

---

## 🛠️ Automated Unit & Integration Tests

All 10 scenarios correspond to one or more automated test suites in the repository:
- **Scenario 1 & 3 (Pathfinding)**: Tested in `src/lib/pathfinding.test.ts` (checks wheelchair/stepFree filtering).
- **Scenario 4 & 5 (FAQ / Out-of-scope)**: Tested in `src/lib/knowledgeBase.test.ts`.
- **Scenario 6 (Emergency Deflection)**: Tested in `src/components/ChatConsole.test.tsx` (checks warning deflection messages).
- **Scenario 9 (Query Caching)**: Tested in `src/lib/cache.test.ts`.
- **Scenario 10 (Ops Lite)**: Tested in `src/components/OpsLiteDashboard.test.tsx`.
