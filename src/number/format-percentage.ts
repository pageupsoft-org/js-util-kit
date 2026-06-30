/**
 * Formats a number as a percentage string using the native `Intl.NumberFormat` API.
 *
 * The input is expected on a **0–100 scale** (e.g. pass `25` to display `'25.00%'`),
 * which matches the output of `calculatePercentage`.
 *
 * @param value - The percentage value to format (0–100 scale). Accepts `null`,
 *   `undefined`, or non-finite numbers.
 * @param decimalPlaces - Number of decimal places to display. Defaults to `2`.
 *   Must be a finite, non-negative number; non-integer values are truncated toward zero.
 * @param locale - A BCP 47 locale string. Defaults to `'en-US'`.
 * @returns A locale-formatted percentage string, or `''` for null, undefined, or
 *   non-finite input.
 * @throws {RangeError} When `decimalPlaces` is not a finite, non-negative number.
 *
 * @example
 * formatPercentage(25.5);    // => '25.50%'
 *
 * @example
 * formatPercentage(null);    // => ''
 */
export function formatPercentage(
    value: number | null | undefined,
    decimalPlaces = 2,
    locale = 'en-US'
): string {
    if (value == null || !isFinite(value)) return '';
    if (!isFinite(decimalPlaces) || decimalPlaces < 0) {
        throw new RangeError('`decimalPlaces` must be a finite, non-negative number.');
    }
    const places = Math.trunc(decimalPlaces);
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: places,
        maximumFractionDigits: places,
    }).format(value / 100);
}
