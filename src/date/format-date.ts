import { _parseDate, _applyFormat } from './_helpers.js';

/**
 * Formats a date using a token-based format string and local time.
 *
 * Supported tokens: `YYYY` (year), `MM` (month), `DD` (day).
 * Defaults to `'YYYY-MM-DD'` when no format is provided.
 *
 * @param value - The date to format. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @param format - Optional format string. Defaults to `'YYYY-MM-DD'`.
 * @returns The formatted date string, or `''` for null, undefined, or an invalid date.
 *
 * @example
 * formatDate(new Date(2026, 5, 30));               // => '2026-06-30'
 *
 * @example
 * formatDate(new Date(2026, 5, 30), 'DD/MM/YYYY'); // => '30/06/2026'
 *
 * @example
 * formatDate(null); // => ''
 */
export function formatDate(value: Date | string | null | undefined, format = 'YYYY-MM-DD'): string {
    const d = _parseDate(value);
    if (d === null) return '';
    return _applyFormat(d, format);
}
