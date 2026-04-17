/**
 * Frets are ordered from low E to high E string. 0 means open string, -1 means muted string, and any positive number 
 * indicates the fret to be pressed.
 * @typedef {[number,number,number,number,number,number]} Frets
 */
/** @typedef {Object} Bar
 * @property {number} fret
 * @property {number} fromString
 * @property {number} toString
 */
/**
 * @typedef {Object} ChordShape
 * @property {string} id
 * @property {string} name 
 * @property {Frets} frets
 * @property {Bar[]} bars
 */

/**
 * @param {string} name
 * @returns {ChordShape[]}
 */
export async function getChordShapes(name){
    
    const chords = await getAllChords();
    const positions = chords[name]?.positions || [];
    return positions.map(pos => ({
        id: `${name}-${pos.frets.join('')}`,
        name,
        frets: pos.frets,
        bars: pos.bars || [],
    }));
    return [chords[name]] || [];
}
let allChords=null;
async function loadChords(){
    if(allChords) return allChords;
    console.log("Loading chords...");
    try {
        const response = await fetch('/chords.json');
        const data = await response.json();
        allChords = data;
        console.log("Chords loaded.",allChords);
        return allChords;
    } catch (error) {
        console.error("Failed to load chords:", error);
        throw error;
    }
}
function getAllChords(){
    if(allChords) return Promise.resolve(allChords);
    return loadChords();
}


export async function getAllChordNames(){
    const chords = await getAllChords();
    return Object.keys(chords);
}




