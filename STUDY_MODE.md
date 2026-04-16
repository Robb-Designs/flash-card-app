# Study Mode Spec

> **For AI Copilot**: Full specification for the study session feature.
> `study.js` is a self-contained state machine. Read this before writing any study code.
> Cross-reference `ACCESSIBILITY.md` for ARIA requirements and `UI_DESIGN.md` for visuals.

---

## Overview

Study mode is a focused, full-viewport overlay where users review one card at a time.
It runs as a state machine in `study.js` and communicates with `app.js` via custom events.

---

## DOM Responsibility Rule

- study.js must NOT directly manipulate the DOM
- All rendering must be handled by ui.js
- Functions like renderCurrentCard() represent UI behavior and must be implemented in ui.js
- study.js passes state to ui.js for rendering

---

## State Machine

```
          ┌──────────────────────────────────────────┐
          │              STUDY SESSION               │
          │                                          │
  start() │                                          │ exit()
──────────►  CARD_FRONT  ◄────────────────────────►  COMPLETE
          │      │                    prev()         │
          │   flip()                                 │
          │      │                                   │
          │  CARD_BACK                               │
          │      │                                   │
          │   next()                                 │
          │      │                                   │
          │  (next card or COMPLETE)                 │
          └──────────────────────────────────────────┘
```

### State Object

```js
// Internal state in study.js (not exported directly)
const session = {
  deckId:       null,     // string
  cards:        [],       // Card[] — current ordered/shuffled list
  originalCards:[],       // Card[] — unshuffled copy
  currentIndex: 0,        // number
  isFlipped:    false,    // boolean
  isShuffled:   false,    // boolean
  isActive:     false,    // boolean
};
```

## State Mutation Rule

- Only study.js may mutate the study session state
- Other modules must not modify session directly
- Session state must be treated as internal and private

---

## Public API (`study.js` exports)

```js
/**
 * Initialize and start a new study session.
 * Loads cards from store, resets state, renders study UI.
 * Dispatches 'study:start' event.
 * @param {string} deckId
 */
export function startStudy(deckId) { ... }

/**
 * Flip the current card (front → back or back → front).
 * Updates ARIA attributes and announces to screen reader.
 */
export function flipCard() { ... }

/**
 * Advance to the next card (resets to front).
 * If on last card, triggers completion screen.
 */
export function nextCard() { ... }

/**
 * Go to previous card (resets to front).
 * No-op if already on first card.
 */
export function prevCard() { ... }

/**
 * Toggle shuffle on/off.
 * On: Fisher-Yates shuffle of cards array, reset to index 0.
 * Off: Restore originalCards, best-effort preserve position.
 */
export function toggleShuffle() { ... }

/**
 * Restart the session from card 1 (keeps shuffle state).
 */
export function restartStudy() { ... }

/**
 * Exit study mode, clean up, return to deck view.
 * Dispatches 'study:exit' event.
 */
export function exitStudy() { ... }
```

---

## Side Effect Rule

- study.js must not directly control global UI or navigation
- study.js must not directly switch views
- All external effects must be communicated via CustomEvents
- app.js is responsible for responding to these events

---

## Fisher-Yates Shuffle Implementation

```js
function shuffle(array) {
  const arr = [...array]; // never mutate original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

---

## HTML Structure for Study Mode

```html
<section
  id="study-overlay"
  aria-label="Study session"
  aria-live="off"
  hidden
>
  <!-- Top bar -->
  <header class="study-header">
    <button id="study-exit-btn" class="btn btn-ghost" aria-label="Exit study mode">
      ← Exit
    </button>
    <h2 id="study-deck-name" class="study-deck-title"></h2>
    <button
      id="study-shuffle-btn"
      class="btn btn-secondary"
      aria-pressed="false"
      aria-label="Shuffle cards"
    >
      ⇄ Shuffle
    </button>
  </header>

  <!-- Progress bar -->
  <div
    id="study-progress-bar"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="0"
    aria-label="Study progress"
    class="study-progress"
  >
    <div id="study-progress-fill" class="study-progress-fill"></div>
  </div>

  <!-- Card counter -->
  <p id="study-counter" class="study-counter" aria-live="polite">
    Card 1 of 12
  </p>

  <!-- Flip card -->
  <div class="study-card-wrapper">
    <div
      id="study-card"
      class="study-card"
      role="button"
      tabindex="0"
      aria-pressed="false"
      aria-label=""
    >
      <div class="study-card-inner">
        <div class="study-card-face study-card-front" id="study-card-front">
          <span class="card-face-label" aria-hidden="true">Front</span>
          <p id="study-front-text"></p>
        </div>
        <div class="study-card-face study-card-back" id="study-card-back" aria-hidden="true">
          <span class="card-face-label" aria-hidden="true">Back</span>
          <p id="study-back-text"></p>
        </div>
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="study-nav" aria-label="Card navigation">
    <button id="study-prev-btn" class="btn btn-secondary" aria-label="Previous card" disabled>
      ← Prev
    </button>
    <button id="study-flip-hint" class="btn btn-ghost study-hint" aria-hidden="true">
      Space to flip
    </button>
    <button id="study-next-btn" class="btn btn-primary" aria-label="Next card">
      Next →
    </button>
  </nav>

  <!-- Screen reader announcer (visually hidden) -->
  <div
    id="study-announcer"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  ></div>
</section>

<!-- Completion screen (hidden until triggered) -->
<section id="study-complete" hidden aria-label="Study session complete">
  <div class="study-complete-content">
    <div class="study-complete-icon" aria-hidden="true">🎉</div>
    <h2>All done!</h2>
    <p id="study-complete-message"></p>
    <div class="study-complete-actions">
      <button id="study-again-btn" class="btn btn-primary">Study Again</button>
      <button id="study-back-btn"  class="btn btn-secondary">Back to Deck</button>
    </div>
  </div>
</section>
```

---

## Rendering Responsibility

- The logic below defines how the UI should update
- Implementation must live in ui.js
- study.js calls ui.js.renderStudyCard(session)

---

## Rendering a Card

Call this whenever `currentIndex` changes OR flip state changes:

```js
function renderCurrentCard() {
  const card = session.cards[session.currentIndex];
  const total = session.cards.length;
  const cardEl = document.getElementById('study-card');

  // Update text
  document.getElementById('study-front-text').textContent = card.front;
  document.getElementById('study-back-text').textContent  = card.back;

  // Reset flip state to front
  session.isFlipped = false;
  cardEl.classList.remove('flipped');
  cardEl.setAttribute('aria-pressed', 'false');
  cardEl.setAttribute('aria-label', `Card front: ${card.front}. Press Space to reveal the answer.`);

  // Update aria-hidden on faces
  document.getElementById('study-card-front').removeAttribute('aria-hidden');
  document.getElementById('study-card-back').setAttribute('aria-hidden', 'true');

  // Update counter
  document.getElementById('study-counter').textContent = `Card ${session.currentIndex + 1} of ${total}`;

  // Update progress bar
  const pct = Math.round(((session.currentIndex + 1) / total) * 100);
  const fill = document.getElementById('study-progress-fill');
  fill.style.width = `${pct}%`;
  document.getElementById('study-progress-bar').setAttribute('aria-valuenow', pct);

  // Update nav buttons
  document.getElementById('study-prev-btn').disabled = session.currentIndex === 0;
  const nextBtn = document.getElementById('study-next-btn');
  nextBtn.textContent = session.currentIndex === total - 1 ? 'Finish ✓' : 'Next →';

  // Announce to screen reader
  announce(`Card ${session.currentIndex + 1} of ${total}: ${card.front}`);
}

function announce(message) {
  const el = document.getElementById('study-announcer');
  el.textContent = '';          // force re-announce if same text
  requestAnimationFrame(() => { el.textContent = message; });
}
```

---

## Flip Animation (CSS)

```css
/* In study.css */
.study-card {
  perspective: 1200px;
  cursor: pointer;
}

.study-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.study-card.flipped .study-card-inner {
  transform: rotateY(180deg);
}

.study-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
}

.study-card-front {
  background: var(--color-card-front);
  color: var(--color-text-primary);
}

.study-card-back {
  background: var(--color-card-back);
  color: var(--color-card-back-text);
  transform: rotateY(180deg);
}
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Deck has 0 cards | "Study" button disabled; clicking shows tooltip "Add cards to study" |
| Deck has 1 card | Prev disabled, Next shows "Finish" immediately |
| User deletes active deck while in study | `study:exit` fired, return to home view |
| User navigates away (selects another deck) | Exit study silently, do not show completion screen |
| localStorage error during study | Session runs in-memory; no crash; warn in console |

---

## Custom Events Dispatched by `study.js`

```js
// Study session started
document.dispatchEvent(new CustomEvent('study:start', {
  detail: { deckId: session.deckId, cardCount: session.cards.length }
}));

// Study session exited (back button or Escape)
document.dispatchEvent(new CustomEvent('study:exit', {
  detail: { deckId: session.deckId }
}));

// Study session completed (finished all cards)
document.dispatchEvent(new CustomEvent('study:complete', {
  detail: { deckId: session.deckId, cardCount: session.cards.length }
}));
```
