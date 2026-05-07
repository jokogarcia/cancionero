/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { findSong } from '../services/songs.js';
import { getFavorites, isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import { subscribeToAuth, signOutUser } from '../services/auth.js';
import { pickCrdFile, setLocalSong } from '../services/local-song.js';
import { scanLocalFolder, getLocalFolderName } from '../services/local-folder.js';
import { queryLocalSongs } from '../services/local-songs-v2.js';
import { t, LocalizeMixin } from '../services/i18n.js';
import './app-icon.js';

const HOME_SECTIONS_STORAGE_KEY = 'coda_home_sections';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class HomePage extends LocalizeMixin(LitElement) {
    static properties = {
        _query: { type: String, state: true },
        _favorites: { type: Array, state: true },
        _allSongs: { type: Array, state: true },
        _localFolderName: { type: String, state: true },
        _loading: { type: Boolean, state: true },
        _currentUser: { type: Object, state: true },
        _showProgress: { type: Boolean, state: true },
        _scannedCount: { type: Number, state: true },
        _foundCount: { type: Number, state: true },
        _filteredLocalSongs: {type: Array, state: true },
        _filteredSongs: { type: Array, state: true },
        _localLimit: { type: Number, state: true },
        _hasMoreLocal: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this._query = '';
        this._favorites = getFavorites();
        this._allSongs = [];
        this._localFolderName = getLocalFolderName();
        this._loading = true;
        this._currentUser = null;
        this._unsubAuth = null;
        this._progressTimeout = null;
        this._scannedCount = 0;
        this._foundCount = 0;
        this._filteredLocalSongs = [];
        this._filteredSongs = [];
        this._localLimit = 15;
        this._hasMoreLocal = false;
        this._sectionState = this._readSectionState();
    }

    connectedCallback() {
        super.connectedCallback();
        this._unsubAuth = subscribeToAuth(user => {
            this._currentUser = user;
        });
        this._loadSongs();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._unsubAuth) this._unsubAuth();
    }

    async _loadSongs() {
        this._loading = true;
        try {
            this._allSongs = await findSong('', '', '', '', true);
            this._filteredSongs = this._getFilteredSongs();
            this._localLimit = 15;
            this._filteredLocalSongs = await this._getFilteredLocalSongs();
        } finally {
            this._loading = false;
        }
    }

  

    

    _openLocalSong(e, song) {
        e.stopPropagation();
        setLocalSong(song);
        navigate('/open');
    }

    async _onSearch(e) {
        this._query = e.target.value;
        this._filteredSongs = this._getFilteredSongs();
        this._localLimit = 15;
        this._filteredLocalSongs = await this._getFilteredLocalSongs();
    }

    async _loadMoreLocalSongs() {
        this._localLimit += 15;
        this._filteredLocalSongs = await this._getFilteredLocalSongs();
    }

    _toggleFavorite(e, id) {
        e.stopPropagation();
        if (isFavorite(id)) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
        this._favorites = getFavorites();
    }

    async _signOut() {
        await signOutUser();
    }

    async _openLocalFile() {
        try {
            const song = await pickCrdFile();
            if (song) navigate('/open');
        } catch (err) {
            alert('Could not open file: ' + err.message);
        }
    }

    _getFilteredSongs() {
        const q = this._query.trim();
        if (!q) return this._allSongs;
        const lower = q.toLowerCase();
        return this._allSongs.filter(song =>
            song.title?.toLowerCase().includes(lower) ||
            song.artist?.toLowerCase().includes(lower) ||
            song.author?.toLowerCase().includes(lower) ||
            song.content?.toLowerCase().includes(lower)
        );
    }
    async _getFilteredLocalSongs() {
        const q = this._query.trim();
        const r = await queryLocalSongs(q, 0, this._localLimit + 1);
        this._hasMoreLocal = r.length > this._localLimit;
        return this._hasMoreLocal ? r.slice(0, this._localLimit) : r;
    }

    _renderLocalSongItem(song) {
        return html`
            <li class="song-item" @click=${(e) => this._openLocalSong(e, song)}>
                <span class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist || t('home.localFile')}</span>
                </span>
                <span class="local-tag">${t('song.local')}</span>
            </li>
        `;
    }

    _renderSongItem(song) {
        const fav = this._favorites.includes(song.id);
        const favLabel = fav ? t('song.removeFavorite') : t('song.addFavorite');
        return html`
            <li class="song-item" @click=${() => navigate(`/song/${song.id}`)}>
                <span class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist}</span>
                </span>
                <button
                    class="fav-btn ${fav ? 'is-fav' : ''}"
                    aria-label="${favLabel}"
                    title="${favLabel}"
                    @click=${(e) => this._toggleFavorite(e, song.id)}
                ><app-icon .name=${fav ? 'star-solid' : 'star'} .size=${18}></app-icon></button>
            </li>
        `;
    }

    _readSectionState() {
        try {
            return JSON.parse(localStorage.getItem(HOME_SECTIONS_STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    _writeSectionState() {
        localStorage.setItem(HOME_SECTIONS_STORAGE_KEY, JSON.stringify(this._sectionState));
    }

    _isSectionOpen(key) {
        return this._sectionState[key] !== false;
    }

    _onSectionToggle(key, event) {
        this._sectionState = {
            ...this._sectionState,
            [key]: event.currentTarget.open,
        };
        this._writeSectionState();
    }

    _renderSection(key, title, content) {
        return html`
            <details class="section-block" ?open=${this._isSectionOpen(key)} @toggle=${(event) => this._onSectionToggle(key, event)}>
                <summary class="section-summary">
                    <span class="section-title">${title}</span>
                    <span class="section-chevron" aria-hidden="true">▾</span>
                </summary>
                <div class="section-content">${content}</div>
            </details>
        `;
    }

    render() {
        
        const isSearching = this._query.trim().length > 0;
        const favSongs = this._favorites
            .map(id => this._allSongs.find(s => s.id === id))
            .filter(Boolean);
        const mySongs = this._currentUser
            ? this._allSongs.filter(s => s.uploaderId === this._currentUser.uid)
            : [];
        const showFavorites = favSongs.length > 0 && !isSearching;
        const showMySongs = mySongs.length > 0 && !isSearching;
        const showLocal = this._localFolderName;
        const nonSpecialResults = this._filteredSongs.filter(s =>
            !this._favorites.includes(s.id) &&
            !(showMySongs && s.uploaderId === this._currentUser?.uid)
        );

        return html`
            <main>
                ${this._loading ? html`<p class="loading">${t('home.loading')}</p>` : html`
                    ${showMySongs ? html`
                        ${this._renderSection(
                            'mySongs',
                            html`<app-icon class="section-icon" name="queue-list" .size=${16}></app-icon>${t('home.mySongs')}`,
                            html`
                                <ul class="song-list">
                                    ${mySongs.map(s => this._renderSongItem(s))}
                                </ul>
                            `
                        )}
                    ` : ''}

                    ${showFavorites ? html`
                        ${this._renderSection(
                            'favorites',
                            html`<app-icon class="section-icon" name="star-solid" .size=${16}></app-icon>${t('home.favorites')}`,
                            html`
                                <ul class="song-list">
                                    ${favSongs.map(s => this._renderSongItem(s))}
                                </ul>
                            `
                        )}
                    ` : ''}

                    ${this._renderSection(
                        'results',
                        html`${isSearching
                            ? t('home.results', { query: this._query.trim() })
                            : (showFavorites || showMySongs ? t('home.allSongs') : t('home.songs'))
                        }`,
                        this._filteredSongs.length === 0 ? html`<p class="empty">${t('home.noSongsFound')}</p>` : html`
                            <ul class="song-list">
                                ${(isSearching ? this._filteredSongs : nonSpecialResults).map(s => this._renderSongItem(s))}
                            </ul>
                        `
                    )}

                    ${showLocal ? html`
                        ${this._renderSection(
                            'localFiles',
                            html`<app-icon class="section-icon" name="folder" .size=${16}></app-icon>${t('home.localFiles')} <span class="folder-name">(${this._localFolderName})</span>`,
                            this._filteredLocalSongs.length === 0 ? html`
                                ${!isSearching ? html`
                                    <p class="empty">
                                        ${t('home.noSongsLoaded')} 
                                    </p>
                                ` : ''}
                            ` : html`
                                <ul class="song-list">
                                    ${this._filteredLocalSongs.map(s => this._renderLocalSongItem(s))}
                                </ul>
                                ${this._hasMoreLocal ? html`
                                    <button class="load-more-btn" @click=${this._loadMoreLocalSongs}>Load more</button>
                                ` : ''}
                            `
                        )}
                    ` : ''}
                `}
            </main>

            <nav class="bottom-nav" aria-label="Main actions">
                <div class="search-wrapper">
                    <input
                        type="search"
                        placeholder=${t('home.search')}
                        .value=${this._query}
                        @input=${this._onSearch}
                        aria-label=${t('home.search')}
                    />
                </div>
                <button class="nav-btn" @click=${this._openLocalFile} title=${t('home.openFileTitle')} aria-label=${t('home.openFileLabel')}><app-icon name="folder-open" .size=${22}></app-icon></button>
                <button class="nav-btn" @click=${() => navigate('/settings')} title=${t('home.settingsLabel')} aria-label=${t('home.settingsLabel')}><app-icon name="cog-6-tooth" .size=${22}></app-icon></button>
                ${this._currentUser ? html`
                    <button class="nav-btn" @click=${() => navigate('/add-song')} title=${t('home.addSongLabel')} aria-label=${t('home.addSongLabel')}><app-icon name="plus" .size=${22}></app-icon></button>
                    <button class="nav-btn nav-avatar" @click=${this._signOut} title=${t('home.signOutLabel')} aria-label=${t('home.signOutLabel')}>
                        ${this._currentUser.photoURL
                            ? html`<img class="avatar" src=${this._currentUser.photoURL} alt=${this._currentUser.displayName || t('home.userAvatar')} />`
                            : html`<span class="avatar-placeholder">${(this._currentUser.displayName || this._currentUser.email || '?')[0].toUpperCase()}</span>`
                        }
                    </button>
                ` : html`
                    <button class="nav-btn" @click=${() => navigate('/login')} title=${t('home.signInLabel')} aria-label=${t('home.signInLabel')}><app-icon name="user-circle" .size=${22}></app-icon></button>
                `}
            </nav>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100svh;
            box-sizing: border-box;
        }

        h2 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-h, #08060d);
            margin: 0 0 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .search-wrapper {
            flex: 1;
            min-width: 0;
        }

        input[type="search"] {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 14px;
            font-size: 1rem;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 10px;
            background: var(--bg, #fff);
            color: var(--text-h, #08060d);
            outline: none;
            transition: border-color 0.2s;
        }

        input[type="search"]:focus {
            border-color: var(--accent, #aa3bff);
        }

        main {
            flex: 1;
            padding: 16px;
            padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
            background: var(--bg, #fff);
            border-top: 1px solid var(--border, #e5e4e7);
            z-index: 100;
        }

        .nav-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 10px;
            width: 48px;
            height: 48px;
            font-size: 1.4rem;
            line-height: 1;
            cursor: pointer;
            color: var(--text-h, #08060d);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            padding: 0;
            transition: background 0.15s;
        }

        .nav-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .nav-avatar {
            overflow: hidden;
            padding: 0;
        }

        section {
            display: flex;
            flex-direction: column;
        }

        .section-block {
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 12px;
            background: var(--bg, #fff);
            overflow: hidden;
        }

        .section-summary {
            list-style: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
            user-select: none;
        }

        .section-summary::-webkit-details-marker {
            display: none;
        }

        .section-title {
            min-width: 0;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-h, #08060d);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .section-content {
            padding: 0 8px 8px;
        }

        .section-chevron {
            color: var(--text, #6b6375);
            transition: transform 0.15s ease;
        }

        .section-block:not([open]) .section-chevron {
            transform: rotate(-90deg);
        }

        .song-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .song-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.15s;
            gap: 8px;
        }

        .song-item:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .song-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        .song-title {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-h, #08060d);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .song-artist {
            font-size: 0.85rem;
            color: var(--text, #6b6375);
        }

        .fav-btn {
            background: none;
            border: none;
            font-size: 1.4rem;
            cursor: pointer;
            padding: 4px 6px;
            color: var(--text, #6b6375);
            flex-shrink: 0;
            line-height: 1;
            transition: color 0.15s, transform 0.15s;
            border-radius: 4px;
        }

        .fav-btn:hover {
            transform: scale(1.2);
        }

        .fav-btn.is-fav {
            color: var(--accent, #aa3bff);
        }

        .local-tag {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 8px;
            border-radius: 999px;
            background: var(--accent-bg, rgba(170, 59, 255, 0.1));
            color: var(--accent, #aa3bff);
            border: 1px solid var(--accent-border, rgba(170, 59, 255, 0.5));
            flex-shrink: 0;
        }

        .folder-name {
            text-transform: none;
            letter-spacing: normal;
            font-weight: 400;
            color: var(--text, #6b6375);
            font-size: 0.85rem;
        }

        .link-btn {
            background: none;
            border: none;
            color: var(--accent, #aa3bff);
            text-decoration: underline;
            cursor: pointer;
            padding: 0;
            font: inherit;
        }

        .empty {
            color: var(--text, #6b6375);
            font-size: 0.95rem;
            margin: 8px 0 0;
        }

        .load-more-btn {
            margin-top: 10px;
            align-self: flex-start;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 8px;
            background: var(--bg, #fff);
            color: var(--text-h, #08060d);
            padding: 8px 12px;
            cursor: pointer;
            font: inherit;
        }

        .load-more-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .loading {
            color: var(--text, #6b6375);
            font-size: 0.95rem;
            text-align: center;
            padding: 32px 0;
        }

        .avatar {
            width: 46px;
            height: 46px;
            border-radius: 8px;
            display: block;
            object-fit: cover;
        }

        .avatar-placeholder {
            width: 46px;
            height: 46px;
            border-radius: 8px;
            background: var(--accent, #aa3bff);
            color: #fff;
            font-size: 1.1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Tablet and up */
        @media (min-width: 600px) {
            main {
                padding: 24px;
                padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            }
        }

        /* Desktop */
        @media (min-width: 900px) {
            main {
                padding: 28px 32px;
                padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            }

            .song-item {
                padding: 14px 16px;
            }
        }
    `;
}

customElements.define('home-page', HomePage);
