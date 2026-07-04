import { _getLocalStorage } from './_helpers.js';

/**
 * Reads and deserializes a value from local storage.
 *
 * Returns `null` instead of throwing when local storage is unavailable, the key
 * does not exist, or parsing fails.
 *
 * @param key - The storage key. Returns `null` for null, undefined, or empty keys.
 * @returns The parsed value as `T`, or `null` when unavailable, missing, or invalid.
 *
 * @example
 * getItem<{ theme: string }>('settings'); // => { theme: 'dark' } | null
 */
export function getItem<T>(key: string | null | undefined): T | null {
    if (typeof key !== 'string' || key.length === 0) return null;

    const storage = _getLocalStorage();
    if (storage == null) return null;

    let rawValue: string | null;
    try {
        rawValue = storage.getItem(key);
    } catch {
        return null;
    }

    if (rawValue == null) return null;

    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return null;
    }
}