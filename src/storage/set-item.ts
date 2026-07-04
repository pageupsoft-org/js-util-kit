import { _getLocalStorage } from './_helpers.js';

/**
 * Stores a value in local storage under the provided key.
 *
 * The value is serialized with `JSON.stringify` before being written.
 * Returns `false` instead of throwing when local storage is unavailable or
 * the write fails (for example quota errors).
 *
 * @param key - The storage key. Returns `false` for null, undefined, or empty keys.
 * @param value - The value to serialize and store.
 * @returns `true` when the value is stored successfully; otherwise `false`.
 *
 * @example
 * setItem('settings', { theme: 'dark' }); // => true
 */
export function setItem(key: string | null | undefined, value: unknown): boolean {
    if (typeof key !== 'string' || key.length === 0) return false;

    const storage = _getLocalStorage();
    if (storage == null) return false;

    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}