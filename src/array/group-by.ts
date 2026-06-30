/**
 * Groups the elements of an array into a `Record` keyed by the string returned
 * by `keySelector`. The insertion order of each group matches the original array.
 *
 * @param array - The array to group. Accepts `null` or `undefined`.
 * @param keySelector - A function that derives the group key from an element.
 * @returns A `Record<string, T[]>` mapping each key to its group, or `{}` for
 *   null or undefined input.
 *
 * @example
 * groupBy(
 *   [{ name: 'Alice', dept: 'Eng' }, { name: 'Bob', dept: 'Mkt' }, { name: 'Eve', dept: 'Eng' }],
 *   item => item.dept
 * );
 * // => { Eng: [{Alice}, {Eve}], Mkt: [{Bob}] }
 */
export function groupBy<T>(
    array: readonly T[] | null | undefined,
    keySelector: (item: T) => string
): Record<string, T[]> {
    if (array == null) return {};
    const result: Record<string, T[]> = {};
    for (const item of array) {
        const key = keySelector(item);
        const group = result[key];
        if (group === undefined) {
            result[key] = [item];
        } else {
            group.push(item);
        }
    }
    return result;
}
