/**
 * Creates a deep copy of a value using `structuredClone` when available
 * (Node.js ≥ 17, modern browsers). Falls back to `JSON.parse(JSON.stringify(value))`
 * in older environments.
 *
 * Fallback limitations: does not preserve `Date` objects (converted to strings),
 * `undefined` values, `Map`, `Set`, `RegExp`, or circular references.
 * `structuredClone`-capable environments have none of these limitations.
 *
 * `null` and `undefined` inputs are returned as-is; no `{}` fallback is applied
 * because `deepClone` is generic and must preserve the input type.
 *
 * @param value - The value to clone. Works with objects, arrays, dates, and primitives.
 * @returns A deep copy of `value`.
 *
 * @example
 * const obj = { a: 1, nested: { b: 2 } };
 * const clone = deepClone(obj);
 * clone.nested.b = 99;
 * obj.nested.b; // => 2  (original is unchanged)
 */
export function deepClone<T>(value: T): T {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    // JSON fallback for environments without structuredClone.
    if (value === undefined) return undefined as T;
    return JSON.parse(JSON.stringify(value)) as T;
}
