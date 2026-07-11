# LinkedIn Post

🚀 Exciting news! I have successfully built and deployed **Setu**, a Smart Stadium AI Concierge for the FIFA World Cup 2026, designed to support international and accessibility-priority fans.

🔗 **Try it live**: https://setu-concierge-1059171200393.us-central1.run.app

### 💡 The Architecture
Rather than delegating navigation directly to the LLM (which is prone to hallucinations), Setu uses a **hybrid deterministic-pathfinding + Gemini-explains architecture**:
1️⃣ **Gemini Developer API (via Firebase AI Logic)** parses user intent, detects language, and identifies destination/source points.
2️⃣ **Local Dijkstra Pathfinder** computes the mathematically guaranteed shortest path, dynamically avoiding stairs if the user's accessibility profile requires step-free routing.
3️⃣ **Gemini Explainer** synthesizes the route, grounding it with FAQ info and live events, delivering a natural, accessible guidance response.

### 🌟 Key Highlights
* 🌐 **Automatic Language Detection**: Fans can speak or type in their native tongue and get an immediate translation/response.
* ♿ **Accessibility First**: Integrates high-contrast visual themes, text scale resizing, screen reader announcements (`aria-live`), and step-free navigation.
* ⚡ **Performance & PWA**: Under 300KB initial bundle size with offline mode caching for reliable use in crowded stadium environments.
* 🛡️ **Security Built-In**: All LLM outputs are fully sanitized via DOMPurify to eliminate XSS, and Firebase App Check secures the endpoints.
* 🧪 **100% Tested**: Features 99 unit and component tests achieving 100% coverage in core routing and RAG logic.

Shoutout to Google Developers for the awesome Gemini Developer API! 

#GoogleDevelopers #PromptWars #FIFAWorldCup #SmartStadiums #Gemini #WebDevelopment #ReactJS #Accessibility #A11y
