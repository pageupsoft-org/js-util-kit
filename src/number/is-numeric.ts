/**
 * Returns `true` when the value is a finite, non-NaN number.
 * `Infinity`, `-Infinity`, and `NaN` are considered non-numeric.
 *
 * @param value - The value to test. Accepts `null` or `undefined`.
 * @returns `true` for a finite number; `false` for null, undefined, NaN, `Infinity`,
 *   or `-Infinity`.
 *
 * @example
 * isNumeric(42);        // => true
 * isNumeric(NaN);       // => false
 * isNumeric(Infinity);  // => false
 * isNumeric(null);      // => false
 */
export function isNumeric(value: number | null | undefined): boolean {
    return value != null && isFinite(value);
}
