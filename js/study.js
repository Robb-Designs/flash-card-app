/**
 * study.js
 *
 * Study session state
 *
 * Responsibilities:
 * - Maintain private study session state
 * - Provide study session operations
 * - Dispatch study events
 *
 * Rules:
 * - No DOM manipulation
 * - No localStorage access
 * - No ui.js calls
 * - No other feature module imports
 * - Only in-memory state
 */

const session = {
    deckId: null,
    cards: [],
    originalCards: [],
    currentIndex: 0,
    isFlipped: false,
    isShuffled: false,
    isActive: false
};

const dispatchEvent = (type, detail = {}) => {
    const event = new CustomEvent(type, { detail });
    document.dispatchEvent(event);
};

const shuffleArray = (array) => {
    const arr = [...array]; // shallow copy, don't mutate original
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export function startStudy(deckId, cards) {
    if (typeof deckId !== 'string' || deckId.trim() === '') {
        throw new Error('Invalid deckId: must be a non-empty string');
    }
    if (!Array.isArray(cards)) {
        throw new Error('Invalid cards: must be an array');
    }
    session.deckId = deckId;
    session.originalCards = [...cards];
    session.cards = [...cards];
    session.currentIndex = 0;
    session.isFlipped = false;
    session.isShuffled = false;
    session.isActive = true;
    if (cards.length === 0) {
        dispatchEvent('study:complete', { deckId, cardCount: 0 });
    } else {
        dispatchEvent('study:start', { deckId, cardCount: cards.length });
    }
}

export function getCurrentCard() {
    if (
        !session.isActive ||
        session.currentIndex < 0 ||
        session.currentIndex >= session.cards.length
    ) {
        return null;
    }
    return session.cards[session.currentIndex];
}

export function getIsFlipped() {
    return session.isFlipped;
}

export function getCurrentIndex() {
    return session.currentIndex;
}

export function getTotalCards() {
    return session.cards.length;
}

export function nextCard() {
    if (!session.isActive) return;

    if (session.currentIndex < session.cards.length - 1) {
        session.currentIndex++;
        session.isFlipped = false;

        dispatchEvent('study:next', {
            deckId: session.deckId,
            currentIndex: session.currentIndex
        });
    } else {
        session.isActive = false;

        dispatchEvent('study:complete', {
            deckId: session.deckId,
            cardCount: session.cards.length
        });
    }
}

export function prevCard() {
    if (!session.isActive) return;
    if (session.currentIndex > 0) {
        session.currentIndex--;
        session.isFlipped = false;
        dispatchEvent('study:prev', { deckId: session.deckId, currentIndex: session.currentIndex });
    }
}

export function flipCard() {
    if (!session.isActive) return;
    session.isFlipped = !session.isFlipped;

    console.log('isFlipped now:', session.isFlipped);

    dispatchEvent('study:flip', { deckId: session.deckId, isFlipped: session.isFlipped });
}

export function toggleShuffle() {
    if (!session.isActive) return;
    if (session.isShuffled) {
        session.cards = [...session.originalCards];
        session.isShuffled = false;
    } else {
        session.cards = shuffleArray(session.originalCards);
        session.isShuffled = true;
    }
    session.currentIndex = 0;
    session.isFlipped = false;
    dispatchEvent('study:shuffle', { deckId: session.deckId, isShuffled: session.isShuffled });
}

export function restartStudy() {
    if (!session.deckId) return;

    session.isActive = true;
    session.currentIndex = 0;
    session.isFlipped = false;

    dispatchEvent('study:start', {
        deckId: session.deckId,
        cardCount: session.cards.length
    });
}

export function exitStudy() {
    const deckId = session.deckId;
    session.deckId = null;
    session.cards = [];
    session.originalCards = [];
    session.currentIndex = 0;
    session.isFlipped = false;
    session.isShuffled = false;
    session.isActive = false;
    dispatchEvent('study:exit', { deckId });
}