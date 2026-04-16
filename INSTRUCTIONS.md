# Flashcards Study App — Project Instructions

> **For AI Copilot Agents**: This file is the root reference for the entire project.
> Always read this file first, then consult the linked spec files for specific domains.
> Never contradict rules defined here unless a more specific spec file overrides them.

---

## Project Overview

A **browser-based, single-page Flashcards Study App** built with vanilla HTML, CSS, and JavaScript.
No frameworks. No build tools or runtime dependencies. No bundlers. One `index.html` — open it and it works.

### Core Goals

- Help users create and study flashcard decks
- Persist all data across sessions with `localStorage`
- Be fully responsive (mobile → desktop)
- Be keyboard-accessible and screen-reader friendly
- Feel fast, polished, and delightful to use

---

## Spec File Index

| File                                     | Purpose                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)   | File structure, module layout, data model                  |
| [`FEATURES.md`](./FEATURES.md)           | Full feature list with acceptance criteria                 |
| [`UI_DESIGN.md`](./UI_DESIGN.md)         | Visual design system, color tokens, typography, animations |
| [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) | A11y requirements, ARIA patterns, keyboard map             |
| [`DATA.md`](./DATA.md)                   | LocalStorage schema, CRUD operations, migration strategy   |
| [`STUDY_MODE.md`](./STUDY_MODE.md)       | Study session logic, flip mechanics, shuffle, progress     |

---

## Non-Negotiable Rules

1. **No build tools** — no Vite, Webpack, Parcel, or bundlers. Pure HTML/CSS/JS files only.
2. **Single HTML file entry point** — `index.html` bootstraps everything.
3. **ES Modules allowed** — use `<script type="module">` and native `import/export`.
4. **No external JS libraries** — no jQuery, no lodash, no React. Vanilla only.
5. **External fonts and icons via CDN are allowed** — Google Fonts, Font Awesome, etc.
6. **All data lives in `localStorage`** — no backend, no IndexedDB (unless noted in `DATA.md`).
7. **Every interactive element must be keyboard-accessible** — see `ACCESSIBILITY.md`.
8. **Mobile-first CSS** — base styles target small screens; `min-width` breakpoints scale up.

---

## Package.json Rule

If a `package.json` file exists:

- It must NOT be used for build tools or runtime dependencies
- It may be used for optional dev tools only

Allowed (optional):

- ESLint
- Prettier

Not allowed:

- Vite
- Webpack
- Parcel
- Any runtime dependency

---

## Tech Stack

```
index.html          ← Single entry point
css/
  base.css          ← Reset, variables, typography
  layout.css        ← App shell, sidebar, main area
  components.css    ← Cards, modals, buttons, inputs
  animations.css    ← Transitions, flip, entrance effects
  study.css         ← Study mode specific styles
js/
  app.js            ← Bootstrap, router, global state
  store.js          ← LocalStorage CRUD layer
  decks.js          ← Deck management logic
  cards.js          ← Card management logic
  study.js          ← Study session controller
  search.js         ← Search/filter logic
  ui.js             ← DOM helpers, modal controller, toasts
  keyboard.js       ← Global keyboard shortcuts
```

---

## Coding Conventions

- Use `const` and `let`; never `var`.
- Prefer `querySelector` / `querySelectorAll` over `getElementById`.
- All DOM manipulation goes through helper functions in `ui.js` — no raw `innerHTML` outside of dedicated render functions.
- Event delegation preferred over attaching listeners to individual dynamic elements.
- Functions must be pure where possible (input → output, no side effects).
- State mutations always go through `store.js` — never write to `localStorage` directly from feature modules.
- Comment any logic that is non-obvious. JSDoc on all exported functions.

---

## Critical Architecture Rules

### DOM Rule

- Only `ui.js` is allowed to create, modify, or render DOM elements
- Feature modules must NOT:
  - use `innerHTML`
  - create elements with `document.createElement`
  - directly update DOM nodes
- Feature modules may ONLY:
  - attach event listeners (via delegation in app.js or helpers)
  - call UI functions to trigger rendering

### Storage Rule

- Only `store.js` can read/write `localStorage`.

### State Rule

- `app.js` is the single source of truth for global state
- Only `app.js` can directly mutate global state
- Other modules must NOT:
  - modify shared state objects directly
- Other modules must:
  - return data
  - or dispatch events to request changes

  ### Event Communication Rule

- Modules communicate using CustomEvents on `document`
- Events must follow naming convention: `feature:action` (e.g., `deck:selected`, `study:exit`)
- No direct cross-module imports for side effects
- app.js listens and coordinates responses

---

## File Naming

- HTML: `kebab-case`
- CSS: `kebab-case`
- JS: `camelCase` for files, `PascalCase` for class-like objects, `camelCase` for functions/variables, `SCREAMING_SNAKE_CASE` for constants.

---

## Browser Support Target

Latest 2 versions of: Chrome, Firefox, Safari, Edge.
No IE11 support required.

---

## AI Development Rules

- Always read INSTRUCTIONS.md first
- Follow ARCHITECTURE.md strictly
- Do not create new files or folders outside the defined structure
- Do not introduce new patterns, abstractions, or architectures
- Do not use external libraries
- Do not mix responsibilities between modules
- Do not bypass ui.js, store.js, or app.js rules
- Keep code modular, readable, and consistent

---

## Rule Priority

If any conflict occurs:

- ARCHITECTURE.md defines structure and module boundaries
- DATA.md defines data rules and storage behavior
- ACCESSIBILITY.md defines accessibility requirements
- This file defines global constraints

Follow the most specific rule when in doubt.

## Completion Criteria

A feature is considered complete only if:

- It follows all architecture rules
- It meets acceptance criteria in FEATURES.md
- It satisfies accessibility requirements in ACCESSIBILITY.md

If any rule is violated, the implementation is incomplete.
