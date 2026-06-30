/**
 * Capitalizes the first character of a string, leaving the remainder unchanged.
 *
 * @param value - The string to process. Accepts `null` or `undefined`.
 * @returns The string with its first character uppercased, or `''` for null,
 *   undefined, or an empty string.
 *
 * @example
 * capitalizeFirstLetter('hello world'); // => 'Hello world'
 *
 * @example
 * capitalizeFirstLetter(null); // => ''
 */
export function capitalizeFirstLetter(value: string | null | undefined): string {
    if (value == null || value.length === 0) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}
