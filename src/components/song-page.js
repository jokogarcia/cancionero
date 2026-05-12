/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import { getSongById } from '../services/songs.js';
import { isFavorite, addFavorite, removeFavorite, uploadAndFavoriteSong } from '../services/favorites.js';
import { getSettings } from '../services/settings.js';
import { getLocalSong } from '../services/local-song.js';
import { getLocalFolderFile } from '../services/local-folder.js';
import { acquireWakeLock, releaseWakeLock } from '../services/screen-wake-lock.js';
import './song-renderer.js';
import './app-icon.js';
import { t, LocalizeMixin } from '../services/i18n.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class SongPage extends LocalizeMixin(LitElement) {
    static properties = {
        songId: { type: String },
        source: { type: String },
        _song: { type: Object, state: true },
        _loading: { type: Boolean, state: true },
        _favorite: { type: Boolean, state: true },
        _playing: { type: Boolean, state: true },
        _rate: { type: Number, state: true },
        _formatMode: { type: Boolean, state: true },
        _plainTextContent: { type: String, state: true },
    };

    constructor() {
        super();
        this._song = null;
        this._loading = true;
        this._favorite = false;
        this._playing = false;
        this._rate = getSettings().scrollRate;
        this._formatMode = true;
        this._plainTextContent = null;
        this._loadingPath = null;
        this._rafId = null;
        this._lastFrame = 0;
        this._pixelAccum = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSong();
        void acquireWakeLock();
    }

    disconnectedCallback() {
        this._stopScroll();
        releaseWakeLock();
        super.disconnectedCallback();
    }

    updated(changedProps) {
        if (changedProps.has('songId') || changedProps.has('source')) {
            this._stopScroll();
            releaseWakeLock();
            this._loadSong();
            void acquireWakeLock();
        }
    }

    async _loadSong() {
        this._loading = true;
        this._song = null;
        this._plainTextContent = null;
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

    willUpdate(changedProps) {
        if (changedProps.has('_song') && this._song?.path && this._song.path !== this._loadingPath) {
            this._loadingPath = this._song.path;
            this._plainTextContent = null;
            getLocalFolderFile(this._song.path).then(text => {
                if (this._loadingPath === this._song?.path) {
                    this._plainTextContent = text;
                }
            }).catch(err => {
                console.error('Failed to load local file:', err);
                this._plainTextContent = '';
            });
        }
    }

    async _toggleFavorite() {
        try {
            if (this.source === 'local') {
                if (this._favorite) return;
                this._loading = true;

                let localContent = (this._song?.content || '').trim();
                if (!localContent && this._song?.path) {
                    localContent = (await getLocalFolderFile(this._song.path)).trim();
                }
                if (!localContent) {
                    throw new Error('This local song has no content to upload.');
                }

                const uploadedSong = await uploadAndFavoriteSong({
                    ...this._song,
                    content: localContent,
                });
                this.songId = uploadedSong.id;
                this.source = null;
                this._song = uploadedSong;
                this._favorite = true;
                navigate(`/song/${uploadedSong.id}`);
                return;
            }

            if (this._favorite) {
                removeFavorite(this.songId);
            } else {
                addFavorite(this.songId);
            }
            this._favorite = !this._favorite;
        } catch (err) {
            console.error('Failed to update favorite:', err);
            alert(err?.message || 'Could not update favorite.');
        } finally {
            this._loading = false;
        }
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

    _toggleFormatMode() {
        this._formatMode = !this._formatMode;
    }

    _getLineHeight() {
        if(!this._formatMode) {
            const pre = this.renderRoot.querySelector('.plain-text');
            if (pre) {
                const style = getComputedStyle(pre);
                const parsedLineHeight = parseFloat(style.lineHeight);
                if (Number.isFinite(parsedLineHeight) && parsedLineHeight > 0) {
                    return parsedLineHeight;
                }
                const parsedFontSize = parseFloat(style.fontSize);
                if (Number.isFinite(parsedFontSize) && parsedFontSize > 0) {
                    return parsedFontSize * 1.2;
                }
            }
        }
        const renderer = this.renderRoot.querySelector('song-renderer');
        const probe = renderer?.renderRoot?.querySelector('.song-line') ||
            renderer?.renderRoot
                ?.querySelector('song-renderer-v2')
                ?.renderRoot?.querySelector('p, pre');
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
                <p class="loading">${t('song.loading')}</p>
                <div class="toolbar">
                    <button class="back-btn" title=${t('song.back')} aria-label=${t('song.back')} @click=${() => navigate('/')}><app-icon name="arrow-left" .size=${20}></app-icon></button>
                </div>
            `;
        }
        if (!this._song) {
            return html`
                <p class="not-found">${t('song.notFound')}</p>
                <div class="toolbar">
                    <button class="back-btn" title=${t('song.back')} aria-label=${t('song.back')} @click=${() => navigate('/')}><app-icon name="arrow-left" .size=${20}></app-icon></button>
                </div>
            `;
        }
        const favLabel = this._favorite ? t('song.removeFavorite') : t('song.addFavorite');
        const playLabel = this._playing ? t('song.pauseScroll') : t('song.playScroll');
        const isLocal = this.source === 'local';
        const formatLabel = 'Format';
        const plainTextContent = this._song?.path ? (this._plainTextContent ?? '') : (this._song?.content ?? '');
        return html`
            ${this._formatMode
                ? html`<song-renderer .content=${this._song}></song-renderer>`
                : html`<pre class="plain-text">${plainTextContent}</pre>`
            }
            <div class="toolbar">
                <button class="back-btn" title=${t('song.back')} aria-label=${t('song.back')} @click=${() => navigate('/')}><app-icon name="arrow-left" .size=${20}></app-icon></button>
                <button
                    class="plain-btn ${this._formatMode ? 'is-active' : ''}"
                    title=${formatLabel}
                    aria-label=${formatLabel}
                    aria-pressed=${this._formatMode}
                    @click=${this._toggleFormatMode}
                >
                    <app-icon name='sparkles' .size=${16}></app-icon>
                </button>
                <button
                    class="play-btn ${this._playing ? 'is-playing' : ''}"
                    title=${playLabel}
                    aria-label=${playLabel}
                    aria-pressed=${this._playing}
                    @click=${this._togglePlay}
                >
                    <app-icon .name=${this._playing ? 'pause-solid' : 'play-solid'} .size=${20}></app-icon>
                </button>
                
                <label class="rate" title=${t('song.scrollRateTitle')}>
                    <input
                        class="rate-input"
                        type="number"
                        min="0.01"
                        max="10"
                        step="0.5"
                        .value=${String(this._rate)}
                        aria-label=${t('song.scrollRateLabel')}
                        @input=${this._onRateChange}
                    />
                    <span class="rate-unit">${t('song.lps')}</span>
                </label>
                
                <button
                    class="fav-btn ${this._favorite ? 'is-fav' : ''}"
                    title=${favLabel}
                    aria-label=${favLabel}
                    aria-pressed=${this._favorite}
                    @click=${this._toggleFavorite}
                >
                    <app-icon .name=${this._favorite ? 'star-solid' : 'star'} .size=${20}></app-icon>
                </button>
                ${isLocal ? html`<span class="local-badge" title=${t('song.localBadgeTitle')}>${t('song.local')}</span>` : ''}
            </div>
        `;
    }

    static styles = css`
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

        .plain-btn {
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            background: none;
            height: 40px;
            padding: 0 10px;
            color: var(--text-h, #08060d);
            cursor: pointer;
            font: inherit;
            font-size: 0.85rem;
            white-space: nowrap;
        }

        .plain-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        .plain-btn.is-active {
            color: var(--accent, #aa3bff);
            border-color: var(--accent-border, rgba(170, 59, 255, 0.5));
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

        .plain-text {
            margin: 0;
            padding: 16px;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: 'Courier New', Courier, monospace;
            font-size: calc(0.95rem * var(--song-font-scale, 1));
            color: var(--text-h, #08060d);
            text-align:start;
        }
    `;
}

customElements.define('song-page', SongPage);
