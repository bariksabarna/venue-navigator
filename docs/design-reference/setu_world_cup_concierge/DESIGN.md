---
name: Setu World Cup Concierge
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3f4943'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#6f7a73'
  outline-variant: '#bec9c1'
  surface-tint: '#056c4d'
  primary: '#00543b'
  on-primary: '#ffffff'
  primary-container: '#0b6e4f'
  on-primary-container: '#98edc6'
  inverse-primary: '#83d7b1'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#5e4500'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c5b00'
  on-tertiary-container: '#ffd784'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff4cc'
  primary-fixed-dim: '#83d7b1'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#005139'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#f6be39'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  touch-target: 44px
  container-margin: 20px
---

## Brand & Style
The design system is engineered for the high-stakes, high-energy environment of the FIFA World Cup 2026. It adopts a **Corporate / Modern** aesthetic with a specific focus on **Wayfinding Minimalism**. Much like international airport signage, the UI prioritizes immediate legibility and cognitive ease over decorative flair.

The target audience consists of international travelers, local fans, and stadium staff navigating complex physical environments. The emotional response is one of **composed reliability**; the interface acts as a calm, expert guide amidst the chaos of a stadium. The visual language is structured, professional, and authoritative, utilizing deep pitch-greens to ground the user in the sport's context while maintaining a high-utility, functionalist feel.

## Colors
The palette is anchored by **Pitch Green (#0B6E4F)**, used for primary headers, navigation bars, and brand-defining surfaces. **Clean White** serves as the primary canvas to ensure maximum readability and a sense of spaciousness.

**Warm Gold (#D4A017)** is reserved strictly for high-priority Call-to-Actions (CTAs) and critical wayfinding markers, such as seat locations or gate numbers. For the high-contrast mode, the system shifts to a pure black and white foundation with an **Amber (#FFBF00)** accent to ensure accessibility compliance in direct sunlight or for users with visual impairments. All color pairings must maintain a minimum 4.5:1 contrast ratio, with a preference for 7:1 on informational text.

## Typography
This design system utilizes **Hanken Grotesk** as the primary typeface. Its contemporary, sharp grotesque features provide the professional clarity required for an international concierge. Headlines are bold and tight to mimic stadium architectural lettering.

**JetBrains Mono** is used sparingly for labels, seat numbers, and data-heavy strings (like gate codes or timestamps) to provide a distinct technical "data-layer" feel that separates logistics from conversational AI responses. 

For mobile devices, display sizes are aggressively scaled down to maintain hierarchy without forcing excessive scrolling. All body text is set with generous line-height to ensure legibility while the user is walking.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a heavy emphasis on vertical rhythm based on an 8px baseline. 

- **Mobile:** 4-column grid, 20px side margins, 16px gutters.
- **Desktop:** 12-column centered grid, max-width 1280px.

A "Safe Zone" philosophy is applied: interactive elements never sit closer than 8px to each other to prevent accidental taps in crowded environments. Vertical spacing between logical sections (e.g., "Your Ticket" vs "Recommended Food") uses the `xl` (40px) unit to create a clear visual break without the need for heavy dividers.

## Elevation & Depth
The design system utilizes **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows. This ensures the UI remains legible under various lighting conditions (harsh sun or stadium floodlights).

- **Level 0 (Base):** White background.
- **Level 1 (Cards):** Subsurface colors (#F8F9FA) with a 1px border (#E9ECEF).
- **Level 2 (Modals/Overlays):** White surface with a tight, 8px blur, 10% opacity black shadow to provide just enough separation from the base.

Depth is primarily used to indicate "interactability." Elements that can be swiped or tapped have a subtle 1px inner stroke to provide a tactile edge.

## Shapes
The shape language is defined as **Rounded**. This softens the professional tone, making the AI feel approachable rather than clinical. 

Standard components (buttons, input fields) use a **0.5rem (8px)** radius. Larger containers, such as stadium maps or highlight cards, use **1rem (16px)**. This distinction helps users subconsciously categorize information: sharper corners for utility/tools, rounder corners for content/experience.

## Components
- **Buttons:** Primary buttons are Pitch Green with White text. Accent buttons (Gold) are used only for "Buy," "Enter," or "Confirm." All buttons must be at least 44px in height.
- **Chips:** Used for quick-reply AI prompts or category filters. These use a Pill-shape (full radius) with a 1px Pitch Green border.
- **Input Fields:** Minimalist design with a 1px grey border that thickens and turns Pitch Green on focus. Labels always remain visible above the field.
- **Cards:** Cards carry the stadium's "Wayfinding" look. They feature large headlines and clear iconography. If a card is informational (e.g., "Gate 4 Open"), it uses a left-accent bar in Green or Gold.
- **Lists:** High-density lists (like match schedules) use a 1px bottom divider with 16px of vertical padding per item to ensure tap accuracy.
- **AI Concierge Bubble:** The chat interface uses asymmetrical rounding (the corner pointing to the speaker is sharper) to clearly distinguish between user and AI.
- **Wayfinding Icons:** Custom-drawn, monoline icons with a 2px stroke weight to match the Hanken Grotesk weight.