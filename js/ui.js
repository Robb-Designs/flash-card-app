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
		${viewMarkup}
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

    return `
		<div class="app-layout">
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

    return `
		<div class="app-layout">
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
								value="${escapeHtml(data?.searchQuery ?? '')}"
								placeholder="Search front or back text"
								data-action="search-cards"
							>
						</label>
						<button class="btn btn-primary hover-lift press-down" type="button" data-action="create-card" data-id="${escapeHtml(deckId)}">Add Card</button>
					</section>
					<section class="view-body" aria-label="Cards in deck">
						${renderCardList(cards)}
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
    const currentCard = data?.currentCard ?? null;
    const currentIndex = Number.isInteger(data?.currentIndex) ? data.currentIndex : 0;
    // If totalCards is missing, fall back to 1 when a current card exists.
    const totalCards = Number.isInteger(data?.totalCards) ? data.totalCards : currentCard ? 1 : 0;
    const isFlipped = Boolean(data?.isFlipped);
    const isShuffled = Boolean(data?.isShuffled);
    const frontText = currentCard?.front ?? '';
    const backText = currentCard?.back ?? '';
    const counterText = totalCards > 0 ? `Card ${currentIndex + 1} of ${totalCards}` : 'No cards to study';

    return `
		<section class="study-overlay" aria-label="Study session">
			<header class="study-header">
				<button class="btn btn-ghost" type="button" data-action="exit-study" data-id="${escapeHtml(deckId)}">Exit</button>
				<p class="study-counter">${escapeHtml(counterText)}</p>
				<button
					class="btn btn-secondary"
					type="button"
					data-action="toggle-shuffle"
					data-id="${escapeHtml(deckId)}"
					aria-pressed="${isShuffled ? 'true' : 'false'}"
				>
					Shuffle
				</button>
			</header>
			<main class="study-main">
				<div class="study-progress" aria-hidden="true">
					<div class="study-progress-fill"></div>
				</div>
				<div class="card-flip ${isFlipped ? 'is-flipped' : ''}" data-action="flip-card" data-id="${escapeHtml(deckId)}">
					<div class="card-flip-inner">
						<div class="card card-flip-front">
							<div class="card-front">${escapeHtml(frontText)}</div>
						</div>
						<div class="card card-flip-back">
							<div class="card-back">${escapeHtml(backText)}</div>
						</div>
					</div>
				</div>
				<nav class="study-nav" aria-label="Study controls">
					<button class="btn btn-secondary" type="button" data-action="prev-card" data-id="${escapeHtml(deckId)}">Prev</button>
					<button class="btn btn-ghost" type="button" data-action="restart-study" data-id="${escapeHtml(deckId)}">Restart</button>
					<button class="btn btn-primary" type="button" data-action="next-card" data-id="${escapeHtml(deckId)}">Next</button>
				</nav>
			</main>
		</section>
	`;
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

    return `
		<div class="modal-backdrop" data-modal-open="true">
			<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
				<div class="modal-header">
					<h2 class="modal-title" id="modal-title">${escapeHtml(title)}</h2>
					<button class="btn btn-ghost" type="button" data-action="hide-modal">Close</button>
				</div>
				<div class="modal-body">
					<p class="modal-message">${escapeHtml(message)}</p>
				</div>
				<div class="modal-actions">
					<button class="btn btn-secondary" type="button" data-action="${escapeHtml(cancelAction)}" data-id="${escapeHtml(modalId)}">${escapeHtml(cancelLabel)}</button>
					<button class="btn btn-primary" type="button" data-action="${escapeHtml(confirmAction)}" data-id="${escapeHtml(modalId)}">${escapeHtml(confirmLabel)}</button>
				</div>
			</section>
		</div>
	`;
}

/**
 * Builds the toast markup for a short status message.
 * @param {string} message - The text to display inside the toast.
 * @returns {string} An HTML string for the toast, or an empty string when there is no message.
 */
function renderToastMarkup(message) {
    if (!message) {
        return '';
    }

    return `
		<div class="toast-stack" aria-live="polite" aria-atomic="true">
			<div class="toast toast-info" role="status">
				<p class="toast-message">${escapeHtml(message)}</p>
			</div>
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

        return `
			<li>
				<button class="deck-item hover-lift press-down" type="button" data-action="select-deck" data-id="${escapeHtml(deckId)}">
					<span class="deck-item-name">${escapeHtml(name)}</span>
					<span class="deck-item-count">${cardCount}</span>
				</button>
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
export function renderCardList(cards) {
    if (!Array.isArray(cards) || cards.length === 0) {
        return renderEmptyState('No cards match the current view.');
    }

    const items = cards.map((card) => {
        const front = card?.front ?? '';
        const back = card?.back ?? '';

        return `
			<div class="card hover-lift">
				<div class="card-front">${escapeHtml(front)}</div>
				<div class="card-back">${escapeHtml(back)}</div>
			</div>
		`;
    }).join('');

    return items;
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

