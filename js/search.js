/**
 * search.js
 *
 * Pure utility module for filtering cards by a keyword.
 *
 * Responsibilities:
 * - Perform case-insensitive search
 * - Match against both front and back text
 * - Return a new filtered array (no mutation)
 *
 * Rules:
 * - No DOM access
 * - No localStorage
 * - No side effects
 * - No state
 */

/**
 * Filters cards based on a keyword.
 *
 * @param {Card[]} cards - Array of card objects
 * @param {string} keyword - Search keyword
 * @returns {Card[]} New array of matching cards
 */
export function filterCards(cards, keyword) {
  // Ensure cards is a valid array
  if (!Array.isArray(cards)) {
    return [];
  }

  // If keyword is not a valid string or is empty after trimming,
  // return a shallow copy of all cards (immutability)
  if (typeof keyword !== 'string' || keyword.trim() === '') {
    return [...cards];
  }

  // Normalize keyword for case-insensitive comparison
  const lowerKeyword = keyword.trim().toLowerCase();

  // Filter cards without mutating original array
  return cards.filter((card) => {
    // Safely access front/back (prevent runtime errors)
    const front = typeof card.front === 'string'
      ? card.front.toLowerCase()
      : '';

    const back = typeof card.back === 'string'
      ? card.back.toLowerCase()
      : '';

    // Match keyword against front OR back
    return front.includes(lowerKeyword) || back.includes(lowerKeyword);
  });
}