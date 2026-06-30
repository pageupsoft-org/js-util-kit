/**
 * Removes all non-alphanumeric characters from a string, preserving spaces.
 *
 * @param value - The string to process. Accepts `null` or `undefined`.
 * @returns The string with only letters (`A–Za–z`), digits (`0–9`), and spaces retained,
 *   or `''` for null or undefined.
 *
 * @example
 * removeSpecialChar('Hello, World! 123'); // => 'Hello World 123'
 *
 * @example
 * removeSpecialChar(null); // => ''
 */
export function removeSpecialChar(value: string | null | undefined): string {
    if (value == null) return '';
    return value.replace(/[^a-zA-Z0-9 ]/g, '');
}
