import { describe, it, expect } from '@jest/globals';
import {
    capitalizeFirstLetter,
    toTitleCase,
    truncateText,
    removeExtraWhitespaces,
    isNullOrWhitespace,
    generateRandomString,
    maskSensitiveData,
    sanitizeFilename,
    removeSpecialChar,
} from './index.js';

// ---------------------------------------------------------------------------
// capitalizeFirstLetter
// ---------------------------------------------------------------------------

describe('capitalizeFirstLetter', () => {
    it('capitalizes only the first character, leaving the rest unchanged', () => {
        expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
    });

    it('does not change an already-capitalized string', () => {
        expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('handles a single character', () => {
        expect(capitalizeFirstLetter('a')).toBe('A');
    });

    it('returns empty string for an empty string input', () => {
        expect(capitalizeFirstLetter('')).toBe('');
    });

    it('returns empty string for null', () => {
        expect(capitalizeFirstLetter(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(capitalizeFirstLetter(undefined)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// toTitleCase
// ---------------------------------------------------------------------------

describe('toTitleCase', () => {
    it('capitalizes the first letter of each word', () => {
        expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('collapses extra internal whitespace before casing', () => {
        expect(toTitleCase('  foo   bar  ')).toBe('Foo Bar');
    });

    it('handles a single word', () => {
        expect(toTitleCase('javascript')).toBe('Javascript');
    });

    it('handles an already title-cased string', () => {
        expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('returns empty string for an empty string input', () => {
        expect(toTitleCase('')).toBe('');
    });

    it('returns empty string for null', () => {
        expect(toTitleCase(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(toTitleCase(undefined)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// truncateText
// ---------------------------------------------------------------------------

describe('truncateText', () => {
    it('truncates at the last word boundary and appends ellipsis', () => {
        expect(truncateText('Hello World', 7)).toBe('Hello...');
    });

    it('does not append ellipsis when the string fits within maxLength', () => {
        expect(truncateText('Hi', 10)).toBe('Hi');
    });

    it('returns the string unchanged when length equals maxLength exactly', () => {
        expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('cuts at maxLength when no word boundary exists in the slice', () => {
        expect(truncateText('HelloWorld', 5)).toBe('Hello...');
    });

    it('returns only the ellipsis when maxLength is 0 and input is non-empty', () => {
        expect(truncateText('Hi', 0)).toBe('...');
    });

    it('returns empty string for null', () => {
        expect(truncateText(null, 10)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(truncateText(undefined, 10)).toBe('');
    });

    it('throws RangeError for a negative maxLength', () => {
        expect(() => truncateText('hello', -1)).toThrow(RangeError);
    });

    it('throws RangeError for Infinity', () => {
        expect(() => truncateText('hello', Infinity)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// removeExtraWhitespaces
// ---------------------------------------------------------------------------

describe('removeExtraWhitespaces', () => {
    it('collapses internal runs of spaces to a single space', () => {
        expect(removeExtraWhitespaces('hello   world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
        expect(removeExtraWhitespaces('  hello  ')).toBe('hello');
    });

    it('handles a string that is already normalised', () => {
        expect(removeExtraWhitespaces('hello world')).toBe('hello world');
    });

    it('returns empty string for a whitespace-only string', () => {
        expect(removeExtraWhitespaces('   ')).toBe('');
    });

    it('returns empty string for an empty string input', () => {
        expect(removeExtraWhitespaces('')).toBe('');
    });

    it('returns empty string for null', () => {
        expect(removeExtraWhitespaces(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(removeExtraWhitespaces(undefined)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// isNullOrWhitespace
// ---------------------------------------------------------------------------

describe('isNullOrWhitespace', () => {
    it('returns true for a whitespace-only string', () => {
        expect(isNullOrWhitespace('   ')).toBe(true);
    });

    it('returns true for an empty string', () => {
        expect(isNullOrWhitespace('')).toBe(true);
    });

    it('returns false for a string with visible content', () => {
        expect(isNullOrWhitespace('hello')).toBe(false);
    });

    it('returns false for a string that starts with whitespace but has content', () => {
        expect(isNullOrWhitespace('  hi  ')).toBe(false);
    });

    it('returns true for null', () => {
        expect(isNullOrWhitespace(null)).toBe(true);
    });

    it('returns true for undefined', () => {
        expect(isNullOrWhitespace(undefined)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// generateRandomString
// ---------------------------------------------------------------------------

describe('generateRandomString', () => {
    it('returns a string of the exact requested length', () => {
        expect(generateRandomString(12)).toHaveLength(12);
    });

    it('returns an empty string when length is 0', () => {
        expect(generateRandomString(0)).toBe('');
    });

    it('returns a single character when length is 1', () => {
        expect(generateRandomString(1)).toHaveLength(1);
    });

    it('only uses characters from the provided charset', () => {
        const result = generateRandomString(50, 'abc');
        expect(result).toMatch(/^[abc]*$/);
    });

    it('only uses alphanumeric characters with the default charset', () => {
        const result = generateRandomString(100);
        expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('throws RangeError for a negative length', () => {
        expect(() => generateRandomString(-1)).toThrow(RangeError);
    });

    it('throws RangeError for Infinity', () => {
        expect(() => generateRandomString(Infinity)).toThrow(RangeError);
    });

    it('throws RangeError for an empty chars string', () => {
        expect(() => generateRandomString(5, '')).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// maskSensitiveData
// ---------------------------------------------------------------------------

describe('maskSensitiveData', () => {
    it('masks all but the last 4 characters by default', () => {
        expect(maskSensitiveData('4111111111111234')).toBe('************1234');
    });

    it('masks all but the last N characters when visibleChars is provided', () => {
        expect(maskSensitiveData('4111111111111234', 6)).toBe('**********111234');
    });

    it('returns the full string when its length equals visibleChars', () => {
        expect(maskSensitiveData('1234', 4)).toBe('1234');
    });

    it('returns the full string when its length is less than visibleChars', () => {
        expect(maskSensitiveData('12', 4)).toBe('12');
    });

    it('masks all characters when visibleChars is 0', () => {
        expect(maskSensitiveData('abcd', 0)).toBe('****');
    });

    it('returns empty string for null', () => {
        expect(maskSensitiveData(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(maskSensitiveData(undefined)).toBe('');
    });

    it('throws RangeError for a negative visibleChars', () => {
        expect(() => maskSensitiveData('abc', -1)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// sanitizeFilename
// ---------------------------------------------------------------------------

describe('sanitizeFilename', () => {
    it('strips characters invalid on Windows and Linux', () => {
        expect(sanitizeFilename('my:file?.txt')).toBe('myfile.txt');
    });

    it('strips all reserved characters in one pass', () => {
        expect(sanitizeFilename('a\\b/c:d*e?f"g<h>i|j')).toBe('abcdefghij');
    });

    it('removes trailing dots (Windows restriction)', () => {
        expect(sanitizeFilename('report.')).toBe('report');
    });

    it('removes trailing spaces (Windows restriction)', () => {
        expect(sanitizeFilename('report   ')).toBe('report');
    });

    it('leaves a valid filename unchanged', () => {
        expect(sanitizeFilename('my-file_v2.0.txt')).toBe('my-file_v2.0.txt');
    });

    it('returns empty string for null', () => {
        expect(sanitizeFilename(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(sanitizeFilename(undefined)).toBe('');
    });

    it('returns empty string when every character is invalid', () => {
        expect(sanitizeFilename('\\/:*?"<>|')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// removeSpecialChar
// ---------------------------------------------------------------------------

describe('removeSpecialChar', () => {
    it('removes punctuation and symbols, preserving letters, digits, and spaces', () => {
        expect(removeSpecialChar('Hello, World! 123')).toBe('Hello World 123');
    });

    it('returns the string unchanged when no special characters are present', () => {
        expect(removeSpecialChar('Hello123')).toBe('Hello123');
    });

    it('returns empty string when every character is special', () => {
        expect(removeSpecialChar('!@#$%^&*()')).toBe('');
    });

    it('handles a single special character', () => {
        expect(removeSpecialChar('!')).toBe('');
    });

    it('preserves a single alphanumeric character', () => {
        expect(removeSpecialChar('a')).toBe('a');
    });

    it('returns empty string for null', () => {
        expect(removeSpecialChar(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(removeSpecialChar(undefined)).toBe('');
    });
});
