import { _getSessionStorage } from './_helpers.js';

/**
 * Removes a key from session storage.
 *
 * This is a no-op for missing keys and returns `false` only when session storage
 * is unavailable or the remove operation fails.
 *
 * @param key - The storage key to remove. Returns `false` for null, undefined, or empty keys.
 * @returns `true` when removal is completed (including missing keys); otherwise `false`.
 *
 * @example
 * removeSessionStorage('tempToken'); // => true
 */
export function removeSessionStorage(key: string | null | undefined): boolean {
    if (typeof key !== 'string' || key.length === 0) return false;

    const storage = _getSessionStorage();
    if (storage == null) return false;

    try {
        storage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}