/**
 * Returns a new array sorted by the value returned by `selector`, without
 * mutating the original array.
 *
 * @param array - The array to sort. Accepts `null` or `undefined`.
 * @param selector - A function that derives the sort key (number or string) from
 *   an element.
 * @param direction - Sort direction: `'asc'` (default) or `'desc'`.
 * @returns A new sorted array, or `[]` for null or undefined input.
 *
 * @example
 * sortBy([{ n: 3 }, { n: 1 }, { n: 2 }], item => item.n);
 * // => [{ n: 1 }, { n: 2 }, { n: 3 }]
 *
 * @example
 * sortBy(['banana', 'apple', 'cherry'], s => s, 'desc');
 * // => ['cherry', 'banana', 'apple']
 */
export function sortBy<T>(
    array: readonly T[] | null | undefined,
    selector: (item: T) => number | string,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    if (array == null) return [];
    return [...array].sort((a, b) => {
        const aVal = selector(a);
        const bVal = selector(b);
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -cmp : cmp;
    });
}
