// IMPORTS -------------------------------------------------------------------------

import {
    getDecks,
    getDeck,
    saveDeck,
    setLastActiveDeck,
    deleteDeck as removeDeckFromStore
} from './store.js';
/**
 * Load all decks, sorted by updatedAt descending.
 * @returns {Deck[]} Array of deck objects
 */
export function loadDecks() {
    return getDecks();
}


// FUNCTIONS --------------------------------------------------------------------------------

/**
 * Create a new deck with the given name.
 * @param {string} name - The name of the deck
 * @throws {Error} If name is invalid
 */
export function createDeck(name) {
    if (typeof name !== 'string') {
        throw new Error('Deck name must be a string');
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 60) {
        throw new Error('Deck name must be 1-60 characters');
    }

    const savedDeck = saveDeck({ name: trimmedName });

    document.dispatchEvent(new CustomEvent('deck:created', {
        detail: { deck: savedDeck }
    }));

    return savedDeck;
}

/**
 * Update an existing deck's name.
 * @param {string} id - The deck ID
 * @param {string} name - The new name
 * @throws {Error} If name is invalid or deck not found
 */
export function updateDeck(id, name) {

    if (typeof name !== 'string') {
        throw new Error('Deck name must be a string');
    }

    if (typeof id !== 'string') {
        throw new Error('Deck id must be a string');
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 60) {
        throw new Error('Deck name must be 1-60 characters');
    }

    const existingDeck = getDeck(id);
    if (!existingDeck) {
        throw new Error('Deck not found');
    }

    const savedDeck = saveDeck({
        id,
        name: trimmedName,
    });

    document.dispatchEvent(new CustomEvent('deck:updated', {
        detail: { deck: savedDeck }
    }));

    return savedDeck;
}

/**
 * Delete a deck by ID.
 * @param {string} id - The deck ID
 * @throws {Error} If deck not found
 */
export function deleteDeck(id) {
    if (typeof id !== 'string') {
        throw new Error('Deck id must be a string');
    }

    const existingDeck = getDeck(id);
    if (!existingDeck) {
        throw new Error('Deck not found');
    }

    removeDeckFromStore(id);

    document.dispatchEvent(new CustomEvent('deck:deleted', {
        detail: { deckId: id }
    }));
}

/**
 * Select a deck by ID, updating the last active deck.
 * @param {string} id - The deck ID
 * @throws {Error} If deck not found
 */
export function selectDeck(id) {
    if (typeof id !== 'string') {
        throw new Error('Deck id must be a string');
    }

    const existingDeck = getDeck(id);
    if (!existingDeck) {
        throw new Error('Deck not found');
    }

    setLastActiveDeck(id);

    document.dispatchEvent(new CustomEvent('deck:selected', {
        detail: { deckId: id }
    }));
}