/**
 * Truncates a string to at most `maxLength` characters and appends `'...'` when
 * truncation occurs. The cut is made at the last word boundary within `maxLength`
 * characters; if no word boundary exists the cut falls at `maxLength`.
 * No ellipsis is appended when the input fits within `maxLength`.
 *
 * @param value - The string to truncate. Accepts `null` or `undefined`.
 * @param maxLength - Maximum number of visible text characters before the ellipsis.
 *   Must be a finite, non-negative number; otherwise throws a `RangeError`.
 *   Non-integer values are truncated toward zero.
 * @returns The (possibly truncated) string, or `''` for null or undefined.
 * @throws {RangeError} When `maxLength` is not a finite, non-negative number.
 *
 * @example
 * truncateText('Hello World', 7); // => 'Hello...'
 *
 * @example
 * truncateText('Hi', 10); // => 'Hi'  (no ellipsis — fits within limit)
 *
 * @example
 * truncateText(null, 10); // => ''
 */
export function truncateText(value: string | null | undefined, maxLength: number): string {
    if (!isFinite(maxLength) || maxLength < 0) {
        throw new RangeError('`maxLength` must be a finite, non-negative number.');
    }
    if (value == null) return '';
    const limit = Math.trunc(maxLength);
    if (value.length <= limit) return value;
    const slice = value.slice(0, limit);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
    return `${cut}...`;
}
