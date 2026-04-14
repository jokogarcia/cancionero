/**
 * @type {string[]}
 */
let favorites = [];

/**
 * Get all favorite song IDs.
 * @returns {string[]}
 */
export function getFavorites() {
    return [...favorites];
}

/**
 * Check if a song is in favorites.
 * @param {string} songId
 * @returns {boolean}
 */
export function isFavorite(songId) {
    return favorites.includes(songId);
}

/**
 * Add a song to favorites.
 * @param {string} songId
 */
export function addFavorite(songId) {
    if (!favorites.includes(songId)) {
        favorites.push(songId);
    }
}

/**
 * Remove a song from favorites.
 * @param {string} songId
 */
export function removeFavorite(songId) {
    favorites = favorites.filter(id => id !== songId);
}
