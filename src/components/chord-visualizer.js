import { LitElement, html, css } from 'lit';
import { getChordShapes } from '../services/chords.js';
import { RenderShape } from './chord-renderer.js';

export class ChordVisualizer extends LitElement {
  static properties = {
    chordName: { type: String },
    _shapes: { state: true },
    _index: { type: Number, state: true },
    _loading: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.chordName = '';
    this._shapes = [];
    this._index = 0;
    this._loading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadShapes();
  }

  updated(changedProps) {
    if (changedProps.has('chordName')) {
      this._loadShapes();
    }
  }

  async _loadShapes() {
    const chordName = (this.chordName || '').trim();
    this._index = 0;

    if (!chordName) {
      this._shapes = [];
      this._loading = false;
      return;
    }

    this._loading = true;
    const shapes = await getChordShapes(chordName);
    if ((this.chordName || '').trim() !== chordName) return;
    this._shapes = shapes;
    this._loading = false;
  }

  _prevShape() {
    if (this._shapes.length <= 1) return;
    this._index = (this._index - 1 + this._shapes.length) % this._shapes.length;
  }

  _nextShape() {
    if (this._shapes.length <= 1) return;
    this._index = (this._index + 1) % this._shapes.length;
  }

  _renderShape() {
    if (this._loading) {
      return html`<p>Loading...</p>`;
    }
    if (!this._shapes.length) {
      return html`<p>No shape found.</p>`;
    }
    return RenderShape(this._shapes[this._index]);
  }

  render() {
    const hasMultiple = this._shapes.length > 1;
    return html`
      <div class="container">
        <div class="shape">${this._renderShape()}</div>
        ${hasMultiple
          ? html`
              <div class="controls">
                <button @click=${this._prevShape} aria-label="Previous chord shape">&lt;</button>
                <span>${this._index + 1}/${this._shapes.length}</span>
                <button @click=${this._nextShape} aria-label="Next chord shape">&gt;</button>
              </div>
            `
          : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .shape {
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .controls {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .controls button {
      border: 1px solid var(--border, #ccc);
      border-radius: 6px;
      background: var(--bg, #fff);
      color: inherit;
      cursor: pointer;
      padding: 0.2em 0.7em;
      font-size: 0.95rem;
      line-height: 1.2;
    }

    .controls span {
      font-size: 0.85rem;
      opacity: 0.8;
    }
  `;
}

customElements.define('chord-visualizer', ChordVisualizer);