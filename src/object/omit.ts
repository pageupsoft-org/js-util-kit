/**
 * Returns a new object with the specified keys excluded from `obj`.
 * The return type is strongly typed as `Omit<T, K>`.
 *
 * Only own enumerable string-keyed properties are considered. Keys listed in
 * `keys` that do not exist on `obj` are silently ignored.
 *
 * @param obj - The source object. Accepts `null` or `undefined`.
 * @param keys - The keys to exclude from the result.
 * @returns A new object without the omitted keys, or `{}` for null or undefined input.
 *
 * @example
 * omit({ a: 1, b: 'two', c: true }, ['b']); // => { a: 1, c: true }
 *
 * @example
 * omit(null, ['a']); // => {}
 */
export function omit<T extends object, K extends keyof T>(
    obj: T | null | undefined,
    keys: readonly K[]
): Omit<T, K> {
    if (obj == null) return {} as Omit<T, K>;
    const excluded = new Set<PropertyKey>(keys);
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => !excluded.has(key))
    ) as Omit<T, K>;
}
