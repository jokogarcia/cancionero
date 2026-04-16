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
        isPublic: false,
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
