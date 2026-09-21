---
name: "Eater Egg Fresh Mart"
description: "Warm, tactile, and dependable retail checklist & operational design system"
colors:
  primary: "#78483b"
  primary-dim: "#5c352a"
  primary-glow: "rgba(120, 72, 59, 0.12)"
  amber: "#f59e0b"
  amber-dim: "#d97706"
  amber-glow: "rgba(245, 158, 11, 0.15)"
  background: "#fffdf9"
  surface: "#ffffff"
  surface-2: "#fcf8f2"
  border: "#eadbce"
  border-subtle: "#f2e7dc"
  text: "#2b1413"
  text-muted: "#78483b"
  text-subtle: "#9c6c60"
  success: "#15803d"
  danger: "#dc2626"
typography:
  display:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
  headline:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
  micro:
    fontFamily: "Prompt, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.1
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: "2px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Eater Egg Fresh Mart

## Overview

**Creative North Star: "The Farm-Fresh Field Ledger"**

The Eater Egg Fresh Mart design system bridges warm, approachable grocery retail identity with high-accountability floor operations. Rejecting cold corporate blues and generic SaaS tables, it embraces rich eggshell backgrounds (`#fffdf9`), yolk amber accents (`#f59e0b`), and deep roast brown typography (`#2b1413`).

The interface is calibrated for walk-around retail floor usage in Thailand: cashiers auditing cash floats, stock teams logging cold storage temperatures, and store managers signing off on shift handoffs.

**Key Characteristics:**
- **Warm & Tactile**: Organic eggshell tones paired with satisfying 16px radius cards that give clear visual feedback.
- **Ergonomic Floor Usability**: Sticky bottom thumb-zone docks for primary actions on handheld mobile devices.
- **Bilingual Harmony**: Powered by the Cadson Demak `Prompt` typeface, providing seamless x-height and baseline balance across Thai and Latin scripts.

## Colors

The color palette is warm, appetizing, and strictly accessible (>4.5:1 text contrast on light grounds; >7:1 for status pills).

### Primary
- **Roast Chestnut** (`#78483b`): Primary brand accent, used for prominent headings, key identity badges, and focused borders.
- **Chestnut Dim** (`#5c352a`): Pressed states and high-emphasis icons.

### Secondary
- **Yolk Amber** (`#f59e0b`): The energetic heartbeat of the system. Used for progress bars, active selections, and primary call-to-actions.
- **Amber Glow** (`rgba(245, 158, 11, 0.15)`): Subtle ambient highlights behind active cards and badges.

### Neutral
- **Warm Eggshell** (`#fffdf9`): Main page background, soft on the eyes under harsh fluorescent grocery store lights.
- **Pure Surface** (`#ffffff`): Elevated card surfaces providing optical lift.
- **Soft Cream** (`#fcf8f2`): Secondary surface for tabs, inputs, and badge backdrops.
- **Warm Border** (`#eadbce`): Crisp 1px perimeter border for cards and containers.
- **Deep Espresso Text** (`#2b1413`): High-contrast readable body text.

### Named Rules
**The Tinted Text Rule.** Gray text on colored backgrounds is forbidden. Secondary text on colored alert or status badges must always use a darker shade of that color family (`text-amber-950` on amber, `text-rose-900` on rose).

## Typography

**Display Font:** Prompt (with `-apple-system`, `BlinkMacSystemFont` fallback)  
**Body Font:** Prompt  
**Mono Font:** JetBrains Mono (for timestamps, numeric IDs, and register counts)

### Hierarchy
- **Display** (800 weight, 1.75rem / 28px, 1.2 line-height): Top portal headers and modal titles.
- **Headline** (700 weight, 1.25rem / 20px, 1.3 line-height): Section groupings and shift summary cards.
- **Title** (600 weight, 1rem / 16px, 1.4 line-height): Checklist task item labels and card titles.
- **Body** (400 weight, 0.875rem / 14px, 1.5 line-height): Task descriptions, confirmation dialog instructions.
- **Label** (600 weight, 0.75rem / 12px, 1.3 line-height): Shift badges, time-window indicators, category tags.

## Layout

- **Mobile First Container**: Default floor views are constrained to max-width 42rem (672px / `max-w-2xl`) for optimal vertical scanability.
- **Floating Thumb Dock**: Interactive mobile floor screens feature a fixed bottom action bar (`bottom-0 left-0 right-0 z-40`) ensuring primary buttons are within natural one-handed thumb reach.
- **Consistent Grid Rhythm**: 8px base spacing scale with 16px horizontal screen gutters.

## Elevation & Depth

Surfaces rely primarily on tonal layering and crisp 1px borders rather than heavy drop shadows.

### Shadow Vocabulary
- **Subtle Rest** (`shadow-xs` / `0 1px 2px rgba(43, 20, 19, 0.04)`): Rest state for cards and badges.
- **Interactive Lift** (`shadow-md` / `0 4px 6px -1px rgba(245, 158, 11, 0.15)`): Hover and focus states on actionable cards.
- **Modal Overlay** (`shadow-2xl` / `0 25px 50px -12px rgba(0, 0, 0, 0.25)`): Dialogs and bottom action docks.

## Shapes

- **Card Radii**: 16px (`rounded-2xl`) for primary interactive cards and modals.
- **Control Radii**: 12px (`rounded-xl`) for buttons, text inputs, and segmented controls.
- **Badge Radii**: 9999px (`rounded-full`) for status pills, shift tags, and category chips.

## Components

### Checklist Item Cards
- Large tactile hit target (min 56px height) with smooth `active:scale-[0.99]` tap response.
- Completed state features amber tint (`bg-amber-50/50 border-amber-300`), strike-through label, and timestamp confirmation.

### Segmented Filter Controls
- Dark espresso active pill (`bg-[var(--color-brown)] text-amber-300`) with keyboard ArrowLeft/ArrowRight navigation.

### Bottom Action Dock
- Glassmorphic backdrop (`bg-white/95 backdrop-blur-md`) with total progress metrics and gated shift-end button.

## Do's and Don'ts

### Do:
- **Do** provide high-contrast text on all status badges (e.g. `text-rose-900` on `bg-rose-50`).
- **Do** keep primary operational buttons docked in the bottom thumb zone for floor staff.
- **Do** enforce modal focus trapping and Escape-key dismiss on all dialogs.

### Don't:
- **Don't** use generic cold blue (`#3b82f6`) or harsh unstyled gray slate borders.
- **Don't** use bouncy or elastic animation easings (`animate-bounce`); prefer smooth linear or exponential deceleration (`animate-pulse`, `ease-out`).
- **Don't** allow shifts to close without reaching 100% verified checklist completion.
