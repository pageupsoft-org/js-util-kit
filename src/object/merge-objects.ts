/** Internal helper: recursively merges two plain-object records. */
function _deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
): Record<string, unknown> {
    const result: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
        const sv: unknown = source[key];
        const tv: unknown = result[key];
        if (
            sv !== null && sv !== undefined &&
            typeof sv === 'object' && !Array.isArray(sv) &&
            tv !== null && tv !== undefined &&
            typeof tv === 'object' && !Array.isArray(tv)
        ) {
            result[key] = _deepMerge(
                tv as Record<string, unknown>,
                sv as Record<string, unknown>
            );
        } else {
            result[key] = sv;
        }
    }
    return result;
}

/**
 * Deep-merges `source` into `target` and returns a new object without mutating
 * either input. When the same key holds a plain object in both inputs, the objects
 * are merged recursively. Arrays and other non-plain-object values from `source`
 * overwrite those in `target`.
 *
 * @param target - The base object. Accepts `null` or `undefined` (treated as `{}`).
 * @param source - The object whose properties are merged in. Accepts `null` or
 *   `undefined` (treated as `{}`).
 * @returns A new deep-merged object; never `null` or `undefined`.
 *
 * @example
 * mergeObjects({ a: 1, b: { x: 10 } }, { b: { y: 20 }, c: 3 });
 * // => { a: 1, b: { x: 10, y: 20 }, c: 3 }
 *
 * @example
 * mergeObjects(null, { a: 1 }); // => { a: 1 }
 */
export function mergeObjects<T extends object, S extends object>(
    target: T | null | undefined,
    source: S | null | undefined
): T & S {
    const t = (target ?? {}) as Record<string, unknown>;
    const s = (source ?? {}) as Record<string, unknown>;
    return _deepMerge(t, s) as T & S;
}
