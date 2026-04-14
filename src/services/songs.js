/*
SONG FORMAT in JSON:
{
  "title": "Song Title",
  "artist": "Artist Name",
  "key": "C",
  "album": "Album Name",
  "year": 2024,
  "author": "Author Name",
  "content":"Plain text with chords in square brackets inline with the lyrics, e.g.:
[C]This is the [G]first line of the song
[D]And this is the [A]second line"
}
  
*/
/**
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} key
 * @property {string} album
 * @property {number} year
 * @property {string} author
 * @property {string} content
 */

/**
 * Find songs based on the provided search criteria. The search can be performed using any combination of the following parameters: title, artist, author, and lyric. The 'andOr' parameter determines whether the search should return songs that match all criteria (AND) or any criteria (OR).
 * empty string parameters should be ignored in the search.
 * searchs for partial matches and is case-insensitive.
 * @param {string} title 
 * @param {string} artist 
 * @param {string} author 
 * @param {string} lyric 
 * @param {boolean} andOr - if true, search for songs that match all criteria; if false, search for songs that match any criteria
 * @return {Song[]} array of songs that match the search criteria
 */
export function findSong(title,artist,author,lyric,andOr){
    return db.filter(song => {
        const matchesTitle = title ? song.title.toLowerCase().includes(title.toLowerCase()) : false;
        const matchesArtist = artist ? song.artist.toLowerCase().includes(artist.toLowerCase()) : false;
        const matchesAuthor = author ? song.author.toLowerCase().includes(author.toLowerCase()) : false;
        const matchesLyric = lyric ? song.content.toLowerCase().includes(lyric.toLowerCase()) : false;

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
 * @return {Song|null} The song with the specified ID, or null if not found.
 */
export function getSongById(id){
    return db.find(song => song.id === id) || null;
}
/**
 * Insert a new song into the database.
 * @param {Song} song - The song object to be inserted. The 'id' property will be generated automatically and should not be included in the input object.
 * @return {Song} The newly created song object, including the generated 'id'.
 */
export function insertSong(song){
    const newId = (db.length + 1).toString();
    const newSong = { id: newId, ...song };
    db.push(newSong);
    return newSong;
}

const db = [
    {
        id: '1',
        title: 'Let It Be',
        artist: 'The Beatles',
        key: 'C',
        album: 'Let It Be',
        year: 1970,
        author: 'Paul McCartney',
        content: "[C]When I find myself in times of [G]trouble\nM[D]other Mary comes to [A]me\n[C]Speaking words of wisdom, [G]let it be"
    }
];