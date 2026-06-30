import { _parseDate } from './_helpers.js';

/**
 * Returns a new `Date` set to the start of the given day (00:00:00.000) in local time.
 *
 * @param date - The reference date. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns A new `Date` at midnight local time, or `null` for any null, undefined,
 *   or invalid input.
 *
 * @example
 * getStartOfDay(new Date(2026, 5, 30, 14, 30, 45)); // => Date for 2026-06-30T00:00:00.000
 */
export function getStartOfDay(date: Date | string | null | undefined): Date | null {
    const d = _parseDate(date);
    if (d === null) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
