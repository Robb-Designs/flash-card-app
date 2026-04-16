# Architecture Spec

> **For AI Copilot**: Defines the file layout, module responsibilities, and data flow.
> When generating or editing any file, check that it belongs in the correct module.

---

## Directory Structure

```
flashcards-app/
├── index.html
├── INSTRUCTIONS.md         ← Root AI copilot guide (read first)
├── ARCHITECTURE.md         ← This file
├── FEATURES.md
├── UI_DESIGN.md
├── ACCESSIBILITY.md
├── DATA.md
├── STUDY_MODE.md
├── css/
│   ├── base.css            ← CSS reset, custom properties (design tokens), root typography
│   ├── layout.css          ← App shell: sidebar, main panel, header, responsive grid
│   ├── components.css      ← All reusable components: buttons, inputs, cards, modals, badges
│   ├── animations.css      ← All @keyframes and transition utilities
│   └── study.css           ← Study mode layout, flip card, progress bar
└── js/
    ├── app.js              ← Entry point: init, view router, global event listeners
    ├── store.js            ← All LocalStorage read/write. Single source of truth.
    ├── decks.js            ← Deck CRUD and data preparation
    ├── cards.js            ← Card CRUD and data preparation
    ├── study.js            ← Study session state machine and controller (no direct DOM rendering)
    ├── search.js           ← Keyword filter logic for cards within a deck
    ├── ui.js               ← DOM rendering engine (all UI creation, updates, modals, toasts)
    └── keyboard.js         ← Global keyboard shortcut registry and handlers
```

---

## Module Responsibilities

## Rendering Ownership (CRITICAL)

- All DOM creation and rendering must happen inside `ui.js`
- Feature modules (`decks.js`, `cards.js`, `study.js`) must NOT:
  - build HTML
  - use innerHTML
  - create DOM nodes

- Feature modules are responsible for:
  - preparing data
  - calling UI functions

Example flow:
decks.js → getDecks() → ui.renderDeckList(decks)

### `app.js`

- Calls `store.init()` on page load
- Single source of truth for global state
- Only module allowed to mutate global state
- Coordinates all module communication
- Renders initial view (last active deck or welcome screen)
- Owns the top-level "view" state: `'home' | 'deck' | 'study'`
- Imports and initializes all other modules
- Sets up delegated event listeners on `document` or `#app`

### `store.js`

- **Only** module allowed to read/write `localStorage`
- Must return clean, validated data
- Must handle corrupted or missing data safely
- Must never expose raw localStorage structure directly
- Exports: `getDecks()`, `saveDeck()`, `deleteDeck()`, `getCards(deckId)`, `saveCard()`, `deleteCard()`, `getLastActiveDeck()`, `setLastActiveDeck(id)`
- All data is serialized/deserialized as JSON
- Handles missing/corrupted data gracefully (returns defaults)

### `decks.js`

- Imports from `store.js` and `ui.js`
- Exports: `loadDecks()`, `createDeck(name)`, `updateDeck(id, name)`, `deleteDeck(id)`, `selectDeck(id)`
- Prepares deck data and passes it to ui.js for rendering
- Does NOT touch `localStorage` directly

### `cards.js`

- Imports from `store.js` and `ui.js`
- Exports: `loadCards(deckId)`, `createCard(deckId, front, back)`, `updateCard(id, front, back)`, `deleteCard(id)`
- Prepares card data and passes it to ui.js for rendering
- Handles card count display in deck header

### `study.js`

- Imports from `store.js`
- Self-contained state machine with properties: `deck`, `cards`, `currentIndex`, `isFlipped`, `isShuffled`
- Exports: `startStudy(deckId)`, `nextCard()`, `prevCard()`, `flipCard()`, `shuffleCards()`, `exitStudy()`
- Communicates back to `app.js` via custom events on `document`
- Must not directly manipulate DOM
- Must call ui.js to update study UI

### `search.js`

- Pure filter logic — no DOM writes
- Exports: `filterCards(cards, keyword)` → returns filtered array
- `cards.js` calls this when the search input changes

### `ui.js`

- Exports DOM helpers: `createElement(tag, attrs, children)`, `showModal(id)`, `hideModal(id)`, `showToast(message, type)`
- Manages modal open/close state and focus trap
- All `innerHTML` template rendering functions live here

### UI API Rule

- ui.js exposes rendering functions (e.g., renderDeckList, renderCardList, renderStudyView)
- Other modules must call these functions instead of manipulating DOM directly
- ui.js is the only module aware of HTML structure

### UI State Rule

- ui.js must not store application state
- It only receives data and renders it
- All state must come from app.js or store.js

### `keyboard.js`

- Exports: `registerShortcut(key, handler)`, `initKeyboard()`
- `initKeyboard()` is called by `app.js` once on load
- Shortcuts are context-aware (study mode vs. normal mode)

---

## Data Flow

```
User Action
    │
    ▼
Event Listener (app.js or delegated)
    │
    ▼
Feature Module (decks.js / cards.js / study.js)
    │
    ├──► store.js  ──► localStorage (write)
    │
    └──► ui.js / render functions  ──► DOM update
```

### Data Flow Rule

All interactions MUST follow this flow:

User → app.js → feature module → store.js → ui.js

- Skipping layers is not allowed
- Direct UI updates from feature modules are not allowed
- Direct storage access outside store.js is not allowed

---

## View States

The app has three top-level views managed by `app.js`:

| View ID | Trigger                | What's Visible                                   |
| ------- | ---------------------- | ------------------------------------------------ |
| `home`  | No deck selected       | Welcome/empty state, deck list sidebar           |
| `deck`  | Deck selected          | Deck header, card list, search bar, study button |
| `study` | "Study" button clicked | Full-screen study mode overlay                   |

View transitions use CSS classes added/removed on `#app` or a `#main-content` wrapper.

### View Control Rule

- Only `app.js` controls view transitions
- Other modules must request view changes via events
- No module may directly switch views

### State Integrity Rule

- No module may maintain its own persistent state outside of app.js or store.js
- Temporary local variables are allowed
- Shared state must always be explicit and centralized

---

## State Shape (in memory, mirrors localStorage)

```js
// Global app state object (in app.js)
const state = {
  view: "home", // 'home' | 'deck' | 'study'
  activeDeckId: null, // string UUID or null
  decks: [], // array of Deck objects (see DATA.md)
  searchQuery: "", // current search string
};
```

---

## Event Communication Between Modules

### Event Rules

- Events must be dispatched on `document`
- Event names must follow `feature:action` format
- Events are used to decouple modules
- Modules must not directly call functions in unrelated modules

Use `CustomEvent` on `document` to avoid tight coupling:

```js
// study.js dispatches:
document.dispatchEvent(new CustomEvent('study:exit', { detail: { deckId } }));

// app.js listens:
document.addEventListener('study:exit', (e) => { ... });
```

Custom events to implement:

- `deck:selected` — payload: `{ deckId }`
- `deck:created` — payload: `{ deck }`
- `deck:deleted` — payload: `{ deckId }`
- `card:created` — payload: `{ card }`
- `card:deleted` — payload: `{ cardId }`
- `study:start` — payload: `{ deckId }`
- `study:exit` — payload: `{ deckId }`

### Module Communication Rule

- Feature modules must not directly call other feature modules
- All coordination flows through app.js or CustomEvents
- Prevents tight coupling between modules

---

## Forbidden Actions

- No module except `ui.js` may manipulate the DOM
- No module except `store.js` may access localStorage
- No module may mutate global state except `app.js`
- No module may directly modify another module’s internal state
- No circular dependencies between modules
