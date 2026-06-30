import { _parseDate } from './_helpers.js';

/**
 * Returns a new `Date` set to the end of the given day (23:59:59.999) in local time.
 *
 * @param date - The reference date. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns A new `Date` at 23:59:59.999 local time, or `null` for any null, undefined,
 *   or invalid input.
 *
 * @example
 * getEndOfDay(new Date(2026, 5, 30, 8, 0, 0)); // => Date for 2026-06-30T23:59:59.999
 */
export function getEndOfDay(date: Date | string | null | undefined): Date | null {
    const d = _parseDate(date);
    if (d === null) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
