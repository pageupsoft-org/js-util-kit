/**
 * Capitalizes the first character of a string, leaving the remainder unchanged.
 *
 * Note: this only uppercases the first character of the whole string — it does
 * not capitalize each word. For per-word capitalization use `toTitleCase`.
 *
 * @param value - The string to process. Accepts `null` or `undefined`.
 * @returns The string with its first character uppercased, or `''` for null,
 *   undefined, or an empty string.
 *
 * @example
 * capitalize('hello world'); // => 'Hello world'
 *
 * @example
 * capitalize(null); // => ''
 */
export function capitalize(value: string | null | undefined): string {
    if (value == null || value.length === 0) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}