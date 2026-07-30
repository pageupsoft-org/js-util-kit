import { _getLocalStorage, _shouldClearAll } from './_helpers.js';

/**
 * Clears keys from local storage by prefix.
 *
 * When `prefix` is omitted, null, undefined, or an empty string, this clears
 * all local-storage entries. This operation is destructive.
 *
 * @param prefix - Optional key prefix used to select keys for removal.
 * @returns `true` when the clear operation succeeds; otherwise `false`.
 *
 * @example
 * clearItems('app:'); // => true
 */
export function clearItems(prefix?: string | null): boolean {
    const storage = _getLocalStorage();
    if (storage == null) return false;

    try {
        if (_shouldClearAll(prefix)) {
            storage.clear();
            return true;
        }
        const safePrefix = prefix as string;

        const keysToRemove: string[] = [];

        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key != null && key.startsWith(safePrefix)) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            storage.removeItem(key);
        }

        return true;
    } catch {
        return false;
    }
}