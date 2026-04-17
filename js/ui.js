/**
 * ui.js
 *
 * Pure rendering module for the application UI.
 *
 * Responsibilities:
 * - Render complete views into the root container
 * - Return HTML strings for reusable lists
 * - Render root-scoped modal and toast UI
 *
 * Rules:
 * - No business logic
 * - No module imports
 * - No localStorage access
 * - No global event listeners
 */

const root = document.getElementById('app');



/**
 * Escapes unsafe characters before putting text into an HTML string.
 * @param {*} value - Any value that should be safely displayed in markup.
 * @returns {string} A safe string that can be inserted into HTML.
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Makes sure the app root exists before anything is rendered.
 * @param {void} No parameters.
 * @returns {void} Does not return a value.
 */
function ensureRoot() {
    if (!root) {
        throw new Error('UI root container #app was not found.');
    }
}

/**
 * Renders the current view and optional overlay UI into the root container.
 * @param {string} viewMarkup - The full HTML string for the main view.
 * @param {?Object} modalConfig - Optional modal settings used to render a modal.
 * @param {string} toastMessage - Optional toast message to show.
 * @returns {void} Does not return a value.
 */
function renderRoot(viewMarkup, modalConfig, toastMessage) {
    ensureRoot();

    // Render the full screen in one pass so old markup does not hang around.
    root.innerHTML = `
		<div class="app-root" role="application" aria-label="Flashcards Study App">
			${viewMarkup}
		</div>
		${renderModalMarkup(modalConfig)}
		${renderToastMarkup(toastMessage)}
	`;
}



/**
 * Builds a simple empty-state message block.
 * @param {string} message - The message to show to the user.
 * @returns {string} An HTML string for the empty state.
 */
function renderEmptyState(message) {
    return `
		<div class="empty-state">
			<p class="empty-state-message">${escapeHtml(message)}</p>
		</div>
	`;
}

/**
 * Builds the full home view markup.
 * @param {Object} data - View data, usually including a decks array.
 * @returns {string} The full HTML string for the home screen.
 */
function renderHomeShell(data) {
    const decks = Array.isArray(data?.decks) ? data.decks : [];
    const entryClass = data?.animateEntry ? 'entry-animate' : '';

    return `
		<div class="app-layout ${entryClass}">
			<aside class="app-sidebar" aria-label="Deck sidebar">
				<div class="app-sidebar-inner">
					<div class="sidebar-header">
						<h1 class="app-title">Flashcards</h1>
						<button class="btn btn-primary hover-lift press-down" type="button" data-action="create-deck">New Deck</button>
					</div>
					${renderDeckList(decks)}
				</div>
			</aside>
			<main class="app-main" aria-label="Home view">
				<div class="app-main-inner">
					<section class="view-body">
						<section class="welcome-panel">
							<h2 class="section-title">Study starts with a deck.</h2>
							<p class="section-copy">Create a deck or choose one from the sidebar to begin.</p>
						</section>
					</section>
				</div>
			</main>
		</div>
	`;
}

/**
 * Builds the full deck view markup, including deck details and card list.
 * @param {Object} data - View data containing the selected deck, cards, decks, and search text.
 * @returns {string} The full HTML string for the deck screen.
 */
function renderDeckShell(data) {
    const deck = data?.deck ?? null;
    const cards = Array.isArray(data?.cards) ? data.cards : [];
    const deckId = deck?.id ?? '';
    const deckName = deck?.name ?? 'Untitled Deck';
	const resultLabel = `${cards.length} card${cards.length === 1 ? '' : 's'} shown`;
		const entryClass = data?.animateEntry ? 'entry-animate' : '';

    return `
		<div class="app-layout ${entryClass}">
			<aside class="app-sidebar" aria-label="Deck sidebar">
				<div class="app-sidebar-inner">
					<div class="sidebar-header">
						<h1 class="app-title">Flashcards</h1>
						<button class="btn btn-primary hover-lift press-down" type="button" data-action="create-deck">New Deck</button>
					</div>
					${renderDeckList(Array.isArray(data?.decks) ? data.decks : [])}
				</div>
			</aside>
			<main class="app-main" aria-label="Deck view">
				<div class="app-main-inner">
					<header class="view-header">
						<div class="deck-header-copy">
							<h2 class="deck-title">${escapeHtml(deckName)}</h2>
							<p class="deck-meta">${cards.length} card${cards.length === 1 ? '' : 's'}</p>
						</div>
						<div class="deck-header-actions">
							<button class="btn btn-secondary hover-lift press-down" type="button" data-action="edit-deck" data-id="${escapeHtml(deckId)}">Edit Deck</button>
							<button class="btn btn-primary hover-lift press-down" type="button" data-action="start-study" data-id="${escapeHtml(deckId)}">Study</button>
						</div>
					</header>
					<section class="deck-toolbar" aria-label="Deck tools">
						<label class="search-field" for="deck-search">
							<span class="search-label">Search cards</span>
							<input
								id="deck-search"
								class="input search-input"
								name="search"
								type="search"
								role="searchbox"
								aria-label="Search cards in deck"
								aria-controls="card-list"
								value="${escapeHtml(data?.searchQuery ?? '')}"
								placeholder="Search front or back text"
								data-action="search-cards"
							>
						</label>
						<div class="sr-only" id="search-results-count" aria-live="polite" aria-atomic="true">${escapeHtml(resultLabel)}</div>
						<button class="btn btn-primary hover-lift press-down" type="button" data-action="create-card" data-id="${escapeHtml(deckId)}">Add Card</button>
					</section>
					<section class="view-body" aria-label="Cards in deck">
						${renderCardList(cards, deckName)}
					</section>
				</div>
			</main>
		</div>
	`;
}

/**
 * Builds the full study view markup for the current card session.
 * @param {Object} data - View data containing the current card and study session details.
 * @returns {string} The full HTML string for the study screen.
 */
function renderStudyShell(data) {
    const deckId = data?.deckId ?? '';
	const deckName = data?.deckName ?? 'Study Session';
    const currentCard = data?.currentCard ?? null;
    const currentIndex = Number.isInteger(data?.currentIndex) ? data.currentIndex : 0;
    // If totalCards is missing, fall back to 1 when a current card exists.
    const totalCards = Number.isInteger(data?.totalCards) ? data.totalCards : currentCard ? 1 : 0;
    const isFlipped = Boolean(data?.isFlipped);
    const isShuffled = Boolean(data?.isShuffled);
    const frontText = currentCard?.front ?? '';
    const backText = currentCard?.back ?? '';
    const counterText = totalCards > 0 ? `Card ${currentIndex + 1} of ${totalCards}` : 'No cards to study';
	const studyAriaLabel = isFlipped
		? `Card back: ${backText || 'No answer text'}. Press Space or Enter to flip back.`
		: `Card front: ${frontText || 'No prompt text'}. Press Space or Enter to reveal answer.`;
	const studyEntryClass = data?.animateEntry ? 'study-enter entry-animate' : '';

    return `
		<section class="view-study ${studyEntryClass}" aria-label="Study session">
			<header class="study-header">
				<button class="btn btn-ghost hover-lift press-down study-header-left" type="button" data-action="exit-study" data-id="${escapeHtml(deckId)}">Exit</button>
				<div class="study-header-center">
					<h2 class="study-title">${escapeHtml(deckName)}</h2>
				</div>
				<button
					class="btn btn-secondary hover-lift press-down study-header-right"
					type="button"
					data-action="toggle-shuffle"
					data-id="${escapeHtml(deckId)}"
					aria-pressed="${isShuffled ? 'true' : 'false'}"
				>
					Shuffle
				</button>
			</header>
			<main class="study-main study-container">
				<div class="study-progress" aria-hidden="true">
					<div class="study-progress-fill"></div>
				</div>
				<div class="card-flip hover-lift press-down ${isFlipped ? 'is-flipped' : ''}" role="button" tabindex="0" data-action="flip-card" data-id="${escapeHtml(deckId)}" aria-pressed="${isFlipped ? 'true' : 'false'}" aria-label="${escapeHtml(studyAriaLabel)}">
					<div class="card-flip-inner">
						<div class="card card-flip-front" aria-hidden="${isFlipped ? 'true' : 'false'}">
							<div class="card-front">${escapeHtml(frontText)}</div>
						</div>
						<div class="card card-flip-back" aria-hidden="${isFlipped ? 'false' : 'true'}">
							<div class="card-back">${escapeHtml(backText)}</div>
						</div>
					</div>
				</div>
				<div class="sr-only" id="study-announcer" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(counterText)}${isFlipped ? `. Answer: ${backText || 'No answer text'}` : ''}</div>
				<nav class="study-nav study-controls" aria-label="Study controls">
					<button class="btn btn-secondary hover-lift press-down" type="button" data-action="prev-card" data-id="${escapeHtml(deckId)}">Prev</button>
					<p class="study-progress-text">${escapeHtml(counterText)} · Space to flip</p>
					<button class="btn btn-ghost hover-lift press-down" type="button" data-action="restart-study" data-id="${escapeHtml(deckId)}">Restart</button>
					<button class="btn btn-primary hover-lift press-down" type="button" data-action="next-card" data-id="${escapeHtml(deckId)}">Next</button>
				</nav>
			</main>
		</section>
	`;
}

/**
 * Updates only the study flip class so the same DOM node can animate.
 * @param {boolean} isFlipped - Whether the study card should show the back side.
 * @returns {void} Does not return a value.
 */
export function syncStudyFlip(isFlipped) {
    ensureRoot();

    const flipEl = root.querySelector('.card-flip');
    if (!flipEl) {
        return;
    }

    flipEl.classList.toggle('is-flipped', Boolean(isFlipped));
}

/**
 * Builds the modal markup when modal settings are provided.
 * @param {?Object} config - Modal settings such as title, message, labels, and actions.
 * @returns {string} An HTML string for the modal, or an empty string if no modal is needed.
 */
function renderModalMarkup(config) {
    if (!config) {
        return '';
    }

    // Default values keep the modal usable even when some config fields are missing.
    const title = config.title ?? 'Notice';
    const message = config.message ?? '';
    const confirmLabel = config.confirmLabel ?? 'Confirm';
    const cancelLabel = config.cancelLabel ?? 'Cancel';
    const confirmAction = config.confirmAction ?? 'modal-confirm';
    const cancelAction = config.cancelAction ?? 'modal-cancel';
    const modalId = config.id ?? '';
    const input = config.input ?? null;
	const fields = Array.isArray(config.fields) ? config.fields : [];

    const inputMarkup = input ? `
					<label class="modal-field" for="${escapeHtml(input.id ?? 'modal-input')}">
						<span class="modal-field-label">${escapeHtml(input.label ?? 'Value')}</span>
						<input
							id="${escapeHtml(input.id ?? 'modal-input')}"
							class="input"
							name="${escapeHtml(input.name ?? 'modal-input')}"
							type="text"
							value="${escapeHtml(input.value ?? '')}"
							placeholder="${escapeHtml(input.placeholder ?? '')}"
							data-action="${escapeHtml(input.action ?? 'modal-input')}"
							autocomplete="off"
						>
					</label>
				` : '';

    const fieldsMarkup = fields.map((field) => {
        const fieldId = field.id ?? `modal-field-${field.name ?? 'value'}`;
        const fieldName = field.name ?? 'value';
        const fieldLabel = field.label ?? 'Value';
        const fieldAction = field.action ?? 'modal-field-input';
        const fieldPlaceholder = field.placeholder ?? '';
        const fieldValue = field.value ?? '';
        const fieldControl = field.control === 'textarea' ? 'textarea' : 'input';
        const rows = Number.isInteger(field.rows) ? field.rows : 4;

        if (fieldControl === 'textarea') {
            return `
					<label class="modal-field" for="${escapeHtml(fieldId)}">
						<span class="modal-field-label">${escapeHtml(fieldLabel)}</span>
						<textarea
							id="${escapeHtml(fieldId)}"
							class="input"
							name="${escapeHtml(fieldName)}"
							rows="${rows}"
							placeholder="${escapeHtml(fieldPlaceholder)}"
							data-action="${escapeHtml(fieldAction)}"
							data-field="${escapeHtml(fieldName)}"
							autocomplete="off"
						>${escapeHtml(fieldValue)}</textarea>
					</label>
				`;
        }

        return `
					<label class="modal-field" for="${escapeHtml(fieldId)}">
						<span class="modal-field-label">${escapeHtml(fieldLabel)}</span>
						<input
							id="${escapeHtml(fieldId)}"
							class="input"
							name="${escapeHtml(fieldName)}"
							type="text"
							value="${escapeHtml(fieldValue)}"
							placeholder="${escapeHtml(fieldPlaceholder)}"
							data-action="${escapeHtml(fieldAction)}"
							data-field="${escapeHtml(fieldName)}"
							autocomplete="off"
						>
					</label>
				`;
    }).join('');

    return `
		<div class="modal-backdrop" data-modal-open="true">
			<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-message" tabindex="-1">
				<div class="modal-header">
					<h2 class="modal-title" id="modal-title">${escapeHtml(title)}</h2>
					<button class="btn btn-ghost hover-lift press-down" type="button" data-action="hide-modal" aria-label="Close modal">&times;</button>
				</div>
				<div class="modal-body">
					<p class="modal-message" id="modal-message">${escapeHtml(message)}</p>
					${inputMarkup}
					${fieldsMarkup}
				</div>
				<div class="modal-actions">
					<button class="btn btn-secondary hover-lift press-down" type="button" data-action="${escapeHtml(cancelAction)}" data-id="${escapeHtml(modalId)}">${escapeHtml(cancelLabel)}</button>
					<button class="btn btn-primary hover-lift press-down" type="button" data-action="${escapeHtml(confirmAction)}" data-id="${escapeHtml(modalId)}">${escapeHtml(confirmLabel)}</button>
				</div>
			</section>
		</div>
	`;
}

/**
 * Builds the toast markup for a short status message.
 * @param {string|Object|Array} toast - A toast payload or array of toast payloads.
 * @returns {string} An HTML string for toasts, or an empty string when there are no toasts.
 */
function renderToastMarkup(toast) {
	if (!toast) {
        return '';
    }

    const normalized = Array.isArray(toast)
        ? toast
        : [toast];

    const allowed = new Set(['info', 'success', 'warning', 'error']);

    const items = normalized.map((entry) => {
		const payload = typeof entry === 'string'
			? { message: entry, type: 'info' }
			: { message: entry?.message ?? '', type: entry?.type ?? 'info' };

		if (!payload.message) {
			return '';
		}

		const toastType = allowed.has(payload.type) ? payload.type : 'info';
		const toneClass = `toast-${toastType}`;
		const role = toastType === 'error' || toastType === 'warning' ? 'alert' : 'status';

		return `
			<div class="toast ${toneClass}" role="${role}">
				<p class="toast-message">${escapeHtml(payload.message)}</p>
			</div>
		`;
    }).join('');

    if (!items.trim()) {
        return '';
    }

    return `
		<div class="toast-stack" id="toast-region" role="alert" aria-live="assertive" aria-atomic="true" aria-relevant="additions text">
			${items}
		</div>
	`;
}

/**
 * Builds the deck list markup used by the sidebar.
 * @param {Array} decks - A list of deck objects with id, name, and optional cardCount.
 * @returns {string} An HTML string for the full deck list.
 */
export function renderDeckList(decks) {
    if (!Array.isArray(decks) || decks.length === 0) {
        return renderEmptyState('No decks yet. Create one to get started.');
    }

    // Each deck button includes data attributes so app.js can handle clicks with event delegation.
    const items = decks.map((deck) => {
        const deckId = deck?.id ?? '';
        const name = deck?.name ?? 'Untitled Deck';
        const cardCount = Number.isInteger(deck?.cardCount) ? deck.cardCount : 0;
        const deleteLabel = `Delete deck: ${name || 'Untitled deck'}`;

        return `
			<li>
				<div class="deck-row">
					<button class="deck-item hover-lift press-down" type="button" data-action="select-deck" data-id="${escapeHtml(deckId)}">
						<span class="deck-item-name">${escapeHtml(name)}</span>
						<span class="deck-item-count">${cardCount}</span>
					</button>
					<div class="deck-item-actions" aria-label="Deck actions">
						<button class="btn btn-ghost press-down deck-item-action-btn" type="button" data-action="delete-deck" data-id="${escapeHtml(deckId)}" aria-label="${escapeHtml(deleteLabel)}">Delete</button>
					</div>
				</div>
			</li>
		`;
    }).join('');

    return `
		<nav class="deck-list" aria-label="Decks">
			<ul class="deck-list-items">${items}</ul>
		</nav>
	`;
}

/**
 * Builds the card list markup for the selected deck.
 * @param {Array} cards - A list of card objects with id, front, and back text.
 * @returns {string} An HTML string for the full card list.
 */
export function renderCardList(cards, deckName = 'Selected deck') {
    if (!Array.isArray(cards) || cards.length === 0) {
        return renderEmptyState('No cards match the current view.');
    }

    const items = cards.map((card) => {
        const cardId = card?.id ?? '';
        const front = card?.front ?? '';
        const back = card?.back ?? '';
        const deleteLabel = `Delete card: ${front || 'Untitled card'}`;

        return `
			<li class="card-list-item">
				<article class="card hover-lift" aria-label="Flashcard preview">
					<div class="card-list-head">
						<div class="card-front card-line-truncate">${escapeHtml(front)}</div>
						<div class="card-item-actions" aria-label="Card actions">
							<button class="btn btn-ghost press-down card-item-action-btn" type="button" data-action="delete-card" data-id="${escapeHtml(cardId)}" aria-label="${escapeHtml(deleteLabel)}">Delete</button>
						</div>
					</div>
					<div class="card-back card-line-truncate card-list-back">${escapeHtml(back)}</div>
				</article>
			</li>
		`;
    }).join('');

    return `
		<ul class="card-list" id="card-list" aria-label="Cards in ${escapeHtml(deckName)}" aria-live="polite">
			${items}
		</ul>
	`;
}

/**
 * Renders the full home view into the root container.
 * @param {Object} data - Data needed to build the home screen, plus optional modal and toast info.
 * @returns {void} Does not return a value.
 */
export function renderHomeView(data = {}) {
	renderRoot(renderHomeShell(data), data.modal, data.toast);
}

/**
 * Renders the full deck view into the root container.
 * @param {Object} data - Data needed to build the deck screen, plus optional modal and toast info.
 * @returns {void} Does not return a value.
 */
export function renderDeckView(data = {}) {
	renderRoot(renderDeckShell(data), data.modal, data.toast);
}

/**
 * Renders the full study view into the root container.
 * @param {Object} data - Data needed to build the study screen, plus optional modal and toast info.
 * @returns {void} Does not return a value.
 */
export function renderStudyView(data = {}) {
    renderRoot(renderStudyShell(data), data.modal, data.toast);
}

