/**
 * app.js
 *
 * Application entry point and orchestrator.
 *
 * Responsibilities:
 * - Manage global app state
 * - Coordinate between modules
 * - Handle events and trigger renders
 * - Call ui.js for rendering
 *
 * Rules:
 * - No DOM manipulation
 * - No direct module-to-module calls
 * - Central render cycle
 */

alert('Hello from app.js!');
// Imports
import { init as storeInit, getLastActiveDeck } from './store.js';
import { loadDecks, createDeck, deleteDeck, selectDeck } from './decks.js';
import { loadCards, createCard, deleteCard } from './cards.js';
import { startStudy, getCurrentCard, nextCard, prevCard, flipCard, restartStudy, exitStudy } from './study.js';
import { filterCards } from './search.js';
import { renderHomeView, renderDeckView, renderStudyView } from './ui.js';
import { initKeyboard } from './keyboard.js';

// Global state
const state = {
    view: 'home', // 'home' | 'deck' | 'study'
    activeDeckId: null,
    decks: [],
    searchQuery: ''
};

// Initialization
function init() {

    // Initialize store
    storeInit();

    // Initialize keyboard shortcuts
    initKeyboard();

    // Load decks
    state.decks = loadDecks();

    // Restore last active deck
    const lastDeckId = getLastActiveDeck();
    if (lastDeckId && state.decks.some(d => d.id === lastDeckId)) {
        state.activeDeckId = lastDeckId;
        state.view = 'deck';
    }

    // Register event listeners
    registerEventListeners();

    // Initial render
    render();
}

// Event listeners
function registerEventListeners() {
    // UI events
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('input', handleDocumentInput);
    document.addEventListener('submit', handleDocumentSubmit);

    // CustomEvents
    document.addEventListener('deck:selected', handleDeckSelected);
    document.addEventListener('deck:created', handleDeckCreated);
    document.addEventListener('deck:deleted', handleDeckDeleted);
    document.addEventListener('card:created', handleCardCreated);
    document.addEventListener('card:deleted', handleCardDeleted);
    document.addEventListener('study:start', handleStudyStart);
    document.addEventListener('study:exit', handleStudyExit);
    document.addEventListener('study:next', handleStudyUpdate);
    document.addEventListener('study:prev', handleStudyUpdate);
    document.addEventListener('study:flip', handleStudyUpdate);
    document.addEventListener('study:shuffle', handleStudyUpdate);
    document.addEventListener('study:complete', handleStudyUpdate);
}

// UI event handlers
function handleDocumentClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;

    switch (action) {
        case 'select-deck':
            if (id) {
                selectDeck(id);
            }
            break;

        case 'create-deck': {
            const name = window.prompt('Deck name?');
            if (name && name.trim()) {
                createDeck(name.trim());
            }
            break;
        }

        case 'delete-deck':
            if (id) {
                deleteDeck(id);
            }
            break;

        case 'create-card': {
            const deckId = id || state.activeDeckId;
            if (!deckId) break;

            const front = window.prompt('Front text?');
            const back = window.prompt('Back text?');

            if (front && back) {
                createCard(deckId, front.trim(), back.trim());
            }
            break;
        }

        case 'delete-card':
            if (id) {
                deleteCard(id);
            }
            break;

        case 'start-study': {
            const deckId = id || state.activeDeckId;
            if (!deckId) break;

            const cards = loadCards(deckId);
            startStudy(deckId, cards);
            break;
        }

        case 'next-card':
            nextCard();
            break;

        case 'prev-card':
            prevCard();
            break;

        case 'flip-card':
            flipCard();
            break;

        case 'restart-study':
            restartStudy();
            break;

        case 'exit-study':
            exitStudy();
            break;

        default:
            break;
    }
}

function handleDocumentInput(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    if (action === 'search-cards') {
        state.searchQuery = actionEl.value ?? '';
        render();
    }
}

function handleDocumentSubmit(event) {
    event.preventDefault();
}

// CustomEvent handlers
function handleDeckSelected(event) {
    const deckId = event.detail?.deckId ?? null;

    state.activeDeckId = deckId;
    state.view = deckId ? 'deck' : 'home';
    state.searchQuery = '';
    state.decks = loadDecks();

    render();
}

function handleDeckCreated(event) {
    const createdDeckId = event.detail?.deck?.id ?? null;

    state.decks = loadDecks();
    if (createdDeckId) {
        state.activeDeckId = createdDeckId;
        state.view = 'deck';
        state.searchQuery = '';
    }

    render();
}

function handleDeckDeleted(event) {
    const deletedDeckId = event.detail?.deckId ?? null;

    state.decks = loadDecks();

    if (state.activeDeckId === deletedDeckId) {
        const fallbackDeckId = state.decks[0]?.id ?? null;
        state.activeDeckId = fallbackDeckId;
        state.view = fallbackDeckId ? 'deck' : 'home';
        state.searchQuery = '';
    } else if (!state.activeDeckId) {
        state.view = 'home';
    }

    render();
}

function handleCardCreated(event) {
    const deckId = event.detail?.card?.deckId ?? null;

    if (deckId) {
        state.activeDeckId = deckId;
        state.view = 'deck';
    }
    state.decks = loadDecks();

    render();
}

function handleCardDeleted(event) {
    void event;
    state.decks = loadDecks();
    render();
}

function handleStudyUpdate() {
    render();
}

function handleStudyStart(event) {
    const deckId = event.detail?.deckId ?? state.activeDeckId;

    if (deckId) {
        state.activeDeckId = deckId;
    }
    state.view = 'study';

    render();
}

function handleStudyExit(event) {
    const deckId = event.detail?.deckId ?? state.activeDeckId;

    state.activeDeckId = deckId ?? null;
    state.view = state.activeDeckId ? 'deck' : 'home';

    render();
}

// Render function
function render() {
    switch (state.view) {
        case 'home':
            // Compute derived data: decks
            const homeData = {
                decks: state.decks
            };
            renderHomeView(homeData);
            break;

        case 'deck':
            // Compute derived data: activeDeck, cards, filteredCards
            const activeDeck = state.decks.find(deck => deck.id === state.activeDeckId);
            const cards = state.activeDeckId ? loadCards(state.activeDeckId) : [];
            const filteredCards = filterCards(cards, state.searchQuery);
            const deckData = {
                deck: activeDeck,
                cards: filteredCards,
                decks: state.decks,
                searchQuery: state.searchQuery
            };
            renderDeckView(deckData);
            break;

        case 'study':
            // Compute derived data: currentCard
            const currentCard = getCurrentCard();
            const studyData = {
                currentCard,
                deckId: state.activeDeckId
            };
            renderStudyView(studyData);
            break;

        default:
            break;
    }
}

// Export init for external call
export { init };

init();