/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { getSongById } from '../services/songs.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import './song-renderer.js';

export class SongPage extends LitElement {
    static properties = {
        songId: { type: String },
        _favorite: { type: Boolean, state: true },
    };

    connectedCallback() {
        super.connectedCallback();
        this._favorite = isFavorite(this.songId);
    }

    updated(changedProps) {
        if (changedProps.has('songId')) {
            this._favorite = isFavorite(this.songId);
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
        const song = getSongById(this.songId);
        if (!song) {
            return html`<p>Song not found.</p>`;
        }
        return html`
            <button @click=${this._toggleFavorite}>
                ${this._favorite ? '★ Remove from favorites' : '☆ Add to favorites'}
            </button>
            <song-renderer .content=${song}></song-renderer>
        `;
    }

    static styles = css`
        :host {
            display: block;
        }
        button {
            margin: 16px;
            padding: 8px 16px;
            font-size: 1em;
            cursor: pointer;
        }
    `;
}

customElements.define('song-page', SongPage);
