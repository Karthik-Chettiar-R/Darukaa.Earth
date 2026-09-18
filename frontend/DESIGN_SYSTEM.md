# Darukaa.earth — Design System

Reference this file whenever creating or restyling a page, component, or view. Keep all new UI consistent with these tokens and rules — don't invent new colors, fonts, radii, or shadows outside what's listed here.

## Brand feel

Earthy, calm, precise. A conservation/carbon-tracking product — not a generic SaaS dashboard. Forest green + cream + white, no gradients-as-decoration, no soft grey drop-shadows, no rounded-pill everything.

---

## 1. Color tokens

Define these as CSS custom properties (e.g. in `src/styles/tokens.css`) and reference them everywhere — never hardcode hex values in components.

```css
:root {
  /* Greens — structure & brand */
  --forest-900: #132A1E;   /* topbar, sidebar background */
  --forest-800: #1B3B29;   /* sidebar panels, borders on dark */
  --forest-700: #2B5039;   /* active/hover states on dark surfaces */
  --moss-500:   #6B9169;   /* primary accent, links, icons */
  --moss-300:   #9FBB8E;   /* secondary text on dark surfaces */
  --leaf-400:   #B7CD9B;   /* highlight accent, active dots, badges */

  /* Neutrals — surfaces */
  --cream-100: #FAF6EC;    /* map/illustration backgrounds */
  --cream-200: #F3ECDB;    /* app background (body) */
  --cream-300: #E9DFC6;    /* subtle fills, hover on light */
  --white:     #FFFFFF;    /* card backgrounds */

  /* Text */
  --ink:      #1E2A20;     /* primary text */
  --ink-soft: #4C5A4C;     /* secondary text, labels */

  /* Lines */
  --line:      #DED2AE;
  --line-soft: #E6DCC0;
}
```

**Usage rules**
- Page/app background: `--cream-200`.
- Cards, panels, modals: `--white` on `--cream-200`/`--cream-100`.
- Sidebar/topbar/nav: `--forest-900` background, `--forest-800` for nested panels.
- Primary accent (buttons, active states, links, chart highlight): `--moss-500`.
- Never use pure black (`#000`) or default grey shadows (`rgba(0,0,0,.1)`).
- Borders are always 1px, using `--line-soft` on light surfaces or `rgba(250,246,236,0.1–0.3)` on dark surfaces — never a shadow-only card edge.

---

## 2. Typography

```css
/* Load via Google Fonts or self-hosted */
--font-display: 'Fraunces', serif;   /* headings, page titles, big stat numbers */
--font-body:    'Inter', sans-serif; /* body copy, labels, nav, buttons, inputs */
```

| Role | Font | Weight | Size |
|---|---|---|---|
| Page title (h1) | Fraunces | 500 | 28px |
| Section heading (h2) | Fraunces | 500 | 16–18px |
| Big stat value | Fraunces | 500 | 32–34px |
| Body / UI text | Inter | 400–500 | 13.5–15px |
| Labels / captions | Inter | 500 | 12–13px |

Rules:
- Fraunces is only for headings and hero numbers — never for paragraphs or UI chrome (buttons, nav, inputs stay Inter).
- No uppercase tracked-out eyebrow labels. Sentence case throughout.
- Don't bold/italicize single words inside a heading for emphasis.

---

## 3. Layout & spacing

- Base spacing unit: 4px. Common gaps: 6, 10, 16, 18, 20, 22, 24, 28, 32, 40px.
- App shell: fixed sidebar (~272px) + topbar (~68px) + fluid main content area, `grid` based.
- Main content padding: 32–40px horizontal, generous top padding (~32px).
- Content max width for text-heavy pages: ~760px, left-aligned (not centered/justified).

## 4. Components

### Cards
- Background `--white`, 1px `--line-soft` border, `border-radius: 14–16px`.
- No default drop shadow. Optional: a 4px solid left accent bar (`--moss-500` or `--leaf-400`) for stat/status cards instead of a shadow.
- Padding: 20–22px.

### Buttons
- Primary: `--forest-800` or `--moss-500` background, `--cream-100` text, `border-radius: 8px`, 9–10px vertical / 16–18px horizontal padding.
- Secondary/outline (used on dark surfaces, e.g. "Log out"): transparent background, 1px `rgba(250,246,236,0.25)` border, `--cream-100` text; hover raises border opacity and adds a faint fill.
- No pill-shaped (fully rounded) buttons. Corner radius stays 8–9px.

### Sidebar nav items
- Default: transparent, `--cream-200` text, 14px, `border-radius: 8px`, small leading dot indicator (7px circle, `--moss-300`).
- Active: `--forest-700` background, `--leaf-400` dot, `--cream-100` text, medium weight, subtle border `rgba(250,246,236,0.12)`.
- Hover (inactive): faint `rgba(250,246,236,0.05)` background.

### Stat / metric blocks
- Label (Inter, 13px, `--ink-soft`) above a big Fraunces value; optional small unit suffix in Inter next to the value; optional trend line below in `--moss-500`.

### Panels with headers (e.g. map, tables)
- Header row: 16px vertical / 22px horizontal padding, bottom border `--line-soft`, Fraunces h2 title + right-aligned legend/actions.
- Body: no padding if it's a map/visual; 16–22px padding if it's content.

### Icon buttons (e.g. expand, close)
- 36x36px, `border-radius: 9px`, white background, `--line-soft` border, `--forest-800` icon color, subtle shadow only here (`0 2px 6px rgba(19,42,30,0.08)`) — this is the one place a soft shadow is allowed, for floating controls over imagery/maps.

## 5. What to avoid

- No `rgba(0,0,0,.1)`-style default grey card shadows.
- No terracotta/orange accents (`#D97757`-adjacent) — this is a green/cream palette only.
- No fully rounded "pill" buttons or badges.
- No uppercase tracked-out labels or middle-dot-separated meta strings.
- No gradient washes as pure decoration.
- Don't mix in a third typeface.

## 6. React/Vite integration notes

- Put tokens in `src/styles/tokens.css`, imported once in `src/main.jsx` (or via `:root` in `index.css`).
- Fonts: add the Google Fonts `<link>` tags to `index.html`, or self-host with `@font-face` + `vite-plugin-fonts`.
- Prefer CSS Modules or plain CSS using the variables above over inline styles, so theming stays centralized.
- Component styling should reference `var(--token-name)` exclusively — grep the codebase for hardcoded hex values when migrating existing components and replace with the nearest token.
