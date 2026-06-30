/**
 * Trims leading and trailing whitespace and collapses any internal run of
 * whitespace characters into a single space.
 *
 * @param value - The string to process. Accepts `null` or `undefined`.
 * @returns The normalised string, or `''` for null or undefined.
 *
 * @example
 * removeExtraWhitespaces('  hello   world  '); // => 'hello world'
 *
 * @example
 * removeExtraWhitespaces(null); // => ''
 */
export function removeExtraWhitespaces(value: string | null | undefined): string {
    if (value == null) return '';
    return value.trim().replace(/\s+/g, ' ');
}
