import { _parseDate } from './_helpers.js';

/**
 * Converts a local `Date` to a new `Date` whose UTC time values reflect the equivalent
 * UTC wall-clock time. Inverse of `convertUtcToLocal`.
 *
 * Shifts the timestamp backwards by the runtime's UTC offset. The result depends on
 * the runtime timezone.
 *
 * @param date - The local date to convert. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns A shifted `Date`, or `null` for any null, undefined, or invalid input.
 *
 * @example
 * // In UTC+2: local 10:00 → 08:00 UTC
 * const utc = convertLocalToUtc(new Date(2026, 5, 30, 10, 0, 0));
 * utc?.toISOString(); // => '2026-06-30T08:00:00.000Z'  (UTC+2 runtime)
 */
export function convertLocalToUtc(date: Date | string | null | undefined): Date | null {
    const d = _parseDate(date);
    if (d === null) return null;
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}
