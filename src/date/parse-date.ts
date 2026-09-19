import { _parseDateString } from './_helpers.js';

/**
 * Parses a date string using a format pattern.
 *
 * @param dateStr - The date string to parse.
 * @param format - The format pattern (e.g., 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY HH:mm').
 * @returns A Date object if parsing succeeds, undefined otherwise.
 *
 * @example
 * parseDate('30/07/2026', 'DD/MM/YYYY'); // => Date(2026-07-30)
 * @example
 * parseDate('07/30/2026', 'MM/DD/YYYY'); // => Date(2026-07-30)
 * @example
 * parseDate('2026-07-30', 'YYYY-MM-DD'); // => Date(2026-07-30)
 * @example
 * parseDate('2026-07-30 14:05', 'YYYY-MM-DD HH:mm'); // => Date(2026-07-30T14:05:00)
 * @example
 * parseDate('invalid', 'YYYY-MM-DD'); // => undefined
 */
export function parseDate(dateStr: string, format: string): Date | undefined {
    if (typeof dateStr !== 'string' || typeof format !== 'string') {
        return undefined;
    }
    const result = _parseDateString(dateStr, format);
    return result ?? undefined;
}