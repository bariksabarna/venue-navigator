# Setu — AI Stadium Concierge | FIFA World Cup 2026

**Setu** is an intelligent indoor navigation and informational concierge designed for international and accessibility-priority fans attending the FIFA World Cup 2026. 

Live Demo Link: [https://setu-concierge-1059171200393.us-central1.run.app](https://setu-concierge-1059171200393.us-central1.run.app)

---

## 🎯 Chosen Vertical & Persona

*   **Vertical**: Smart Stadiums & Tournament Operations (Challenge 4).
*   **Target Persona**: International fans (requiring multi-lingual support), accessibility-priority fans (wheelchair users, sensory/cognitive-sensitive fans, and visual/hearing impaired fans), and local stewards needing operational insight.

---

## 💡 Core Philosophy & Architecture

A key architectural constraint of **Setu** is that **navigation is never delegated to the LLM**. 
Instead, we use a hybrid **two-call deterministic-pathfinding + Gemini-explains architecture**:

```
[ User Query (Voice/Text) ] 
       │
       ▼
[ Call 1: Gemini Intent Parser ] ───► Parses language, intent, nodes, reading level
       │
       ▼
[ Local Dijkstra Pathfinder ] ───► Calculates shortest path (excludes stairs if wheelchair)
       │
       ▼
[ Call 2: Gemini Explainer ] ◄───► Combines path, FAQs, live alerts & sensory profiles
       │
       ▼
[ User Output (TTS/UI) ] ◄───────► Highlights SVG Map & Speaks / Displays Response
```

### Why this approach?
1.  **Safety**: Prevents LLM hallucinations or direction errors. The path is mathematically guaranteed to be correct.
2.  **Privacy & Compliance**: Zero PII is stored. Analytics are aggregated on a strictly anonymized counter basis.
3.  **Low Latency & Cost**: Lightweight local pathfinding and query caching ensure extremely fast response times and minimal token costs.

---

## 🛠️ Tech Stack & Setup Instructions

*   **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
*   **Unit Tests**: Vitest + React Testing Library (99 tests, 100% logic coverage)
*   **Abuse Prevention**: Firebase App Check (reCAPTCHA v3) + DOMPurify sanitization
*   **Hosting & Deployment**: Google Cloud Run (serving via Nginx on Alpine)

### Running Locally

1.  Clone the repository and navigate to the project directory:
    ```bash
    cd setu
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root based on `.env.example` and add your Firebase credentials:
    ```bash
    cp .env.example .env
    ```
4.  Start the local development server:
    ```bash
    npm run dev
    ```
5.  Run lint, type checks, and tests:
    ```bash
    npm run lint
    npm run typecheck
    npm run test
    ```

---

## 📋 Key Assumptions Made

1.  **Mock Data**: The stadium graph and live events are mock datasets representing a representative tournament venue.
2.  **Local Web Speech API**: Speech-to-text uses the browser's native Web Speech API, which runs entirely client-side without charging external service usage.
3.  **Spark/Free Tier**: The application runs completely on Google's free-tier offerings.
