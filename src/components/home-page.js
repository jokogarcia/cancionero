/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { findSong, getSongById } from '../services/songs.js';
import { getFavorites, isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class HomePage extends LitElement {
    static properties = {
        _query: { type: String, state: true },
        _favorites: { type: Array, state: true },
    };

    constructor() {
        super();
        this._query = '';
        this._favorites = getFavorites();
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

    _getSongList() {
        const q = this._query.trim();
        if (!q) {
            // return all songs — use findSong with wildcard-like approach via empty andOr
            return findSong('', '', '', '', true);
        }
        return findSong(q, q, q, q, false);
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
        const allResults = this._getSongList();
        const favSongs = this._favorites.map(id => getSongById(id)).filter(Boolean);
        const nonFavResults = allResults.filter(s => !this._favorites.includes(s.id));
        const showFavorites = favSongs.length > 0 && !this._query.trim();

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
                <button class="add-btn" @click=${() => navigate('/add-song')} aria-label="Add a song">+ Add Song</button>
            </header>

            <main>
                ${showFavorites ? html`
                    <section>
                        <h2>⭐ Favorites</h2>
                        <ul class="song-list">
                            ${favSongs.map(s => this._renderSongItem(s))}
                        </ul>
                    </section>
                ` : ''}

                <section>
                    <h2>${this._query.trim() ? `Results for "${this._query.trim()}"` : (showFavorites ? 'All Songs' : 'Songs')}</h2>
                    ${allResults.length === 0 ? html`<p class="empty">No songs found.</p>` : html`
                        <ul class="song-list">
                            ${(showFavorites ? nonFavResults : allResults).map(s => this._renderSongItem(s))}
                        </ul>
                    `}
                </section>
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
