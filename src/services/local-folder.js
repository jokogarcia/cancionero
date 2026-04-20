/** @typedef {import('./songs.js').Song} Song */

import { parseCrdFile } from './local-song.js';

const DB_NAME = 'cancionero-local';
const STORE = 'handles';
const HANDLE_KEY = 'songsFolder';
const NAME_STORAGE_KEY = 'cancionero_local_folder_name';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbSet(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbDel(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export function isLocalFolderSupported() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function getLocalFolderName() {
    return localStorage.getItem(NAME_STORAGE_KEY) || null;
}

function setStoredName(name) {
    if (name) localStorage.setItem(NAME_STORAGE_KEY, name);
    else localStorage.removeItem(NAME_STORAGE_KEY);
}

/**
 * Prompt the user to pick a folder and persist the handle.
 * @returns {Promise<{ name: string } | null>}
 */
export async function pickLocalFolder() {
    if (!isLocalFolderSupported()) {
        throw new Error('Your browser does not support selecting a local folder');
    }
    let handle;
    try {
        handle = await window.showDirectoryPicker({ id: 'cancionero-songs', mode: 'read' });
    } catch (err) {
        if (err && err.name === 'AbortError') return null;
        throw err;
    }
    await idbSet(HANDLE_KEY, handle);
    setStoredName(handle.name);
    return { name: handle.name };
}

export async function clearLocalFolder() {
    await idbDel(HANDLE_KEY);
    setStoredName(null);
}

/**
 * Verify or request read permission on the stored handle.
 * @param {FileSystemDirectoryHandle} handle
 * @param {boolean} requestIfNeeded  if true, prompt the user; otherwise only check silently.
 */
async function ensurePermission(handle, requestIfNeeded) {
    if (!handle.queryPermission) return true;
    const state = await handle.queryPermission({ mode: 'read' });
    if (state === 'granted') return true;
    if (!requestIfNeeded) return false;
    const next = await handle.requestPermission({ mode: 'read' });
    return next === 'granted';
}

/**
 * Scan the stored folder and return parsed songs from every .crd file (non-recursive).
 * @param {{ requestPermission?: boolean }} [opts]
 * @returns {Promise<Song[]>}
 */
export async function scanLocalFolder({ requestPermission = false } = {}) {
    if (!isLocalFolderSupported()) return [];
    const handle = await idbGet(HANDLE_KEY);
    if (!handle) return [];
    const ok = await ensurePermission(handle, requestPermission);
    if (!ok) return [];

    const songs = [];
    for await (const entry of handle.values()) {
        if (entry.kind !== 'file') continue;
        if (!/\.crd$/i.test(entry.name)) continue;
        try {
            const file = await entry.getFile();
            const song = await parseCrdFile(file);
            songs.push({ ...song, _local: true });
        } catch (err) {
            console.warn(`Skipping ${entry.name}:`, err);
        }
    }
    songs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return songs;
}
