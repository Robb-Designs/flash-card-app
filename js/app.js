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


// Imports
import { init as storeInit, getLastActiveDeck } from './store.js';
import { loadDecks, createDeck, updateDeck, deleteDeck, selectDeck } from './decks.js';
import { loadCards, createCard, deleteCard } from './cards.js';
import { startStudy, getCurrentCard, nextCard, prevCard, flipCard, restartStudy, exitStudy, getIsFlipped, getCurrentIndex, getTotalCards } from './study.js';
import { filterCards } from './search.js';
import { renderHomeView, renderDeckView, renderStudyView, syncStudyFlip } from './ui.js';
import { initKeyboard } from './keyboard.js';

// Global state
const state = {
    view: 'home', // 'home' | 'deck' | 'study'
    activeDeckId: null,
    decks: [],
    searchQuery: '',
    modal: null,
    modalInputValue: ''
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
    document.addEventListener('deck:updated', handleDeckUpdated);
    document.addEventListener('deck:deleted', handleDeckDeleted);
    document.addEventListener('card:created', handleCardCreated);
    document.addEventListener('card:deleted', handleCardDeleted);
    document.addEventListener('study:start', handleStudyStart);
    document.addEventListener('study:exit', handleStudyExit);
    document.addEventListener('study:next', handleStudyUpdate);
    document.addEventListener('study:prev', handleStudyUpdate);
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
        case 'flip-card':
            flipCard();
            syncStudyFlip(getIsFlipped());
            break;
        case 'select-deck':
            if (id) {
                selectDeck(id);
            }
            break;

        case 'create-deck': {
            state.modalInputValue = '';
            state.modal = {
                title: 'New Deck',
                message: 'Create a new deck.',
                confirmLabel: 'Create',
                cancelLabel: 'Cancel',
                confirmAction: 'confirm-create-deck',
                cancelAction: 'modal-cancel',
                input: {
                    id: 'modal-new-deck-name',
                    name: 'deck-name',
                    label: 'Deck name',
                    placeholder: 'Enter deck name',
                    action: 'modal-input',
                    value: ''
                }
            };
            render();
            break;
        }

        case 'hide-modal':
        case 'modal-cancel':
            closeModal();
            render();
            break;

        case 'delete-deck':
            if (id) {
                deleteDeck(id);
            }
            break;

        case 'edit-deck': {
            if (!id) break;

            const existingDeck = state.decks.find((deck) => deck.id === id);
            const currentName = existingDeck?.name ?? '';

            state.modalInputValue = currentName;
            state.modal = {
                id,
                title: 'Edit Deck',
                message: 'Update the deck name.',
                confirmLabel: 'Save',
                cancelLabel: 'Cancel',
                confirmAction: 'confirm-edit-deck',
                cancelAction: 'modal-cancel',
                input: {
                    id: 'modal-deck-name',
                    name: 'deck-name',
                    label: 'Deck name',
                    placeholder: 'Enter deck name',
                    action: 'modal-input',
                    value: currentName
                }
            };
            render();
            break;
        }

        case 'confirm-edit-deck': {
            const deckId = id || state.modal?.id;
            if (!deckId) break;

            const nextName = state.modalInputValue.trim();
            if (!nextName) {
                state.modal = {
                    ...(state.modal || {}),
                    id: deckId,
                    message: 'Deck name must be 1-60 characters.'
                };
                render();
                break;
            }

            const modalSnapshot = state.modal;
            const inputSnapshot = state.modalInputValue;

            try {
                closeModal();
                updateDeck(deckId, nextName);
            } catch (error) {
                state.modal = {
                    ...(modalSnapshot || {}),
                    id: deckId,
                    message: error instanceof Error ? error.message : 'Unable to update deck.'
                };
                state.modalInputValue = inputSnapshot;
                render();
            }
            break;
        }

        case 'confirm-create-deck': {
            const nextName = state.modalInputValue.trim();
            if (!nextName) {
                state.modal = {
                    ...(state.modal || {}),
                    message: 'Deck name must be 1-60 characters.'
                };
                render();
                break;
            }

            const modalSnapshot = state.modal;
            const inputSnapshot = state.modalInputValue;

            try {
                closeModal();
                createDeck(nextName);
            } catch (error) {
                state.modal = {
                    ...(modalSnapshot || {}),
                    message: error instanceof Error ? error.message : 'Unable to create deck.'
                };
                state.modalInputValue = inputSnapshot;
                render();
            }
            break;
        }

        case 'create-card': {
            if (!state.activeDeckId) break;

            const front = window.prompt('Front text?');
            const back = window.prompt('Back text?');

            if (front && back) {
                createCard(state.activeDeckId, front.trim(), back.trim());
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
        return;
    }

    if (action === 'modal-input') {
        state.modalInputValue = actionEl.value ?? '';
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

function handleDeckUpdated(event) {
    const updatedDeckId = event.detail?.deck?.id ?? null;

    state.decks = loadDecks();
    if (updatedDeckId) {
        state.activeDeckId = updatedDeckId;
    }

    render();
}

function closeModal() {
    state.modal = null;
    state.modalInputValue = '';
}

function getRenderModal() {
    if (!state.modal) {
        return null;
    }

    if (!state.modal.input) {
        return state.modal;
    }

    return {
        ...state.modal,
        input: {
            ...state.modal.input,
            value: state.modalInputValue
        }
    };
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
                decks: state.decks,
                modal: getRenderModal()
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
                searchQuery: state.searchQuery,
                modal: getRenderModal()
            };
            renderDeckView(deckData);
            break;

        case 'study': {
            const currentCard = getCurrentCard();

            renderStudyView({
                deckId: state.activeDeckId,
                currentCard,
                isFlipped: getIsFlipped(), // 🔥 THIS is the fix
                currentIndex: getCurrentIndex(),
                totalCards: getTotalCards(),
                modal: getRenderModal()
            });

            break;
        }
    }
}

// Export init for external call
export { init };

init();