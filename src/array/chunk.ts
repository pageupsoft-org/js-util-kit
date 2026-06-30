/**
 * Splits an array into consecutive sub-arrays of at most `size` elements.
 * The final chunk may be smaller than `size` if the array length is not evenly
 * divisible.
 *
 * @param array - The array to split. Accepts `null` or `undefined`.
 * @param size - The maximum number of elements per chunk. Must be a finite number
 *   greater than `0`; non-integer values are truncated toward zero.
 * @returns An array of chunks, or `[]` for null or undefined input.
 * @throws {RangeError} When `size` is not a finite number greater than `0`.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // => [[1, 2], [3, 4], [5]]
 *
 * @example
 * chunk([], 3); // => []
 */
export function chunk<T>(array: readonly T[] | null | undefined, size: number): T[][] {
    if (!isFinite(size) || size <= 0) {
        throw new RangeError('`size` must be a finite number greater than 0.');
    }
    if (array == null) return [];
    const chunkSize = Math.trunc(size);
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}
