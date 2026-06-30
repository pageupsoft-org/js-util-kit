/**
 * Returns a new array containing only the first element for each unique value
 * returned by `keySelector`. Subsequent elements with the same key are discarded.
 *
 * Use this instead of `distinct` when deduplicating objects by a property or
 * computed value.
 *
 * @param array - The array to deduplicate. Accepts `null` or `undefined`.
 * @param keySelector - A function that derives the uniqueness key from an element.
 *   Two elements with the same key are considered duplicates.
 * @returns A new array with duplicates removed, or `[]` for null or undefined input.
 *
 * @example
 * distinctBy(
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 1, name: 'Duplicate' }],
 *   item => item.id
 * );
 * // => [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 */
export function distinctBy<T>(
    array: readonly T[] | null | undefined,
    keySelector: (item: T) => unknown
): T[] {
    if (array == null) return [];
    const seen = new Set<unknown>();
    return array.filter(item => {
        const key = keySelector(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
