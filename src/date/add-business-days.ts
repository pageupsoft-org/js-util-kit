import { _parseDate } from './_helpers.js';

/**
 * Adds a number of business days (Monday–Friday) to a date, skipping Saturdays and Sundays.
 * Negative values move backwards in time.
 *
 * @param date - The starting date. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @param days - The number of business days to add. Must be a finite number;
 *   non-finite values throw a `RangeError`. Non-integer values are truncated.
 * @returns A new `Date` after skipping weekends, or `null` for a null, undefined,
 *   or invalid `date` argument.
 * @throws {RangeError} When `days` is not a finite number.
 *
 * @example
 * // Friday + 1 business day = Monday
 * addBusinessDays(new Date(2026, 5, 26), 1); // => Date for 2026-06-29
 */
export function addBusinessDays(
    date: Date | string | null | undefined,
    days: number
): Date | null {
    if (!isFinite(days)) {
        throw new RangeError('`days` must be a finite number.');
    }
    const d = _parseDate(date);
    if (d === null) return null;
    const result = new Date(d.getTime());
    let remaining = Math.trunc(days);
    const step = remaining >= 0 ? 1 : -1;
    while (remaining !== 0) {
        result.setDate(result.getDate() + step);
        const day = result.getDay();
        if (day !== 0 && day !== 6) {
            remaining -= step;
        }
    }
    return result;
}
