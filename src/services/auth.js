import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase.js';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let _initialized = false;
let _currentUser = null;
const _listeners = new Set();

onAuthStateChanged(auth, (user) => {
    _initialized = true;
    _currentUser = user;
    _listeners.forEach(fn => fn(user));
});

/**
 * Get the currently signed-in user synchronously (may be null while initializing).
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
    return _currentUser;
}

/**
 * Subscribe to auth state changes. Immediately calls the callback with the current user.
 * @param {function(import('firebase/auth').User|null): void} callback
 * @returns {function(): void} unsubscribe function
 */
export function subscribeToAuth(callback) {
    _listeners.add(callback);
    // Only call immediately if Firebase Auth has already resolved the initial state.
    // Otherwise the callback is called when onAuthStateChanged fires.
    if (_initialized) {
        callback(_currentUser);
    }
    return () => _listeners.delete(callback);
}

/**
 * Sign in using a Google popup.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export function signInWithGoogle() {
    return signInWithPopup(auth, provider);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export function signOutUser() {
    return signOut(auth);
}
