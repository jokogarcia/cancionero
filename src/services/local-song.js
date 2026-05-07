/** @typedef {import('./songs.js').Song} Song */
const LOCAL_SONG_KEY = 'cancionero_local_song';

/**
 * Parse a .crd file (JSON) into a Song-shaped object.
 * @param {File|Blob} file
 * @returns {Promise<Song>}
 */
export async function parseCrdFile(file) {
    const text = await file.text();
    let obj;
    try {
        obj = JSON.parse(text);
    } catch (e) {
        if (await isProbablyBinary(file)) {
            throw new Error('File appears to be binary, not a text/JSON song file');
        }
        if(text.includes('<html')){
            throw new Error('File appears to be an HTML page, not a song file.');
        }
        // Process as plain text.
        return {
            id: `local:${file.name}`,
            title: file.name.replace(/.crd$/i, '').replace(/.txt$/i, '').replace(/[-_]/g, ' '),
            artist: '',
            year:0,
            isHiddenDMCA: false,
            isPublic: false,
            content: text,
            album: '',
            version: 1,
            uploaderId: null,
        }
    }
    if (!obj || typeof obj !== 'object') {
        throw new Error('File does not contain a song object');
    }
    if (typeof obj.content !== 'string') {
        throw new Error('Song is missing required "content" field');
    }
    const name = (file && file.name) || 'song.crd';
    return {
        id: `local:${name}`,
        title: obj.title || name.replace(/.crd$/i, '').replace(/.txt$/i, '').replace(/[-_]/g, ' '),
        artist: obj.artist || '',
        author: obj.author || '',
        album: obj.album || '',
        year: obj.year,
        key: obj.key || '',
        version: obj.version || 1,
        content: obj.content,
        isPublic: false,
        isHiddenDMCA: false,
        uploaderId: null,
    };
}

/**
 * Processes a plain text file with OLGA file conventions
 * @param {String} path,
 * @returns {Song | null}
 */
export function parseOlgaFile(filePath){
    if (!/crd|tab/.test(basename(filePath))) return null;
    const artist = underscoreToSpace(containingDirectory(filePath));
    const {title, type} = extractOlgaTitleAndType(filePath);
    if (type != 'crd') return null;
    
    /** @type {Song} */
    const result={
        id:`olga-${filePath}`,
        artist,
        title,
        _isLocal:true,
        path:filePath,
        year:0
        

    }
    return result;
}

/**
 * Decompress a gzipped File and return a new File with the .gz extension removed.
 * @param {File} file  A file with a .gz extension
 * @returns {Promise<File>}
 */
export async function decompressGzFile(file) {
    const ds = new DecompressionStream('gzip');
    const decompressedStream = file.stream().pipeThrough(ds);
    const decompressedBlob = await new Response(decompressedStream).blob();
    const innerName = file.name.replace(/\.gz$/i, '');
    return new File([decompressedBlob], innerName, { type: 'text/plain' });
}

/**
 * Heuristic: a NUL byte in the first 8KB strongly suggests a binary file.
 * @param {File|Blob} file
 */
async function isProbablyBinary(file, sampleSize = 8192) {
    const buf = await file.slice(0, sampleSize).arrayBuffer();
    const bytes = new Uint8Array(buf);
    for (const b of bytes) {
        if (b === 0) return true;
    }
    return false;
}

/**
 * Stash the local song in sessionStorage so the song page can read it after navigation.
 * @param {Song} song
 */
export function setLocalSong(song) {
    try {
        sessionStorage.setItem(LOCAL_SONG_KEY, JSON.stringify(song));
    } catch {
        // sessionStorage may be unavailable (private mode); fall back to memory
        _memorySong = song;
    }
}

/** @returns {Song|null} */
export function getLocalSong() {
    try {
        const raw = sessionStorage.getItem(LOCAL_SONG_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return _memorySong;
}

export function clearLocalSong() {
    try {
        sessionStorage.removeItem(LOCAL_SONG_KEY);
    } catch {
        // ignore
    }
    _memorySong = null;
}

let _memorySong = null;

/**
 * Prompt the user to pick a .crd file from disk and load it as the current local song.
 * @returns {Promise<Song|null>} the loaded song, or null if the user cancelled.
 */
export function pickCrdFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.crd,.txt,application/json,text/plain';
        input.style.display = 'none';
        input.addEventListener('change', async () => {
            const file = input.files && input.files[0];
            document.body.removeChild(input);
            if (!file) {
                resolve(null);
                return;
            }
            try {
                const song = await parseCrdFile(file);
                setLocalSong(song);
                resolve(song);
            } catch (err) {
                reject(err);
            }
        }, { once: true });
        document.body.appendChild(input);
        input.click();
    });
}


function underscoreToSpace(str) {    return str.replace(/_/g, ' ');}

function containingDirectory(filePath) {
    const a = dirname(filePath).split("/");
    return a.slice(-1)[0];
}

function normalizePath(p) {
    return String(p || '').replace(/\\/g, '/');
}

function basename(filePath) {
    const normalized = normalizePath(filePath);
    const i = normalized.lastIndexOf('/');
    return i >= 0 ? normalized.slice(i + 1) : normalized;
}

function dirname(filePath) {
    const normalized = normalizePath(filePath);
    const i = normalized.lastIndexOf('/');
    return i >= 0 ? normalized.slice(0, i) : '';
}

function relativeFromRoot(rootPath, targetPath) {
    const root = normalizePath(rootPath).replace(/\/+$/, '');
    const target = normalizePath(targetPath);
    if (!root) return target;
    if (target === root) return '';
    if (target.startsWith(root + '/')) return target.slice(root.length + 1);
    return target;
}
/**
 * Extracts the file name, converts underscores to spaces, removes 
 * .crd and .txt extensions and crd, tab and ver* suffixes
 * @param {string} filePath 
 * @return {{title:string,type:string}} the extracted title and type
 */
function extractOlgaTitleAndType(filePath) {
    const fileName = basename(filePath);
    const nameWithoutExtension = fileName.replace(/\.(crd|txt)$/, '');
    const nameWithoutSuffixes = nameWithoutExtension.replace(/(?:_?(?:ver\d+|btab|tab|crd))+$/i, '');
    const nameWithoutUnderscores = underscoreToSpace(nameWithoutSuffixes);
    const nameWithoutDoubleSpaces = nameWithoutUnderscores.replace(/\s+/g, ' ').trim();
    const name = nameWithoutDoubleSpaces;
    const typeMatch = fileName.match(/(crd|tab|btab)/i);
    const type = typeMatch ? typeMatch[1] : 'unknown';
    return {title: name, type};
}