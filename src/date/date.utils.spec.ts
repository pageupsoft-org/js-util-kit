import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
    formatDate,
    formatDateTime,
    parseDate,
    compareDatesIgnoringTime,
    isWeekend,
    addBusinessDays,
    getStartOfDay,
    getEndOfDay,
    convertUtcToLocal,
    convertLocalToUtc,
    calculateAge,
} from './index.js';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
    it('formats a Date object as YYYY-MM-DD', () => {
        expect(formatDate(new Date(2026, 5, 30))).toBe('2026-06-30');
    });

    it('zero-pads single-digit months and days', () => {
        expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('handles a leap-year date (Feb 29)', () => {
        expect(formatDate(new Date(2000, 1, 29))).toBe('2000-02-29');
    });

    it('returns empty string for null', () => {
        expect(formatDate(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatDate(undefined)).toBe('');
    });

    it('returns empty string for an invalid date string', () => {
        expect(formatDate('not-a-date')).toBe('');
    });

    it('accepts a custom format (DD/MM/YYYY)', () => {
        expect(formatDate(new Date(2026, 5, 30), 'DD/MM/YYYY')).toBe('30/06/2026');
    });

    it('accepts a custom format with separators (MM-DD-YYYY)', () => {
        expect(formatDate(new Date(2026, 0, 5), 'MM-DD-YYYY')).toBe('01-05-2026');
    });

    it('returns empty string for null even with a custom format', () => {
        expect(formatDate(null, 'DD/MM/YYYY')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
    it('formats a Date object as YYYY-MM-DD HH:mm:ss', () => {
        expect(formatDateTime(new Date(2026, 5, 30, 14, 30, 0))).toBe('2026-06-30 14:30:00');
    });

    it('formats exact midnight as 00:00:00', () => {
        expect(formatDateTime(new Date(2026, 5, 30, 0, 0, 0))).toBe('2026-06-30 00:00:00');
    });

    it('formats the last second of the year', () => {
        expect(formatDateTime(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31 23:59:59');
    });

    it('returns empty string for null', () => {
        expect(formatDateTime(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatDateTime(undefined)).toBe('');
    });

    it('returns empty string for an invalid date string', () => {
        expect(formatDateTime('not-a-date')).toBe('');
    });

    it('accepts a custom format omitting seconds (DD/MM/YYYY HH:mm)', () => {
        expect(formatDateTime(new Date(2026, 5, 30, 14, 30, 0), 'DD/MM/YYYY HH:mm')).toBe('30/06/2026 14:30');
    });

    it('accepts a time-only format (HH:mm:ss)', () => {
        expect(formatDateTime(new Date(2026, 5, 30, 9, 5, 3), 'HH:mm:ss')).toBe('09:05:03');
    });

    it('returns empty string for null even with a custom format', () => {
        expect(formatDateTime(null, 'HH:mm:ss')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------

describe('parseDate', () => {
    it('parses DD/MM/YYYY format', () => {
        const result = parseDate('30/07/2026', 'DD/MM/YYYY');
        expect(result).toBeInstanceOf(Date);
        expect(formatDate(result!)).toBe('2026-07-30');
    });

    it('parses MM/DD/YYYY format', () => {
        const result = parseDate('07/30/2026', 'MM/DD/YYYY');
        expect(result).toBeInstanceOf(Date);
        expect(formatDate(result!)).toBe('2026-07-30');
    });

    it('parses YYYY-MM-DD format', () => {
        const result = parseDate('2026-07-30', 'YYYY-MM-DD');
        expect(result).toBeInstanceOf(Date);
        expect(formatDate(result!)).toBe('2026-07-30');
    });

    it('parses date with time (YYYY-MM-DD HH:mm)', () => {
        const result = parseDate('2026-07-30 14:05', 'YYYY-MM-DD HH:mm');
        expect(result).toBeInstanceOf(Date);
        expect(formatDateTime(result!)).toBe('2026-07-30 14:05:00');
    });

    it('parses 12-hour format with AM/PM', () => {
        const result = parseDate('30/07/2026 02:05 PM', 'DD/MM/YYYY hh:mm A');
        expect(result).toBeInstanceOf(Date);
        expect(formatDateTime(result!)).toBe('2026-07-30 14:05:00');
    });

    it('parses lowercase am/pm', () => {
        const result = parseDate('30/07/2026 02:05 pm', 'DD/MM/YYYY hh:mm a');
        expect(result).toBeInstanceOf(Date);
        expect(formatDateTime(result!)).toBe('2026-07-30 14:05:00');
    });

    it('returns undefined for invalid date string', () => {
        expect(parseDate('invalid', 'YYYY-MM-DD')).toBeUndefined();
    });

    it('returns undefined for pattern mismatch', () => {
        expect(parseDate('30-07-2026', 'YYYY-MM-DD')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
        expect(parseDate('', 'YYYY-MM-DD')).toBeUndefined();
    });

    it('returns undefined for non-string input', () => {
        expect(parseDate(null as any, 'YYYY-MM-DD')).toBeUndefined();
        expect(parseDate(undefined as any, 'YYYY-MM-DD')).toBeUndefined();
    });

    it('handles single-digit month/day without padding (M, D)', () => {
        const result = parseDate('7/5/2026', 'M/D/YYYY');
        expect(result).toBeInstanceOf(Date);
        expect(formatDate(result!)).toBe('2026-07-05');
    });

    it('handles 2-digit year (YY)', () => {
        const result = parseDate('30/07/26', 'DD/MM/YY');
        expect(result).toBeInstanceOf(Date);
        expect(formatDate(result!)).toBe('2026-07-30');
    });

    it('handles single-digit hour (H, h)', () => {
        const result = parseDate('2026-07-30 9:5', 'YYYY-MM-DD H:m');
        expect(result).toBeInstanceOf(Date);
        expect(formatDateTime(result!)).toBe('2026-07-30 09:05:00');
    });
});

// ---------------------------------------------------------------------------
// compareDatesIgnoringTime
// ---------------------------------------------------------------------------

describe('compareDatesIgnoringTime', () => {
    it('returns -1 when a is before b', () => {
        expect(compareDatesIgnoringTime(new Date(2026, 5, 29), new Date(2026, 5, 30))).toBe(-1);
    });

    it('returns 1 when a is after b', () => {
        expect(compareDatesIgnoringTime(new Date(2026, 5, 30), new Date(2026, 5, 29))).toBe(1);
    });

    it('returns 0 for the same calendar date with different times', () => {
        expect(
            compareDatesIgnoringTime(
                new Date(2026, 5, 30, 0, 0, 0),
                new Date(2026, 5, 30, 23, 59, 59)
            )
        ).toBe(0);
    });

    it('handles a month/year boundary (Dec 31 vs Jan 1)', () => {
        expect(
            compareDatesIgnoringTime(new Date(2025, 11, 31), new Date(2026, 0, 1))
        ).toBe(-1);
    });

    it('returns null when a is null', () => {
        expect(compareDatesIgnoringTime(null, new Date(2026, 5, 30))).toBeNull();
    });

    it('returns null when b is undefined', () => {
        expect(compareDatesIgnoringTime(new Date(2026, 5, 30), undefined)).toBeNull();
    });

    it('returns null when a is an invalid date string', () => {
        expect(compareDatesIgnoringTime('bad-date', new Date(2026, 5, 30))).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// isWeekend
// ---------------------------------------------------------------------------

describe('isWeekend', () => {
    // June 27, 2026 = Saturday; June 28 = Sunday; June 29 = Monday
    it('returns true for Saturday', () => {
        expect(isWeekend(new Date(2026, 5, 27))).toBe(true);
    });

    it('returns true for Sunday', () => {
        expect(isWeekend(new Date(2026, 5, 28))).toBe(true);
    });

    it('returns false for a weekday (Monday)', () => {
        expect(isWeekend(new Date(2026, 5, 29))).toBe(false);
    });

    it('returns true for Saturday at exact midnight', () => {
        expect(isWeekend(new Date(2026, 5, 27, 0, 0, 0, 0))).toBe(true);
    });

    it('returns false for null', () => {
        expect(isWeekend(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isWeekend(undefined)).toBe(false);
    });

    it('returns false for an invalid date string', () => {
        expect(isWeekend('not-a-date')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// addBusinessDays
// ---------------------------------------------------------------------------

describe('addBusinessDays', () => {
    // June 26, 2026 = Friday; June 29 = Monday
    it('adds 1 business day from Friday, landing on Monday', () => {
        const result = addBusinessDays(new Date(2026, 5, 26), 1);
        expect(formatDate(result)).toBe('2026-06-29');
    });

    it('adds multiple business days spanning a weekend', () => {
        // Monday June 29 + 3 = Thursday July 2
        expect(formatDate(addBusinessDays(new Date(2026, 5, 29), 3))).toBe('2026-07-02');
    });

    it('returns a copy of the same date when days is 0', () => {
        const date = new Date(2026, 5, 30);
        const result = addBusinessDays(date, 0);
        expect(formatDate(result)).toBe('2026-06-30');
        expect(result).not.toBe(date);
    });

    it('subtracts business days (negative days) skipping weekends', () => {
        // Monday June 29 - 1 = Friday June 26
        expect(formatDate(addBusinessDays(new Date(2026, 5, 29), -1))).toBe('2026-06-26');
    });

    it('returns null for a null date', () => {
        expect(addBusinessDays(null, 3)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(addBusinessDays('not-a-date', 3)).toBeNull();
    });

    it('throws RangeError for Infinity', () => {
        expect(() => addBusinessDays(new Date(2026, 5, 30), Infinity)).toThrow(RangeError);
    });

    it('throws RangeError for NaN', () => {
        expect(() => addBusinessDays(new Date(2026, 5, 30), NaN)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// getStartOfDay
// ---------------------------------------------------------------------------

describe('getStartOfDay', () => {
    it('returns a new Date at 00:00:00.000 on the same local calendar date', () => {
        const result = getStartOfDay(new Date(2026, 5, 30, 14, 30, 45, 500));
        expect(result).not.toBeNull();
        expect(result!.getHours()).toBe(0);
        expect(result!.getMinutes()).toBe(0);
        expect(result!.getSeconds()).toBe(0);
        expect(result!.getMilliseconds()).toBe(0);
        expect(formatDate(result)).toBe('2026-06-30');
    });

    it('handles the last day of the year', () => {
        const result = getStartOfDay(new Date(2026, 11, 31, 23, 59, 59));
        expect(formatDate(result)).toBe('2026-12-31');
        expect(result!.getHours()).toBe(0);
    });

    it('returns the same midnight when the input is already midnight', () => {
        const midnight = new Date(2026, 5, 30, 0, 0, 0, 0);
        expect(getStartOfDay(midnight)!.getTime()).toBe(midnight.getTime());
    });

    it('returns null for null', () => {
        expect(getStartOfDay(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(getStartOfDay(undefined)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(getStartOfDay('not-a-date')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// getEndOfDay
// ---------------------------------------------------------------------------

describe('getEndOfDay', () => {
    it('returns a new Date at 23:59:59.999 on the same local calendar date', () => {
        const result = getEndOfDay(new Date(2026, 5, 30, 8, 0, 0));
        expect(result).not.toBeNull();
        expect(result!.getHours()).toBe(23);
        expect(result!.getMinutes()).toBe(59);
        expect(result!.getSeconds()).toBe(59);
        expect(result!.getMilliseconds()).toBe(999);
        expect(formatDate(result)).toBe('2026-06-30');
    });

    it('handles the last day of the year', () => {
        const result = getEndOfDay(new Date(2026, 11, 31));
        expect(formatDate(result)).toBe('2026-12-31');
        expect(result!.getHours()).toBe(23);
        expect(result!.getMilliseconds()).toBe(999);
    });

    it('returns the end of day for a date already at end of day', () => {
        const eod = new Date(2026, 5, 30, 23, 59, 59, 999);
        expect(getEndOfDay(eod)!.getTime()).toBe(eod.getTime());
    });

    it('returns null for null', () => {
        expect(getEndOfDay(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(getEndOfDay(undefined)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(getEndOfDay('not-a-date')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// convertUtcToLocal
// ---------------------------------------------------------------------------

describe('convertUtcToLocal', () => {
    it('returns a Date instance for a valid UTC date', () => {
        const result = convertUtcToLocal(new Date('2026-06-30T12:00:00Z'));
        expect(result).toBeInstanceOf(Date);
    });

    it('shifts the timestamp by the negative timezone offset', () => {
        const utc = new Date('2026-06-30T12:00:00Z');
        const result = convertUtcToLocal(utc)!;
        expect(result.getTime()).toBe(utc.getTime() - utc.getTimezoneOffset() * 60000);
    });

    it('is the inverse of convertLocalToUtc (round-trip)', () => {
        const original = new Date('2026-06-30T12:00:00Z');
        const local = convertUtcToLocal(original)!;
        const backToUtc = convertLocalToUtc(local)!;
        expect(backToUtc.getTime()).toBe(original.getTime());
    });

    it('returns null for null', () => {
        expect(convertUtcToLocal(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(convertUtcToLocal(undefined)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(convertUtcToLocal('not-a-date')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// convertLocalToUtc
// ---------------------------------------------------------------------------

describe('convertLocalToUtc', () => {
    it('returns a Date instance for a valid local date', () => {
        const result = convertLocalToUtc(new Date(2026, 5, 30, 14, 0, 0));
        expect(result).toBeInstanceOf(Date);
    });

    it('shifts the timestamp by the positive timezone offset', () => {
        const local = new Date(2026, 5, 30, 14, 0, 0);
        const result = convertLocalToUtc(local)!;
        expect(result.getTime()).toBe(local.getTime() + local.getTimezoneOffset() * 60000);
    });

    it('is the inverse of convertUtcToLocal (round-trip)', () => {
        const original = new Date(2026, 5, 30, 14, 0, 0);
        const utc = convertLocalToUtc(original)!;
        const backToLocal = convertUtcToLocal(utc)!;
        expect(backToLocal.getTime()).toBe(original.getTime());
    });

    it('returns null for null', () => {
        expect(convertLocalToUtc(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(convertLocalToUtc(undefined)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(convertLocalToUtc('not-a-date')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// calculateAge
// ---------------------------------------------------------------------------

describe('calculateAge', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Fix today to 2026-06-30
        jest.setSystemTime(new Date(2026, 5, 30));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns the correct full years when the birthday has already occurred this year', () => {
        // Born June 30, 1996 → exactly 30 years old on June 30, 2026
        expect(calculateAge(new Date(1996, 5, 30))).toBe(30);
    });

    it('returns one year less when the birthday has not occurred yet this year', () => {
        // Born July 1, 1996 → 29 years old on June 30, 2026
        expect(calculateAge(new Date(1996, 6, 1))).toBe(29);
    });

    it('handles a Feb 29 leap-year birthday (birthday already passed this non-leap year)', () => {
        // Born Feb 29, 2000 → 26 full years as of June 30, 2026
        expect(calculateAge(new Date(2000, 1, 29))).toBe(26);
    });

    it('returns 0 for someone born today', () => {
        expect(calculateAge(new Date(2026, 5, 30))).toBe(0);
    });

    it('returns null for a future birth date', () => {
        expect(calculateAge(new Date(2027, 0, 1))).toBeNull();
    });

    it('returns null for null', () => {
        expect(calculateAge(null)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(calculateAge(undefined)).toBeNull();
    });

    it('returns null for an invalid date string', () => {
        expect(calculateAge('not-a-date')).toBeNull();
    });
});
