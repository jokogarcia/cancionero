/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';
import "./song-renderer-v2.js";
import './chord-visualizer.js';
import { getAllChordNames } from '../services/chords.js';
import { convertV1ToV2 } from '../services/songs.js';
export class SongRenderer extends LitElement {
    
  static properties = {
    content: { type: Object },
    _modalChord: { type: String, state: true },
    _chordsReady: { type: Boolean, state: true },
  };
  static allChordNames = null;

  constructor() {
    super();
    this._modalChord = null;
    this._chordsReady = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    try {
      if (!SongRenderer.allChordNames) {
        SongRenderer.allChordNames = new Set(await getAllChordNames());
      }
    } catch (error) {
      console.error('Failed to load chord names:', error);
      SongRenderer.allChordNames = new Set();
    }
    this._chordsReady = true;
  }
  /**
   * 
   * @param {string} line 
   * @returns {import('lit').TemplateResult} Html representation of the line.
    * Each chord marker is replaced with an anchor element with class "chord-link" and 
    * a data-chord attribute containing the chord name. Non-chord text and whitespace 
    * are preserved as-is.
   */
  static processSongLine(line){
    const tokens = line.split(/(\s+)/);
    return html`${tokens.map(token => {
      if(/^\s+$/.test(token) || token === ''){
        return token;
      }
      if(SongRenderer.allChordNames.has(token)){
        return html`<a href="#" class="chord-link" data-chord=${token}>${token}</a>`;
      }
      return token;
    })}`;
  }
  _openChordModal(e) {
    e.preventDefault();
    const chordName = e.target.closest('a.chord-link')?.getAttribute('data-chord');
    if (chordName){
       this._modalChord = chordName;
    }
  }
  _closeModal() {
    this._modalChord = null;
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
    if(song.version == 2){
      return html`<song-renderer-v2 .content=${song}></song-renderer-v2>`;
    }
    else if(song.version == 1){
      if(!this._chordsReady){
        return html`<p>Loading…</p>`;
      }
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

customElements.define('song-renderer', SongRenderer);
