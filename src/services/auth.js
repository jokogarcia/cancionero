import { supabase } from '../supabase.js';

let _initialized = false;
let _currentUser = null;
const _listeners = new Set();

/**
 * Normalize Supabase user shape to keep legacy `uid` access used in the app.
 * @param {import('@supabase/supabase-js').User|null} user
 * @returns {(import('@supabase/supabase-js').User & {uid: string})|null}
 */
function normalizeUser(user) {
    if (!user) return null;
    return {
        ...user,
        uid: user.id,
    };
}

supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Failed to initialize auth session:', error);
        _initialized = true;
        _currentUser = null;
        _listeners.forEach(fn => fn(_currentUser));
        return;
    }
    _initialized = true;
    _currentUser = normalizeUser(data.session?.user || null);
    _listeners.forEach(fn => fn(_currentUser));
});

supabase.auth.onAuthStateChange((_, session) => {
    _initialized = true;
    _currentUser = normalizeUser(session?.user || null);
    _listeners.forEach(fn => fn(_currentUser));
});

/**
 * Get the currently signed-in user synchronously (may be null while initializing).
 * @returns {import('@supabase/supabase-js').User & {uid: string}|null}
 */
export function getCurrentUser() {
    return _currentUser;
}

/**
 * Subscribe to auth state changes. Immediately calls the callback with the current user.
 * @param {function((import('@supabase/supabase-js').User & {uid: string})|null): void} callback
 * @returns {function(): void} unsubscribe function
 */
export function subscribeToAuth(callback) {
    _listeners.add(callback);
    // Only call immediately if auth has already resolved the initial state.
    // Otherwise the callback is called when auth state change events fire.
    if (_initialized) {
        callback(_currentUser);
    }
    return () => _listeners.delete(callback);
}

/**
 * Sign in using a Google redirect flow compatible with COOP/COEP.
 * @returns {Promise<void>}
 */
export async function signInWithGoogle() {
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    });
    if (error) {
        throw error;
    }
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export async function signOutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}
