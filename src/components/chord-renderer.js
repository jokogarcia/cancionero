/** @typedef {import('../services/chords.js').ChordShape} ChordShape */
/** @typedef {import('../services/chords.js').Frets} Frets */

import { svg } from 'lit';

/**
 * Returns SVG representation of the chord shape for rendering on the frontend.
 * @param {Frets} frets 
 * @returns {string} SVG string
 */
export function RenderShape(frets){
    const lowerFret = Math.min(...frets.filter(f => f >= 0));
    const upperFret = Math.max(...frets);
    const fretCount = upperFret - lowerFret + 1;
    if(fretCount > 5) {
        throw new Error("Chord shape is too wide to render.");
    }
    const svg=svg`<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="100" height="150" fill="#fff" stroke="#000" stroke-width="2"/>
        ${[...Array(6)].map((_, i) => svg`
            <line x1="${20 + i * 20}" y1="10" x2="${20 + i * 20}" y2="160" stroke="#000" stroke-width="1"/>
        `)}
        ${[...Array(fretCount)].map((_, i) => svg`
            <line x1="10" y1="${20 + i * 20}" x2="110" y2="${20 + i * 20}" stroke="#000" stroke-width="1"/>
        `)}
        ${frets.map((fret, i) => {
            if (fret === -1) {
                return svg`<text x="${20 + i * 20}" y="5" font-size="10" text-anchor="middle">X</text>`;
            } else if (fret === 0) {
                return svg`<text x="${20 + i * 20}" y="5" font-size="10" text-anchor="middle">O</text>`;
            } else {
                const fretPosition = (fret - lowerFret) * 20 + 10;
                return svg`<circle cx="${20 + i * 20}" cy="${fretPosition}" r="5" fill="#000"/>`;
            }
        })}
    </svg>`;
    return svg.outerHTML;
}