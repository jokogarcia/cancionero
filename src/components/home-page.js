/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { findSong } from '../services/songs.js';
import { getFavorites, isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import { subscribeToAuth, signOutUser } from '../services/auth.js';
import { pickCrdFile, setLocalSong } from '../services/local-song.js';
import { scanLocalFolder, getLocalFolderName } from '../services/local-folder.js';
import { globalStyles } from '../styles.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class HomePage extends LitElement {
    static properties = {
        _query: { type: String, state: true },
        _favorites: { type: Array, state: true },
        _allSongs: { type: Array, state: true },
        _localSongs: { type: Array, state: true },
        _localFolderName: { type: String, state: true },
        _loading: { type: Boolean, state: true },
        _currentUser: { type: Object, state: true },
    };

    constructor() {
        super();
        this._query = '';
        this._favorites = getFavorites();
        this._allSongs = [];
        this._localSongs = [];
        this._localFolderName = getLocalFolderName();
        this._loading = true;
        this._currentUser = null;
        this._unsubAuth = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._unsubAuth = subscribeToAuth(user => {
            this._currentUser = user;
        });
        this._loadSongs();
        this._loadLocalSongs();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._unsubAuth) this._unsubAuth();
    }

    async _loadSongs() {
        this._loading = true;
        try {
            this._allSongs = await findSong('', '', '', '', true);
        } finally {
            this._loading = false;
        }
    }

    async _loadLocalSongs() {
        if (!this._localFolderName) return;
        try {
            this._localSongs = await scanLocalFolder();
        } catch (err) {
            console.warn('Local folder scan failed:', err);
            this._localSongs = [];
        }
    }

    async _retryLocalScan() {
        try {
            this._localSongs = await scanLocalFolder({ requestPermission: true });
        } catch (err) {
            alert('Could not read folder: ' + err.message);
        }
    }

    _openLocalSong(e, song) {
        e.stopPropagation();
        setLocalSong(song);
        navigate('/open');
    }

    _onSearch(e) {
        this._query = e.target.value;
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

    _getFilteredLocalSongs() {
        const q = this._query.trim();
        if (!q) return this._localSongs;
        const lower = q.toLowerCase();
        return this._localSongs.filter(song =>
            song.title?.toLowerCase().includes(lower) ||
            song.artist?.toLowerCase().includes(lower) ||
            song.author?.toLowerCase().includes(lower) ||
            song.content?.toLowerCase().includes(lower)
        );
    }

    _renderLocalSongItem(song) {
        return html`
            <li class="song-item" @click=${(e) => this._openLocalSong(e, song)}>
                <span class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist || 'Local file'}</span>
                </span>
                <span class="local-tag">Local</span>
            </li>
        `;
    }

    _renderSongItem(song) {
        const fav = this._favorites.includes(song.id);
        return html`
            <li class="song-item" @click=${() => navigate(`/song/${song.id}`)}>
                <span class="song-info">
                    <span class="song-title">${song.title}</span>
                    <span class="song-artist">${song.artist}</span>
                </span>
                <button
                    class="fav-btn ${fav ? 'is-fav' : ''}"
                    aria-label="${fav ? 'Remove from favorites' : 'Add to favorites'}"
                    title="${fav ? 'Remove from favorites' : 'Add to favorites'}"
                    @click=${(e) => this._toggleFavorite(e, song.id)}
                >${fav ? '★' : '☆'}</button>
            </li>
        `;
    }

    render() {
        const filteredSongs = this._getFilteredSongs();
        const filteredLocalSongs = this._getFilteredLocalSongs();
        const isSearching = this._query.trim().length > 0;
        const favSongs = this._favorites
            .map(id => this._allSongs.find(s => s.id === id))
            .filter(Boolean);
        const mySongs = this._currentUser
            ? this._allSongs.filter(s => s.uploaderId === this._currentUser.uid)
            : [];
        const showFavorites = favSongs.length > 0 && !isSearching;
        const showMySongs = mySongs.length > 0 && !isSearching;
        const showLocal = this._localFolderName && (filteredLocalSongs.length > 0 || this._localSongs.length > 0);
        const nonSpecialResults = filteredSongs.filter(s =>
            !this._favorites.includes(s.id) &&
            !(showMySongs && s.uploaderId === this._currentUser?.uid)
        );

        return html`
            <main>
                ${this._loading ? html`<p class="loading">Loading songs…</p>` : html`
                    ${showMySongs ? html`
                        <section>
                            <h2>🎸 My Songs</h2>
                            <ul class="song-list">
                                ${mySongs.map(s => this._renderSongItem(s))}
                            </ul>
                        </section>
                    ` : ''}

                    ${showFavorites ? html`
                        <section>
                            <h2>⭐ Favorites</h2>
                            <ul class="song-list">
                                ${favSongs.map(s => this._renderSongItem(s))}
                            </ul>
                        </section>
                    ` : ''}

                    ${showLocal ? html`
                        <section>
                            <h2>📂 Local Files <span class="folder-name">(${this._localFolderName})</span></h2>
                            ${this._localSongs.length === 0 ? html`
                                <p class="empty">
                                    No songs loaded. <button class="link-btn" @click=${this._retryLocalScan}>Grant access</button> to scan this folder.
                                </p>
                            ` : html`
                                <ul class="song-list">
                                    ${filteredLocalSongs.map(s => this._renderLocalSongItem(s))}
                                </ul>
                            `}
                        </section>
                    ` : ''}

                    <section>
                        <h2>${isSearching
                            ? `Results for "${this._query.trim()}"`
                            : (showFavorites || showMySongs ? 'All Songs' : 'Songs')
                        }</h2>
                        ${filteredSongs.length === 0 ? html`<p class="empty">No songs found.</p>` : html`
                            <ul class="song-list">
                                ${(isSearching ? filteredSongs : nonSpecialResults).map(s => this._renderSongItem(s))}
                            </ul>
                        `}
                    </section>
                `}
            </main>

            <nav class="bottom-nav" aria-label="Main actions">
                <div class="search-wrapper">
                    <input
                        type="search"
                        placeholder="Search…"
                        .value=${this._query}
                        @input=${this._onSearch}
                        aria-label="Search songs"
                    />
                </div>
                <button class="nav-btn" @click=${this._openLocalFile} title="Open a .crd file from your device" aria-label="Open file">
                    <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
                </button>
                <button class="nav-btn" @click=${() => navigate('/settings')} title="Settings" aria-label="Settings">
                    <i class="fa-solid fa-gear" aria-hidden="true"></i>
                </button>
                ${this._currentUser ? html`
                    <button class="nav-btn" @click=${() => navigate('/add-song')} title="Add a song" aria-label="Add a song">
                        <i class="fa-solid fa-plus" aria-hidden="true"></i>
                    </button>
                    <button class="nav-btn nav-avatar" @click=${this._signOut} title="Sign out" aria-label="Sign out">
                        ${this._currentUser.photoURL
                            ? html`<img class="avatar" src=${this._currentUser.photoURL} alt=${this._currentUser.displayName || 'User'} />`
                            : html`<span class="avatar-placeholder">${(this._currentUser.displayName || this._currentUser.email || '?')[0].toUpperCase()}</span>`
                        }
                    </button>
                ` : html`
                    <button class="nav-btn" @click=${() => navigate('/login')} title="Sign in" aria-label="Sign in">
                        <i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i>
                    </button>
                `}
            </nav>
        `;
    }

    static styles = [globalStyles, css`
        /* Shadow DOM bridge for a small subset of Font Awesome icons used here */
        .fa-solid {
            display: inline-block;
            width: 1.25em;
            line-height: 1;
            text-align: center;
            font-family: 'Font Awesome 7 Free', 'Font Awesome 6 Free', 'Font Awesome 5 Free';
            font-weight: 900;
            font-style: normal;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .fa-solid::before {
            display: inline-block;
        }

        .fa-folder-open::before {
            content: '\\f07c';
        }

        .fa-gear::before,
        .fa-cog::before {
            content: '\\f013';
        }

        .fa-plus::before {
            content: '\\2b';
        }

        .fa-right-to-bracket::before,
        .fa-sign-in::before {
            content: '\\f090';
        }

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
    `];
}

customElements.define('home-page', HomePage);
