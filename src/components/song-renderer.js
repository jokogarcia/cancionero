/** @typedef {import('../services/songs.js').Song} Song */

import { LitElement, html, css } from 'lit';

export class SongRenderer extends LitElement {
    
  static properties = {
    content: { type: Object },
  };
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
      const nextIsChord =
        i < line.length &&
        line[i] === '[' &&
        line.indexOf(']', i + 1) > i + 1;

      if (nextIsChord) {
        parts.push(html`<span class="chord" data-text=${chord}> </span>`);
        cursor = end;
        continue;
      }

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
        const chordName = el.textContent;
        alert(`You clicked on chord: ${chordName}`);
      });
    });
  }
  firstUpdated() {
    this.addChordClickListeners();
  }
  render() {
    /**@type {Song} */
    const song = this.content;

    return html`
      <h1>${song.title}</h1>
        ${song.artist ? html`<h2>${song.artist}</h2>` : ''}
        ${song.album ? html`<h3>${song.album} (${song.year})</h3>` : ''}
        ${song.author ? html`<h4>Written by ${song.author}</h4>` : ''}
        <div>
          ${song.content.split('\n').map(line => html`<p>${SongRenderer.processSongLine(line)}</p>`)}
        </div>
    `;
  }
  static styles=css`
  :host {
      display: block;
    }
 p {
  font-size: 1.2em;
}

span.chord {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  vertical-align: text-bottom;
}

span.chord::before {
  color: red;
  font-size: 0.8em;
  content: attr(data-text);
  white-space: nowrap;
  line-height: 1.5;
}`;
}

customElements.define('song-renderer', SongRenderer);
