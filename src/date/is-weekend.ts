import { _parseDate } from './_helpers.js';

/**
 * Returns `true` if the given date falls on a Saturday or Sunday (local time).
 *
 * @param value - The date to check. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns `true` for Saturday or Sunday, `false` for any weekday,
 *   and `false` for any null, undefined, or invalid input.
 *
 * @example
 * isWeekend(new Date(2026, 5, 27)); // => true  (Saturday)
 *
 * @example
 * isWeekend(null); // => false
 */
export function isWeekend(value: Date | string | null | undefined): boolean {
    const d = _parseDate(value);
    if (d === null) return false;
    const day = d.getDay();
    return day === 0 || day === 6;
}
