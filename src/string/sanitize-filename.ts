/**
 * Strips characters that are invalid in Windows and Linux filenames, and removes
 * trailing dots and spaces (disallowed by Windows).
 *
 * Removed characters: `\ / : * ? " < > |` and ASCII control characters (0x00–0x1F).
 *
 * @param value - The filename string to sanitize. Accepts `null` or `undefined`.
 * @returns The sanitized filename, or `''` for null or undefined.
 *
 * @example
 * sanitizeFilename('my:file?.txt'); // => 'myfile.txt'
 *
 * @example
 * sanitizeFilename('report.'); // => 'report'
 *
 * @example
 * sanitizeFilename(null); // => ''
 */
export function sanitizeFilename(value: string | null | undefined): string {
    if (value == null) return '';
    return value
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/[\x00-\x1f]/g, '')
        .replace(/[. ]+$/, '');
}
