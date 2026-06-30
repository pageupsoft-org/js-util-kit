import { _parseDate } from './_helpers.js';

/**
 * Calculates a person's age in full years as of today's local date.
 *
 * Note: reads `new Date()` internally and is therefore not a pure function.
 * In tests, use `jest.useFakeTimers()` / `jest.setSystemTime()` to control today's date.
 *
 * @param birthDate - The date of birth. Accepts a `Date` object, an ISO date string,
 *   `null`, or `undefined`.
 * @returns Age in full years, or `null` for any null, undefined, invalid date, or
 *   a birth date in the future.
 *
 * @example
 * // Today is 2026-06-30; born on 1996-06-30
 * calculateAge(new Date(1996, 5, 30)); // => 30
 *
 * @example
 * calculateAge(null); // => null
 */
export function calculateAge(birthDate: Date | string | null | undefined): number | null {
    const birth = _parseDate(birthDate);
    if (birth === null) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age < 0 ? null : age;
}
