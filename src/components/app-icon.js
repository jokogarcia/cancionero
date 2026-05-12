import { LitElement, html, css } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import arrowLeft from 'heroicons/24/outline/arrow-left.svg?raw';
import cog6Tooth from 'heroicons/24/outline/cog-6-tooth.svg?raw';
import folder from 'heroicons/24/outline/folder.svg?raw';
import folderOpen from 'heroicons/24/outline/folder-open.svg?raw';
import musicalNote from 'heroicons/24/outline/musical-note.svg?raw';
import plus from 'heroicons/24/outline/plus.svg?raw';
import queueList from 'heroicons/24/outline/queue-list.svg?raw';
import star from 'heroicons/24/outline/star.svg?raw';
import userCircle from 'heroicons/24/outline/user-circle.svg?raw';
import sparkles from 'heroicons/24/outline/sparkles.svg?raw';

import pauseSolid from 'heroicons/24/solid/pause.svg?raw';
import playSolid from 'heroicons/24/solid/play.svg?raw';
import starSolid from 'heroicons/24/solid/star.svg?raw';

const ICONS = {
  'arrow-left': arrowLeft,
  'cog-6-tooth': cog6Tooth,
  folder,
  'folder-open': folderOpen,
  'musical-note': musicalNote,
  plus,
  'queue-list': queueList,
  star,
  'star-solid': starSolid,
  'user-circle': userCircle,
  'pause-solid': pauseSolid,
  'play-solid': playSolid,
  sparkles,
};

export class AppIcon extends LitElement {
  static properties = {
    name: { type: String },
    size: { type: Number },
    label: { type: String },
  };

  constructor() {
    super();
    this.name = 'musical-note';
    this.size = 20;
    this.label = '';
  }

  render() {
    const iconMarkup = ICONS[this.name] || ICONS['musical-note'];
    const ariaLabel = this.label || null;
    return html`
      <span
        class="icon"
        style=${`--icon-size: ${this.size}px`}
        aria-hidden=${ariaLabel ? 'false' : 'true'}
        role=${ariaLabel ? 'img' : 'presentation'}
        aria-label=${ariaLabel || ''}
      >${unsafeSVG(iconMarkup)}</span>
    `;
  }

  static styles = css`
    :host {
      display: inline-flex;
      line-height: 1;
    }

    .icon {
      width: var(--icon-size, 20px);
      height: var(--icon-size, 20px);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `;
}

customElements.define('app-icon', AppIcon);