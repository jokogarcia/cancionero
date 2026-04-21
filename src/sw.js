/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

const CHORDS_DB_NAME = 'coda-db';
const CHORDS_STORE_NAME = 'app-cache';
const CHORDS_CACHE_KEY = 'chords';
const CHORDS_INITIAL_SYNC_TAG = 'sync-chords-cache-initial';
const CHORDS_COMPLETE_SYNC_TAG = 'sync-chords-cache-complete';
const MSG_CHORDS_SYNC_WAIT = 'CHORDS_SYNC_WAIT';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

let initialSyncInFlight = null;
let completeSyncInFlight = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();

    try {
      await ensureInitialChordsSync();
    } catch (_error) {
      await registerBackgroundSync(CHORDS_INITIAL_SYNC_TAG);
    }

    void scheduleCompleteChordsSync();
  })());
});

self.addEventListener('sync', event => {
  if (event.tag === CHORDS_INITIAL_SYNC_TAG) {
    event.waitUntil(ensureInitialChordsSync());
    return;
  }

  if (event.tag === CHORDS_COMPLETE_SYNC_TAG) {
    event.waitUntil(ensureCompleteChordsSync());
  }
});

self.addEventListener('message', event => {
  const message = event.data || {};
  if (message.type !== MSG_CHORDS_SYNC_WAIT) return;

  event.waitUntil((async () => {
    const replyPort = event.ports && event.ports[0];
    if (!replyPort) return;

    try {
      // Only wait for an ongoing synchronization; do not start a new one from this request.
      if (initialSyncInFlight) {
        await initialSyncInFlight;
      }
      replyPort.postMessage({ ok: true });
    } catch (error) {
      replyPort.postMessage({ ok: false, error: error?.message || 'sync wait failed' });
    }
  })());
});

async function ensureInitialChordsSync() {
  if (initialSyncInFlight) return initialSyncInFlight;

  initialSyncInFlight = (async () => {
    await syncChordsFromNetwork('/chords.json');
    return true;
  })();

  try {
    return await initialSyncInFlight;
  } finally {
    initialSyncInFlight = null;
  }
}

async function ensureCompleteChordsSync() {
  if (completeSyncInFlight) return completeSyncInFlight;

  completeSyncInFlight = (async () => {
    await syncChordsFromNetwork('/chords.complete.json');
    return true;
  })();

  try {
    return await completeSyncInFlight;
  } finally {
    completeSyncInFlight = null;
  }
}

async function scheduleCompleteChordsSync() {
  const registered = await registerBackgroundSync(CHORDS_COMPLETE_SYNC_TAG);
  if (registered) return;

  // Best-effort fallback when Background Sync is not available.
  void ensureCompleteChordsSync().catch(() => {});
}

async function syncChordsFromNetwork(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const chords = await response.json();
  await writeChordsToIndexedDB(chords);
}

async function registerBackgroundSync(tag) {
  if (!('sync' in self.registration)) return false;

  try {
    await self.registration.sync.register(tag);
    return true;
  } catch (_error) {
    return false;
  }
}

function openChordsDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHORDS_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHORDS_STORE_NAME)) {
        db.createObjectStore(CHORDS_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function writeChordsToIndexedDB(chords) {
  const db = await openChordsDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHORDS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CHORDS_STORE_NAME);
    store.put(chords, CHORDS_CACHE_KEY);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to write chords to IndexedDB'));
    tx.onabort = () => reject(tx.error || new Error('Failed to write chords to IndexedDB'));
  });
}
