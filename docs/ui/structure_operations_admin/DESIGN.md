---
name: Structure Operations Admin
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-metric:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 1.5rem
---

## Brand & Style

This design system is engineered for modern building operations, asset portfolios, and rental property management platforms. It speaks directly to property directors, facilities managers, leasing agents, and operational dispatchers who require continuous spatial awareness and quick administrative action under demanding conditions. 

The emotional tone balances institutional reliability, architectural precision, and operational calm. The visual language utilizes a disciplined Corporate Modern approach stripped of decorative friction, leaning heavily into data-dense clarity, clear state definitions, and zero-latency visual hierarchy. Clean structural geometry, distinct card demarcations, and explicit state signals replace ambiguous surface treatments to prevent operational mistakes, misallocated work orders, or missed lease deadlines.

## Colors

The palette establishes an ultra-scannable administrative workspace built around crisp contrast and purposeful signaling.

- **Primary (`#4f46e5` / `#6366f1`):** Precision Indigo. Reserved for primary operational actions, active navigation states, selected table rows, focused interactive inputs, and confirmed workflow submissions.
- **Secondary (`#0ea5e9`):** Technical Cyan. Applied to secondary data indicators, telemetry metrics, filter pills, and interactive telemetry data points.
- **Tertiary / Success (`#10b981`):** Emerald. Signals occupied units, cleared balances, completed inspections, and healthy HVAC/meter thresholds. Paired with `#ecfdf5` background tints for high-visibility badge containers.
- **Warning (`#f59e0b`):** Amber. Applied to pending tenant verifications, expiring leases within 30 days, scheduled utility maintenance, and unpaid balances approaching grace limits. Paired with `#fffbeb`.
- **Urgent / Danger (`#ef4444`):** Rose. Applied to critical equipment alarms, overdue rent, safety tickets, emergency dispatches, and lease terminations. Paired with `#fef2f2`.
- **Background & Canvas:** Crisp base canvas uses `#f8fafc` (slate-50), with layered cards and interactive surfaces set to pure `#ffffff`. Secondary toolbars, neutral panels, and muted table headers use `#f1f5f9` (slate-100).
- **Borders & Dividers:** Crisp, high-contrast `#e2e8f0` (slate-200) for regular containment; active hover and focused field borders step up to `#cbd5e1` (slate-300) and `#4f46e5`.
- **Text & Content Hierarchy:** Deep charcoal/navy `#0f172a` (slate-900) for headers and data values; `#475569` (slate-600) for structural labels and table column headers; `#94a3b8` (slate-400) strictly for placeholder hints and disabled states.

## Typography

The type system pairs **Hanken Grotesk** for clean, non-distracting reading and interface navigation with **JetBrains Mono** for mission-critical administrative data: unit numbers (e.g., `APT-402`), monetary amounts, telemetry outputs, sub-meter identifiers, timestamps, and status badges.

- **Legibility & Density:** Standard body copy is maintained at 14px on 20px leading to allow maximum information visibility without crowding operational dashboards.
- **Monospaced Data Anchors:** All financial figures, numerical counts, meter reads, and tenant identifiers enforce tabular figures via JetBrains Mono to keep data aligned vertically across dense summary tables.
- **Scannable Hierarchy:** Section titles leverage deliberate weight (600/700) paired with tight tracking (`-0.015em`), ensuring fast eye landing when switching between administrative panels.

## Layout & Spacing

This design system uses a responsive **fluid grid** architecture governed by an 8pt base grid system (with a 4pt sub-grid for compact administrative alignments, toolbars, and micro-badges).

- **Desktop (1280px and above):** 12-column responsive layout with fixed 240px or 72px collapsible left operational sidebar, 24px outer margins, and 16px horizontal gutters. Main data workspaces accommodate multi-column property cards and side-by-side ledger sheets.
- **Tablet (768px - 1279px):** 8-column layout with 16px margins and 16px gutters. Secondary inspection side-drawers open over the workspace as an overlay, maintaining primary grid context.
- **Mobile (< 768px):** 4-column layout with 16px margins. Tables reflow into stacked asset cards with key metric anchors (Rent, Unit, Occupancy Status) prioritized at the top edge.
- **Compact Metric Rhythms:** Dense data cards use `space-md` (12px) padding, while standard container sections enforce `space-lg` (24px) padding to create an airy separation between operational groups without wasting vertical scroll estate.

## Elevation & Depth

Elevation is established using **low-contrast outlines** paired with subtle, clinical **ambient drop shadows**. This prevents visual heaviness and keeps the user's attention anchored on status colors and property metrics.

- **Level 0 (Canvas Base):** Ground background `#f8fafc`. No shadows, no borders.
- **Level 1 (Card / Table Surface):** Pure white `#ffffff` surface, framed with a 1px solid `#e2e8f0` border and a crisp micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hovered Card / Dropdowns / Popovers):** Elevated `#ffffff` surface, 1px solid `#cbd5e1` border, with ambient depth: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modal Dialogs / Urgent Incident Drawers):** 1px solid `#e2e8f0` with a wide ambient dispersal: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, anchored over a backdrop scrim tinted at `#0f172a` with 40% opacity.
- **Focus Rings:** High-visibility administrative focus states apply a zero-offset 1px primary ring (`#4f46e5`) accompanied by an outer `0 0 0 3px rgba(79, 70, 229, 0.18)` glow for reliable keyboard-only navigation.

## Shapes

The design system adopts **Soft** roundedness (`roundedness: 1`):
- Standard interactive elements (buttons, inputs, select fields, table action buttons) utilize **0.25rem (4px)** corner radius.
- Enclosing containers (cards, property panels, metric callouts, inspection modals) utilize **0.5rem (8px)** corner radius (`rounded-lg`).
- Transient notifications, contextual toast alerts, and sliding utility panels utilize **0.75rem (12px)** corner radius (`rounded-xl`).
- Status indicators and category tag badges maintain structural soft corners (`4px`), never using circular pill shapes, to keep visual consistency with architectural drafting and administrative data lines.

## Components

### Buttons & Quick Actions
- **Primary Action:** Solid `#4f46e5` fill with `#ffffff` bold text, 4px border radius, 36px height for standard admin density (32px for table inline actions). Hover: `#4338ca`. Active: `#3730a3`.
- **Secondary Action:** `#ffffff` surface with 1px solid `#cbd5e1` border, text in `#0f172a`. Hover: `#f8fafc` background with `#94a3b8` border.
- **Destructive Action:** `#ef4444` fill with `#ffffff` text, or subtle `#fef2f2` fill with `#dc2626` text for secondary risk actions (e.g., "Eviction Notice", "Delete Unit").

### Status Badges & Chips
- Designed for rapid glance recognition. Composed of a 6px solid status dot, monospaced 11px uppercase text (`label-sm`), and a 20px container height with 6px horizontal padding.
- **Occupied / Current / Normal:** `#ecfdf5` background, `#065f46` text, `#10b981` indicator dot.
- **Pending / In Grace / Scheduled:** `#fffbeb` background, `#92400e` text, `#f59e0b` indicator dot.
- **Overdue / Critical / Vacant:** `#fef2f2` background, `#991b1b` text, `#ef4444` indicator dot.

### Data Tables & Property Ledgers
- Outer frame uses 1px solid `#e2e8f0` with clean `#ffffff` row backgrounds.
- Header row is 36px high, tinted `#f8fafc`, featuring 11px uppercase tracking labels in `#475569`.
- Data rows feature 44px standard height (36px in compact mode) separated by 1px `#f1f5f9` dividers. Hover triggers `#f8fafc` row illumination.
- Selected rows display a 2px left border accent in `#4f46e5` with a `#f5f3ff` background wash.

### Form Inputs & Filters
- 36px height with `#ffffff` interior, 1px solid `#cbd5e1` border, 8px horizontal padding, and `#0f172a` text.
- Focused inputs switch border to `#4f46e5` with a 3px diffused outer halo (`rgba(79, 70, 229, 0.15)`).
- Error inputs highlight with `#ef4444` borders and show an inline alert label below in 12px Hanken Grotesk.

### Cards & Property Overview Tiles
- Background `#ffffff`, border 1px solid `#e2e8f0`, shadow level 1.
- Top section holds building/unit title and occupancy status badge.
- Center section hosts key metric values (Rent, Square Footage, Current Tenant, Maintenance Status) displayed in JetBrains Mono.
- Footer features a light `#f8fafc` separator bar housing quick-action links (e.g., "Log Payment", "Create Work Order").

### Checkboxes & Radio Controls
- 16x16px boxes with 3px soft corners (`rounded-sm`). 1.5px solid border in `#94a3b8`.
- Checked state activates solid `#4f46e5` with a white checkmark icon. Indeterminate states display a solid 8x2px center bar.