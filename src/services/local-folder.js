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

async function hasNestedFile(rootHandle, relativePath) {
    const parts = relativePath.split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return false;

    let current = rootHandle;
    for (const part of parts) {
        try {
            current = await current.getDirectoryHandle(part);
        } catch {
            return false;
        }
    }

    try {
        await current.getFileHandle(fileName);
        return true;
    } catch {
        return false;
    }
}

async function detectOlgaArchive(rootHandle) {
    const requiredFiles = [
        'guitar/other_stuff/chordname.c',
        'guitar/tabs/a/index.php.old',
    ];

    for (const relativePath of requiredFiles) {
        if (!(await hasNestedFile(rootHandle, relativePath))) {
            console.log(`Not an Olga archive: missing ${relativePath}`);
            return false;
        }
    }

    return true;
}

async function scanDirectoryRecursive(directoryHandle, parentFolders, visitFile) {
    for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'directory') {
            await scanDirectoryRecursive(entry, [...parentFolders, entry.name], visitFile);
            continue;
        }
        if (entry.kind === 'file') {
            await visitFile(entry, parentFolders);
        }
    }
}

/**
 * Scan the stored folder recursively and return parsed songs from every .crd/.txt file.
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
    const isOlga = await detectOlgaArchive(handle);
    console.log("Scanning local folder",handle ," (Olga archive detected:", isOlga, ")...");
    await scanDirectoryRecursive(handle, [], async (entry, parentFolders) => {
        if (!/\.(crd|txt)$/i.test(entry.name)) return;
        try {
            const file = await entry.getFile();
            const song = await parseCrdFile(file);
            const localSong = { ...song };
            if (isOlga && parentFolders.length > 0) {
                localSong.artist = parentFolders[parentFolders.length - 1];
            }
            songs.push({ ...localSong, _local: true });
        } catch (err) {
            const relativePath = [...parentFolders, entry.name].join('/');
            console.warn(`Skipping ${relativePath}:`, err);
        }
    });

    songs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    console.log(`Found ${songs.length} song(s) in local folder.`);
    return songs;
}