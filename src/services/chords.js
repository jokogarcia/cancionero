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
        const barFrets = positions.map(p => p.fret);
        const minFret = Math.min(...barFrets);
        const maxFret = Math.max(...barFrets);
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
let loadChordsPromise = null;
let waitForSyncPromise = null;

const CHORDS_DB_NAME = 'cancionero-db';
const CHORDS_STORE_NAME = 'app-cache';
const CHORDS_CACHE_KEY = 'chords';
const CHORDS_SYNC_WAIT_TIMEOUT_MS = 15000;
const MSG_CHORDS_SYNC_WAIT = 'CHORDS_SYNC_WAIT';

function openChordsDatabase(){
    if(typeof indexedDB === 'undefined') return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CHORDS_DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if(!db.objectStoreNames.contains(CHORDS_STORE_NAME)){
                db.createObjectStore(CHORDS_STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });
}

async function readChordsFromIndexedDB(){
    const db = await openChordsDatabase();
    if(!db) return null;

    return new Promise((resolve, reject) => {
        const tx = db.transaction(CHORDS_STORE_NAME, 'readonly');
        const store = tx.objectStore(CHORDS_STORE_NAME);
        const request = store.get(CHORDS_CACHE_KEY);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Failed to read chords from IndexedDB'));
    });
}

async function writeChordsToIndexedDB(chords){
    const db = await openChordsDatabase();
    if(!db) return;

    return new Promise((resolve, reject) => {
        console.log('Caching chords in IndexedDB...');
        const tx = db.transaction(CHORDS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CHORDS_STORE_NAME);
        store.put(chords, CHORDS_CACHE_KEY);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Failed to write chords to IndexedDB'));
        tx.onabort = () => reject(tx.error || new Error('Failed to write chords to IndexedDB'));
    });
}

async function waitForServiceWorkerSyncIfRunning(){
    if(waitForSyncPromise) return waitForSyncPromise;

    waitForSyncPromise = (async () => {
        if(typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

        let registration = null;
        try {
            registration = await navigator.serviceWorker.getRegistration();
        } catch (_error) {
            return;
        }

        if(!registration && !navigator.serviceWorker.controller) return;

        const worker = navigator.serviceWorker.controller || registration?.active || registration?.waiting || registration?.installing;
        if(!worker) return;

        await new Promise((resolve) => {
            const channel = new MessageChannel();
            const timeout = setTimeout(() => {
                channel.port1.onmessage = null;
                resolve();
            }, CHORDS_SYNC_WAIT_TIMEOUT_MS);

            channel.port1.onmessage = (event) => {
                const data = event.data || {};
                if(data.ok){
                    clearTimeout(timeout);
                    resolve();
                    return;
                }

                clearTimeout(timeout);
                resolve();
            };

            try {
                worker.postMessage({ type: MSG_CHORDS_SYNC_WAIT }, [channel.port2]);
            } catch (_error) {
                clearTimeout(timeout);
                resolve();
            }
        });
    })();

    try {
        await waitForSyncPromise;
    } finally {
        waitForSyncPromise = null;
    }
}

async function loadChords(){
    if(allChords) return allChords;

    await waitForServiceWorkerSyncIfRunning();

    try {
        const cachedChords = await readChordsFromIndexedDB();
        if(cachedChords){
            allChords = cachedChords;
            return allChords;
        }
    } catch (error) {
        console.warn('Failed to read chords from IndexedDB:', error);
    }

    try {
        const response = await fetch('/chords.json');
        if(!response.ok){
            throw new Error(`Failed to fetch chords.json: ${response.status}`);
        }

        const data = await response.json();
        allChords = data;

        writeChordsToIndexedDB(data).catch(error => {
            console.warn('Failed to cache chords in IndexedDB:', error);
        });

        return allChords;
    } catch (error) {
        console.error('Failed to load chords:', error);
        throw error;
    }
}
function getAllChords(){
    if(allChords) return Promise.resolve(allChords);
    if(loadChordsPromise) return loadChordsPromise;

    loadChordsPromise = loadChords().finally(() => {
        loadChordsPromise = null;
    });

    return loadChordsPromise;
}


export async function getAllChordNames(){
    const chords = await getAllChords();
    return Object.keys(chords);
}




