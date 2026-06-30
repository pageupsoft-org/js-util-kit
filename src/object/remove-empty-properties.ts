/**
 * Returns a shallow copy of an object with all "empty" properties removed.
 *
 * A property is considered **empty** when its value is strictly `null`,
 * `undefined`, or an empty string (`''`). All other falsy values — `0`, `false`,
 * `NaN`, and empty arrays or objects — are retained.
 *
 * Only own enumerable string-keyed properties are inspected; nested objects are
 * not recursively pruned.
 *
 * @param obj - The object to prune. Accepts `null` or `undefined`.
 * @returns A new object with empty properties removed, or `{}` for null or
 *   undefined input.
 *
 * @example
 * removeEmptyProperties({ a: 1, b: null, c: '', d: undefined, e: 0 });
 * // => { a: 1, e: 0 }
 *
 * @example
 * removeEmptyProperties(null); // => {}
 */
export function removeEmptyProperties<T extends object>(
    obj: T | null | undefined
): Partial<T> {
    if (obj == null) return {};
    const result = {} as Partial<T>;
    for (const key of Object.keys(obj) as Array<keyof T & string>) {
        const val: unknown = obj[key];
        if (val !== null && val !== undefined && val !== '') {
            result[key] = obj[key];
        }
    }
    return result;
}
