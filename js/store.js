
/**
 * store.js
 *
 * Central data layer for the application.
 *
 * Responsibilities:
 * - Read/write all data from localStorage
 * - Validate and sanitize all inputs
 * - Enforce data schema (Deck, Card, Settings)
 * - Maintain immutability (no direct reference leaks)
 *
 * Rules:
 * - No DOM manipulation
 * - No global state
 * - No side effects outside localStorage
 */

//---------------------------------------------------------------------------------------------------------------------

// Keys used to store data in localStorage
const STORAGE_KEYS = {
    DECKS: 'flashcards_decks',
    CARDS: 'flashcards_cards',
    LAST_ACTIVE_DECK: 'flashcards_last_active_deck',
    SETTINGS: 'flashcards_settings',
};

// Default application settings used as fallback
const DEFAULT_SETTINGS = {
    theme: 'system',
};

// Returns current timestamp in ISO format
function now() {
    return new Date().toISOString();
}

// Safely parses JSON, returns null if invalid
function safeParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

// Reads and parses data from localStorage safely
// Returns null if unavailable or corrupted
function read(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? null : safeParse(raw);
    } catch {
        return null;
    }
}

// Writes data to localStorage
function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Fail silently; store module must not crash when localStorage is unavailable.
    }
}

// Return shallow copies to prevent external mutation
function cloneDeck(deck) {
    return { ...deck };
}

function cloneCard(card) {
    return { ...card };
}

// Validation helpers ensure data integrity before saving
function validateDeckName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 60;
}

function validateCardText(text) {
    return typeof text === 'string' && text.trim().length > 0 && text.trim().length <= 500;
}

/**
 * Initializes storage with safe defaults.
 * Ensures all required keys exist and are valid.
 */
export function init() {
    const decks = read(STORAGE_KEYS.DECKS);
    if (!Array.isArray(decks)) {
        write(STORAGE_KEYS.DECKS, []);
    }

    const cards = read(STORAGE_KEYS.CARDS);
    if (!Array.isArray(cards)) {
        write(STORAGE_KEYS.CARDS, []);
    }

    const settings = read(STORAGE_KEYS.SETTINGS);
    if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) {
        write(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
    }
}

/**
 * Returns all decks sorted by most recently updated.
 * Always returns a new array (immutable).
 */
export function getDecks() {
    const decks = read(STORAGE_KEYS.DECKS);
    if (!Array.isArray(decks)) {
        return [];
    }

    return [...decks]
        .map(cloneDeck)
        .sort((a, b) => {
            const aTime = new Date(a.updatedAt || 0).valueOf();
            const bTime = new Date(b.updatedAt || 0).valueOf();
            return bTime - aTime;
        });
}

/**
 * Returns a single deck by ID or null if not found.
 */
export function getDeck(id) {
    if (typeof id !== 'string') {
        return null;
    }

    const decks = read(STORAGE_KEYS.DECKS);
    if (!Array.isArray(decks)) {
        return null;
    }

    const deck = decks.find((entry) => entry.id === id);
    return deck ? cloneDeck(deck) : null;
}

/**
 * Creates or updates a deck.
 *
 * - Validates name
 * - Generates ID and timestamps for new decks
 * - Updates updatedAt for existing decks
 */
export function saveDeck(deck) {
    if (typeof deck !== 'object' || deck === null) {
        throw new Error('Deck must be an object.');
    }

    const name = typeof deck.name === 'string' ? deck.name.trim() : '';
    if (!validateDeckName(name)) {
        throw new Error('Deck name must be a trimmed string between 1 and 60 characters.');
    }

    const storedDecks = read(STORAGE_KEYS.DECKS);
    const decks = Array.isArray(storedDecks) ? [...storedDecks] : [];
    const timestamp = now();

    if (deck.id) {
        const index = decks.findIndex((existing) => existing.id === deck.id);
        if (index === -1) {
            throw new Error('Cannot update deck; deck not found.');
        }

        const existing = decks[index];
        const updatedDeck = {
            ...existing,
            name,
            updatedAt: timestamp,
        };
        decks[index] = updatedDeck;
        write(STORAGE_KEYS.DECKS, decks);
        return cloneDeck(updatedDeck);
    }

    const newDeck = {
        id: crypto.randomUUID(),
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    decks.push(newDeck);
    write(STORAGE_KEYS.DECKS, decks);
    return cloneDeck(newDeck);
}



 //Deletes a deck and all associated cards.
 //Maintains referential integrity.
export function deleteDeck(id) {
    if (typeof id !== 'string') {
        return;
    }

    const storedDecks = read(STORAGE_KEYS.DECKS);
    const decks = Array.isArray(storedDecks) ? [...storedDecks] : [];

    const filteredDecks = decks.filter((deck) => deck.id !== id);
    if (filteredDecks.length !== decks.length) {
        write(STORAGE_KEYS.DECKS, filteredDecks);
    }

    const storedCards = read(STORAGE_KEYS.CARDS);
    const cards = Array.isArray(storedCards) ? [...storedCards] : [];
    const filteredCards = cards.filter((card) => card.deckId !== id);
    if (filteredCards.length !== cards.length) {
        write(STORAGE_KEYS.CARDS, filteredCards);
    }
}

//Returns all cards for a given deck ID.
export function getCards(deckId) {
    if (typeof deckId !== 'string') {
        return [];
    }

    const cards = read(STORAGE_KEYS.CARDS);
    if (!Array.isArray(cards)) {
        return [];
    }

    return cards.filter((card) => card.deckId === deckId).map(cloneCard);
}

// Returns a single card by ID or null if not found.
export function getCard(id) {
    if (typeof id !== 'string') {
        return null;
    }

    const cards = read(STORAGE_KEYS.CARDS);
    if (!Array.isArray(cards)) {
        return null;
    }

    const card = cards.find((entry) => entry.id === id);
    return card ? cloneCard(card) : null;
}

/**
 * Creates or updates a card.
 *
 * - Validates front/back text
 * - Ensures parent deck exists
 * - Updates parent deck's updatedAt timestamp
 */

export function saveCard(card) {
    if (typeof card !== 'object' || card === null) {
        throw new Error('Card must be an object.');
    }

    const front = typeof card.front === 'string' ? card.front.trim() : '';
    const back = typeof card.back === 'string' ? card.back.trim() : '';
    const deckId = typeof card.deckId === 'string' ? card.deckId : '';

    if (!validateCardText(front) || !validateCardText(back)) {
        throw new Error('Card front and back must be trimmed strings between 1 and 500 characters.');
    }

    if (!deckId) {
        throw new Error('Card must reference a valid deckId.');
    }

    const storedDecks = read(STORAGE_KEYS.DECKS);
    const decks = Array.isArray(storedDecks) ? [...storedDecks] : [];
    const parentDeck = decks.find((deck) => deck.id === deckId);
    if (!parentDeck) {
        throw new Error('Parent deck does not exist.');
    }

    const storedCards = read(STORAGE_KEYS.CARDS);
    const cards = Array.isArray(storedCards) ? [...storedCards] : [];
    const timestamp = now();

    if (card.id) {
        const index = cards.findIndex((existing) => existing.id === card.id);
        if (index === -1) {
            throw new Error('Cannot update card; card not found.');
        }

        const updatedCard = {
            ...cards[index],
            front,
            back,
            updatedAt: timestamp,
        };
        cards[index] = updatedCard;
        const deckIndex = decks.findIndex((deck) => deck.id === deckId);
        decks[deckIndex] = { ...decks[deckIndex], updatedAt: timestamp };
        write(STORAGE_KEYS.CARDS, cards);
        write(STORAGE_KEYS.DECKS, decks);
        return cloneCard(updatedCard);
    }

    const newCard = {
        id: crypto.randomUUID(),
        deckId,
        front,
        back,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    cards.push(newCard);
    const deckIndex = decks.findIndex((deck) => deck.id === deckId);
    decks[deckIndex] = { ...decks[deckIndex], updatedAt: timestamp };
    write(STORAGE_KEYS.CARDS, cards);
    write(STORAGE_KEYS.DECKS, decks);
    return cloneCard(newCard);
}

// Deletes a card and updates its parent deck timestamp.
export function deleteCard(id) {
    if (typeof id !== 'string') {
        return;
    }

    const storedCards = read(STORAGE_KEYS.CARDS);
    const cards = Array.isArray(storedCards) ? [...storedCards] : [];
    const card = cards.find((entry) => entry.id === id);
    if (!card) {
        return;
    }

    const filteredCards = cards.filter((entry) => entry.id !== id);
    write(STORAGE_KEYS.CARDS, filteredCards);

    const storedDecks = read(STORAGE_KEYS.DECKS);
    const decks = Array.isArray(storedDecks) ? [...storedDecks] : [];
    const deckIndex = decks.findIndex((deck) => deck.id === card.deckId);
    if (deckIndex !== -1) {
        decks[deckIndex] = { ...decks[deckIndex], updatedAt: now() };
        write(STORAGE_KEYS.DECKS, decks);
    }
}

// Stores and retrieves the last selected deck ID
export function getLastActiveDeck() {
    const value = read(STORAGE_KEYS.LAST_ACTIVE_DECK);
    return typeof value === 'string' ? value : null;
}

export function setLastActiveDeck(id) {
    if (id === null) {
        write(STORAGE_KEYS.LAST_ACTIVE_DECK, null);
        return;
    }

    if (typeof id !== 'string') {
        throw new Error('Last active deck id must be a string or null.');
    }

    write(STORAGE_KEYS.LAST_ACTIVE_DECK, id);
}

// Retrieves application settings with fallback defaults.
export function getSettings() {
    const settings = read(STORAGE_KEYS.SETTINGS);
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
        return { ...settings };
    }
    return { ...DEFAULT_SETTINGS };
}

// Merges and saves partial settings updates.
export function saveSettings(patch) {
    if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
        throw new Error('Settings patch must be an object.');
    }

    const current = getSettings();
    const nextSettings = { ...current, ...patch };
    write(STORAGE_KEYS.SETTINGS, nextSettings);
    return { ...nextSettings };
}
