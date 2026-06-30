/**
 * Rounds a number to a specified number of decimal places using `Math.round`.
 *
 * @param value - The number to round. Accepts `null`, `undefined`, or non-finite numbers.
 * @param places - Number of decimal places to retain. Must be a finite, non-negative
 *   number; non-integer values are truncated toward zero.
 * @returns The rounded number, or `null` for null, undefined, NaN, or non-finite input.
 * @throws {RangeError} When `places` is not a finite, non-negative number.
 *
 * @example
 * roundToDecimalPlaces(3.14159, 2); // => 3.14
 *
 * @example
 * roundToDecimalPlaces(3.7, 0);     // => 4
 *
 * @example
 * roundToDecimalPlaces(null, 2);    // => null
 */
export function roundToDecimalPlaces(
    value: number | null | undefined,
    places: number
): number | null {
    if (!isFinite(places) || places < 0) {
        throw new RangeError('`places` must be a finite, non-negative number.');
    }
    if (value == null || !isFinite(value)) return null;
    const factor = Math.pow(10, Math.trunc(places));
    return Math.round(value * factor) / factor;
}
