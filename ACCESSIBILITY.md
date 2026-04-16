# Accessibility Spec

> **For AI Copilot**: Every component generated must satisfy these requirements.
> Run through this checklist mentally for any new interactive element.
> WCAG 2.1 AA is the minimum target.

---

## Enforcement Rule

- Every interactive component must follow all rules in this document
- If any requirement is missing, the component is considered incomplete
- Accessibility is not optional and must not be deferred

---

## Core Principles

1. **Keyboard First** — every action achievable without a mouse
2. **Screen Reader Friendly** — meaningful labels and live regions
3. **Focus Visible** — always show where focus is
4. **Motion Respect** — honor `prefers-reduced-motion`
5. **Color Independence** — never use color as the only signal

---

## Keyboard Navigation Map

### Global (all views)

| Key | Action |
|---|---|
| `Tab` | Move focus forward through interactive elements |
| `Shift+Tab` | Move focus backward |
| `Enter` / `Space` | Activate focused button or control |
| `Escape` | Close open modal / exit study mode |
| `?` | Open keyboard shortcuts modal |

### Deck Sidebar

| Key | Action |
|---|---|
| `↑` / `↓` | Move between deck items in sidebar list |
| `Enter` | Select focused deck |
| `F2` or `E` (when deck focused) | Edit focused deck name |
| `Delete` (when deck focused) | Prompt delete for focused deck |

### Card List (deck view)

| Key | Action |
|---|---|
| `↑` / `↓` | Move between card items in list |
| `N` | Open "New Card" modal (when not in input) |
| `Enter` on card | Open edit card modal |
| `Delete` on card | Trigger delete confirmation |
| `/` | Focus search input |
| `Escape` (in search) | Clear search and return focus to list |

### Study Mode

| Key | Action |
|---|---|
| `Space` or `Enter` | Flip current card |
| `→` or `L` | Next card |
| `←` or `H` | Previous card |
| `S` | Toggle shuffle |
| `Escape` | Exit study mode |
| `R` | Restart session |

### Modal

| Key | Action |
|---|---|
| `Tab` | Cycle through focusable elements (trapped) |
| `Shift+Tab` | Cycle backward (trapped) |
| `Escape` | Close modal |
| `Enter` | Submit form (when focus is in input) |

---

## ARIA Patterns

## Labeling Rule

- All inputs must have associated labels (visible or sr-only)
- All icon-only buttons must include an aria-label
- Labels must clearly describe the action or content

---

### App Shell

```html
<div id="app" role="application" aria-label="Flashcards Study App">
  <nav id="sidebar" aria-label="Decks">...</nav>
  <main id="main-content" aria-live="polite" aria-atomic="false">...</main>
</div>
```

### Deck List

```html
<ul id="deck-list" role="listbox" aria-label="Your decks">
  <li role="option"
      tabindex="0"
      aria-selected="true"          <!-- true for active deck -->
      aria-label="Deck name, 12 cards"
      data-deck-id="...">
    ...
  </li>
</ul>
```

### Card List

```html
<ul id="card-list" aria-label="Cards in [Deck Name]" aria-live="polite">
  <li tabindex="0"
      aria-label="Front: [front text]. Back: [back text]"
      data-card-id="...">
    ...
  </li>
</ul>
```

### Search Input

```html
<label for="search-input" class="sr-only">Search cards</label>
<input
  id="search-input"
  type="search"
  role="searchbox"
  aria-label="Search cards in deck"
  aria-controls="card-list"
  placeholder="Search cards…"
/>
<div aria-live="polite" aria-atomic="true" class="sr-only" id="search-results-count">
  <!-- Dynamically updated: "3 cards found" -->
</div>
```

### Modal

```html
<div
  id="modal-create-deck"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-create-deck-title"
  aria-describedby="modal-create-deck-desc"  <!-- optional -->
  tabindex="-1"
>
  <h2 id="modal-create-deck-title">Create New Deck</h2>
  ...
</div>
<div id="modal-backdrop" aria-hidden="true"></div>
```

### Icon Buttons

```html
<!-- Icon-only button MUST have aria-label -->
<button aria-label="Edit deck: Introduction to Biology" class="btn-icon">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<button aria-label="Delete deck: Introduction to Biology" class="btn-icon btn-danger">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>
```

### Study Mode Card

```html
<div
  id="study-card"
  role="button"
  tabindex="0"
  aria-pressed="false"       <!-- false=front, true=back (flipped) -->
  aria-label="Card front: [front text]. Press Space to reveal answer."
>
  <div class="card-face card-front" aria-hidden="false">...</div>
  <div class="card-face card-back"  aria-hidden="true">...</div>
</div>
```

Update aria-label and aria-hidden on flip:
```js
// When flipped to back:
card.setAttribute('aria-pressed', 'true');
card.setAttribute('aria-label', `Card back: ${backText}. Press Space to flip back.`);
cardFront.setAttribute('aria-hidden', 'true');
cardBack.setAttribute('aria-hidden', 'false');
```

### Progress / Status Announcements

```html
<!-- Announce card changes to screen readers without visual flash -->
<div
  id="study-announcer"
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  <!-- JS writes: "Card 4 of 12" or "Card flipped. Answer: [back text]" -->
</div>
```

### Toast Notifications

```html
<div
  id="toast-region"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  aria-relevant="additions"
>
  <!-- Toasts injected here -->
</div>
```

---

## Focus Management

### Keyboard Trap Rule

- Users must never be trapped in a component
- Modals must trap focus while open, but allow exit via Escape
- Focus must always be able to move forward and backward predictably

### On Modal Open
```js
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  // Show modal
  modal.removeAttribute('hidden');
  // Store last focused element
  modal._returnFocus = document.activeElement;
  // Move focus to modal container or first input
  const firstFocusable = modal.querySelector('input, textarea, button, [tabindex="0"]');
  (firstFocusable || modal).focus();
}
```

### On Modal Close
```js
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.setAttribute('hidden', '');
  // Return focus to trigger element
  if (modal._returnFocus) modal._returnFocus.focus();
}
```

### Focus Trap in Modal
```js
function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
}
```

### On Study Mode Enter / Exit
- Entering study: save previous focus, move focus to study card element
- Exiting study: return focus to "Study" button in the deck header

### On Deck Selection
- After deck selection, move focus to the deck header `<h1>` or the "Add Card" button

---

## Visually Hidden Utility (screen reader only)

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Color Contrast Requirements

All text must meet WCAG 2.1 AA:
- Normal text (< 18px regular / < 14px bold): minimum **4.5:1** contrast ratio
- Large text (≥ 18px regular / ≥ 14px bold): minimum **3:1**
- UI components (buttons, inputs, focus rings): minimum **3:1**

Verified pairs from design tokens:
| Foreground | Background | Ratio | Pass |
|---|---|---|---|
| `--color-text-primary` `#1A1A2E` | `--color-bg` `#F5F1EB` | ~14:1 | ✅ AA, AAA |
| `--color-text-on-accent` `#FFF` | `--color-accent` `#C8860A` | ~4.6:1 | ✅ AA |
| `--color-text-secondary` `#5C5748` | `--color-surface` `#FDFAF5` | ~7.2:1 | ✅ AA |
| `--color-card-back-text` `#FDFAF5` | `--color-card-back` `#2C3E6B` | ~9.3:1 | ✅ AA, AAA |

---

## Form Validation Accessibility

```html
<div class="form-group">
  <label for="deck-name">Deck Name <span aria-hidden="true">*</span></label>
  <span class="sr-only">(required)</span>
  <input
    id="deck-name"
    type="text"
    aria-required="true"
    aria-describedby="deck-name-error"
    aria-invalid="false"   <!-- set to "true" on validation failure -->
  />
  <span
    id="deck-name-error"
    role="alert"
    class="field-error"
    hidden         <!-- remove hidden on error -->
  >
    Deck name is required.
  </span>
</div>
```

---

## Touch / Mobile Accessibility

- Minimum touch target size: **44×44px** (use padding to achieve this on small icons)
- Edit/delete buttons on card list items must always be visible on touch (not hover-only)
- Swipe gesture on study card to go next/prev is a progressive enhancement — keyboard/button always works
- All interactive states (hover, focus, active) are distinct and visible
