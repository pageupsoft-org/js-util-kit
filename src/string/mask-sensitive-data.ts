/**
 * Masks all but the last `visibleChars` characters of a string with `'*'`.
 * Useful for display-safe rendering of card numbers, tokens, and similar sensitive values.
 * When the string is shorter than or equal to `visibleChars`, it is returned unmasked.
 *
 * @param value - The string to mask. Accepts `null` or `undefined`.
 * @param visibleChars - Number of trailing characters to leave visible. Defaults to `4`.
 *   Must be a finite, non-negative number; non-integer values are truncated toward zero.
 * @returns The masked string, or `''` for null or undefined.
 * @throws {RangeError} When `visibleChars` is not a finite, non-negative number.
 *
 * @example
 * maskSensitiveData('4111111111111234');      // => '************1234'
 *
 * @example
 * maskSensitiveData('4111111111111234', 6);  // => '**********111234'
 *
 * @example
 * maskSensitiveData(null); // => ''
 */
export function maskSensitiveData(value: string | null | undefined, visibleChars = 4): string {
    if (!isFinite(visibleChars) || visibleChars < 0) {
        throw new RangeError('`visibleChars` must be a finite, non-negative number.');
    }
    if (value == null) return '';
    const visible = Math.trunc(visibleChars);
    if (value.length <= visible) return value;
    return '*'.repeat(value.length - visible) + (visible > 0 ? value.slice(-visible) : '');
}
