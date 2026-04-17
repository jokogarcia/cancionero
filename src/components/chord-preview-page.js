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
        _filterText: { state: true },
    };

    constructor() {
        super();
        this._selectedChord = 'D';
        this._chordNames = [];
        this._filterText = '';
    }

    async connectedCallback() {
        super.connectedCallback();
        try {
            this._chordNames = await getAllChordNames();
        } catch (error) {
            console.error('Failed to load chord names:', error);
            this._chordNames = [];
        }
    }

    _selectChord(name) {
        this._selectedChord = name;
    }

    _onFilterInput(event) {
        this._filterText = event.target.value;
    }

    render() {
        const filter = this._filterText.trim().toLowerCase();
        const visibleChordNames = filter
            ? this._chordNames.filter(name => name.toLowerCase().includes(filter))
            : this._chordNames;

        return html`
            <div>
                <h2>Chord Preview</h2>
                <p>Selected: ${this._selectedChord}</p>
                <div class="svg-container">
                    <chord-visualizer .chordName=${this._selectedChord}></chord-visualizer>
                </div>
                <label class="filter">
                    Filtrar por nombre:
                    <input
                        type="text"
                        .value=${this._filterText}
                        @input=${this._onFilterInput}
                        placeholder="Ej: Dm, A7, Cmaj7"
                    />
                </label>
                <div class="buttons">
                    ${visibleChordNames.map(name => html`
                        <button
                            @click=${() => this._selectChord(name)}
                            ?disabled=${name === this._selectedChord}
                        >${name}</button>
                    `)}
                </div>
                ${visibleChordNames.length === 0
                    ? html`<p class="empty">No hay acordes que coincidan con el filtro.</p>`
                    : ''}
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
        .filter {
            display: inline-flex;
            gap: 8px;
            align-items: center;
            margin-top: 8px;
        }
        .empty {
            margin: 8px 0 0;
            font-style: italic;
        }
        .back {
            margin-top: 16px;
        }
    `;
}

customElements.define('chord-preview-page', ChordPreviewPage);
