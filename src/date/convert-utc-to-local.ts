import { _parseDate } from './_helpers.js';

/**
 * Converts a UTC `Date` to a new `Date` whose UTC time values reflect the equivalent
 * local wall-clock time.
 *
 * Shifts the timestamp forward by the runtime's UTC offset so that `toISOString()`
 * on the result displays the local time. The result depends on the runtime timezone.
 * Use `convertLocalToUtc` to reverse the operation.
 *
 * @param date - The UTC date to convert. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns A shifted `Date`, or `null` for any null, undefined, or invalid input.
 *
 * @example
 * // In UTC+2: 08:00 UTC → local 10:00
 * const local = convertUtcToLocal(new Date('2026-06-30T08:00:00Z'));
 * local?.toISOString(); // => '2026-06-30T10:00:00.000Z'  (UTC+2 runtime)
 */
export function convertUtcToLocal(date: Date | string | null | undefined): Date | null {
    const d = _parseDate(date);
    if (d === null) return null;
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
}
