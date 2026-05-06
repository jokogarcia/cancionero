const LANGUAGE_KEY = 'cancionero_language';

const en = {
    home: {
        loading: 'Loading songs\u2026',
        mySongs: 'My Songs',
        favorites: 'Favorites',
        localFiles: 'Local Files',
        noSongsLoaded: 'No songs loaded.',
        grantAccess: 'Grant access',
        results: 'Results for \u201c{query}\u201d',
        allSongs: 'All Songs',
        songs: 'Songs',
        noSongsFound: 'No songs found.',
        search: 'Search\u2026',
        openFileTitle: 'Open a .crd file from your device',
        openFileLabel: 'Open file',
        settingsLabel: 'Settings',
        addSongLabel: 'Add a song',
        signOutLabel: 'Sign out',
        signInLabel: 'Sign in',
        localFile: 'Local file',
    },
    song: {
        loading: 'Loading\u2026',
        notFound: 'Song not found.',
        back: 'Back',
        removeFavorite: 'Remove from favorites',
        addFavorite: 'Add to favorites',
        pauseScroll: 'Pause auto-scroll',
        playScroll: 'Play auto-scroll',
        scrollRateTitle: 'Scroll rate (lines per second)',
        scrollRateLabel: 'Scroll rate in lines per second',
        lps: 'lps',
        local: 'Local',
        localBadgeTitle: 'Loaded from a local .crd file',
    },
    settings: {
        title: 'Settings',
        back: 'Back',
        playback: 'Playback',
        scrollRate: 'Default auto-scroll rate',
        scrollRateHint: 'Lines per second',
        display: 'Display',
        fontSize: 'Font size',
        fontSizeHint: 'Multiplier applied to lyrics ({size}\u00d7)',
        theme: 'Theme',
        themeHint: 'Follow system or force a mode',
        themeSystem: 'System',
        themeLight: 'Light',
        themeDark: 'Dark',
        language: 'Language',
        languageHint: 'App display language',
        languageSystem: 'System default',
        languageEn: 'English',
        languageEs: 'Espa\u00f1ol',
        languageDe: 'Deutsch',
        library: 'Library',
        localLocation: 'Local files location',
        notSupported: 'Not supported in this browser',
        scanningFolder: 'Scanning {name} for .crd files on startup',
        selectFolderHint: 'Select a folder to scan for .crd files on startup',
        changeFolder: 'Change',
        selectFolder: 'Select folder',
        clear: 'Clear',
        data: 'Data',
        favoritesName: 'Favorites',
        favoritesHint: '1 saved song',
        favoritesHintPlural: '{count} saved songs',
        clearFavorites: 'Clear favorites',
        resetSettings: 'Reset settings',
        resetHint: 'Restore defaults for all options above',
        reset: 'Reset',
        confirmClearFavorites: 'Remove all favorites? This cannot be undone.',
        confirmReset: 'Reset all settings to defaults?',
    },
    addSong: {
        back: '\u2190 Back',
        title: 'Add a Song',
        failedSave: 'Failed to save song. Please try again.',
        titleLabel: 'Title',
        titleRequired: 'Title is required.',
        authorLabel: 'Author(s)',
        artistLabel: 'Artist',
        yearLabel: 'Year',
        albumLabel: 'Album',
        keyLabel: 'Key',
        contentLabel: 'Content',
        contentRequired: 'Content is required.',
        saving: 'Saving\u2026',
        save: 'Save Song',
        loading: 'Loading\u2026',
    },
    login: {
        subtitle: 'Sign in to add and manage your songs.',
        signingIn: 'Signing in\u2026',
        signInGoogle: 'Sign in with Google',
        backToSongs: '\u2190 Back to songs',
    },
    scan: {
        progress: 'Scanning\u2026 {processed} processed, {found} found',
    },
};

const es = {
    home: {
        loading: 'Cargando canciones\u2026',
        mySongs: 'Mis Canciones',
        favorites: 'Favoritos',
        localFiles: 'Archivos Locales',
        noSongsLoaded: 'No se cargaron canciones.',
        grantAccess: 'Permitir acceso',
        results: 'Resultados para \u201c{query}\u201d',
        allSongs: 'Todas las Canciones',
        songs: 'Canciones',
        noSongsFound: 'No se encontraron canciones.',
        search: 'Buscar\u2026',
        openFileTitle: 'Abrir un archivo .crd de tu dispositivo',
        openFileLabel: 'Abrir archivo',
        settingsLabel: 'Ajustes',
        addSongLabel: 'Agregar canci\u00f3n',
        signOutLabel: 'Cerrar sesi\u00f3n',
        signInLabel: 'Iniciar sesi\u00f3n',
        localFile: 'Archivo local',
    },
    song: {
        loading: 'Cargando\u2026',
        notFound: 'Canci\u00f3n no encontrada.',
        back: 'Atr\u00e1s',
        removeFavorite: 'Quitar de favoritos',
        addFavorite: 'Agregar a favoritos',
        pauseScroll: 'Pausar desplazamiento',
        playScroll: 'Iniciar desplazamiento',
        scrollRateTitle: 'Velocidad de desplazamiento (l\u00edneas por segundo)',
        scrollRateLabel: 'Velocidad de desplazamiento en l\u00edneas por segundo',
        lps: 'l/s',
        local: 'Local',
        localBadgeTitle: 'Cargado desde un archivo .crd local',
    },
    settings: {
        title: 'Ajustes',
        back: 'Atr\u00e1s',
        playback: 'Reproducci\u00f3n',
        scrollRate: 'Velocidad de desplazamiento predeterminada',
        scrollRateHint: 'L\u00edneas por segundo',
        display: 'Pantalla',
        fontSize: 'Tama\u00f1o de fuente',
        fontSizeHint: 'Multiplicador aplicado a la letra ({size}\u00d7)',
        theme: 'Tema',
        themeHint: 'Seguir el sistema o forzar un modo',
        themeSystem: 'Sistema',
        themeLight: 'Claro',
        themeDark: 'Oscuro',
        language: 'Idioma',
        languageHint: 'Idioma de la aplicaci\u00f3n',
        languageSystem: 'Predeterminado del sistema',
        languageEn: 'English',
        languageEs: 'Espa\u00f1ol',
        languageDe: 'Deutsch',
        library: 'Biblioteca',
        localLocation: 'Ubicaci\u00f3n de archivos locales',
        notSupported: 'No compatible con este navegador',
        scanningFolder: 'Escaneando {name} en busca de archivos .crd al iniciar',
        selectFolderHint: 'Selecciona una carpeta para buscar archivos .crd al iniciar',
        changeFolder: 'Cambiar',
        selectFolder: 'Seleccionar carpeta',
        clear: 'Limpiar',
        data: 'Datos',
        favoritesName: 'Favoritos',
        favoritesHint: '1 canci\u00f3n guardada',
        favoritesHintPlural: '{count} canciones guardadas',
        clearFavorites: 'Borrar favoritos',
        resetSettings: 'Restablecer ajustes',
        resetHint: 'Restaurar valores predeterminados de todas las opciones',
        reset: 'Restablecer',
        confirmClearFavorites: '\u00bfEliminar todos los favoritos? Esta acci\u00f3n no se puede deshacer.',
        confirmReset: '\u00bfRestablecer todos los ajustes a los valores predeterminados?',
    },
    addSong: {
        back: '\u2190 Atr\u00e1s',
        title: 'Agregar Canci\u00f3n',
        failedSave: 'Error al guardar la canci\u00f3n. Por favor, int\u00e9ntalo de nuevo.',
        titleLabel: 'T\u00edtulo',
        titleRequired: 'El t\u00edtulo es obligatorio.',
        authorLabel: 'Autor(es)',
        artistLabel: 'Artista',
        yearLabel: 'A\u00f1o',
        albumLabel: '\u00c1lbum',
        keyLabel: 'Tonalidad',
        contentLabel: 'Contenido',
        contentRequired: 'El contenido es obligatorio.',
        saving: 'Guardando\u2026',
        save: 'Guardar Canci\u00f3n',
        loading: 'Cargando\u2026',
    },
    login: {
        subtitle: 'Inicia sesi\u00f3n para agregar y gestionar tus canciones.',
        signingIn: 'Iniciando sesi\u00f3n\u2026',
        signInGoogle: 'Iniciar sesi\u00f3n con Google',
        backToSongs: '\u2190 Volver a las canciones',
    },
    scan: {
        progress: 'Escaneando\u2026 {processed} procesados, {found} encontrados',
    },
};

const de = {
    home: {
        loading: 'Lieder werden geladen\u2026',
        mySongs: 'Meine Lieder',
        favorites: 'Favoriten',
        localFiles: 'Lokale Dateien',
        noSongsLoaded: 'Keine Lieder geladen.',
        grantAccess: 'Zugriff erlauben',
        results: 'Ergebnisse f\u00fcr \u201e{query}\u201c',
        allSongs: 'Alle Lieder',
        songs: 'Lieder',
        noSongsFound: 'Keine Lieder gefunden.',
        search: 'Suchen\u2026',
        openFileTitle: 'Eine .crd-Datei vom Ger\u00e4t \u00f6ffnen',
        openFileLabel: 'Datei \u00f6ffnen',
        settingsLabel: 'Einstellungen',
        addSongLabel: 'Lied hinzuf\u00fcgen',
        signOutLabel: 'Abmelden',
        signInLabel: 'Anmelden',
        localFile: 'Lokale Datei',
    },
    song: {
        loading: 'Wird geladen\u2026',
        notFound: 'Lied nicht gefunden.',
        back: 'Zur\u00fcck',
        removeFavorite: 'Aus Favoriten entfernen',
        addFavorite: 'Zu Favoriten hinzuf\u00fcgen',
        pauseScroll: 'Automatisches Scrollen pausieren',
        playScroll: 'Automatisches Scrollen starten',
        scrollRateTitle: 'Scroll-Geschwindigkeit (Zeilen pro Sekunde)',
        scrollRateLabel: 'Scroll-Geschwindigkeit in Zeilen pro Sekunde',
        lps: 'Z/s',
        local: 'Lokal',
        localBadgeTitle: 'Aus einer lokalen .crd-Datei geladen',
    },
    settings: {
        title: 'Einstellungen',
        back: 'Zur\u00fcck',
        playback: 'Wiedergabe',
        scrollRate: 'Standard-Scroll-Geschwindigkeit',
        scrollRateHint: 'Zeilen pro Sekunde',
        display: 'Anzeige',
        fontSize: 'Schriftgr\u00f6\u00dfe',
        fontSizeHint: 'Multiplikator f\u00fcr die Liedtexte ({size}\u00d7)',
        theme: 'Design',
        themeHint: 'System folgen oder Modus erzwingen',
        themeSystem: 'System',
        themeLight: 'Hell',
        themeDark: 'Dunkel',
        language: 'Sprache',
        languageHint: 'Anzeigesprache der App',
        languageSystem: 'Systemstandard',
        languageEn: 'English',
        languageEs: 'Espa\u00f1ol',
        languageDe: 'Deutsch',
        library: 'Bibliothek',
        localLocation: 'Speicherort lokaler Dateien',
        notSupported: 'In diesem Browser nicht unterst\u00fctzt',
        scanningFolder: '{name} wird beim Start nach .crd-Dateien durchsucht',
        selectFolderHint: 'Ordner ausw\u00e4hlen, um beim Start nach .crd-Dateien zu suchen',
        changeFolder: '\u00c4ndern',
        selectFolder: 'Ordner ausw\u00e4hlen',
        clear: 'L\u00f6schen',
        data: 'Daten',
        favoritesName: 'Favoriten',
        favoritesHint: '1 gespeichertes Lied',
        favoritesHintPlural: '{count} gespeicherte Lieder',
        clearFavorites: 'Favoriten l\u00f6schen',
        resetSettings: 'Einstellungen zur\u00fccksetzen',
        resetHint: 'Standardwerte f\u00fcr alle obigen Optionen wiederherstellen',
        reset: 'Zur\u00fccksetzen',
        confirmClearFavorites: 'Alle Favoriten entfernen? Dies kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
        confirmReset: 'Alle Einstellungen auf Standardwerte zur\u00fccksetzen?',
    },
    addSong: {
        back: '\u2190 Zur\u00fcck',
        title: 'Lied hinzuf\u00fcgen',
        failedSave: 'Lied konnte nicht gespeichert werden. Bitte versuche es erneut.',
        titleLabel: 'Titel',
        titleRequired: 'Titel ist erforderlich.',
        authorLabel: 'Autor(en)',
        artistLabel: 'K\u00fcnstler',
        yearLabel: 'Jahr',
        albumLabel: 'Album',
        keyLabel: 'Tonart',
        contentLabel: 'Inhalt',
        contentRequired: 'Inhalt ist erforderlich.',
        saving: 'Wird gespeichert\u2026',
        save: 'Lied speichern',
        loading: 'Wird geladen\u2026',
    },
    login: {
        subtitle: 'Melde dich an, um Lieder hinzuzuf\u00fcgen und zu verwalten.',
        signingIn: 'Anmeldung l\u00e4uft\u2026',
        signInGoogle: 'Mit Google anmelden',
        backToSongs: '\u2190 Zur\u00fcck zu den Liedern',
    },
    scan: {
        progress: 'Scannt\u2026 {processed} verarbeitet, {found} gefunden',
    },
};

const translations = { en, es, de };

const listeners = new Set();

function detectSystemLanguage() {
    const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
    return translations[lang] ? lang : 'en';
}

/**
 * Returns the stored language preference ('system' | 'en' | 'es' | 'de').
 */
export function getLanguageSetting() {
    return localStorage.getItem(LANGUAGE_KEY) || 'system';
}

/**
 * Sets the language preference and notifies subscribers.
 * @param {'system'|'en'|'es'|'de'} lang
 */
export function setLanguageSetting(lang) {
    localStorage.setItem(LANGUAGE_KEY, lang);
    listeners.forEach(fn => fn(lang));
}

/**
 * Returns the resolved language code ('en' | 'es' | 'de') after applying
 * the 'system' fallback.
 */
export function getResolvedLanguage() {
    const setting = getLanguageSetting();
    if (setting === 'system') return detectSystemLanguage();
    return translations[setting] ? setting : 'en';
}

/**
 * Translates a dot-separated key with optional named placeholders.
 * Falls back to English, then to the key itself if not found.
 * @param {string} key  e.g. 'home.loading'
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function t(key, params) {
    const lang = getResolvedLanguage();
    const parts = key.split('.');

    let value = translations[lang];
    for (const part of parts) value = value?.[part];

    if (value === undefined) {
        value = translations.en;
        for (const part of parts) value = value?.[part];
    }

    if (typeof value !== 'string') return key;

    if (params) {
        return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }
    return value;
}

/**
 * Subscribe to language setting changes. Returns an unsubscribe function.
 * @param {(lang: string) => void} fn
 */
export function subscribeToLanguage(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/**
 * Lit mixin that re-renders the component whenever the language changes.
 * @param {typeof import('lit').LitElement} superClass
 */
export const LocalizeMixin = (superClass) => class extends superClass {
    connectedCallback() {
        super.connectedCallback();
        this._unsubLanguage = subscribeToLanguage(() => this.requestUpdate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._unsubLanguage) this._unsubLanguage();
    }
};
