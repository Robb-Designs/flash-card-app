# UI Design Spec

> **For AI Copilot**: This is the visual design system. Use these tokens and patterns
> for every component you generate. Do not invent new color values or spacing outside
> this system. All tokens are defined as CSS custom properties on `:root`.

---

## Token Usage Rule

- All styling must use the defined CSS custom properties (tokens)
- Do NOT hardcode color values, spacing, or font sizes in components
- If a needed value does not exist, it must be added to this design system first

---

## Aesthetic Direction

**Theme**: "Academic Warmth" — a refined, paper-and-ink editorial feel with warm off-whites,
deep navy ink, and a single amber accent. Inspired by well-designed notebooks and index cards.

Think: a physical index card box on a clean wooden desk. Calm, focused, tactile.

- **NOT**: dark mode hacker UI, purple gradient SaaS, brutalist chaos
- **YES**: warm neutrals, confident typography, generous whitespace, subtle texture

---

## Styling Rule

- No inline styles allowed in HTML or JavaScript
- All styling must be defined in CSS files using classes and tokens

---

## Color Tokens

```css
:root {
  /* Backgrounds */
  --color-bg:           #F5F1EB;   /* warm off-white — app background */
  --color-surface:      #FDFAF5;   /* near-white — cards, modals, panels */
  --color-surface-alt:  #EDE8DE;   /* slightly darker — sidebar, hover states */

  /* Borders */
  --color-border:       #D6CEBA;   /* warm gray-beige */
  --color-border-focus: #2C3E6B;   /* navy — focus rings */

  /* Text */
  --color-text-primary:   #1A1A2E; /* deep navy-black */
  --color-text-secondary: #5C5748; /* warm medium gray */
  --color-text-muted:     #9E9485; /* light warm gray — placeholders, counts */
  --color-text-on-accent: #FFFFFF;

  /* Accent */
  --color-accent:         #C8860A; /* amber gold — primary CTA */
  --color-accent-hover:   #A36E08;
  --color-accent-light:   #FDF0D5; /* amber tint — highlights, badges */

  /* Semantic */
  --color-danger:         #C0392B;
  --color-danger-hover:   #A93226;
  --color-danger-light:   #FDEDEC;
  --color-success:        #1E7E50;
  --color-success-light:  #E8F5EE;
  --color-warning:        #E67E22;
  --color-warning-light:  #FEF5E7;

  /* Study Card */
  --color-card-front:     #FDFAF5;
  --color-card-back:      #2C3E6B;  /* navy — back of card */
  --color-card-back-text: #FDFAF5;
}
```

### Dark Mode Overrides (if implementing F-17)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:             #1A1A2E;
    --color-surface:        #22223B;
    --color-surface-alt:    #16213E;
    --color-border:         #3A3A5C;
    --color-text-primary:   #F0EDE6;
    --color-text-secondary: #B0AAA0;
    --color-text-muted:     #6E6860;
    --color-accent-light:   #3D2A00;
  }
}
```

---

## Typography

```css
:root {
  /* Font Families */
  --font-display: 'Playfair Display', Georgia, serif;   /* headings, deck names */
  --font-body:    'Source Serif 4', Georgia, serif;     /* body text, card content */
  --font-ui:      'DM Sans', system-ui, sans-serif;     /* buttons, labels, UI chrome */
  --font-mono:    'JetBrains Mono', monospace;          /* card counts, badges */

  /* Font Sizes (fluid scale) */
  --text-xs:   0.75rem;   /* 12px — badges, hints */
  --text-sm:   0.875rem;  /* 14px — secondary UI, metadata */
  --text-base: 1rem;      /* 16px — body default */
  --text-md:   1.125rem;  /* 18px — card list items */
  --text-lg:   1.375rem;  /* 22px — section headings */
  --text-xl:   1.75rem;   /* 28px — deck title */
  --text-2xl:  2.25rem;   /* 36px — study card text */
  --text-3xl:  3rem;      /* 48px — study card large */

  /* Line Heights */
  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-loose:  1.8;

  /* Font Weights */
  --weight-regular: 400;
  --weight-medium:  500;
  --weight-bold:    700;
}
```

### Google Fonts Import (in `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Spacing Scale

```css
:root {
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.5rem;    /* 24px */
  --space-6:  2rem;      /* 32px */
  --space-7:  2.5rem;    /* 40px */
  --space-8:  3rem;      /* 48px */
  --space-10: 4rem;      /* 64px */
  --space-12: 5rem;      /* 80px */
}
```

---

## Spacing Rule

- Use spacing tokens for all margin, padding, and layout gaps
- Do not use arbitrary pixel values
- Prefer consistent vertical rhythm using the spacing scale

---

## Border Radius

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   20px;
  --radius-full: 9999px;
}
```

---

## Shadows

```css
:root {
  --shadow-sm:  0 1px 3px rgba(26,26,46,0.06), 0 1px 2px rgba(26,26,46,0.04);
  --shadow-md:  0 4px 12px rgba(26,26,46,0.08), 0 2px 4px rgba(26,26,46,0.04);
  --shadow-lg:  0 10px 30px rgba(26,26,46,0.12), 0 4px 8px rgba(26,26,46,0.06);
  --shadow-card: 0 2px 8px rgba(26,26,46,0.10);
  --shadow-modal:0 20px 60px rgba(26,26,46,0.20), 0 8px 20px rgba(26,26,46,0.10);
}
```

---

## Layout

### App Shell (two-column)

```
┌─────────────────────────────────────────────────────┐
│  #sidebar  (280px fixed)  │  #main-content (flex 1) │
│                            │                         │
│  App logo/title            │  [Deck header]          │
│  [+ New Deck]              │  [Search bar]           │
│                            │  [Card list]            │
│  ▸ Deck One          12    │                         │
│  ▸ Deck Two           3    │                         │
│  ▸ Deck Three         0    │                         │
│                            │                         │
└─────────────────────────────────────────────────────┘
```

- Sidebar width: `280px` on desktop, collapses to off-canvas drawer on mobile
- Main content: fills remaining width, scrolls independently
- Sidebar has `position: sticky` top-level; card list in main scrolls

### Breakpoints

```css
/* Mobile first */
/* base           → < 640px:  single column, sidebar hidden, hamburger menu */
/* sm: 640px      → sidebar as bottom sheet or slide-in drawer              */
/* md: 768px      → two-column layout activated                             */
/* lg: 1024px     → wider sidebar (300px), more card grid columns           */
/* xl: 1280px     → max content width capped at 1400px                     */
```

---

## Layering Rule (Z-Index)

- Define z-index layers for:
  - base content
  - sidebar
  - modals
  - toasts
- Avoid arbitrary z-index values
- Use a consistent scale (e.g., 10, 100, 1000)

---

## Responsive Rule

- Mobile-first approach must be used
- Base styles apply to mobile (< 640px)
- Enhancements are added progressively at larger breakpoints
- Components must remain usable at all screen sizes

---

## Layout Responsibility Rule

- Layout structure is defined in HTML and controlled by ui.js
- CSS is responsible only for styling, not structure changes
- Do not dynamically restructure layout outside ui.js

---

## Accessibility Alignment Rule

- All components must comply with ACCESSIBILITY.md
- Focus states, contrast, and interaction patterns must meet WCAG 2.1 AA standards
- Visual design must not break accessibility requirements

---

## Interactive States Rule

All interactive elements must define:

- Hover state (where applicable)
- Focus state (required for accessibility)
- Active/pressed state (for buttons)

Focus states must always be visible and use `--color-border-focus`.

---

## Component System

### Component Consistency Rule

- Components must reuse defined patterns (buttons, inputs, modals, etc.)
- Do not create new visual styles for existing components
- Variants must follow the defined system (primary, secondary, danger, etc.)

### Buttons

```
Primary:   bg=accent,       text=white,     hover=accent-hover
Secondary: bg=transparent,  text=primary,   border=border,   hover=surface-alt
Danger:    bg=danger,       text=white,     hover=danger-hover
Ghost:     bg=transparent,  text=secondary, no border,       hover=surface-alt
Icon:      32×32px square,  ghost style,    icon centered
```

All buttons: `font-family: var(--font-ui)`, `font-weight: var(--weight-medium)`, `border-radius: var(--radius-md)`.
Focus state: `outline: 2px solid var(--color-border-focus)`, `outline-offset: 2px`.

### Text Inputs & Textareas

```css
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
background: var(--color-surface);
padding: var(--space-3) var(--space-4);
font-family: var(--font-body);
font-size: var(--text-base);
transition: border-color 0.2s;

&:focus {
  border-color: var(--color-border-focus);
  outline: none;
  box-shadow: 0 0 0 3px rgba(44,62,107,0.12);
}
```

### Card List Item (in deck view)

```
┌─────────────────────────────────────────────┐
│  FRONT TEXT (truncated, 1 line)        ✏️ 🗑 │
│  Back text (truncated, 1 line, muted)        │
└─────────────────────────────────────────────┘
```

- `background: var(--color-surface)`
- `border: 1px solid var(--color-border)`
- `border-radius: var(--radius-lg)`
- `padding: var(--space-4) var(--space-5)`
- Hover: `box-shadow: var(--shadow-card)`, subtle lift
- Edit/delete buttons appear on hover (always visible on touch devices)

### Modal

```
- Backdrop: rgba(26,26,46,0.5), blur(4px)
- Panel: surface color, border-radius: var(--radius-xl), shadow: var(--shadow-modal)
- Max-width: 480px, centered with transform
- Entrance animation: fade in + slide up 12px, 250ms ease-out
- Always has a visible close (×) button in top-right
- Focus trapped inside while open
```

### Toast Notifications

```
- Position: bottom-right, 16px from edge
- Max-width: 360px
- Types: success (green left border), error (red), warning (amber), info (navy)
- Auto-dismiss: 4 seconds
- Entrance: slide in from right, 300ms
- Can be stacked (multiple toasts)
```

---

## Study Mode Design

```
Full viewport overlay, centered content

┌─────────────────────────────────────────────┐
│  [← Exit]           Deck Name    [⇄ Shuffle]│
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │         FRONT OF CARD TEXT           │   │
│  │                                      │   │
│  │         (click to flip)              │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [←]    Card 3 of 12    [→]                 │
│                 [Space to flip]              │
└─────────────────────────────────────────────┘
```

- Card: large, centered, max-width `560px`, min-height `300px`
- Card front: `--color-surface`, navy text
- Card back: `--color-card-back` (navy), light text
- 3D flip: `transform-style: preserve-3d`, `rotateY(180deg)`
- Progress: thin `4px` progress bar at top of overlay

---

## Animation Specs

All in `animations.css`:

```css
/* Card flip */
.card-inner {
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.card-inner.flipped {
  transform: rotateY(180deg);
}

/* Modal entrance */
@keyframes modalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

/* Toast slide-in */
@keyframes toastIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0);    }
}

/* Card list item entrance (staggered) */
@keyframes cardItemIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}

/* Deck list entrance */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0);    }
}
```

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Animation Rule

- Animations must be subtle and purposeful
- Do not animate layout shifts unnecessarily
- Prefer opacity and transform-based animations for performance
- Avoid excessive or distracting motion
