# Features Spec

> **For AI Copilot**: Each feature has a clear description and acceptance criteria (AC).
> When implementing a feature, verify every AC item before marking it complete.
> Features are ordered by priority: P1 = must have, P2 = should have, P3 = nice to have.

---

## Implementation Order (MANDATORY)

Features must be implemented in this order:

1. F-12: Data Persistence (store.js foundation)
2. F-01 → F-04: Deck system
3. F-05 → F-07: Card system
4. F-11: Search / Filter
5. F-08 → F-10: Study mode
6. Remaining P2 features
7. P3 features last

Do not skip ahead. Each feature must be complete before moving on.

---

## UI Responsibility Rule

- Features must not directly manipulate the DOM
- All rendering must go through ui.js
- Feature modules prepare data and trigger UI updates

---

## State Update Rule

- All state updates must go through app.js
- Features must not mutate shared state directly
- Use events or function calls to request updates

---

## Definition of Done

A feature is complete only if:

- All acceptance criteria are satisfied
- It follows ARCHITECTURE.md rules
- It follows DATA.md validation and integrity rules
- It meets accessibility requirements in ACCESSIBILITY.md
- No console errors or warnings are present

---

## P1 — Core Features (Must Have)

---

### F-01: Multiple Decks

**Description**: Users can create and manage multiple named flashcard decks. The sidebar lists all decks at all times.

**Acceptance Criteria**:
- [ ] Sidebar renders a list of all decks from `localStorage`
- [ ] Clicking a deck name activates it and shows its cards in the main panel
- [ ] Active deck is visually highlighted in the sidebar
- [ ] Deck list is sorted by `updatedAt` descending (most recent first)
- [ ] If no decks exist, the main panel shows a friendly empty/welcome state with a CTA to create a deck
- [ ] Last active deck is restored on page reload (via `localStorage`)

---

### F-02: Create Deck

**Description**: User can create a new deck with a name.

**Acceptance Criteria**:
- [ ] "New Deck" button is visible and accessible in the sidebar
- [ ] Clicking it opens a modal with a text input for deck name
- [ ] Input is auto-focused when modal opens
- [ ] Submitting with a valid name (non-empty, ≤ 60 chars) creates the deck, closes modal, and selects the new deck
- [ ] Submitting with an empty name shows an inline validation error
- [ ] Duplicate deck names are allowed (no blocking, but a soft warning toast is shown)
- [ ] Pressing `Enter` in the input submits the form
- [ ] Pressing `Escape` closes the modal without saving

---

### F-03: Edit Deck

**Description**: User can rename an existing deck.

**Acceptance Criteria**:
- [ ] Each deck item in the sidebar has an edit (pencil) icon button
- [ ] Clicking edit opens a pre-filled modal with the current deck name
- [ ] Saving updates the name in `localStorage` and refreshes the sidebar
- [ ] Same validation rules as F-02 apply

---

### F-04: Delete Deck

**Description**: User can delete a deck and all its cards.

**Acceptance Criteria**:
- [ ] Each deck item has a delete (trash) icon button
- [ ] Clicking delete opens a confirmation modal listing the deck name and card count
- [ ] Confirming deletes the deck and all associated cards from `localStorage`
- [ ] If the deleted deck was active, the view resets to `home`
- [ ] The sidebar re-renders after deletion

---

### F-05: Create Card

**Description**: User can add a new flashcard (front/back) to the active deck.

**Acceptance Criteria**:
- [ ] "Add Card" button is visible when a deck is active
- [ ] Clicking it opens a modal with two textareas: "Front" and "Back"
- [ ] Both fields are required; inline errors shown if empty on submit
- [ ] Card text limit: 500 characters per side; character counter shown near each textarea
- [ ] Successful save closes modal, adds card to card list, updates deck card count
- [ ] `Tab` moves focus from Front → Back → Save button
- [ ] Modal can be dismissed with `Escape`

---

### F-06: Edit Card

**Description**: User can edit the front and/or back of a card.

**Acceptance Criteria**:
- [ ] Each card in the list has an edit icon button
- [ ] Clicking opens a pre-filled modal with current front/back content
- [ ] Same validation rules as F-05 apply
- [ ] On save, the card is updated in `localStorage` and the card list re-renders

---

### F-07: Delete Card

**Description**: User can delete a card from a deck.

**Acceptance Criteria**:
- [ ] Each card has a delete icon button
- [ ] Clicking shows an inline confirmation (e.g., button changes to "Confirm?") or a small confirmation modal
- [ ] Confirmed deletion removes the card from `localStorage` and re-renders the list
- [ ] Deck card count updates accordingly

---

### F-08: Study Mode — Flip Cards

**Description**: User can enter a full-screen study session to review cards with flip animations.

**Acceptance Criteria**:
- [ ] "Study" button in the deck header launches study mode
- [ ] Study mode overlays/replaces the main content area (deck and sidebar are hidden or dimmed)
- [ ] Shows one card at a time: front face visible by default
- [ ] Clicking the card or pressing `Space`/`Enter` flips it to reveal the back
- [ ] Flip uses a CSS 3D card-flip animation (rotateY)
- [ ] Card index displayed: "Card 3 of 12"
- [ ] An "Exit" button returns to the deck view
- [ ] If deck has 0 cards, "Study" button is disabled with a tooltip

---

### F-09: Study Mode — Next / Previous

**Description**: User can navigate between cards during study.

**Acceptance Criteria**:
- [ ] "Next" and "Previous" arrow buttons are visible
- [ ] Clicking Next advances to the next card (resets flip to front)
- [ ] Clicking Prev goes to the previous card (resets flip to front)
- [ ] At the first card, "Prev" is disabled
- [ ] At the last card, "Next" changes to "Finish" which shows a completion screen
- [ ] `ArrowRight` / `ArrowLeft` keyboard shortcuts work for next/prev

---

### F-10: Study Mode — Shuffle

**Description**: User can shuffle cards for randomized study.

**Acceptance Criteria**:
- [ ] "Shuffle" toggle button is visible in study mode
- [ ] Activating shuffle randomizes the card order (Fisher-Yates algorithm)
- [ ] Shuffle indicator is visually active when shuffled
- [ ] Deactivating restores original order, keeping current position best-effort
- [ ] Shuffle state persists for the session but not across page reloads

---

### F-11: Search / Filter Cards

**Description**: User can filter the card list in a deck by keyword.

**Acceptance Criteria**:
- [ ] Search input is visible when a deck is active, above the card list
- [ ] Typing filters cards in real-time (debounced ~200ms)
- [ ] Matches against both front AND back text (case-insensitive)
- [ ] Matching text is highlighted in the card list
- [ ] If no results, show an empty state message: "No cards match your search"
- [ ] Clearing the input restores the full list
- [ ] Search state is cleared when switching decks

---

### F-12: Data Persistence

**Description**: All data survives page reload.

**Acceptance Criteria**:
- [ ] Decks and cards are saved to `localStorage` on every mutation
- [ ] Last active deck ID is saved and restored on reload
- [ ] If `localStorage` data is corrupted or missing, the app initializes with empty state (no crash)
- [ ] `localStorage` key prefix: `flashcards_` to avoid collisions

---

## P2 — Should Have

---

### F-13: Study Mode — Completion Screen

**Description**: After the last card, show a summary screen.

**Acceptance Criteria**:
- [ ] Shown when user presses "Finish" on the last card
- [ ] Displays: deck name, total cards reviewed, a motivational message
- [ ] Buttons: "Study Again" (restart), "Back to Deck"

---

### F-14: Card Count Badge

**Description**: Each deck in the sidebar shows a card count.

**Acceptance Criteria**:
- [ ] Badge shows the number of cards next to the deck name
- [ ] Updates in real-time when cards are added/deleted

---

### F-15: Keyboard Shortcuts Reference

**Description**: User can discover keyboard shortcuts.

**Acceptance Criteria**:
- [ ] A `?` button or keyboard shortcut opens a shortcuts cheat sheet modal
- [ ] Lists all active shortcuts for the current view

---

## P3 — Nice to Have

---

### F-16: Import / Export Deck (JSON)

**Description**: User can export a deck as JSON and import a JSON file.

**Acceptance Criteria**:
- [ ] Export downloads a `.json` file with deck + cards data
- [ ] Import reads a `.json` file and creates a new deck (or merges if name matches)
- [ ] Malformed JSON shows an error toast

---

### F-17: Dark / Light Mode Toggle

**Description**: App respects `prefers-color-scheme` and offers a manual toggle.

**Acceptance Criteria**:
- [ ] Defaults to system preference
- [ ] Toggle button saves preference to `localStorage`
- [ ] All components look correct in both modes

---

### F-18: Card Markdown Support

**Description**: Card front/back text supports basic markdown rendering.

**Acceptance Criteria**:
- [ ] Bold, italic, inline code, line breaks render in study mode
- [ ] Raw markdown is stored (not HTML)
- [ ] Edit mode shows raw markdown in textarea
