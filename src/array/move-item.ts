/**
 * Returns a new array with the element at `fromIndex` moved to `toIndex`,
 * without mutating the original array.
 *
 * If either index is out of bounds (`< 0` or `>= array.length`), the function
 * returns a shallow copy of the original array unchanged.
 *
 * @param array - The source array. Accepts `null` or `undefined`.
 * @param fromIndex - The index of the element to move.
 * @param toIndex - The index to move the element to.
 * @returns A new array with the element moved, an unchanged copy if either index
 *   is out of bounds, or `[]` for null or undefined input.
 *
 * @example
 * moveItem([1, 2, 3, 4], 0, 3); // => [2, 3, 4, 1]
 *
 * @example
 * moveItem([1, 2, 3, 4], 0, 99); // => [1, 2, 3, 4]  (out of bounds — unchanged copy)
 */
export function moveItem<T>(
    array: readonly T[] | null | undefined,
    fromIndex: number,
    toIndex: number
): T[] {
    if (array == null) return [];
    if (
        fromIndex < 0 || fromIndex >= array.length ||
        toIndex < 0 || toIndex >= array.length
    ) {
        return [...array];
    }
    const result = [...array];
    // splice returns the removed elements; bounds are validated above so
    // exactly one element is always removed — the non-null assertion is safe.
    const removed = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed[0]!);
    return result;
}
