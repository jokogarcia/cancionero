const SETTINGS_KEY = 'cancionero_settings';

const DEFAULTS = {
    scrollRate: 0.01,
    fontSize: 1,
    theme: 'system',
};

const listeners = new Set();

function load() {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
        return { ...DEFAULTS };
    }
}

function save(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    listeners.forEach(fn => fn(settings));
}

/**
 * Get the current settings, merged with defaults.
 * @returns {{ scrollRate: number, fontSize: number, theme: 'system'|'light'|'dark' }}
 */
export function getSettings() {
    return load();
}

/**
 * Update one or more settings and persist.
 * @param {Partial<{ scrollRate: number, fontSize: number, theme: string }>} patch
 */
export function updateSettings(patch) {
    const next = { ...load(), ...patch };
    save(next);
    return next;
}

/**
 * Reset all settings to defaults.
 */
export function resetSettings() {
    save({ ...DEFAULTS });
    return { ...DEFAULTS };
}

/**
 * Subscribe to settings changes. Returns an unsubscribe function.
 * @param {(s: ReturnType<typeof getSettings>) => void} fn
 */
export function subscribeToSettings(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function applyTheme(theme = getSettings().theme) {
    const root = document.documentElement;
    root.dataset.theme = theme;
}

export function applyFontSize(fontSize = getSettings().fontSize) {
    document.documentElement.style.setProperty('--song-font-scale', String(fontSize));
}
