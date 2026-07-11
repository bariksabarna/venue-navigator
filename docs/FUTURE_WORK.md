# Setu Stadium Concierge — Future Work & Roadmap

This document outlines key roadmap items and architectural improvements that were cut from the MVP due to the hackathon's strict scope, billing, and resource constraints.

---

## 🗺️ Future Enhancements

### 1. Real-time Sensor & Crowd Integrations
- **Dynamic Congestion Routing**: Integrating IoT sensors at stadium turnstiles to update edge weights in `venueGraph.json` dynamically. This would allow Dijkstra to route fans away from heavily congested gates.
- **Queue Wait Time Prediction**: Utilizing historical queue data to output estimated wait times for concession stands and restrooms.

### 2. Multi-lingual Voice Accents & Offline TTS
- **Offline Speech Synthesis**: Implementing localized on-device Speech Synthesis models for when internet access is fully disconnected.
- **Accented Speech Recognition**: Fine-tuning speech recognition models to better support diverse fan accents from visiting FIFA World Cup 2026 nations.

### 3. Interactive 3D/WebXR Map Rendering
- **3D Stadium Visuals**: Upgrading the simple 2D SVG `MapView` to an interactive 3D WebGL or Three.js representation.
- **Augmented Reality (AR) Directions**: Allowing users to overlay pathfinding routes directly onto their phone's camera view.

### 4. Enterprise-Grade Security (App Check in Prod)
- **App Check Enforcements**: Fully enforcing App Check with Device Check (iOS) / Play Integrity (Android) in a non-debug production deployment to completely eliminate API key harvesting.
- **Rate-Limiting per User Session**: Adding middleware layer protection to prevent DDoS attacks against Firebase AI Logic endpoints.
