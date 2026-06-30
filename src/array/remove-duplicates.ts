/**
 * Returns a new array with duplicate **primitive** values removed, preserving
 * the first occurrence of each value.
 *
 * This function is typed for primitive values (`string`, `number`, `boolean`,
 * `bigint`) where `Set` guarantees value equality. For deduplicating objects,
 * use `distinct` (reference equality) or `distinctBy` (key-based equality).
 *
 * @param array - The primitive array to deduplicate. Accepts `null` or `undefined`.
 * @returns A new array with duplicate primitives removed, or `[]` for null or
 *   undefined input.
 *
 * @example
 * removeDuplicates([1, 2, 2, 3, 1]); // => [1, 2, 3]
 *
 * @example
 * removeDuplicates(['a', 'b', 'a', 'c']); // => ['a', 'b', 'c']
 */
export function removeDuplicates<T extends string | number | boolean | bigint>(
    array: readonly T[] | null | undefined
): T[] {
    if (array == null) return [];
    return [...new Set(array)];
}
