let wakeLockSentinel = null;
let keepScreenAwake = false;
let visibilityListenerRegistered = false;

function supportsWakeLock() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

async function requestWakeLockSentinel() {
  if (!supportsWakeLock()) {
    return false;
  }

  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
      if (keepScreenAwake && !document.hidden) {
        void requestWakeLockSentinel();
      }
    });
    return true;
  } catch (err) {
    console.warn('[WakeLock] Could not acquire screen lock:', err);
    wakeLockSentinel = null;
    return false;
  }
}

function onVisibilityChange() {
  if (!keepScreenAwake || !supportsWakeLock()) {
    return;
  }

  if (document.hidden) {
    if (wakeLockSentinel) {
      const current = wakeLockSentinel;
      wakeLockSentinel = null;
      void current.release().catch(() => {});
    }
    return;
  }

  if (!wakeLockSentinel) {
    void requestWakeLockSentinel();
  }
}

function ensureVisibilityListener() {
  if (visibilityListenerRegistered || typeof document === 'undefined') {
    return;
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  visibilityListenerRegistered = true;
}

function removeVisibilityListener() {
  if (!visibilityListenerRegistered || typeof document === 'undefined') {
    return;
  }
  document.removeEventListener('visibilitychange', onVisibilityChange);
  visibilityListenerRegistered = false;
}

export async function acquireWakeLock() {
  keepScreenAwake = true;
  ensureVisibilityListener();

  if (wakeLockSentinel) {
    return true;
  }

  return requestWakeLockSentinel();
}

export function releaseWakeLock() {
  keepScreenAwake = false;
  removeVisibilityListener();

  if (!wakeLockSentinel) {
    return;
  }

  const current = wakeLockSentinel;
  wakeLockSentinel = null;
  void current.release().catch(() => {});
}

export function isWakeLockActive() {
  return Boolean(wakeLockSentinel);
}
