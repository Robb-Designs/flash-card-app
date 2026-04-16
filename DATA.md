# Data Spec

> **For AI Copilot**: All data types, localStorage schema, CRUD API, and error handling.
> ONLY `store.js` reads/writes localStorage. All other modules call store functions.

---

## LocalStorage Keys

All keys are prefixed with `flashcards_` to avoid collisions with other apps.

| Key                           | Type              | Description                         |
| ----------------------------- | ----------------- | ----------------------------------- |
| `flashcards_decks`            | `Deck[]` (JSON)   | Array of all deck objects           |
| `flashcards_cards`            | `Card[]` (JSON)   | Array of ALL cards across all decks |
| `flashcards_last_active_deck` | `string` (UUID)   | ID of the last selected deck        |
| `flashcards_settings`         | `Settings` (JSON) | App preferences (theme, etc.)       |

---

## Write Rule

- All data mutations must go through store.js
- No other module may modify stored data directly
- store.js is the single source of truth for persistence

---

## Data Types

### `Deck`

```ts
interface Deck {
  id: string; // UUID v4 (use crypto.randomUUID())
  name: string; // 1–60 characters
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string; // ISO 8601 datetime string — updated on any card change too
}
```

### `Card`

```ts
interface Card {
  id: string; // UUID v4
  deckId: string; // Foreign key → Deck.id
  front: string; // 1–500 characters
  back: string; // 1–500 characters
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string; // ISO 8601 datetime string
}
```

### `Settings`

```ts
interface Settings {
  theme: "light" | "dark" | "system"; // default: 'system'
}
```

---

## Validation Rules

All data must be validated before being saved:

### Deck

- name must be:
  - non-empty
  - trimmed
  - ≤ 60 characters

### Card

- front and back must be:
  - non-empty
  - trimmed
  - ≤ 500 characters

### General

- Strings must be trimmed before saving
- Invalid data must not be written to localStorage
- store.js should throw or reject invalid input

---

## `store.js` API

Every function is synchronous (localStorage is sync) and should be wrapped in try/catch internally.

```js
// ── Decks ──────────────────────────────────────────────────────

/**
 * Get all decks, sorted by updatedAt descending.
 * @returns {Deck[]}
 */
export function getDecks() { ... }

/**
 * Get a single deck by ID.
 * @param {string} id
 * @returns {Deck|null}
 */
export function getDeck(id) { ... }

/**
 * Create or update a deck. Pass full Deck object.
 * Sets updatedAt to now automatically.
 * @param {Deck} deck
 * @returns {Deck}
 *
 * Behavior:
 * - If deck.id exists → update existing deck
 * - If deck.id does not exist → create new deck with generated ID
 * 
 * Timestamp Rules:
 * - createdAt is set ONLY when creating a new deck
 * - createdAt must never be modified on update
 * - updatedAt is always set to current time on save
 */
export function saveDeck(deck) { ... }

/**
 * Delete a deck and all its cards.
 * @param {string} id
 * @returns {void}
 */
export function deleteDeck(id) { ... }


// ── Cards ──────────────────────────────────────────────────────

/**
 * Get all cards for a given deck.
 * @param {string} deckId
 * @returns {Card[]}
 */
export function getCards(deckId) { ... }

/**
 * Get a single card by ID.
 * @param {string} id
 * @returns {Card|null}
 */
export function getCard(id) { ... }

/**
 * Create or update a card. Pass full Card object.
 * Also updates parent deck's updatedAt.
 * @param {Card} card
 * @returns {Card}
 *
 * Behavior:
 * - If card.id exists → update existing card
 * - If card.id does not exist → create new card with generated ID
 * 
 * Timestamp Rules:
 * - createdAt is set ONLY when creating a new card
 * - createdAt must never be modified on update
 * - updatedAt is always set to current time on save
 */
export function saveCard(card) { ... }

/**
 * Delete a card by ID. Also updates parent deck's updatedAt.
 * @param {string} id
 * @returns {void}
 */
export function deleteCard(id) { ... }


// ── Session ────────────────────────────────────────────────────

/**
 * Get the last active deck ID.
 * @returns {string|null}
 */
export function getLastActiveDeck() { ... }

/**
 * Save the last active deck ID.
 * @param {string|null} id
 * @returns {void}
 */
export function setLastActiveDeck(id) { ... }


// ── Settings ───────────────────────────────────────────────────

/**
 * Get app settings.
 * @returns {Settings}
 */
export function getSettings() { ... }

/**
 * Save app settings.
 * @param {Partial<Settings>} patch
 * @returns {Settings}
 */
export function saveSettings(patch) { ... }


// ── Init ───────────────────────────────────────────────────────

/**
 * Initialize store. Verifies localStorage structure.
 * Safe to call multiple times.
 * @returns {void}
 */
export function init() { ... }
```

---

## Sorting Rule

- Decks must always be returned sorted by `updatedAt` (descending)
- Cards must be returned in insertion order unless explicitly sorted (e.g., study mode shuffle)

---

## Read Safety Rule

- Functions like getDecks() and getCards() must return new copies of data
- Never return references to internal arrays or objects
- Use shallow copies (e.g., `[...array]` or `{ ...obj }`) to prevent mutation outside store.js

---

## Default Value Rule

- If data is missing or corrupted, store.js must return safe defaults:
  - decks → []
  - cards → []
  - settings → defaultSettings
- store.js must never return undefined for public API functions

---

## Implementation Notes for `store.js`

### Reading from localStorage

```js
function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`[store] Failed to read key "${key}":`, e);
    return null;
  }
}
```

### Writing to localStorage

```js
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError or similar
    console.error(`[store] Failed to write key "${key}":`, e);
    // Optionally dispatch a custom event so UI can show a warning
    document.dispatchEvent(
      new CustomEvent("store:error", { detail: { key, error: e } }),
    );
  }
}
```

### UUID Generation

```js
function generateId() {
  // crypto.randomUUID() is available in all modern browsers
  return crypto.randomUUID();
}
```

### `init()` implementation pattern

```js
export function init() {
  // Ensure arrays exist (handle first-run or corrupted state)
  if (!Array.isArray(read(KEYS.DECKS))) write(KEYS.DECKS, []);
  if (!Array.isArray(read(KEYS.CARDS))) write(KEYS.CARDS, []);
  if (!read(KEYS.SETTINGS)) write(KEYS.SETTINGS, defaultSettings);
}
```

---

## Data Integrity Rules

1. **Orphan prevention**: When a deck is deleted, all cards with `deckId === deletedId` must also be deleted in the same operation.
2. **ID uniqueness**: Always use `crypto.randomUUID()` — never manual IDs or array indices.
3. **Timestamp format**: Always ISO 8601 strings from `new Date().toISOString()`. Never Date objects in storage.
4. **No nested data**: Decks and cards are stored in separate flat arrays. Cards reference decks via `deckId`. Never store cards inside a deck object.
5. **Immutability pattern**: When updating, always create a new object:
   ```js
   // Good
   const updated = { ...existing, name: newName, updatedAt: now() };
   // Bad — mutates in place
   existing.name = newName;
   ```
6. **Referential integrity**:
   - A card must not be created if its `deckId` does not exist
   - store.js must validate that the parent deck exists before saving a card

---

7. **Delete safety**:
   - Deleting a non-existent deck or card must not throw an error
   - Operation should fail silently or log a warning

---

## Sample Data (for development / testing)

Paste this into `store.js` `init()` as a dev-only seed if localStorage is empty:

```js
const SEED_DECKS = [
  {
    id: "deck-001",
    name: "JavaScript Fundamentals",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-12T14:30:00Z",
  },
  {
    id: "deck-002",
    name: "World Capitals",
    createdAt: "2024-01-11T09:00:00Z",
    updatedAt: "2024-01-11T09:00:00Z",
  },
];

const SEED_CARDS = [
  {
    id: "card-001",
    deckId: "deck-001",
    front: "What is a closure?",
    back: "A function that retains access to its outer scope even after the outer function has returned.",
    createdAt: "2024-01-10T10:05:00Z",
    updatedAt: "2024-01-10T10:05:00Z",
  },
  {
    id: "card-002",
    deckId: "deck-001",
    front: "What does `typeof null` return?",
    back: '"object" — this is a well-known bug in JavaScript that was never fixed for backward compatibility.',
    createdAt: "2024-01-10T10:06:00Z",
    updatedAt: "2024-01-10T10:06:00Z",
  },
  {
    id: "card-003",
    deckId: "deck-002",
    front: "Capital of Japan",
    back: "Tokyo",
    createdAt: "2024-01-11T09:01:00Z",
    updatedAt: "2024-01-11T09:01:00Z",
  },
  {
    id: "card-004",
    deckId: "deck-002",
    front: "Capital of Brazil",
    back: "Brasília",
    createdAt: "2024-01-11T09:02:00Z",
    updatedAt: "2024-01-11T09:02:00Z",
  },
];
```

---

## Migration Strategy

If the data schema ever changes (new field added, key renamed), handle it in `init()`:

```js
// Example: adding 'updatedAt' to cards that were created before it existed
export function init() {
  const cards = read(KEYS.CARDS) || [];
  const migrated = cards.map((card) => ({
    updatedAt: card.createdAt, // backfill with createdAt
    ...card, // existing fields win if present
  }));
  write(KEYS.CARDS, migrated);
}
```

Keep a `schemaVersion` in settings and gate migrations on version comparison for larger changes.
