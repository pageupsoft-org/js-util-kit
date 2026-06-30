/**
 * Returns `true` when the value is null, undefined, or contains only whitespace.
 *
 * @param value - The value to test. Accepts `null` or `undefined`.
 * @returns `true` for null, undefined, empty string, or whitespace-only strings;
 *   `false` otherwise.
 *
 * @example
 * isNullOrWhitespace('  '); // => true
 *
 * @example
 * isNullOrWhitespace('hello'); // => false
 */
export function isNullOrWhitespace(value: string | null | undefined): boolean {
    return value == null || value.trim().length === 0;
}
