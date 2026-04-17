import { LitElement, html, css } from 'lit';
import { getAllChordNames, getChordShapes } from '../services/chords.js';
import { RenderShape } from './chord-renderer.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class ChordPreviewPage extends LitElement {
    static properties = {
        _selectedChord: { state: true },
        _chordNames: { state: true },
        _shapes: { state: true },
    };

    constructor() {
        super();
        this._selectedChord = 'D';
        this._chordNames = [];
        this._shapes = [];
    }

    async connectedCallback() {
        super.connectedCallback();
        this._chordNames = await getAllChordNames();
        this._shapes = await getChordShapes(this._selectedChord);
    }

    async _selectChord(name) {
        this._selectedChord = name;
        const shapes = await getChordShapes(name);
        if (this._selectedChord !== name) return;
        this._shapes = shapes;
    }

    _renderChordSvg() {
        if (!this._shapes.length) {
            return html`<p>No shape found for "${this._selectedChord}"</p>`;
        }
        return RenderShape(this._shapes[0]);
    }

    render() {
        const frets = this._shapes[0]?.frets?.join(' ') ?? '';
        return html`
            <div>
                <h2>Chord Preview</h2>
                <p>Selected: ${this._selectedChord}</p>
                <div class="svg-container">
                    ${this._renderChordSvg()}
                </div>
                <div class="buttons">
                    ${this._chordNames.map(name => html`
                        <button
                            @click=${() => this._selectChord(name)}
                            ?disabled=${name === this._selectedChord}
                        >${name}</button>
                    `)}
                </div>
                <p>Frets: ${frets} </p>
                <button class="back" @click=${() => navigate('/')}>Back</button>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: block;
            padding: 16px;
        }
        .svg-container {
            margin: 16px 0;
        }
        .buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 16px 0;
        }
        .back {
            margin-top: 16px;
        }
    `;
}

customElements.define('chord-preview-page', ChordPreviewPage);
