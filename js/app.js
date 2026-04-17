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
    modalInputValue: '',
    modalFormValues: {},
    toasts: []
};

let toastCounter = 0;
const toastTimerMap = new Map();
let modalReturnFocusEl = null;
let lastRenderedView = null;

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
    document.addEventListener('keydown', handleDocumentKeydown);

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
            syncStudyAria(getIsFlipped());
            break;
        case 'select-deck':
            if (id) {
                selectDeck(id);
            }
            break;

        case 'create-deck': {
            openModal({
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
            }, '');
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

            openModal({
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
            }, currentName);
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

            openModal({
                id: state.activeDeckId,
                title: 'New Card',
                message: 'Add the front and back text for this card.',
                confirmLabel: 'Create',
                cancelLabel: 'Cancel',
                confirmAction: 'confirm-create-card',
                cancelAction: 'modal-cancel',
                fields: [
                    {
                        id: 'modal-card-front',
                        name: 'front',
                        label: 'Front',
                        placeholder: 'Enter front text',
                        action: 'modal-field-input',
                        control: 'textarea',
                        rows: 4,
                        value: ''
                    },
                    {
                        id: 'modal-card-back',
                        name: 'back',
                        label: 'Back',
                        placeholder: 'Enter back text',
                        action: 'modal-field-input',
                        control: 'textarea',
                        rows: 4,
                        value: ''
                    }
                ]
            }, {
                front: '',
                back: ''
            });
            break;
        }

        case 'confirm-create-card': {
            const deckId = id || state.modal?.id || state.activeDeckId;
            if (!deckId) break;

            const front = getModalFieldValue('front').trim();
            const back = getModalFieldValue('back').trim();

            if (!front || !back) {
                state.modal = {
                    ...(state.modal || {}),
                    id: deckId,
                    message: 'Card front and back must be 1-500 characters.'
                };
                render();
                break;
            }

            const modalSnapshot = state.modal;
            const formSnapshot = { ...state.modalFormValues };

            try {
                closeModal();
                createCard(deckId, front, back);
            } catch (error) {
                state.modal = {
                    ...(modalSnapshot || {}),
                    id: deckId,
                    message: error instanceof Error ? error.message : 'Unable to create card.'
                };
                state.modalFormValues = formSnapshot;
                render();
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
        return;
    }

    if (action === 'modal-field-input') {
        const fieldName = actionEl.dataset.field;
        if (!fieldName) {
            return;
        }

        state.modalFormValues = {
            ...state.modalFormValues,
            [fieldName]: actionEl.value ?? ''
        };
    }
}

function handleDocumentSubmit(event) {
    event.preventDefault();
}

function handleDocumentKeydown(event) {
    if (!state.modal) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        render();
        return;
    }

    if (event.key !== 'Tab') {
        if (event.key === 'Enter' && state.modal?.confirmAction) {
            const target = event.target;
            if (
                target instanceof HTMLElement &&
                target.closest('.modal') &&
                (target.matches('input') || target.matches('select'))
            ) {
                event.preventDefault();
                const confirmBtn = document.querySelector(`.modal [data-action="${state.modal.confirmAction}"]`);
                if (confirmBtn instanceof HTMLElement) {
                    confirmBtn.click();
                }
            }
        }
        return;
    }

    const focusable = getModalFocusableElements();
    if (focusable.length === 0) {
        return;
    }

    const modal = document.querySelector('.modal');
    const target = event.target;
    if (modal instanceof HTMLElement && target instanceof Node && !modal.contains(target)) {
        event.preventDefault();
        if (event.shiftKey) {
            focusable[focusable.length - 1].focus();
            return;
        }

        focusable[0].focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
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

    showToast('Deck created.', 'success');

    render();
}

function handleDeckUpdated(event) {
    const updatedDeckId = event.detail?.deck?.id ?? null;

    state.decks = loadDecks();
    if (updatedDeckId) {
        state.activeDeckId = updatedDeckId;
    }

    showToast('Deck updated.', 'success');

    render();
}

function closeModal() {
    state.modal = null;
    state.modalInputValue = '';
    state.modalFormValues = {};

    const returnEl = modalReturnFocusEl;
    modalReturnFocusEl = null;

    if (returnEl && returnEl.isConnected) {
        setTimeout(() => {
            returnEl.focus();
        }, 0);
    }
}

function openModal(config, initialValue = '') {
    modalReturnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof initialValue === 'string') {
        state.modalInputValue = initialValue;
        state.modalFormValues = {};
    } else {
        state.modalInputValue = '';
        state.modalFormValues = initialValue && typeof initialValue === 'object' ? { ...initialValue } : {};
    }
    state.modal = config;
    render();
    focusModalFirstElement();
}

function getModalFocusableElements() {
    const modal = document.querySelector('.modal');
    if (!modal) {
        return [];
    }

    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(modal.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement && el.offsetParent !== null);
}

function focusModalFirstElement() {
    queueMicrotask(() => {
        const focusable = getModalFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
            return;
        }

        const modal = document.querySelector('.modal');
        if (modal instanceof HTMLElement) {
            modal.focus();
        }
    });
}

function showToast(message, type = 'info') {
    if (!message) {
        return;
    }

    toastCounter += 1;
    const id = `toast-${toastCounter}`;

    state.toasts = [...state.toasts, { id, message, type }];

    const timerId = setTimeout(() => {
        dismissToast(id);
    }, 4000);

    toastTimerMap.set(id, timerId);
}

function dismissToast(id) {
    state.toasts = state.toasts.filter((toast) => toast.id !== id);

    const timerId = toastTimerMap.get(id);
    if (timerId) {
        clearTimeout(timerId);
        toastTimerMap.delete(id);
    }

    render();
}

function syncStudyAria(isFlipped) {
    const flipEl = document.querySelector('.card-flip');
    if (!(flipEl instanceof HTMLElement)) {
        return;
    }

    const frontText = flipEl.querySelector('.card-front')?.textContent?.trim() ?? '';
    const backText = flipEl.querySelector('.card-back')?.textContent?.trim() ?? '';
    const frontFace = flipEl.querySelector('.card-flip-front');
    const backFace = flipEl.querySelector('.card-flip-back');
    const announcer = document.getElementById('study-announcer');

    const label = isFlipped
        ? `Card back: ${backText || 'No answer text'}. Press Space or Enter to flip back.`
        : `Card front: ${frontText || 'No prompt text'}. Press Space or Enter to reveal answer.`;

    flipEl.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
    flipEl.setAttribute('aria-label', label);

    if (frontFace instanceof HTMLElement) {
        frontFace.setAttribute('aria-hidden', isFlipped ? 'true' : 'false');
    }

    if (backFace instanceof HTMLElement) {
        backFace.setAttribute('aria-hidden', isFlipped ? 'false' : 'true');
    }

    if (announcer instanceof HTMLElement && isFlipped) {
        announcer.textContent = `Card flipped. Answer: ${backText || 'No answer text'}`;
    }
}

function getModalFieldValue(fieldName) {
    return typeof state.modalFormValues[fieldName] === 'string' ? state.modalFormValues[fieldName] : '';
}

function getRenderModal() {
    if (!state.modal) {
        return null;
    }

    if (!state.modal.input) {
        if (!Array.isArray(state.modal.fields)) {
            return state.modal;
        }

        return {
            ...state.modal,
            fields: state.modal.fields.map((field) => ({
                ...field,
                value: typeof state.modalFormValues[field.name] === 'string'
                    ? state.modalFormValues[field.name]
                    : (field.value ?? '')
            }))
        };
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

    showToast('Deck deleted.', 'warning');

    render();
}

function handleCardCreated(event) {
    const deckId = event.detail?.card?.deckId ?? null;

    if (deckId) {
        state.activeDeckId = deckId;
        state.view = 'deck';
    }
    state.decks = loadDecks();

    showToast('Card created.', 'success');

    render();
}

function handleCardDeleted(event) {
    void event;
    state.decks = loadDecks();
    showToast('Card deleted.', 'warning');
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
    const isViewEntry = lastRenderedView !== state.view;

    switch (state.view) {
        case 'home':
            // Compute derived data: decks
            const homeData = {
                decks: state.decks,
                modal: getRenderModal(),
                toast: state.toasts,
                animateEntry: isViewEntry
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
                modal: getRenderModal(),
                toast: state.toasts,
                animateEntry: isViewEntry
            };
            renderDeckView(deckData);
            break;

        case 'study': {
            const currentCard = getCurrentCard();
            const activeDeck = state.decks.find((deck) => deck.id === state.activeDeckId);

            renderStudyView({
                deckId: state.activeDeckId,
                deckName: activeDeck?.name ?? 'Study Session',
                currentCard,
                isFlipped: getIsFlipped(), // 🔥 THIS is the fix
                currentIndex: getCurrentIndex(),
                totalCards: getTotalCards(),
                modal: getRenderModal(),
                toast: state.toasts,
                animateEntry: isViewEntry
            });

            break;
        }
    }

    lastRenderedView = state.view;
}

// Export init for external call
export { init };

init();