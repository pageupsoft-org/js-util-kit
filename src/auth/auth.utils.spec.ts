import { describe, expect, it } from '@jest/globals';
import { decodeJwt, isTokenExpired } from './index.js';

function createJwt(payload: Record<string, unknown>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodeBase64Url = (value: string): string =>
        Buffer.from(value, 'utf8')
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');

    return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.signature`;
}

describe('decodeJwt', () => {
    it('decodes a valid token payload', () => {
        const token = createJwt({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 });

        expect(decodeJwt(token)).toEqual({ sub: '123', exp: expect.any(Number) });
    });

    it('decodes a token payload that has no exp claim', () => {
        const token = createJwt({ role: 'viewer' });

        expect(decodeJwt(token)).toEqual({ role: 'viewer' });
    });

    it('returns null for malformed input', () => {
        expect(decodeJwt('not-a-jwt')).toBeNull();
        expect(decodeJwt(null)).toBeNull();
        expect(decodeJwt(undefined)).toBeNull();
    });
});

describe('isTokenExpired', () => {
    it('returns false for a valid non-expired token', () => {
        const token = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 'abc' });

        expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true when token expires exactly now', () => {
        const token = createJwt({ exp: Math.floor(Date.now() / 1000) });

        expect(isTokenExpired(token)).toBe(true);
    });

    it('returns true for token without exp claim', () => {
        const token = createJwt({ sub: 'abc' });

        expect(isTokenExpired(token)).toBe(true);
    });

    it('returns true for malformed and invalid input', () => {
        expect(isTokenExpired('not-a-jwt')).toBe(true);
        expect(isTokenExpired(null)).toBe(true);
        expect(isTokenExpired(undefined)).toBe(true);
    });
});