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
import { loadDecks } from './decks.js';
import { loadCards } from './cards.js';
import { startStudy, getCurrentCard } from './study.js';
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
}

// UI event handlers
function handleDocumentClick(event) {
    // Handle click events
    // Mutate state if needed
    // Call render()
}

function handleDocumentInput(event) {
    // Handle input events
    // Mutate state if needed
    // Call render()
}

function handleDocumentSubmit(event) {
    // Handle submit events
    // Mutate state if needed
    // Call render()
}

// CustomEvent handlers
function handleDeckSelected(event) {
    // Update state
    // Call render()
}

function handleDeckCreated(event) {
    // Update state
    // Call render()
}

function handleDeckDeleted(event) {
    // Update state
    // Call render()
}

function handleCardCreated(event) {
    // Update state
    // Call render()
}

function handleCardDeleted(event) {
    // Update state
    // Call render()
}

function handleStudyStart(event) {
    // Update state
    // Call render()
}

function handleStudyExit(event) {
    // Update state
    // Call render()
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
                cards: filteredCards
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