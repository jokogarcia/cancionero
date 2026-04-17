import { LitElement, html, css } from 'lit';
import { getAllChordNames } from '../services/chords.js';
import './chord-visualizer.js';

function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export class ChordPreviewPage extends LitElement {
    static properties = {
        _selectedChord: { state: true },
        _chordNames: { state: true },
    };

    constructor() {
        super();
        this._selectedChord = 'D';
        this._chordNames = [];
    }

    async connectedCallback() {
        super.connectedCallback();
        this._chordNames = await getAllChordNames();
    }

    _selectChord(name) {
        this._selectedChord = name;
    }

    render() {
        return html`
            <div>
                <h2>Chord Preview</h2>
                <p>Selected: ${this._selectedChord}</p>
                <div class="svg-container">
                    <chord-visualizer .chordName=${this._selectedChord}></chord-visualizer>
                </div>
                <div class="buttons">
                    ${this._chordNames.map(name => html`
                        <button
                            @click=${() => this._selectChord(name)}
                            ?disabled=${name === this._selectedChord}
                        >${name}</button>
                    `)}
                </div>
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
