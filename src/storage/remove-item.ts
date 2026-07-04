import { _getLocalStorage } from './_helpers.js';

/**
 * Removes a key from local storage.
 *
 * This is a no-op for missing keys and returns `false` only when local storage
 * is unavailable or the remove operation fails.
 *
 * @param key - The storage key to remove. Returns `false` for null, undefined, or empty keys.
 * @returns `true` when removal is completed (including missing keys); otherwise `false`.
 *
 * @example
 * removeItem('settings'); // => true
 */
export function removeItem(key: string | null | undefined): boolean {
    if (typeof key !== 'string' || key.length === 0) return false;

    const storage = _getLocalStorage();
    if (storage == null) return false;

    try {
        storage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}