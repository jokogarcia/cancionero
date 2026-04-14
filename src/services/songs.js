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
    },
    {
        id: '2',
        title: 'Knockin\' on Heaven\'s Door',
        artist: 'Bob Dylan',
        key: 'G',
        album: 'Pat Garrett & Billy the Kid',
        year: 1973,
        author: 'Bob Dylan',
        content: "[G]Mama, take this [D]badge off of [Am]me\n[G]I can't use it [D]anymore\n[G]It's gettin' [D]dark, too dark to [Am]see\n[G]I feel I'm [D]knockin' on heaven's [G]door"
    },
    {
        id: '3',
        title: 'Wonderwall',
        artist: 'Oasis',
        key: 'Em',
        album: '(What\'s the Story) Morning Glory?',
        year: 1995,
        author: 'Noel Gallagher',
        content: "[Em7]Today is gonna be the day that they're gonna [G]throw it back to [Dsus4]you\n[Em7]By now you should've somehow realized [G]what you gotta [Dsus4]do\n[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do about you [Em7]now"
    },
    {
        id: '4',
        title: 'Hotel California',
        artist: 'Eagles',
        key: 'Bm',
        album: 'Hotel California',
        year: 1977,
        author: 'Don Felder, Don Henley, Glenn Frey',
        content: "[Bm]On a dark desert [F#]highway, [A]cool wind in my [E]hair\n[G]Warm smell of [D]colitas rising [Em]up through the [F#]air\n[Bm]Up ahead in the [F#]distance, I [A]saw a shimmering [E]light"
    },
    {
        id: '5',
        title: 'Wish You Were Here',
        artist: 'Pink Floyd',
        key: 'G',
        album: 'Wish You Were Here',
        year: 1975,
        author: 'Roger Waters, David Gilmour',
        content: "[G]So, so you think you can [C]tell\n[Am]Heaven from Hell, [G]blue skies from pain\n[C]Can you tell a green field from a [Am]cold steel rail?\n[G]A smile from a veil?"
    },
    {
        id: '6',
        title: 'Stand By Me',
        artist: 'Ben E. King',
        key: 'A',
        album: 'Don\'t Play That Song!',
        year: 1961,
        author: 'Ben E. King, Jerry Leiber, Mike Stoller',
        content: "[A]When the night has come\nAnd the [F#m]land is dark\nAnd the [D]moon is the only [E]light we'll see\n[A]No I won't be afraid\nNo I [F#m]won't be afraid\nJust as [D]long as you stand, [E]stand by [A]me"
    }
];