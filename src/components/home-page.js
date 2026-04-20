/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { findSong } from '../services/songs.js';
import { getFavorites, isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import { subscribeToAuth, signOutUser } from '../services/auth.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class HomePage extends LitElement {
    static properties = {
        _query: { type: String, state: true },
        _favorites: { type: Array, state: true },
        _allSongs: { type: Array, state: true },
        _loading: { type: Boolean, state: true },
        _currentUser: { type: Object, state: true },
    };

    constructor() {
        super();
        this._query = '';
        this._favorites = getFavorites();
        this._allSongs = [];
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
        const isSearching = this._query.trim().length > 0;
        const favSongs = this._favorites
            .map(id => this._allSongs.find(s => s.id === id))
            .filter(Boolean);
        const mySongs = this._currentUser
            ? this._allSongs.filter(s => s.uploaderId === this._currentUser.uid)
            : [];
        const showFavorites = favSongs.length > 0 && !isSearching;
        const showMySongs = mySongs.length > 0 && !isSearching;
        const nonSpecialResults = filteredSongs.filter(s =>
            !this._favorites.includes(s.id) &&
            !(showMySongs && s.uploaderId === this._currentUser?.uid)
        );

        return html`
            <header>
                <h1>🎵 Cancionero</h1>
                <div class="search-wrapper">
                    <input
                        type="search"
                        placeholder="Search songs, artists, or lyrics…"
                        .value=${this._query}
                        @input=${this._onSearch}
                        aria-label="Search songs"
                    />
                </div>
                <div class="header-actions">
                    <button class="settings-btn" @click=${() => navigate('/settings')} title="Settings" aria-label="Settings">⚙</button>
                    ${this._currentUser ? html`
                        <button class="add-btn" @click=${() => navigate('/add-song')} aria-label="Add a song">+ Add Song</button>
                        <button class="sign-out-btn" @click=${this._signOut} title="Sign out">
                            ${this._currentUser.photoURL
                                ? html`<img class="avatar" src=${this._currentUser.photoURL} alt=${this._currentUser.displayName || 'User'} />`
                                : html`<span class="avatar-placeholder">${(this._currentUser.displayName || this._currentUser.email || '?')[0].toUpperCase()}</span>`
                            }
                        </button>
                    ` : html`
                        <button class="login-btn" @click=${() => navigate('/login')} aria-label="Sign in">Sign in</button>
                    `}
                </div>
            </header>

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

        header {
            padding: 20px 16px 12px;
            border-bottom: 1px solid var(--border, #e5e4e7);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        h1 {
            margin: 0;
            font-size: 1.6rem;
            color: var(--text-h, #08060d);
            text-align: left;
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
            width: 100%;
        }

        input[type="search"] {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 14px;
            font-size: 1rem;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 8px;
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
            display: flex;
            flex-direction: column;
            gap: 24px;
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

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .add-btn {
            background: var(--accent, #aa3bff);
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px 18px;
            font-size: 0.95rem;
            font-family: inherit;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            transition: opacity 0.15s;
        }

        .add-btn:hover {
            opacity: 0.88;
        }

        .login-btn {
            background: none;
            color: var(--accent, #aa3bff);
            border: 1px solid var(--accent, #aa3bff);
            border-radius: 8px;
            padding: 10px 18px;
            font-size: 0.95rem;
            font-family: inherit;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            transition: background 0.15s;
        }

        .login-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .settings-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 8px;
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
            cursor: pointer;
            color: var(--text-h, #08060d);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.15s;
        }

        .settings-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .sign-out-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            border-radius: 50%;
            overflow: hidden;
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: block;
        }

        .avatar-placeholder {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--accent, #aa3bff);
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Tablet and up */
        @media (min-width: 600px) {
            header {
                flex-direction: row;
                align-items: center;
                padding: 20px 24px 16px;
            }

            h1 {
                font-size: 1.8rem;
                white-space: nowrap;
            }

            .search-wrapper {
                max-width: 400px;
                margin-left: auto;
            }

            main {
                padding: 24px;
            }
        }

        /* Desktop */
        @media (min-width: 900px) {
            header {
                padding: 24px 32px 20px;
            }

            h1 {
                font-size: 2rem;
            }

            main {
                padding: 28px 32px;
            }

            .song-item {
                padding: 14px 16px;
            }
        }
    `;
}

customElements.define('home-page', HomePage);
