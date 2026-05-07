import { parseCrdFile, parseOlgaFile, decompressGzFile } from './local-song.js';
const INSERT_BATCH_SIZE = 200;
const TX_ROTATE_BATCHES = 10;

let worker = null;
let requestId = 0;
let initPromise = null;
const pending = new Map();

function getWorker() {
    if (worker) return worker;

    worker = new Worker(new URL('../workers/local-songs-db-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
        const { id, ok, result, error, name } = event.data || {};
        const handlers = pending.get(id);
        if (!handlers) return;
        pending.delete(id);

        if (ok) {
            handlers.resolve(result);
            return;
        }

        const err = new Error(error || 'Worker request failed');
        err.name = name || 'Error';
        handlers.reject(err);
    };

    return worker;
}

function callWorker(type, payload) {
    const w = getWorker();
    const id = String(++requestId);
    return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        w.postMessage({ id, type, payload });
    });
}

async function ensureWorkerReady() {
    if (!initPromise) {
        initPromise = (async () => {
            const info = await callWorker('init');
            console.log(
                info.opfs
                    ? `OPFS is available, created persisted database at ${info.filename}`
                    : `OPFS is not available, created transient database ${info.filename}`
            );
            if (!info.opfs) {
                console.warn('OPFS diagnostics:', info.diagnostics || {});
                if (info.opfsFailureReason) {
                    console.warn('OPFS open failure:', info.opfsFailureReason);
                }
            }
        })();
    }

    return initPromise;
}

function isSqliteFullError(error) {
    const message = error?.message || '';
    return message.includes('SQLITE_FULL');
}
/**
 * 
 * @param {FileSystemDirectoryHandle} handle 
 */
export async function startFolderScan(handle) {
    await ensureWorkerReady();

    const progressReport = ({ processed, found, finished=false }) => {
        window.dispatchEvent(new CustomEvent('local-folder-scan-progress', 
            { detail: { processed, found, finished } }
        ));
        console.log(`Scanned ${processed} files, found ${found} songs${finished ? ' - scan complete' : ''}`);
        
    };

    const isOlga = handle.name === 'olga-guitar-archive-complete';
    await callWorker('resetTable');
    clearCounters();

    let batch = [];
    let txBatchCount = 0;

    const flushBatch = async () => {
        if (!batch.length) return;
        await callWorker('insertSongs', batch);
        batch = [];
        txBatchCount++;
        if (txBatchCount >= TX_ROTATE_BATCHES) {
            await callWorker('commitTx');
            await callWorker('beginTx');
            txBatchCount = 0;
        }
    };

    try {
        await callWorker('beginTx');
        await scanDirectoryRecursive(handle, [], isOlga, fileprocessor, progressReport, async (song) => {
            batch.push(song);
            if (batch.length >= INSERT_BATCH_SIZE) {
                await flushBatch();
            }
        });
        await flushBatch();
        await callWorker('commitTx');

        progressReport({ processed: fileCounter, found: foundSongs, finished: true });
        
    } catch (err) {
        await callWorker('rollbackTx');

        if (isSqliteFullError(err)) {
            progressReport({ processed: fileCounter, found: foundSongs, finished: true });
            console.error('SQLite capacity reached while scanning local files.', err);
            return;
        }

        throw err;
    }
}
  let fileCounter = 0;
  let foundSongs = 0;
  function clearCounters(){
    fileCounter=0;
    foundSongs=0;
  }
/**
 * 
 * @param {FileSystemDirectoryHandle} directoryHandle 
 * @param {Array<string>} parentFolders 
 * @param {Function} visitFile 
 * @param {Function} progressReport
 */
async function scanDirectoryRecursive(directoryHandle, parentFolders, isOlga, visitFile, progressReport=null, onSongFound) {

    for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'directory') {
            await scanDirectoryRecursive(entry, [...parentFolders, entry.name], isOlga, visitFile, progressReport, onSongFound);
            continue;
        }
        if (entry.kind === 'file') {
            const song =await visitFile(entry, parentFolders, isOlga);
            if (song){
               foundSongs++;
               await onSongFound(song);
            }
            if(fileCounter++ % 117 === 0 && progressReport) 
              progressReport({ processed: fileCounter, found: foundSongs });
        }
    }
}
/**
 * 
 * @param {FileSystemHandle} entry 
 * @param {Array<string>} parentFolders
 * @param {Boolean} isOlga
 * @returns {Promise<Song|null>} the parsed song, or null if the file was skipped or failed to parse
 */
const fileprocessor = async (entry, parentFolders, isOlga) => {
        if (!/(crd|tab|btab)/i.test(entry.name)) return;
        try {
            let file = await entry.getFile();
            if (!isOlga && /\.gz$/i.test(entry.name)) {
                file = await decompressGzFile(file);
            }
            const song = isOlga ? parseOlgaFile([...parentFolders, entry.name].join('/')) : await parseCrdFile(file);
            return song;
        } catch (err) {
            const relativePath = [...parentFolders, entry.name].join('/');
            console.warn(`Skipping ${relativePath}:`, err);
            return null;
        }
    };
    /**
     * @param{String} filter
     * @param {Number} skip
     * @param {Number} limit
     * @returns {Promise<Array<{id: String, title: String, artist: String, path: String}>>}
     */
    export async function queryLocalSongs(filter = '', skip = 0, limit = 100) {
        await ensureWorkerReady();
        try {
            return await callWorker('querySongs', { filter, skip, limit });
        } catch (err) {
            console.error('Failed to query local songs from SQLite:', err);
            return [];
        }
      }