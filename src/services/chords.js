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
    const fn = fingering.map(f=>parseInt(f,10));
    const bars = [];
    const finger_frets = new Map();
    fn.forEach((f, i) => {
        if(f > 0){
            if(!finger_frets.has(f)){
                finger_frets.set(f, []);
            }
            finger_frets.get(f).push({ fret: frets[i], string: i + 1 });
        }
    });
    //array of the fingers that have more than one position
    const barringFingers = Array.from(finger_frets.entries()).filter(([finger, positions]) => positions.length > 1);
    for(const [finger, positions] of barringFingers){
        const frets = positions.map(p => p.fret);
        const minFret = Math.min(...frets);
        const maxFret = Math.max(...frets);
        if(maxFret - minFret <= 1){
            bars.push({
                fret: minFret,
                fromString: Math.min(...positions.map(p => p.string)),
                toString: Math.max(...positions.map(p => p.string)),
            });
        }
    }
    return bars;



}

/**
 * @param {string} name
 * @returns {ChordShape[]}
 */
export async function getChordShapes(name){
    
    const chords = await getAllChords();
    const _chord = chords[name];

    if(!_chord || !_chord[0]) return [];
    return _chord.map(c=>{
        const positions = c.positions || [];
        const frets = positions.map(f => f === 'x' ? -1 : parseInt(f,10));
        const bars = getBars(c.fingerings?.[0], frets);
        return {
             id: `${name}-0`,
            name,
            frets,
            bars,
        }
    })
    
   
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




