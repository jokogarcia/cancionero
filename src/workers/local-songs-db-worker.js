import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

const DB_FILE = '/local-songs.sqlite3';

let sqlite3 = null;
let db = null;
let opfsEnabled = false;
let opfsFailureReason = null;

async function ensureDb() {
    if (db) return db;

    sqlite3 = await sqlite3InitModule({
        locateFile: (path) => (path.endsWith('.wasm') ? sqliteWasmUrl : path),
        print: () => {},
    });

    try {
        db = new sqlite3.oo1.OpfsDb(DB_FILE);
        opfsEnabled = true;
    } catch (error) {
        opfsEnabled = false;
        opfsFailureReason = error?.message || String(error);
        db = new sqlite3.oo1.DB(DB_FILE, 'ct');
    }

    ensureSchema();
    return db;
}

function ensureSchema() {
    db.exec('CREATE TABLE IF NOT EXISTS local_songs (id TEXT PRIMARY KEY, title TEXT, artist TEXT, path TEXT)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_local_songs_title ON local_songs(title)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_local_songs_artist ON local_songs(artist)');
}

async function resetTable() {
    await ensureDb();
    db.exec('DROP TABLE IF EXISTS local_songs');
    ensureSchema();
}

async function beginTx() {
    await ensureDb();
    db.exec('BEGIN');
}

async function commitTx() {
    await ensureDb();
    db.exec('COMMIT');
}

async function rollbackTx() {
    await ensureDb();
    try {
        db.exec('ROLLBACK');
    } catch (_err) {
        // no active transaction, ignore
    }
}

async function insertSongs(songs) {
    await ensureDb();
    for (const song of songs) {
        db.exec({
            sql: 'INSERT OR REPLACE INTO local_songs (id, title, artist, path) VALUES (?, ?, ?, ?)',
            bind: [song.id, song.title || '', song.artist || '', song.path || ''],
        });
    }
}

async function querySongs(payload = {}) {
    const filter = typeof payload === 'string' ? payload : (payload.filter ?? '');
    const skip = Number.isFinite(payload.skip) ? payload.skip : 0;
    const limit = Number.isFinite(payload.limit) ? payload.limit : 100;

    await ensureDb();
    const rows = !!filter ? db.selectObjects(
        'SELECT id, title, artist, path FROM local_songs WHERE title LIKE ? OR artist LIKE ? ORDER BY title LIMIT ? OFFSET ?',
        [`%${filter}%`, `%${filter}%`, limit, skip]
    ) : db.selectObjects(
        'SELECT id, title, artist, path FROM local_songs ORDER BY title LIMIT ? OFFSET ?',
        [limit, skip]
    );

    return rows.map(row => ({
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        artist: String(row.artist ?? ''),
        path: String(row.path ?? ''),
    }));
}

const actions = {
    init: async () => {
        await ensureDb();
        return {
            opfs: opfsEnabled,
            filename: db.filename,
            opfsFailureReason,
            diagnostics: {
                workerCrossOriginIsolated: self.crossOriginIsolated,
                hasStorageGetDirectory: !!(navigator.storage && navigator.storage.getDirectory),
                hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
            },
        };
    },
    resetTable,
    beginTx,
    commitTx,
    rollbackTx,
    insertSongs,
    querySongs,
};

self.onmessage = async (event) => {
    const { id, type, payload } = event.data || {};
    if (!id || !type || !actions[type]) return;

    try {
        const result = await actions[type](payload);
        self.postMessage({ id, ok: true, result });
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error?.message || String(error),
            name: error?.name || 'Error',
        });
    }
};
