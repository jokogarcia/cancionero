import { LitElement, html, css } from 'lit';
import { insertSong } from '../services/songs.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class AddSongPage extends LitElement {
    static properties = {
        _errors: { type: Object, state: true },
    };

    constructor() {
        super();
        this._errors = {};
    }

    _validate(data) {
        const errors = {};
        if (!data.title.trim()) errors.title = 'Title is required.';
        if (!data.content.trim()) errors.content = 'Content is required.';
        return errors;
    }

    _onSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            title: form.title.value,
            author: form.author.value,
            artist: form.artist.value,
            year: form.year.value ? Number(form.year.value) : undefined,
            album: form.album.value,
            key: form.key.value,
            content: form.content.value,
        };

        const errors = this._validate(data);
        if (Object.keys(errors).length > 0) {
            this._errors = errors;
            return;
        }

        this._errors = {};
        const newSong = insertSong(data);
        navigate(`/song/${newSong.id}`);
    }

    render() {
        return html`
            <div class="toolbar">
                <button class="back-btn" @click=${() => navigate('/')}>← Back</button>
            </div>
            <main>
                <h1>Add a Song</h1>
                <form @submit=${this._onSubmit} novalidate>
                    <div class="field ${this._errors.title ? 'has-error' : ''}">
                        <label for="title">Title <span class="required" aria-hidden="true">*</span></label>
                        <input id="title" name="title" type="text" autocomplete="off" />
                        ${this._errors.title ? html`<span class="error-msg">${this._errors.title}</span>` : ''}
                    </div>

                    <div class="field">
                        <label for="author">Author(s)</label>
                        <input id="author" name="author" type="text" autocomplete="off" />
                    </div>

                    <div class="field">
                        <label for="artist">Artist</label>
                        <input id="artist" name="artist" type="text" autocomplete="off" />
                    </div>

                    <div class="field">
                        <label for="year">Year</label>
                        <input id="year" name="year" type="number" min="1" max="9999" autocomplete="off" />
                    </div>

                    <div class="field">
                        <label for="album">Album</label>
                        <input id="album" name="album" type="text" autocomplete="off" />
                    </div>

                    <div class="field">
                        <label for="key">Key</label>
                        <input id="key" name="key" type="text" autocomplete="off" />
                    </div>

                    <div class="field ${this._errors.content ? 'has-error' : ''}">
                        <label for="content">Content <span class="required" aria-hidden="true">*</span></label>
                        <textarea id="content" name="content" rows="10"></textarea>
                        ${this._errors.content ? html`<span class="error-msg">${this._errors.content}</span>` : ''}
                    </div>

                    <div class="actions">
                        <button type="submit" class="submit-btn">Save Song</button>
                    </div>
                </form>
            </main>
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

        main {
            padding: 24px 16px;
            max-width: 600px;
            margin: 0 auto;
            box-sizing: border-box;
            width: 100%;
        }

        h1 {
            font-size: 1.6rem;
            color: var(--text-h, #08060d);
            margin: 0 0 24px;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        label {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-h, #08060d);
        }

        .required {
            color: var(--accent, #aa3bff);
        }

        input,
        textarea {
            padding: 10px 12px;
            font-size: 1rem;
            font-family: inherit;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 8px;
            background: var(--bg, #fff);
            color: var(--text-h, #08060d);
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
            width: 100%;
        }

        input:focus,
        textarea:focus {
            border-color: var(--accent, #aa3bff);
        }

        textarea {
            resize: vertical;
            line-height: 1.5;
        }

        .has-error input,
        .has-error textarea {
            border-color: #e53e3e;
        }

        .error-msg {
            font-size: 0.82rem;
            color: #e53e3e;
        }

        .actions {
            display: flex;
            justify-content: flex-end;
            padding-top: 8px;
        }

        .submit-btn {
            background: var(--accent, #aa3bff);
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px 28px;
            font-size: 1rem;
            cursor: pointer;
            font-family: inherit;
            transition: opacity 0.15s;
        }

        .submit-btn:hover {
            opacity: 0.88;
        }

        @media (min-width: 600px) {
            main {
                padding: 32px 24px;
            }

            h1 {
                font-size: 1.8rem;
            }
        }
    `;
}

customElements.define('add-song-page', AddSongPage);
