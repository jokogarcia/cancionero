/** @typedef {import('../services/chords.js').ChordShape} ChordShape */
/** @typedef {import('../services/chords.js').Frets} Frets */

import { svg } from 'lit';

/**
 * Returns SVG representation of the chord shape for rendering on the frontend.
 * @param {Frets} frets 
 * @returns {string} SVG string
 */
export function RenderShape(frets){
    console.log(frets);
    const lowerFret = Math.min(...frets.filter(f => f >= 0));
    const upperFret = Math.max(...frets);
    const fretCount = upperFret - lowerFret + 1;
    if(fretCount > 5) {
        throw new Error("Chord shape is too wide to render.");
    }
    const xoffset = 15;
    const yoffset = 10;
    const fretSpacing = 30;
    const stringSpacing = 10;
    const svgContent=svg`<svg width="110" height="65" 
      viewBox="0 0 110 65" xmlns="http://www.w3.org/2000/svg">
  <style>
     .string {
      stroke:gray;
     }
     .fret {
      stroke:black;
     }
     line {
        stroke-width:0.7;
        stroke:black;
      }
    .muteline{
       stroke-width:0.3;
       stroke:gray;
    }
    text{
       font: 6px sans-serif;
    }
    
  </style>
 <symbol id="icon-mute" viewBox="-2.5 -2.5 5 5" width="5" height="5" transform="translate(0,-2.5)" >
   <line x1="-2.5" y1="-2.5" x2="2.55" y2="2.5" class="muteline" />
   <line x1="-2.5" y1="2.5" x2="2.5" y2="-2.5" class="muteline" />
  </symbol>
  <line class="string" x1="${xoffset}" y1="${yoffset+10}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+10}" />
  <line class="string" x1="${xoffset}" y1="${yoffset+20}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+20}"/>
  <line class="string" x1="${xoffset}" y1="${yoffset+30}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+30}"/>
  <line class="string" x1="${xoffset}" y1="${yoffset+40}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+40}"/>
  <line class="string" x1="${xoffset}" y1="${yoffset+50}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+50}"/>
  <line class="string" x1="${xoffset}" y1="${yoffset+60}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+60}"/>

  <line class="fret" x1="${xoffset}" y1="${yoffset}" x2="${xoffset}" y2="${yoffset+stringSpacing*6}"/>
  <line class="fret" x1="${xoffset+fretSpacing*5}" y1="${yoffset}" x2="${xoffset+fretSpacing*5}" y2="${yoffset+stringSpacing*6}"/>
  <line class="fret" x1="${xoffset+fretSpacing*2}" y1="${yoffset}" x2="${xoffset+fretSpacing*2}" y2="${yoffset+stringSpacing*6}"/>
  <line class="fret" x1="${xoffset+fretSpacing*4}" y1="${yoffset}" x2="${xoffset+fretSpacing*4}" y2="${yoffset+stringSpacing*6}"/>
  
  <!--Dynamic part -->
  ${frets.map((fret, index) => {
    if(fret === -1) {
      return svg`<use href="#icon-mute" x="${xoffset}" y="${yoffset+10}" />`;
    } else if(fret === lowerFret) {
      return svg``;
    } else {
      return svg`<circle class="finger" cx="${xoffset+fretSpacing/2+(fret-lowerFret)*fretSpacing}" cy="${yoffset+stringSpacing*index}" r="3" id="finger-string-${index+1}" />`;
    }
  })}
  
  <use href="#icon-mute" x="10" y ="10" />
  <text x="15" y="12" transform="rotate(270,15,8)">${lowerFret}</text>
  
</svg>`;
    return svgContent;
}