/*
SONG FORMAT in Firestore:
{
  "title": "Song Title",
  "artist": "Artist Name",
  "key": "C",
  "album": "Album Name",
  "year": 2024,
  "author": "Author Name",
  "uploaderId": "uid-of-uploader",
  "version": 1,
  "createdAt": "<Firestore timestamp>",
  "modifiedAt": "<Firestore timestamp>",
  "isPublic": false,
  "isHiddenDMCA": false,
  "content":"Plain text with chords in square brackets inline with the lyrics, e.g.:
[C]This is the [G]first line of the song
[D]And this is the [A]second line"
}
  
*/
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase.js';

const db = getFirestore(app);
const songsCol = collection(db, 'songs');

/**
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} key
 * @property {string} album
 * @property {number} year
 * @property {string} author
 * @property {string} uploaderId
 * @property {number} version
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} modifiedAt
 * @property {boolean} isPublic
 * @property {boolean} isHiddenDMCA
 * @property {string} content
 */

/**
 * Find songs based on the provided search criteria. Fetches all songs and filters client-side.
 * Empty string parameters are ignored. Searches for partial matches (case-insensitive).
 * @param {string} title 
 * @param {string} artist 
 * @param {string} author 
 * @param {string} lyric 
 * @param {boolean} andOr - if true, match all criteria (AND); if false, match any criteria (OR)
 * @return {Promise<Song[]>}
 */
export async function findSong(title, artist, author, lyric, andOr) {
    const snapshot = await getDocs(songsCol);
    const songs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return songs.filter(song => {
        const matchesTitle = title ? song.title?.toLowerCase().includes(title.toLowerCase()) : false;
        const matchesArtist = artist ? song.artist?.toLowerCase().includes(artist.toLowerCase()) : false;
        const matchesAuthor = author ? song.author?.toLowerCase().includes(author.toLowerCase()) : false;
        const matchesLyric = lyric ? song.content?.toLowerCase().includes(lyric.toLowerCase()) : false;

        if (andOr) {
            return (title ? matchesTitle : true) &&
                   (artist ? matchesArtist : true) &&
                   (author ? matchesAuthor : true) &&
                   (lyric ? matchesLyric : true);
        } else {
            return matchesTitle || matchesArtist || matchesAuthor || matchesLyric;
        }
    });
}

/**
 * Get a song by its unique identifier.
 * @param {string} id - The unique identifier of the song.
 * @return {Promise<Song|null>}
 */
export async function getSongById(id) {
    const docRef = doc(db, 'songs', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
}

/**
 * Insert a new song into Firestore.
 * @param {Omit<Song, 'id'>} song - Song data without an id; id is assigned by Firestore.
 * @return {Promise<Song>} The created song including its generated id.
 */
export async function insertSong(song) {
    const songWithDefaults = {
        ...song,
        version: 1,
        createdAt: serverTimestamp(),
        modifiedAt: serverTimestamp(),
        isPublic: song.isPublic === true,
        isHiddenDMCA: false,
    };
    const docRef = await addDoc(songsCol, songWithDefaults);
    return { id: docRef.id, ...songWithDefaults };
}

/**
 * Get all songs uploaded by a specific user.
 * @param {string} uploaderId
 * @return {Promise<Song[]>}
 */
export async function getSongsByUploader(uploaderId) {
    const q = query(songsCol, where('uploaderId', '==', uploaderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function convertV1ToV2(song) {
    if (song.version === 1) {
        const contentV1 = song.content || '';
        const lines=[];
        let state="finding-chords"
        let found_chords=[]
        for (const line of contentV1.split('\n')) {
            if(line.trim() === '') {
                lines.push(line)
                continue; // leave blank lines untouched
            }
            if(state=="finding-chords"){
                found_chords=findChordsInLine(line);
                if(found_chords.length>0){
                    state="placing-chords"
                    continue;
                }else{
                    continue;
                }
            }else if (state == "placing-chords"){
                //splice chords into line, surrounded by '[' ']'
                let lineWithChords = line;
                for(const {chord,position} of found_chords){
                    lineWithChords = lineWithChords.slice(0, position) + '[' + chord + ']' + lineWithChords.slice(position);
                    //adjust positions of remaining chords
                    for(let c of found_chords){
                        if(c.position > position){
                            c.position += chord.length + 2; // account for added brackets and chord name length
                        }
                    }
                }
                lines.push(lineWithChords)
                state="finding-chords";
                continue;
            }

        }
        return {
            ...song,
            version: 2,
            isPublic: song.isPublic === true,
            isHiddenDMCA: false,
            content: lines.join('\n'),
        };
    }
    return song;
}

/**
 * Finds chord names in a line. Returns an array of chord names and their positions in the line.
 * E.g. for input "         C                Gm   ", it would return:
 * [
 *   { chord: 'C', position: 10 },
 *   { chord: 'Gm', position: 26 }
 * ]
 * @param {string} line - The line of text to analyze.
 * @param {Set<string>} allChordNames - A set of all valid chord names for quick lookup.
 * @return {Array<{chord: string, position: number}>}
 */
export function findChordsInLine(line) {
    // Source - https://stackoverflow.com/a/46522424
    // Posted by Amit
    // Retrieved 2026-04-20, License - CC BY-SA 3.0

    const notes = "[CDEFGAB]",
    accidentals = "(b|bb)?",
    chords = "(m|maj7|maj|min7|min|sus)?",
    suspends = "(1|2|3|4|5|6|7|8|9)?",
    sharp = "(#)?",
    regex = new RegExp("\\b" + notes + accidentals + chords + suspends + "\\b" + sharp, "g");

    /**@type {Array<{chord: string, position: number}>} */
    const matches = [];

    let match;
    while ((match = regex.exec(line)) !== null) {
        const chord = match[0];
        matches.push({ chord, position: match.index });
    }

    return matches;
}