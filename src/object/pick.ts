/**
 * Returns a new object containing only the specified keys from `obj`.
 * The return type is strongly typed as `Pick<T, K>`.
 *
 * Only own enumerable string-keyed properties are considered. Keys listed in
 * `keys` that do not exist on `obj` are silently ignored.
 *
 * @param obj - The source object. Accepts `null` or `undefined`.
 * @param keys - The keys to include in the result.
 * @returns A new object with only the picked keys, or `{}` for null or undefined input.
 *
 * @example
 * pick({ a: 1, b: 'two', c: true }, ['a', 'c']); // => { a: 1, c: true }
 *
 * @example
 * pick(null, ['a']); // => {}
 */
export function pick<T extends object, K extends keyof T>(
    obj: T | null | undefined,
    keys: readonly K[]
): Pick<T, K> {
    if (obj == null) return {} as Pick<T, K>;
    const included = new Set<PropertyKey>(keys);
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => included.has(key))
    ) as Pick<T, K>;
}
