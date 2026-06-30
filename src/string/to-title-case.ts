/**
 * Converts a string to title case, capitalizing the first letter of every word.
 * Extra leading/trailing whitespace is trimmed and internal runs of whitespace
 * are collapsed to a single space before casing.
 *
 * @param value - The string to convert. Accepts `null` or `undefined`.
 * @returns The title-cased string, or `''` for null, undefined, or an empty string.
 *
 * @example
 * toTitleCase('hello world'); // => 'Hello World'
 *
 * @example
 * toTitleCase(null); // => ''
 */
export function toTitleCase(value: string | null | undefined): string {
    if (value == null) return '';
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.length === 0 ? '' : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
