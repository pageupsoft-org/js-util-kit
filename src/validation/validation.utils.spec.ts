import { describe, expect, it } from '@jest/globals';
import {
    isValidEmail,
    isValidPhoneNumber,
    isValidUrl,
    isStrongPassword,
    validateFileExtension,
    validateFileSize,
} from './index.js';

describe('isValidEmail', () => {
    it('returns true for a standard valid email', () => {
        expect(isValidEmail('john.doe@example.com')).toBe(true);
    });

    it('accepts an uncommon but valid local-part format', () => {
        expect(isValidEmail('user+tag.name@example.co.uk')).toBe(true);
    });

    it('returns false for malformed input', () => {
        expect(isValidEmail('invalid@@example..com')).toBe(false);
    });
});

describe('isValidPhoneNumber', () => {
    it('returns true for a generic international number', () => {
        expect(isValidPhoneNumber('+1 415-555-2671')).toBe(true);
    });

    it('accepts the E.164 upper boundary of 15 digits', () => {
        expect(isValidPhoneNumber('+123456789012345', 'e164')).toBe(true);
    });

    it('returns false for null input', () => {
        expect(isValidPhoneNumber(null)).toBe(false);
    });
});

describe('isValidUrl', () => {
    it('returns true for a valid HTTPS URL', () => {
        expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
    });

    it('accepts a valid URL with an IPv6 host', () => {
        expect(isValidUrl('https://[2001:db8::1]/resource')).toBe(true);
    });

    it('returns false for malformed input', () => {
        expect(isValidUrl('not a url')).toBe(false);
    });
});

describe('isStrongPassword', () => {
    it('returns true for a password meeting default rules', () => {
        expect(isStrongPassword('SecurePass1!')).toBe(true);
    });

    it('accepts a password that matches the exact minimum length boundary', () => {
        expect(isStrongPassword('Ab1!xyz8', { minLength: 8 })).toBe(true);
    });

    it('returns false for undefined input', () => {
        expect(isStrongPassword(undefined)).toBe(false);
    });
});

describe('validateFileExtension', () => {
    it('returns true for an allowed extension', () => {
        expect(validateFileExtension('document.pdf', ['pdf', 'docx'])).toBe(true);
    });

    it('matches allowed extensions case-insensitively', () => {
        expect(validateFileExtension('PHOTO.JPEG', ['.jpg', '.jpeg'])).toBe(true);
    });

    it('returns false for null input', () => {
        expect(validateFileExtension(null, ['pdf'])).toBe(false);
    });
});

describe('validateFileSize', () => {
    it('returns true when file size is within the limit', () => {
        const file = new Blob(['hello']);
        expect(validateFileSize(file, 10)).toBe(true);
    });

    it('returns true when file size equals the maximum boundary', () => {
        const file = new Blob(['12345']);
        expect(validateFileSize(file, 5)).toBe(true);
    });

    it('returns false for null input', () => {
        expect(validateFileSize(null, 100)).toBe(false);
    });
});