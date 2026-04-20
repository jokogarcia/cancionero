/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import './chord-visualizer.js';

export class SongRendererV2 extends LitElement {

  static properties = {
    content: { type: Object },
    _modalChord: { type: String, state: true },
  };

  constructor() {
    super();
    this._modalChord = null;
  }
  /**
   *
   * @param {string} line
   * @returns {import('lit').TemplateResult} Html representation of the line.
    * Each chord marker [X] is removed and the following character is wrapped in
    * <span class="chord" data-text="X">c</span>. If there is no following
    * character, a single space is wrapped instead.
   */
  static processSongLine(line){
    const parts = [];
    let cursor = 0;

    while (cursor < line.length) {
      const next = line.slice(cursor).match(/\[([^\]]+)\]/);
      if (!next) {
        parts.push(line.slice(cursor));
        break;
      }

      const chord = next[1];
      const start = cursor + (next.index ?? 0);
      const end = start + next[0].length;

      if (start > cursor) {
        parts.push(line.slice(cursor, start));
      }

      let i = end;
      while (i < line.length && /\s/.test(line[i])) i++;

      if (i < line.length) {
        if (i > end) parts.push(line.slice(end, i));

        const nextChar = line[i];
        parts.push(html`<span class="chord" data-text=${chord}>${nextChar}</span>`);
        cursor = i + 1;
      } else {
        parts.push(html`<span class="chord" data-text=${chord}> </span>`);
        cursor = line.length;
      }
    }

    return html`${parts}`;
  }
  addChordClickListeners(){
    const chordElements = this.shadowRoot.querySelectorAll('span.chord');
    chordElements.forEach(el => {
      el.addEventListener('click', () => {
        this._modalChord = el.dataset.text;
      });
    });
  }
  _closeModal() {
    this._modalChord = null;
  }
  firstUpdated() {
    this.addChordClickListeners();
  }
  updated(changedProps) {
    if (changedProps.has('_modalChord')) {
      const dialog = this.renderRoot.querySelector('dialog');
      if (this._modalChord && dialog && !dialog.open) {
        dialog.showModal();
      } else if (!this._modalChord && dialog && dialog.open) {
        dialog.close();
      }
    }
  }
  _renderModal() {
    return html`
      <dialog @click=${this._closeModal} @close=${this._closeModal}>
        <div class="modal" @click=${e => e.stopPropagation()}>
          <h2>${this._modalChord}</h2>
          <chord-visualizer .chordName=${this._modalChord}></chord-visualizer>
        </div>
      </dialog>
    `;
  }
  render() {
    /**@type {Song} */
    const song = this.content.version === 1 ? convertV1ToV2(this.content) : this.content;
    return html`
      <h1>${song.title}</h1>
        ${song.artist ? html`<h2>${song.artist}</h2>` : ''}
        ${song.album ? html`<h3>${song.album} (${song.year})</h3>` : ''}
        ${song.author ? html`<h4>Written by ${song.author}</h4>` : ''}
        <div>
          ${song.content.split('\n').map(line => html`<p>${SongRendererV2.processSongLine(line)}</p>`)}
        </div>
        ${this._renderModal()}
    `;
  }
  static styles=css`
  :host {
      display: block;
    }
 p {
  position: relative;
  font-size: calc(1.2em * var(--song-font-scale, 1));
  min-height: 0.5em;
  line-height: 1.6em;
}

span {
  position: relative;
}

span.chord {
  cursor: pointer;
}

span::before {
  position: absolute;
  top: -1em;
  color: red;
  font-size: 0.8em;
  content: attr(data-text);
}
  dialog {
    border: none;
    border-radius: 8px;
    padding: 0;
    background: transparent;
  }
  dialog::backdrop {
    background: rgba(0,0,0,0.5);
  }
  .modal {
    background: white;
    color: black;
    border-radius: 8px;
    padding: 1.5em 2em;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    min-width: 160px;
  }
  .modal h2 {
    margin: 0;
  }
  .modal button {
    padding: 0.4em 1.2em;
    cursor: pointer;
  }
  @media (prefers-color-scheme: dark) {
    .modal {
      background: #1e1e1e;
      color: white;
    }
  }
`;
}

customElements.define('song-renderer-v2', SongRendererV2);
