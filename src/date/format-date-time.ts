import { _parseDate, _applyFormat } from './_helpers.js';

/**
 * Formats a date and time using a token-based format string and local time.
 *
 * Supported tokens: `YYYY` (year), `MM` (month), `DD` (day),
 * `HH` (hours, 24h), `mm` (minutes), `ss` (seconds).
 * Defaults to `'YYYY-MM-DD HH:mm:ss'` when no format is provided.
 *
 * @param value - The date to format. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @param format - Optional format string. Defaults to `'YYYY-MM-DD HH:mm:ss'`.
 * @returns The formatted date-time string, or `''` for null, undefined, or an invalid date.
 *
 * @example
 * formatDateTime(new Date(2026, 5, 30, 14, 30, 0));                     // => '2026-06-30 14:30:00'
 *
 * @example
 * formatDateTime(new Date(2026, 5, 30, 14, 30, 0), 'DD/MM/YYYY HH:mm'); // => '30/06/2026 14:30'
 *
 * @example
 * formatDateTime('not-a-date'); // => ''
 */
export function formatDateTime(value: Date | string | null | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = _parseDate(value);
    if (d === null) return '';
    return _applyFormat(d, format);
}
