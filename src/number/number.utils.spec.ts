import { describe, it, expect } from '@jest/globals';
import {
    formatCurrency,
    formatPercentage,
    roundToDecimalPlaces,
    clamp,
    isNumeric,
    calculatePercentage,
    randomNumber,
} from './index.js';

// ---------------------------------------------------------------------------
// formatCurrency
// Tests pass an explicit 'en-US' locale so output is deterministic.
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
    it('formats a positive value with USD', () => {
        expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
    });

    it('formats zero', () => {
        expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
    });

    it('formats a negative value', () => {
        expect(formatCurrency(-42.5, 'USD', 'en-US')).toBe('-$42.50');
    });

    it('formats a whole number (no fractional part)', () => {
        expect(formatCurrency(100, 'USD', 'en-US')).toBe('$100.00');
    });

    it('returns empty string for null', () => {
        expect(formatCurrency(null, 'USD')).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatCurrency(undefined, 'USD')).toBe('');
    });

    it('returns empty string for NaN', () => {
        expect(formatCurrency(NaN, 'USD')).toBe('');
    });

    it('returns empty string for Infinity', () => {
        expect(formatCurrency(Infinity, 'USD')).toBe('');
    });

    it('returns empty string for an invalid currency code', () => {
        expect(formatCurrency(100, 'NOTACURRENCY')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// formatPercentage
// ---------------------------------------------------------------------------

describe('formatPercentage', () => {
    it('formats a value with two decimal places by default', () => {
        expect(formatPercentage(25.5, 2, 'en-US')).toBe('25.50%');
    });

    it('formats zero', () => {
        expect(formatPercentage(0, 2, 'en-US')).toBe('0.00%');
    });

    it('formats 100 percent', () => {
        expect(formatPercentage(100, 2, 'en-US')).toBe('100.00%');
    });

    it('formats with zero decimal places', () => {
        expect(formatPercentage(33.7, 0, 'en-US')).toBe('34%');
    });

    it('formats a negative percentage', () => {
        expect(formatPercentage(-10, 2, 'en-US')).toBe('-10.00%');
    });

    it('returns empty string for null', () => {
        expect(formatPercentage(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatPercentage(undefined)).toBe('');
    });

    it('returns empty string for NaN', () => {
        expect(formatPercentage(NaN)).toBe('');
    });

    it('throws RangeError for negative decimalPlaces', () => {
        expect(() => formatPercentage(25, -1)).toThrow(RangeError);
    });

    it('throws RangeError for Infinity as decimalPlaces', () => {
        expect(() => formatPercentage(25, Infinity)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// roundToDecimalPlaces
// ---------------------------------------------------------------------------

describe('roundToDecimalPlaces', () => {
    it('rounds to the given number of decimal places', () => {
        expect(roundToDecimalPlaces(3.14159, 2)).toBe(3.14);
    });

    it('rounds up when the next digit is 5 or more', () => {
        expect(roundToDecimalPlaces(3.145, 2)).toBe(3.15);
    });

    it('rounds to zero decimal places (integer)', () => {
        expect(roundToDecimalPlaces(3.7, 0)).toBe(4);
    });

    it('handles a negative value', () => {
        expect(roundToDecimalPlaces(-1.567, 1)).toBe(-1.6);
    });

    it('returns zero unchanged', () => {
        expect(roundToDecimalPlaces(0, 3)).toBe(0);
    });

    it('returns null for null', () => {
        expect(roundToDecimalPlaces(null, 2)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(roundToDecimalPlaces(undefined, 2)).toBeNull();
    });

    it('returns null for NaN', () => {
        expect(roundToDecimalPlaces(NaN, 2)).toBeNull();
    });

    it('throws RangeError for negative places', () => {
        expect(() => roundToDecimalPlaces(3.14, -1)).toThrow(RangeError);
    });

    it('throws RangeError for Infinity as places', () => {
        expect(() => roundToDecimalPlaces(3.14, Infinity)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe('clamp', () => {
    it('returns the value when it is within the range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('returns min when value is below the range', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('returns max when value is above the range', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns min when value equals min (boundary)', () => {
        expect(clamp(0, 0, 10)).toBe(0);
    });

    it('returns max when value equals max (boundary)', () => {
        expect(clamp(10, 0, 10)).toBe(10);
    });

    it('swaps min and max when min is greater than max', () => {
        expect(clamp(5, 10, 0)).toBe(5);
        expect(clamp(-1, 10, 0)).toBe(0);
        expect(clamp(11, 10, 0)).toBe(10);
    });

    it('handles negative ranges', () => {
        expect(clamp(-3, -10, -1)).toBe(-3);
        expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('returns null for null', () => {
        expect(clamp(null, 0, 10)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(clamp(undefined, 0, 10)).toBeNull();
    });

    it('returns null for NaN', () => {
        expect(clamp(NaN, 0, 10)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// isNumeric
// ---------------------------------------------------------------------------

describe('isNumeric', () => {
    it('returns true for a positive integer', () => {
        expect(isNumeric(42)).toBe(true);
    });

    it('returns true for a float', () => {
        expect(isNumeric(3.14)).toBe(true);
    });

    it('returns true for zero', () => {
        expect(isNumeric(0)).toBe(true);
    });

    it('returns true for a negative number', () => {
        expect(isNumeric(-5.5)).toBe(true);
    });

    it('returns false for NaN', () => {
        expect(isNumeric(NaN)).toBe(false);
    });

    it('returns false for Infinity', () => {
        expect(isNumeric(Infinity)).toBe(false);
    });

    it('returns false for -Infinity', () => {
        expect(isNumeric(-Infinity)).toBe(false);
    });

    it('returns false for null', () => {
        expect(isNumeric(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isNumeric(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// calculatePercentage
// ---------------------------------------------------------------------------

describe('calculatePercentage', () => {
    it('calculates the correct percentage', () => {
        expect(calculatePercentage(25, 100)).toBe(25);
    });

    it('returns 25 for one-quarter', () => {
        expect(calculatePercentage(1, 4)).toBe(25);
    });

    it('returns a fractional percentage for non-even division', () => {
        const result = calculatePercentage(1, 3);
        expect(result).not.toBeNull();
        expect(result!).toBeCloseTo(33.333, 3);
    });

    it('returns 0 when part is 0', () => {
        expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('returns 0 when total is 0 (division-by-zero guard)', () => {
        expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('handles a negative part (e.g. a loss)', () => {
        expect(calculatePercentage(-10, 100)).toBe(-10);
    });

    it('returns 100 when part equals total', () => {
        expect(calculatePercentage(7, 7)).toBe(100);
    });

    it('returns null for null part', () => {
        expect(calculatePercentage(null, 100)).toBeNull();
    });

    it('returns null for undefined part', () => {
        expect(calculatePercentage(undefined, 100)).toBeNull();
    });

    it('returns null for NaN total', () => {
        expect(calculatePercentage(25, NaN)).toBeNull();
    });

    it('returns null for Infinity total', () => {
        expect(calculatePercentage(25, Infinity)).toBeNull();
    });
});
// ---------------------------------------------------------------------------
// randomNumber
// ---------------------------------------------------------------------------

describe('randomNumber', () => {
    it('returns a number within the specified range [min, max]', () => {
        const result = randomNumber(1, 10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
        expect(Number.isInteger(result)).toBe(true);
    });

    it('returns min when min equals max (single value range)', () => {
        expect(randomNumber(5, 5)).toBe(5);
    });

    it('returns 0 or 1 for a binary range', () => {
        const result = randomNumber(0, 1);
        expect([0, 1]).toContain(result);
    });

    it('handles negative ranges correctly', () => {
        const result = randomNumber(-10, -5);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(-5);
    });

    it('handles ranges crossing zero', () => {
        const result = randomNumber(-5, 5);
        expect(result).toBeGreaterThanOrEqual(-5);
        expect(result).toBeLessThanOrEqual(5);
    });

    it('handles zero as minimum', () => {
        const result = randomNumber(0, 10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10);
    });

    it('handles zero as maximum', () => {
        const result = randomNumber(-10, 0);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(0);
    });

    it('returns a value when min is larger than max (swapped boundaries)', () => {
        // Implementation doesn't validate order, so this tests actual behavior
        const result = randomNumber(10, 1);
        expect(typeof result).toBe('number');
        expect(Number.isInteger(result)).toBe(true);
    });

    it('generates different values over multiple calls (non-deterministic)', () => {
        const results = new Set<number>();
        for (let i = 0; i < 50; i++) {
            results.add(randomNumber(1, 100));
        }
        // Should generate at least 10 different values out of 50 calls
        expect(results.size).toBeGreaterThan(10);
    });

    it('generates all values in a small range over many iterations', () => {
        const results = new Set<number>();
        for (let i = 0; i < 100; i++) {
            results.add(randomNumber(1, 3));
        }
        // Should hit all values [1, 2, 3] eventually
        expect(results.has(1)).toBe(true);
        expect(results.has(2)).toBe(true);
        expect(results.has(3)).toBe(true);
    });

    it('handles large positive numbers', () => {
        const result = randomNumber(1000000, 9999999);
        expect(result).toBeGreaterThanOrEqual(1000000);
        expect(result).toBeLessThanOrEqual(9999999);
    });

    it('handles large negative numbers', () => {
        const result = randomNumber(-9999999, -1000000);
        expect(result).toBeGreaterThanOrEqual(-9999999);
        expect(result).toBeLessThanOrEqual(-1000000);
    });
});
