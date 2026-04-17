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

function getBars(fingering, frets){
    if(!fingering) return [];
    fingering = fingering.map(f => parseInt(f,10));
    const bars = [];
    // if there are repeated finger numbers it indicates a bar
    const fingerCounts = {};
    fingering.forEach((f,i) => {
        if(f > 0){
            fingerCounts[f] = fingerCounts[f] || [];
            fingerCounts[f].push(i);
        }
    });
    for(const finger in fingerCounts){
        const strings = fingerCounts[finger];
        if(strings.length > 1){
            bars.push({
                fret: frets[strings[0]],
                fromString: Math.min(...strings) + 1,
                toString: Math.max(...strings) + 1,
            });
        }
    }

}

/**
 * @param {string} name
 * @returns {ChordShape[]}
 */
export async function getChordShapes(name){
    
    const chords = await getAllChords();
    const _chord = chords[name];

    if(!_chord || !_chord[0]) return [];
    const chord=_chord[0];
    const positions = chord.positions || [];
    const frets = positions.map(f => f === 'x' ? -1 : parseInt(f,10));
    const bars = getBars(chord.fingerings?.[0]?.fingers, frets);
    return [{
        id: `${name}-0`,
        name,
        frets,
        bars,
    }];
   
}
let allChords=null;
async function loadChords(){
    if(allChords) return allChords;
    console.log("Loading chords...");
    try {
        const response = await fetch('/chords.json');
        const data = await response.json();
        allChords = data;
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




