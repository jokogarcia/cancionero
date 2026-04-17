/** @typedef {import('../services/chords.js').ChordShape} ChordShape */
/** @typedef {import('../services/chords.js').Frets} Frets */

import { svg } from 'lit';

/**
 * Returns SVG representation of the chord shape for rendering on the frontend.
 * @param {ChordShape} chordShape
 * @returns {string} SVG string
 */
export function RenderShape(chordShape) {
    const frets = chordShape.frets;
    const bars = chordShape.bars || [];
    let lowerFret = Math.min(...frets.filter(f => f >= 0));
    const upperFret = Math.max(...frets);
    if(upperFret - lowerFret < 5) {
        lowerFret = 0;
    }
    const fretCount = upperFret - lowerFret + 1;
    if(fretCount > 5) {
        throw new Error("Chord shape is too wide to render.");
    }
    const xoffset = 15;
    const yoffset = 10;
    const fretSpacing = 30;
    const stringSpacing = 10;
    const svgContent=svg`<svg width="200" height="100" 
      viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <style>
    svg {
      --chord-fg: black;
    }
    @media (prefers-color-scheme: dark) {
      svg {
        --chord-fg: white;
      }
    }
    .string {
      stroke: gray;
    }
    .fret {
      stroke: var(--chord-fg);
      
    }
    line {
      stroke-width: 0.7;
      stroke: var(--chord-fg);
    }
    .finger {
      fill: var(--chord-fg);
    }
    .muteline {
      stroke-width: 0.3;
      stroke: gray;
    }
    text {
      font: 6px sans-serif;
      fill: var(--chord-fg);
    }
    .bar {
      stroke-width: 5;
      stroke: var(--chord-fg);
    }
  </style>
 <symbol id="icon-mute" viewBox="-2.5 -2.5 5 5" width="5" height="5" transform="translate(0,-2.5)" >
   <line x1="-2.5" y1="-2.5" x2="2.55" y2="2.5" class="muteline" />
   <line x1="-2.5" y1="2.5" x2="2.5" y2="-2.5" class="muteline" />
  </symbol>
  ${[5,4,3,2,1,0]
    .map((i,n) => svg`
      <text x="${xoffset-10}" y = "${yoffset+stringSpacing*(i)}" transform="rotate(270,${xoffset-10},${yoffset+stringSpacing*i})">${n+1}</text>
      <line class="string" x1="${xoffset}" y1="${yoffset+stringSpacing*i}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+stringSpacing*i}" />
      `)
    }
  ${[0,1,2,3,4,5]
    .map(i => svg`
      <line class="fret" x1="${xoffset+fretSpacing*i}" y1="${yoffset}" x2="${xoffset+fretSpacing*i}" y2="${stringSpacing*6}" />
      `)
    }

  ${frets.map((fret, index) => {
    if(fret === -1) {
      return svg`<use href="#icon-mute" x="${xoffset-5}" y="${yoffset+stringSpacing*index}" />`;
    } else if(fret === lowerFret) {
      return svg``;
    } else {
      return svg`<circle class="finger" cx="${xoffset+fretSpacing/2+(fret-lowerFret-1)*fretSpacing}" cy="${yoffset+stringSpacing*index}" r="3" id="finger-string-${index+1}" />`;
    }
  })}
  ${bars.map(bar => {
    const y1 = yoffset + stringSpacing * (bar.fromString - 1);
    const y2 = yoffset + stringSpacing * (bar.toString - 1);
    const x = xoffset + fretSpacing / 2 + (bar.fret - lowerFret -1) * fretSpacing;
    return svg`<line class="bar" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" />`;
  })}

  <text x="15" y="12" transform="rotate(270,15,8)">${lowerFret}</text>
  
</svg>`;
    return svgContent;
}