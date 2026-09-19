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


// ---------------------------------------------------------------------------
// Additional Validation Edge Cases
// ---------------------------------------------------------------------------

describe('isValidEmail - additional edge cases', () => {
    it('handles email with multiple dots in local part', () => {
        expect(isValidEmail('first.middle.last@example.com')).toBe(true);
    });

    it('handles email with plus sign (sub-addressing)', () => {
        expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('handles email with numbers in local part', () => {
        expect(isValidEmail('user123@example.com')).toBe(true);
    });

    it('handles email with numbers in domain', () => {
        expect(isValidEmail('user@example123.com')).toBe(true);
    });

    it('handles email with hyphen in domain', () => {
        expect(isValidEmail('user@my-company.com')).toBe(true);
    });

    it('handles email with subdomain', () => {
        expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('handles email with multiple subdomains', () => {
        expect(isValidEmail('user@mail.server.example.com')).toBe(true);
    });

    it('rejects email without @', () => {
        expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('rejects email with multiple @ symbols', () => {
        expect(isValidEmail('user@@example.com')).toBe(false);
    });

    it('rejects email without domain', () => {
        expect(isValidEmail('user@')).toBe(false);
    });

    it('rejects email without local part', () => {
        expect(isValidEmail('@example.com')).toBe(false);
    });

    it('rejects email with spaces', () => {
        expect(isValidEmail('user @example.com')).toBe(false);
        expect(isValidEmail('user@ example.com')).toBe(false);
    });

    it('accepts email starting with dot (practical regex limitation)', () => {
        // The practical regex allows this even though RFC 5322 forbids it
        expect(isValidEmail('.user@example.com')).toBe(true);
    });

    it('accepts email ending with dot before @ (practical regex limitation)', () => {
        // The practical regex allows this even though RFC 5322 forbids it
        expect(isValidEmail('user.@example.com')).toBe(true);
    });

    it('accepts email with consecutive dots (practical regex limitation)', () => {
        // The practical regex allows this even though RFC 5322 forbids it
        expect(isValidEmail('user..name@example.com')).toBe(true);
    });

    it('rejects email without TLD', () => {
        expect(isValidEmail('user@localhost')).toBe(false);
    });

    it('accepts very long email (no length limit in practical regex)', () => {
        const longLocal = 'a'.repeat(255);
        expect(isValidEmail(`${longLocal}@example.com`)).toBe(true);
    });

    it('handles email with underscore in local part', () => {
        expect(isValidEmail('user_name@example.com')).toBe(true);
    });

    it('rejects email with special characters in domain', () => {
        expect(isValidEmail('user@exam!ple.com')).toBe(false);
    });

    it('handles null input', () => {
        expect(isValidEmail(null)).toBe(false);
    });

    it('handles undefined input', () => {
        expect(isValidEmail(undefined)).toBe(false);
    });

    it('handles empty string', () => {
        expect(isValidEmail('')).toBe(false);
    });

    it('handles whitespace-only string', () => {
        expect(isValidEmail('   ')).toBe(false);
    });
});

describe('isValidPhoneNumber - additional edge cases', () => {
    it('handles international format with country code', () => {
        expect(isValidPhoneNumber('+1 415-555-2671', 'international')).toBe(true);
        expect(isValidPhoneNumber('+44 20 7946 0958', 'international')).toBe(true);
    });

    it('handles E.164 format', () => {
        expect(isValidPhoneNumber('+14155552671', 'e164')).toBe(true);
        expect(isValidPhoneNumber('+442079460958', 'e164')).toBe(true);
    });

    it('handles national format', () => {
        expect(isValidPhoneNumber('(415) 555-2671', 'national')).toBe(true);
        expect(isValidPhoneNumber('415-555-2671', 'national')).toBe(true);
    });

    it('accepts phone without country code in international format (practical regex)', () => {
        // The implementation is more lenient than strict international format
        expect(isValidPhoneNumber('415-555-2671', 'international')).toBe(true);
    });

    it('rejects phone with spaces in E.164 format', () => {
        expect(isValidPhoneNumber('+1 415 555 2671', 'e164')).toBe(false);
    });

    it('rejects phone with hyphens in E.164 format', () => {
        expect(isValidPhoneNumber('+1-415-555-2671', 'e164')).toBe(false);
    });

    it('rejects phone with letters', () => {
        expect(isValidPhoneNumber('+1-415-555-CALL', 'international')).toBe(false);
    });

    it('rejects phone that is too short', () => {
        expect(isValidPhoneNumber('+1 123', 'international')).toBe(false);
    });

    it('rejects phone that is too long', () => {
        const longPhone = '+1' + '5'.repeat(20);
        expect(isValidPhoneNumber(longPhone, 'international')).toBe(false);
    });

    it('accepts phone without + in international format (practical regex)', () => {
        // The implementation is more lenient
        expect(isValidPhoneNumber('1 415 555 2671', 'international')).toBe(true);
    });

    it('rejects phone with + in national format', () => {
        expect(isValidPhoneNumber('+1 (415) 555-2671', 'national')).toBe(false);
    });

    it('handles null input', () => {
        expect(isValidPhoneNumber(null)).toBe(false);
    });

    it('handles undefined input', () => {
        expect(isValidPhoneNumber(undefined)).toBe(false);
    });

    it('handles empty string', () => {
        expect(isValidPhoneNumber('')).toBe(false);
    });

    it('rejects phone with extension (not supported)', () => {
        // Extensions are not part of the validation pattern
        expect(isValidPhoneNumber('+1 415-555-2671 ext 123', 'international')).toBe(false);
    });

    it('defaults to international format when format not specified', () => {
        expect(isValidPhoneNumber('+1 415-555-2671')).toBe(true);
    });
});

describe('isValidUrl - additional edge cases', () => {
    it('handles URL with port number', () => {
        expect(isValidUrl('https://example.com:8080/path')).toBe(true);
    });

    it('handles URL with query parameters', () => {
        expect(isValidUrl('https://example.com/path?key=value&foo=bar')).toBe(true);
    });

    it('handles URL with fragment', () => {
        expect(isValidUrl('https://example.com/path#section')).toBe(true);
    });

    it('handles URL with username and password', () => {
        expect(isValidUrl('https://user:pass@example.com')).toBe(true);
    });

    it('handles URL with IPv4 address', () => {
        expect(isValidUrl('https://192.168.1.1/path')).toBe(true);
    });

    it('handles URL with localhost', () => {
        expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('rejects FTP protocol (only HTTP/HTTPS supported)', () => {
        expect(isValidUrl('ftp://files.example.com')).toBe(false);
    });

    it('rejects URL without protocol', () => {
        expect(isValidUrl('example.com')).toBe(false);
    });

    it('rejects URL with spaces', () => {
        expect(isValidUrl('https://exam ple.com')).toBe(false);
    });

    it('rejects URL with invalid characters', () => {
        expect(isValidUrl('https://exam<>ple.com')).toBe(false);
    });

    it('rejects malformed URL', () => {
        expect(isValidUrl('ht!tp://example.com')).toBe(false);
    });

    it('handles null input', () => {
        expect(isValidUrl(null)).toBe(false);
    });

    it('handles undefined input', () => {
        expect(isValidUrl(undefined)).toBe(false);
    });

    it('handles empty string', () => {
        expect(isValidUrl('')).toBe(false);
    });

    it('handles URL with subdomain', () => {
        expect(isValidUrl('https://api.example.com')).toBe(true);
    });

    it('handles URL with multiple subdomains', () => {
        expect(isValidUrl('https://api.v2.example.com')).toBe(true);
    });

    it('handles URL with hyphen in domain', () => {
        expect(isValidUrl('https://my-example.com')).toBe(true);
    });
});

describe('isStrongPassword - additional edge cases', () => {
    it('rejects password without uppercase', () => {
        expect(isStrongPassword('weakpass1!')).toBe(false);
    });

    it('accepts password without lowercase (only checks uppercase/number/special)', () => {
        // The implementation doesn't require lowercase
        expect(isStrongPassword('WEAKPASS1!')).toBe(true);
    });

    it('rejects password without number', () => {
        expect(isStrongPassword('WeakPass!')).toBe(false);
    });

    it('rejects password without special character', () => {
        expect(isStrongPassword('WeakPass1')).toBe(false);
    });

    it('rejects password that is too short', () => {
        expect(isStrongPassword('Weak1!')).toBe(false);
    });

    it('accepts password with exactly minimum length', () => {
        expect(isStrongPassword('Strong1!')).toBe(true);
    });

    it('accepts very long strong password', () => {
        const long = 'A'.repeat(50) + 'a'.repeat(50) + '1!' ;
        expect(isStrongPassword(long)).toBe(true);
    });

    it('accepts password with multiple special characters', () => {
        expect(isStrongPassword('Strong1!@#$%')).toBe(true);
    });

    it('accepts password with unicode characters', () => {
        expect(isStrongPassword('Strôñg1!')).toBe(true);
    });

    it('handles custom minimum length', () => {
        expect(isStrongPassword('Str1!', { minLength: 5 })).toBe(true);
        expect(isStrongPassword('Str1!', { minLength: 6 })).toBe(false);
    });

    it('handles disabled requirements', () => {
        expect(isStrongPassword('alllowercase', { requireUppercase: false, requireNumber: false, requireSpecialChar: false })).toBe(true);
    });

    it('handles null input', () => {
        expect(isStrongPassword(null)).toBe(false);
    });

    it('handles undefined input', () => {
        expect(isStrongPassword(undefined)).toBe(false);
    });

    it('handles empty string', () => {
        expect(isStrongPassword('')).toBe(false);
    });

    it('handles whitespace-only password', () => {
        expect(isStrongPassword('        ')).toBe(false);
    });

    it('handles password with spaces', () => {
        expect(isStrongPassword('Strong Pass1!')).toBe(true);
    });
});

describe('validateFileExtension - additional edge cases', () => {
    it('handles uppercase extension', () => {
        expect(validateFileExtension('document.PDF', ['pdf'])).toBe(true);
    });

    it('handles mixed case extension', () => {
        expect(validateFileExtension('document.PdF', ['pdf'])).toBe(true);
    });

    it('handles multiple dots in filename', () => {
        expect(validateFileExtension('my.document.pdf', ['pdf'])).toBe(true);
    });

    it('handles filename without extension', () => {
        expect(validateFileExtension('document', ['pdf'])).toBe(false);
    });

    it('handles empty extension', () => {
        expect(validateFileExtension('document.', ['pdf'])).toBe(false);
    });

    it('handles multiple allowed extensions', () => {
        expect(validateFileExtension('document.docx', ['pdf', 'doc', 'docx'])).toBe(true);
    });

    it('rejects extension not in allowed list', () => {
        expect(validateFileExtension('script.exe', ['pdf', 'doc'])).toBe(false);
    });

    it('handles empty allowed extensions array', () => {
        expect(validateFileExtension('document.pdf', [])).toBe(false);
    });

    it('handles null filename', () => {
        expect(validateFileExtension(null, ['pdf'])).toBe(false);
    });

    it('handles undefined filename', () => {
        expect(validateFileExtension(undefined, ['pdf'])).toBe(false);
    });

    it('handles empty string filename', () => {
        expect(validateFileExtension('', ['pdf'])).toBe(false);
    });

    it('handles null allowed extensions', () => {
        expect(validateFileExtension('document.pdf', null)).toBe(false);
    });

    it('handles filename with path', () => {
        expect(validateFileExtension('/path/to/document.pdf', ['pdf'])).toBe(true);
    });

    it('handles Windows path', () => {
        expect(validateFileExtension('C:\\Users\\doc.pdf', ['pdf'])).toBe(true);
    });
});

describe('validateFileSize - additional edge cases', () => {
    it('handles file exactly at limit', () => {
        const file = new Blob(['x'.repeat(1024 * 1024)]); // 1 MB in bytes
        expect(validateFileSize(file, 1024 * 1024)).toBe(true); // maxSizeInBytes not MB
    });

    it('rejects file one byte over limit', () => {
        const file = new Blob(['x'.repeat(1024 * 1024 + 1)]); // 1 MB + 1 byte
        expect(validateFileSize(file, 1024 * 1024)).toBe(false);
    });

    it('handles zero-byte file', () => {
        const file = new Blob([]);
        expect(validateFileSize(file, 1024)).toBe(true);
    });

    it('handles very small limit', () => {
        const file = new Blob(['hello']); // 5 bytes
        expect(validateFileSize(file, 1024)).toBe(true); // 1024 bytes
    });

    it('handles very large limit', () => {
        const file = new Blob(['test']);
        expect(validateFileSize(file, 1000000)).toBe(true);
    });

    it('handles null file', () => {
        expect(validateFileSize(null, 1024)).toBe(false);
    });

    it('handles undefined file', () => {
        expect(validateFileSize(undefined, 1024)).toBe(false);
    });

    it('handles zero limit', () => {
        const file = new Blob(['test']);
        expect(validateFileSize(file, 0)).toBe(false); // 4 bytes > 0
    });

    it('handles negative limit', () => {
        const file = new Blob(['test']);
        expect(validateFileSize(file, -1)).toBe(false);
    });

    it('handles File object (not just Blob)', () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' }); // 12 bytes
        expect(validateFileSize(file, 1024)).toBe(true);
    });
});
