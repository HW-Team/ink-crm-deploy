---
version: alpha
name: Ink Homes CRM
description: Data-dense LIGHT-theme CRM for the Ink team and the Ink agent — clean white canvas, cyan as the single interaction color, Noto Sans Thai for Thai copy, quiet surfaces so 800+ leads stay scannable. CZ chose light over dark ("ไม่ชอบดำๆมันง่วง").
colors:
  background: "#F6F8FA"
  surface: "#FFFFFF"
  surface-raised: "#EEF2F7"
  border: "#E2E8F0"
  text-primary: "#0F172A"
  text-secondary: "#334155"
  text-muted: "#5B6B7C"
  primary: "#0E7490"
  on-accent: "#FFFFFF"
  success: "#15803D"
  warning: "#B45309"
  danger: "#B91C1C"
  stage-new: "#64748B"
  stage-contacted: "#0369A1"
  stage-qualified: "#15803D"
  stage-sitevisit: "#6D28D9"
  stage-proposal: "#B45309"
  stage-won: "#166534"
  stage-unqualified: "#64748B"
  stage-lost: "#B91C1C"
  stage-duplicate: "#64748B"
  stage-noanswer: "#C2410C"
typography:
  font-family:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
  h1:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.35
  body-md:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.55
  table-cell:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Noto Sans Thai, Inter, system-ui, sans-serif"
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  button-primary-hover:
    backgroundColor: "{colors.stage-contacted}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
  card-hover:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
  table-header:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: 10px 12px
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.table-cell}"
  table-row-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 9px 12px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 9px 12px
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
  sidebar-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  badge-neutral:
    backgroundColor: "{colors.stage-new}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-contacted:
    backgroundColor: "{colors.stage-contacted}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-sitevisit:
    backgroundColor: "{colors.stage-sitevisit}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-won:
    backgroundColor: "{colors.stage-won}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-unqualified:
    backgroundColor: "{colors.stage-unqualified}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-duplicate:
    backgroundColor: "{colors.stage-duplicate}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  badge-noanswer:
    backgroundColor: "{colors.stage-noanswer}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  kpi-value:
    textColor: "{colors.text-primary}"
    typography: "{typography.h1}"
  kpi-label:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
---

## Overview

Ink Homes CRM is a **light**, data-dense application (CZ explicitly rejected the dark navy theme: "ไม่ชอบดำๆมันง่วง"). The team stares at hundreds of leads a day, so the design prioritizes scannability: a clean white/gray canvas (`#F6F8FA`) with white surface cards, hairline `#E2E8F0` borders, ONE cyan interaction color (`#0891B2`, darkened from `#22d3ee` for WCAG on white), and stage-coded badges with white text. Thai is the primary UI language — everything renders in Noto Sans Thai.

The design bar is non-negotiable: no generic AI-default layouts, no templated dashboards. Every screen ships against these tokens.

## Colors

- **Background (`#F6F8FA`)** — light gray-white canvas. App chrome, page background.
- **Surface (`#FFFFFF`)** — cards, tables, panels, sidebar.
- **Surface raised (`#EEF2F7`)** — hover states, table headers, active nav.
- **Border (`#E2E8F0`)** — hairline dividers. The light theme lives on thin lines and space, not shadows.
- **Primary (`#0891B2`)** — cyan-700. THE interaction color: primary buttons, links, active nav, focus rings. Dark enough for white text (WCAG AA ~5:1). Used sparingly.
- **On-accent (`#FFFFFF`)** — text on cyan/stage-colored fills.
- **Success / Warning / Danger** — semantic status colors, inside badges and follow-up due states.
- **Stage colors** — darkened for light backgrounds with white text (contacted `#0284C7`, qualified `#16A34A`, site visit `#7C3AED`, proposal `#D97706`, won `#15803D`, lost `#DC2626`, no-answer `#EA580C`).

## Typography

- **Noto Sans Thai** for all Thai copy, **Inter** for Latin/digits — one font stack.
- Data tables use `table-cell` (0.875rem) — dense but legible.
- Labels small (0.75rem), uppercase-tracked, muted.
- Mono (`JetBrains Mono`) only for IDs and phone numbers.

## Layout & Spacing

- Spacing scale: 4 / 8 / 16 / 24 / 32px. 16px default gutter between cards; 24px between sections.
- Max content width ~1280px for list pages; dashboards stretch wider.
- Left sidebar (collapsible on mobile): วันนี้ · แดชบอร์ด · ลีด · บอร์ด · ปฏิทิน · คอนแทกต์ · ติดตาม.
- Mobile-first: bottom nav on phones, tables degrade to stacked cards.

## Elevation & Depth

- Light theme: subtle elevation via surface steps + 1px borders. Shadows only on floating elements (modals, toasts, Google login button) — tinted to the bg hue, never pure black.

## Shapes

- Cards/panels 14px; buttons/inputs 10px; badges pill; table rows full-bleed.

## Components

- **Button primary** — cyan-700 fill, white text. One per view. Hover: `#0284C7`.
- **Button secondary** — raised surface, secondary text, hairline border.
- **Card** — white surface, hairline border. KPI cards: big bold dark value, muted tracked label.
- **Table** — raised header with tracked small caps, hairline row dividers, hover highlight, stage badges inline.
- **Input** — white input, hairline border, cyan focus border. Labels above.
- **Sidebar** — white surface; active item = raised + cyan text with left indicator bar.
- **Badges** — pill; white text on stage/semantic colors.
- **KPI card** — large bold number (near-black), small muted label.

## Do's and Don'ts

- Do use cyan for ONE interaction per view — primary action, focused field, active nav.
- Do keep the canvas light and the data dark: near-black for numbers, slate for body, muted for metadata.
- Do use stage badges with white text for stage values.
- Do keep tables dense — 0.875rem, tight rows.
- Don't use dark sections inside the light app (login, drawers, modals all stay light).
- Don't use heavy shadows or gradients for depth — hairline borders and surface steps.
- Don't render Thai in any AI-generated image; Thai is always real text in Noto Sans Thai.
- Don't add chart libraries for v1 KPIs — CSS bars and big numbers are enough.
- Don't ship a layout that looks templated. If it looks like a generic admin template, it fails review.
