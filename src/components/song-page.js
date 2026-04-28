/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { getSongById } from '../services/songs.js';
import { isFavorite, addFavorite, removeFavorite } from '../services/favorites.js';
import { getSettings } from '../services/settings.js';
import { getLocalSong } from '../services/local-song.js';
import './song-renderer.js';
import { globalStyles } from '../styles.js';
function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class SongPage extends LitElement {
    static properties = {
        songId: { type: String },
        source: { type: String },
        _song: { type: Object, state: true },
        _loading: { type: Boolean, state: true },
        _favorite: { type: Boolean, state: true },
        _playing: { type: Boolean, state: true },
        _rate: { type: Number, state: true },
    };

    constructor() {
        super();
        this._song = null;
        this._loading = true;
        this._favorite = false;
        this._playing = false;
        this._rate = getSettings().scrollRate;
        this._rafId = null;
        this._lastFrame = 0;
        this._pixelAccum = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSong();
    }

    disconnectedCallback() {
        this._stopScroll();
        super.disconnectedCallback();
    }

    updated(changedProps) {
        if (changedProps.has('songId') || changedProps.has('source')) {
            this._stopScroll();
            this._loadSong();
        }
    }

    async _loadSong() {
        this._loading = true;
        this._song = null;
        try {
            if (this.source === 'local') {
                this._song = getLocalSong();
                this._favorite = false;
            } else {
                const song = await getSongById(this.songId);
                this._song = song;
                this._favorite = isFavorite(this.songId);
            }
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

    _onRateChange(e) {
        const v = parseFloat(e.target.value);
        if (!Number.isNaN(v) && v > 0) {
            this._rate = v;
        }
    }

    _togglePlay() {
        if (this._playing) {
            this._stopScroll();
        } else {
            this._startScroll();
        }
    }

    _getLineHeight() {
        const renderer = this.renderRoot.querySelector('song-renderer');
        const probe =
            renderer?.renderRoot?.querySelector('.song-line') ||
            renderer?.renderRoot
                ?.querySelector('song-renderer-v2')
                ?.renderRoot?.querySelector('.song-line, p, div');
        if (probe) {
            const h = probe.getBoundingClientRect().height;
            if (h > 0) return h;
        }
        const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return (Number.isFinite(fs) ? fs : 16) * 1.4;
    }

    _startScroll() {
        if (this._playing) return;
        this._playing = true;
        this._lastFrame = performance.now();
        this._pixelAccum = 0;
        const step = (now) => {
            if (!this._playing) return;
            const dt = (now - this._lastFrame) / 1000;
            this._lastFrame = now;
            const pxPerSec = this._rate * this._getLineHeight();
            this._pixelAccum += pxPerSec * dt;
            const whole = Math.floor(this._pixelAccum);
            if (whole > 0) {
                window.scrollBy(0, whole);
                this._pixelAccum -= whole;
            }
            const se = document.scrollingElement || document.documentElement;
            if (se.scrollTop + se.clientHeight >= se.scrollHeight - 1) {
                this._stopScroll();
                return;
            }
            this._rafId = requestAnimationFrame(step);
        };
        this._rafId = requestAnimationFrame(step);
    }

    _stopScroll() {
        this._playing = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    render() {
        if (this._loading) {
            return html`
                <p class="loading">Loading…</p>
                <div class="toolbar">
                    <button class="back-btn" title="Back" aria-label="Back" @click=${() => navigate('/')}>←</button>
                </div>
            `;
        }
        if (!this._song) {
            return html`
                <p class="not-found">Song not found.</p>
                <div class="toolbar">
                    <button class="back-btn" title="Back" aria-label="Back" @click=${() => navigate('/')}>←</button>
                </div>
            `;
        }
        const favLabel = this._favorite ? 'Remove from favorites' : 'Add to favorites';
        const playLabel = this._playing ? 'Pause auto-scroll' : 'Play auto-scroll';
        const isLocal = this.source === 'local';
        return html`
            <song-renderer .content=${this._song}></song-renderer>
            <div class="toolbar">
                <button class="back-btn" title="Back" aria-label="Back" @click=${() => navigate('/')}>←</button>
                <button
                    class="play-btn ${this._playing ? 'is-playing' : ''}"
                    title=${playLabel}
                    aria-label=${playLabel}
                    aria-pressed=${this._playing}
                    @click=${this._togglePlay}
                >
                    ${this._playing ? '⏸' : '▶'}
                </button>
                <label class="rate" title="Scroll rate (lines per second)">
                    <input
                        class="rate-input"
                        type="number"
                        min="0.004"
                        max="0.01"
                        step="0.001"
                        .value=${String(this._rate)}
                        aria-label="Scroll rate in lines per second"
                        @input=${this._onRateChange}
                    />
                    <span class="rate-unit">lps</span>
                </label>
                ${isLocal ? html`<span class="local-badge" title="Loaded from a local .crd file">Local</span>` : html`
                    <button
                        class="fav-btn ${this._favorite ? 'is-fav' : ''}"
                        title=${favLabel}
                        aria-label=${favLabel}
                        aria-pressed=${this._favorite}
                        @click=${this._toggleFavorite}
                    >
                        ${this._favorite ? '★' : '☆'}
                    </button>
                `}
            </div>
        `;
    }

    static _styles = css`
        :host {
            display: block;
        }

        .toolbar {
            position: sticky;
            bottom: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid var(--border, #e5e4e7);
            background: var(--bg, #fff);
        }

        .back-btn,
        .fav-btn,
        .play-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            width: 40px;
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            line-height: 1;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }

        .back-btn {
            color: var(--text-h, #08060d);
        }

        .back-btn:hover,
        .play-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .play-btn {
            color: var(--text-h, #08060d);
        }

        .play-btn.is-playing {
            color: var(--accent, #aa3bff);
            border-color: var(--accent-border, rgba(170, 59, 255, 0.5));
        }

        .rate {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.85rem;
            color: var(--text, #6b6375);
        }

        .rate-input {
            width: 52px;
            height: 28px;
            padding: 2px 4px;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            background: transparent;
            color: inherit;
            font: inherit;
            text-align: right;
        }

        .fav-btn {
            margin-left: auto;
            color: var(--text, #6b6375);
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

        .local-badge {
            margin-left: auto;
            padding: 4px 10px;
            font-size: 0.8rem;
            border-radius: 999px;
            background: var(--accent-bg, rgba(170, 59, 255, 0.15));
            color: var(--accent, #aa3bff);
            border: 1px solid var(--accent-border, rgba(170, 59, 255, 0.5));
        }
    `;
    static styles = [globalStyles, this._styles];
}

customElements.define('song-page', SongPage);
