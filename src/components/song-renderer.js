/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import "./song-renderer-v2.js";
import { getAllChordNames, getChordShapes } from '../services/chords.js';
import { RenderShape } from './chord-renderer.js';
export class SongRenderer extends LitElement {
    
  static properties = {
    content: { type: Object },
    _modalChord: { type: String, state: true },
  };
  static allChordNames = null;
  /**
   * 
   * @param {string} line 
   * @returns {import('lit').TemplateResult} Html representation of the line.
    * Each chord marker [X] is removed and the following character is wrapped in
    * <span class="chord" data-text="X">c</span>. If there is no following
    * character, a single space is wrapped instead.
   */
  static processSongLine(line){
    if(!this.allChordNames){
      this.allChordNames = getAllChordNames();
    }
    const tokens = line.split(/(\s+)/);
    return html`${tokens.map(token => {
      if(/^\s+$/.test(token) || token === ''){
        return token;
      }
      if(this.allChordNames.includes(token)){
        return html`<a href="#" class="chord-link" data-chord=${token}>${token}</a>`;
      }
      return token;
    })}`;
  }
  _openChordModal(e) {
    e.preventDefault();
    const chordName = e.target.closest('a.chord-link')?.getAttribute('data-chord');
    if (chordName) this._modalChord = chordName;
  }
  _closeModal() {
    this._modalChord = null;
  }
  _renderModal() {
    if (!this._modalChord) return '';
    const shapes = getChordShapes(this._modalChord);
    const svgContent = shapes.length > 0 ? RenderShape(shapes[0].frets) : html`<p>No shape found</p>`;
    return html`
      <div class="modal-backdrop" @click=${this._closeModal}>
        <div class="modal" @click=${e => e.stopPropagation()}>
          <h2>${this._modalChord}</h2>
          ${svgContent}
        </div>
      </div>
    `;
  }
  render() {
    /**@type {Song} */
    const song = this.content;
    if(song.version == 2){
      return html`<song-renderer-v2 .content=${song}></song-renderer-v2>`;
    }
    else if(song.version == 1){
      const lines = song.content.split('\n');
    return html`
      <h1>${song.title}</h1>
        ${song.artist ? html`<h2>${song.artist}</h2>` : ''}
        ${song.album ? html`<h3>${song.album} (${song.year})</h3>` : ''}
        ${song.author ? html`<h4>Written by ${song.author}</h4>` : ''}
        <div class="song-content" @click=${this._openChordModal}>
          ${lines.map(line => html`<p class="song-line">${SongRenderer.processSongLine(line)}</p>`)}
        </div>
        ${this._renderModal()}
    `;
    }
    else{
      return html`<p>Unsupported song version: ${song.version}</p>`;
    }
  }
  static styles=css`
  :host {
      display: block;
    }
  p {
    position: relative;
    font-size: 1em;
  }
  p.song-line {
    margin: 0;
  }
  .chord-link {
    font-weight: bold;
    color: blue;
    text-decoration: none;
    }
  .song-content {
    font-family: 'Courier New', Courier, monospace;
    white-space: pre;
    text-align: left;
    font-size: x-small;
   }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white;
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
`;
}

customElements.define('song-renderer', SongRenderer);
