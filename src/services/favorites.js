const FAVORITES_KEY = 'cancionero_favorites';

function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

/**
 * Get all favorite song IDs.
 * @returns {string[]}
 */
export function getFavorites() {
    return loadFavorites();
}

/**
 * Check if a song is in favorites.
 * @param {string} songId
 * @returns {boolean}
 */
export function isFavorite(songId) {
    return loadFavorites().includes(songId);
}

/**
 * Add a song to favorites.
 * @param {string} songId
 */
export function addFavorite(songId) {
    const list = loadFavorites();
    if (!list.includes(songId)) {
        list.push(songId);
        saveFavorites(list);
    }
}

/**
 * Remove a song from favorites.
 * @param {string} songId
 */
export function removeFavorite(songId) {
    saveFavorites(loadFavorites().filter(id => id !== songId));
}
