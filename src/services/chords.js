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
export function getChordShapes(name){
    return db.filter(chord => chord.name === name);
}
export function getChordShapeById(id){
    return db.find(chord => chord.id === id);
}
export function insertChordShape(chordShape){
    const newId = (db.length + 1).toString();
    const newChordShape = { id: newId, ...chordShape };
    db.push(newChordShape);
    return newChordShape;
}
export function getAllChordNames(){
    const names = new Set();
    db.forEach(chord => names.add(chord.name));
    return Array.from(names);
}




const db =[
    { id: '1', name: 'C', frets: [0, 3, 2, 0, 1, 0] },
    { id: '2', name: 'G', frets: [3, 2, 0, 0, 0, 3] },
    { id: '3', name: 'D', frets: [-1, -1, 0, 2, 3, 2] },
    { id: '4', name: 'A', frets: [0, 0, 2, 2, 2, 0] },
    { id: '5', name: 'E', frets: [0, 2, 2, 1, 0, 0] },
    { id: '6', name: 'F', frets: [1, 3, 3, 2, 1, 1], bars: [{ fret: 1, fromString: 1, toString: 6 }] },
    { id: '7', name: 'B', frets: [2, 2, 4, 4, 4, 2], bars: [{ fret: 2, fromString: 1, toString: 6 }] },
    { id: '8', name: 'c', frets: [0, 3, 5, 5, 4, 3], bars: [{ fret: 3, fromString: 2, toString: 5 }] },
    { id: '9', name: 'g', frets: [3, 5, 5, 3, 3, 3] },
    { id: '10', name: 'd', frets: [-1, -1, 0, 2, 3, 1] },
    { id: '11', name: 'a', frets: [0, 0, 2, 2, 1, 0] },
    { id: '12', name: 'e', frets: [0, 2, 2, 0, 0, 0] },
    { id: '13', name: 'f', frets: [1, 3, 3, 2, 1, 1] },
    { id: '14', name: 'b', frets: [2, 2, 4, 4, 4, 2] },
    {id: '15', name: 'a7', frets: [0, 0, 2, 0, 2, 0] },
    {id: '16', name: 'e7', frets: [0, 2, 0, 1, 0, 0] },
    {id: '18', name: 'C', frets: [0, 3, 2, 0, 1, 0] },
]
