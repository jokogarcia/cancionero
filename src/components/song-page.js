/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { getSongById } from '../services/songs.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import './song-renderer.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class SongPage extends LitElement {
    static properties = {
        songId: { type: String },
        _song: { type: Object, state: true },
        _loading: { type: Boolean, state: true },
        _favorite: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this._song = null;
        this._loading = true;
        this._favorite = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSong();
    }

    updated(changedProps) {
        if (changedProps.has('songId')) {
            this._loadSong();
        }
    }

    async _loadSong() {
        this._loading = true;
        this._song = null;
        try {
            const song = await getSongById(this.songId);
            this._song = song;
            this._favorite = isFavorite(this.songId);
        } finally {
            this._loading = false;
        }
    }

    _toggleFavorite() {
        if (this._favorite) {
            removeFavorite(this.songId);
        } else {
            addFavorite(this.songId);
        }
        this._favorite = !this._favorite;
    }

    render() {
        if (this._loading) {
            return html`
                <div class="toolbar">
                    <button class="back-btn" @click=${() => navigate('/')}>← Back</button>
                </div>
                <p class="loading">Loading…</p>
            `;
        }
        if (!this._song) {
            return html`
                <div class="toolbar">
                    <button class="back-btn" @click=${() => navigate('/')}>← Back</button>
                </div>
                <p class="not-found">Song not found.</p>
            `;
        }
        return html`
            <div class="toolbar">
                <button class="back-btn" @click=${() => navigate('/')}>← Back</button>
                <button class="fav-btn ${this._favorite ? 'is-fav' : ''}" @click=${this._toggleFavorite}>
                    ${this._favorite ? '★ Remove from favorites' : '☆ Add to favorites'}
                </button>
            </div>
            <song-renderer .content=${this._song}></song-renderer>
        `;
    }

    static styles = css`
        :host {
            display: block;
        }

        .toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border, #e5e4e7);
        }

        .back-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 0.95rem;
            cursor: pointer;
            color: var(--text-h, #08060d);
            transition: background 0.15s;
        }

        .back-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .fav-btn {
            margin-left: auto;
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            padding: 6px 14px;
            font-size: 0.95rem;
            cursor: pointer;
            color: var(--text, #6b6375);
            transition: background 0.15s, color 0.15s;
        }

        .fav-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .fav-btn.is-fav {
            color: var(--accent, #aa3bff);
            border-color: var(--accent-border, rgba(170, 59, 255, 0.5));
        }

        .not-found,
        .loading {
            padding: 24px;
            color: var(--text, #6b6375);
        }
    `;
}

customElements.define('song-page', SongPage);
