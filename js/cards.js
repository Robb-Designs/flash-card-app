import { getCards, getCard, saveCard, deleteCard as deleteCardFromStore } from './store.js';

/**
 * Load all cards for a given deck.
 * @param {string} deckId - The deck ID
 * @returns {Card[]} Array of card objects
 */
export function loadCards(deckId) {
    if (!deckId || typeof deckId !== 'string') {
        throw new Error('Invalid deckId');
    }
    return getCards(deckId);
}

/**
 * Create a new card in a deck.
 * @param {string} deckId - The deck ID
 * @param {string} front - The front side text
 * @param {string} back - The back side text
 * @throws {Error} If inputs are invalid
 */
export function createCard(deckId, front, back) {
    if (typeof deckId !== 'string') {
        throw new Error('Invalid deckId');
    }

    if (typeof front !== 'string' || typeof back !== 'string') {
        throw new Error('Card front and back must be strings');
    }

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || trimmedFront.length > 500) {
        throw new Error('Card front must be 1-500 characters');
    }

    if (!trimmedBack || trimmedBack.length > 500) {
        throw new Error('Card back must be 1-500 characters');
    }

    const savedCard = saveCard({
        deckId,
        front: trimmedFront,
        back: trimmedBack,
    });

    document.dispatchEvent(new CustomEvent('card:created', {
        detail: { card: savedCard }
    }));

    return savedCard;
}

/**
 * Update an existing card's front and/or back content.
 * @param {string} id - The card ID
 * @param {string} front - The new front side text
 * @param {string} back - The new back side text
 * @throws {Error} If inputs are invalid or card not found
 */
export function updateCard(id, front, back) {
    if (typeof id !== 'string') {
        throw new Error('Invalid card id');
    }

    if (typeof front !== 'string' || typeof back !== 'string') {
        throw new Error('Card front and back must be strings');
    }

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || trimmedFront.length > 500) {
        throw new Error('Card front must be 1-500 characters');
    }

    if (!trimmedBack || trimmedBack.length > 500) {
        throw new Error('Card back must be 1-500 characters');
    }

    const existingCard = getCard(id);
    if (!existingCard) {
        throw new Error('Card not found');
    }

    const savedCard = saveCard({
        id,
        front: trimmedFront,
        back: trimmedBack,
    });

    document.dispatchEvent(new CustomEvent('card:updated', {
        detail: { card: savedCard }
    }));

    return savedCard;
}

/**
 * Delete a card by ID.
 * @param {string} id - The card ID
 * @throws {Error} If card not found
 */
export function deleteCard(id) {
    // Validate id
    if (!id || typeof id !== 'string') {
        throw new Error('Invalid card id');
    }

    const existingCard = getCard(id);
    if (!existingCard) {
        throw new Error('Card not found');
    }

    deleteCardFromStore(id);
    document.dispatchEvent(new CustomEvent('card:deleted', { detail: { cardId: id } }));
}
