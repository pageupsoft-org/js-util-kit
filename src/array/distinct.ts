/**
 * Returns a new array containing only the first occurrence of each element,
 * using `Set` (reference equality for objects, value equality for primitives).
 *
 * For objects, two values are considered equal only when they share the same
 * reference. To deduplicate objects by a derived key, use `distinctBy` instead.
 *
 * @param array - The array to deduplicate. Accepts `null` or `undefined`.
 * @returns A new array with duplicate elements removed, or `[]` for null or
 *   undefined input.
 *
 * @example
 * distinct([1, 2, 2, 3, 1]); // => [1, 2, 3]
 *
 * @example
 * const obj = { id: 1 };
 * distinct([obj, { id: 1 }, obj]); // => [obj, { id: 1 }]  (two different references kept)
 */
export function distinct<T>(array: readonly T[] | null | undefined): T[] {
    if (array == null) return [];
    return [...new Set(array)];
}
