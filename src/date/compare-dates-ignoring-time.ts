import { _parseDate } from './_helpers.js';

/**
 * Compares two dates ignoring their time components, using local calendar dates.
 *
 * @param a - First date. Accepts a `Date` object, an ISO date string, `null`, or `undefined`.
 * @param b - Second date. Accepts a `Date` object, an ISO date string, `null`, or `undefined`.
 * @returns `-1` if `a` is before `b`, `0` if equal, `1` if after,
 *   or `null` for any null, undefined, or invalid input.
 *
 * @example
 * compareDatesIgnoringTime(new Date(2026, 5, 29), new Date(2026, 5, 30)); // => -1
 *
 * @example
 * // Same calendar date, different times
 * compareDatesIgnoringTime(new Date(2026, 5, 30, 0, 0), new Date(2026, 5, 30, 23, 59)); // => 0
 */
export function compareDatesIgnoringTime(
    a: Date | string | null | undefined,
    b: Date | string | null | undefined
): number | null {
    const da = _parseDate(a);
    const db = _parseDate(b);
    if (da === null || db === null) return null;
    const aTs = new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime();
    const bTs = new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime();
    if (aTs < bTs) return -1;
    if (aTs > bTs) return 1;
    return 0;
}
