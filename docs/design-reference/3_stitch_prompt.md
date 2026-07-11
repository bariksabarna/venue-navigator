# Stitch Prompts — Setu UI/UX Generation

Use these at **stitch.withgoogle.com**. Paste the **Master Prompt** first (use Thinking/Experimental mode for higher quality since this is a multi-screen app). Then use the **Follow-up Refinement Prompts** one at a time, in order, on the generated canvas. Once you're happy, use **Paste to Figma** or **Export code** and hand the design off to Antigravity (which will re-implement it as clean, typed React + Tailwind — see `4_ANTIGRAVITY_START_PROMPT.md`). Do not ship Stitch's exported HTML/CSS directly; it's a design reference.

---

## Master Prompt (paste this first)

```
Design a mobile-first web app called "Setu" — an AI concierge for FIFA World Cup 2026 stadium fans.
It is calm, trustworthy, and instantly readable at a glance by someone standing in a loud, crowded
stadium concourse — think airport-signage clarity, not a flashy consumer chat app.

Visual identity: deep pitch-green (#0B6E4F family) and clean white as primary colors, warm gold
(#D4A017 family) as a single accent used sparingly for calls to action, rounded but not bubbly
corners, generous white space, large legible type (system sans-serif). Avoid anything that looks
like a generic AI chatbot template — this should feel like official tournament signage that happens
to be conversational. Include a subtle world-cup/globe motif in the header only, nothing busy.

Generate these screens as one connected flow:

1. "Home / Concierge" screen — a large, welcoming chat interface. Top bar shows the Setu wordmark,
   a language indicator pill (auto-detected, tappable to override), and a small accessibility icon
   button. Below that, a big friendly prompt: "Ask me anything about today's match" with a text input
   that has a microphone icon inside it for voice input, and 3 example quick-reply chips: "Find my
   seat", "Nearest restroom", "Is Gate 3 busy?". Chat bubbles below: user bubble right-aligned in
   pitch-green, AI bubble left-aligned in soft white/gray with a small route/map preview thumbnail
   inline when the AI answer includes a route.

2. "Route / Map" screen — a clean top-down SVG-style stadium map (simplified oval bowl shape with
   labeled gates around the perimeter and numbered sections inside), a highlighted path line from
   the fan's current gate to their destination, a bottom sheet with step-by-step directions in large
   text, an estimated walk time, and a toggle chip "Step-free route" that's visibly active when the
   fan's accessibility profile requires it.

3. "Accessibility & Language Setup" screen — a simple one-time onboarding card: language picker
   (flags + names), then accessibility profile picker as large tappable cards with icons: "Wheelchair
   / step-free", "Low vision", "Deaf or hard of hearing", "Cognitive / sensory-friendly", "None of
   these apply". Below, a live preview showing how the chat UI changes (bigger text / high contrast)
   as you pick an option.

4. "Alerts" component — a slim, dismissible banner that can appear above the chat, e.g. amber for
   "Gate 3 is busy right now — Gate 5 is your best bet", used for real-time proactive alerts.

5. "Ops Lite" screen (secondary, clearly visually distinct — muted gray-blue palette instead of
   green, to signal 'this is the staff view not the fan view') — a simple dashboard for volunteers:
   a bar chart of "Most asked-about zones in the last hour" and a short list of "Top topics" (e.g.
   "Restroom location", "Gate congestion", "Ticket entry"), no raw chat text anywhere on this screen.

Accessibility requirements baked into the design itself (not optional polish): minimum 4.5:1 text
contrast everywhere, visible focus outlines on all interactive elements, touch targets at least
44x44px, no information conveyed by color alone (use icons + text labels together), and a
high-contrast theme variant for screens 1–2.

Generate for: Web, responsive, mobile-first (also usable on a tablet kiosk in landscape).
```

---

## Follow-up Refinement Prompt 1 — Voice state
```
On the Home / Concierge screen, add a visual state for when the microphone is actively listening:
the mic icon pulses gently, input field shows a live "Listening…" label, and a cancel (X) button
appears. Keep it calm — no aggressive animation.
```

## Follow-up Refinement Prompt 2 — Offline state
```
Add an "offline mode" banner variant for the Home screen: a slim gray banner at the very top reading
"You're offline — showing saved info" with a small offline-cloud icon. The rest of the chat interface
stays usable underneath it, just visually indicate cached vs. live content with a small "cached"
tag on relevant AI bubbles.
```

## Follow-up Refinement Prompt 3 — High-contrast theme
```
Generate a high-contrast theme variant of the Home and Route screens: pure black background, pure
white text, the pitch-green becomes a brighter accessible green, gold accent becomes a brighter
amber — verify all text/background pairs would pass WCAG AA contrast. Keep exact same layout, only
recolor.
```

## Follow-up Refinement Prompt 4 — Empty / error states
```
Design two small states for the chat interface: (1) an "I don't have that information" AI bubble
with a gentle icon, offering a fallback like "Ask a nearby volunteer" — not a dead end. (2) An
out-of-scope deflection bubble for a question outside stadium topics, politely redirecting back to
what Setu can help with.
```

---

### After exporting
- Use **Paste to Figma** if you want a designer teammate to polish further, or **Export code** to hand a visual reference to Antigravity.
- Screenshot every screen + both theme variants — these go straight into your README and your submission demo video.
