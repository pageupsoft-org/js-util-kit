import { describe, expect, it } from '@jest/globals';
import { decodeJwt, isTokenExpired, generateApiKey, hashPassword, verifyPassword, generateToken, verifyToken } from './index.js';

function createJwt(payload: Record<string, unknown>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodeBase64Url = (value: string): string => {
        const bufferLike = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;
        if (bufferLike != null) {
            return bufferLike
                .from(value, 'utf8')
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/g, '');
        }

        if (typeof btoa === 'function') {
            return btoa(value)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/g, '');
        }

        throw new Error('No base64 encoder available in this environment.');
    };

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

describe('generateApiKey', () => {
    it('returns a string with default prefix', () => {
        const key = generateApiKey();
        expect(key).toMatch(/^ak_live_[a-f0-9]{32}$/);
    });

    it('returns a string with custom prefix', () => {
        const key = generateApiKey('sk');
        expect(key).toMatch(/^sk_live_[a-f0-9]{32}$/);
    });

    it('returns a raw key when prefix is empty string', () => {
        const key = generateApiKey('');
        expect(key).toMatch(/^[a-f0-9]{32}$/);
    });

    it('generates unique keys on each call', () => {
        const keys = new Set();
        for (let i = 0; i < 100; i++) {
            keys.add(generateApiKey());
        }
        expect(keys.size).toBe(100);
    });

    it('throws TypeError for non-string prefix', () => {
        expect(() => generateApiKey(123 as any)).toThrow(TypeError);
    });
});

describe('hashPassword', () => {
    it('returns a hash string with correct format', async () => {
        const hash = await hashPassword('myPassword123');
        expect(hash).toMatch(/^v=1\$i=100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    });

    it('returns different hashes for same password (different salts)', async () => {
        const hash1 = await hashPassword('myPassword123');
        const hash2 = await hashPassword('myPassword123');
        expect(hash1).not.toBe(hash2);
    });

    it('throws TypeError for empty password', async () => {
        await expect(hashPassword('')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for non-string password', async () => {
        await expect(hashPassword(123 as any)).rejects.toThrow(TypeError);
    });
});

describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
        const hash = await hashPassword('myPassword123');
        const result = await verifyPassword('myPassword123', hash);
        expect(result).toBe(true);
    });

    it('returns false for incorrect password', async () => {
        const hash = await hashPassword('myPassword123');
        const result = await verifyPassword('wrongPassword', hash);
        expect(result).toBe(false);
    });

    it('returns false for invalid hash format', async () => {
        const result = await verifyPassword('password', 'invalid-hash');
        expect(result).toBe(false);
    });

    it('throws TypeError for empty password', async () => {
        await expect(verifyPassword('', 'v=1$i=100000$salt$hash')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for empty hash', async () => {
        await expect(verifyPassword('password', '')).rejects.toThrow(TypeError);
    });
});

describe('generateToken', () => {
    it('generates a valid JWT-like token', async () => {
        const token = await generateToken({ userId: '123', role: 'admin' }, 'secret', '1h');
        expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('includes exp claim when expiresIn is provided', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        const parts = token.split('.');
        const payload = JSON.parse(atob((parts[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
        expect(payload.exp).toBeDefined();
        expect(typeof payload.exp).toBe('number');
    });

    it('does not include exp when expiresIn is not provided', async () => {
        const token = await generateToken({ userId: '123' }, 'secret');
        const parts = token.split('.');
        const payload = JSON.parse(atob((parts[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
        expect(payload.exp).toBeUndefined();
    });

    it('throws TypeError for empty secret', async () => {
        await expect(generateToken({ userId: '123' }, '')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for non-object payload', async () => {
        await expect(generateToken('not-an-object' as any, 'secret')).rejects.toThrow(TypeError);
    });

    it('throws RangeError for invalid expiresIn format', async () => {
        await expect(generateToken({ userId: '123' }, 'secret', 'invalid')).rejects.toThrow(RangeError);
    });
});

describe('verifyToken', () => {
    it('returns payload for valid token', async () => {
        const token = await generateToken({ userId: '123', role: 'admin' }, 'secret', '1h');
        const payload = await verifyToken(token, 'secret');
        expect(payload).toEqual({ userId: '123', role: 'admin', exp: expect.any(Number) });
    });

    it('returns null for expired token', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1s');
        await new Promise(r => setTimeout(r, 1100));
        const payload = await verifyToken(token, 'secret');
        expect(payload).toBeNull();
    });

    it('returns null for tampered token', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        // Tamper with the payload (middle part) instead of signature
        const parts = token.split('.');
        const tampered = `${parts[0]}.${parts[1]}X.${parts[2]}`;
        const payload = await verifyToken(tampered, 'secret');
        expect(payload).toBeNull();
    });

    it('returns null for wrong secret', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        const payload = await verifyToken(token, 'wrong-secret');
        expect(payload).toBeNull();
    });

    it('returns null for malformed token', async () => {
        const payload = await verifyToken('not-a-jwt', 'secret');
        expect(payload).toBeNull();
    });

    it('returns null for null/undefined token', async () => {
        expect(await verifyToken(null as any, 'secret')).toBeNull();
        expect(await verifyToken(undefined as any, 'secret')).toBeNull();
    });

    it('returns null for null/undefined secret', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        expect(await verifyToken(token, null as any)).toBeNull();
        expect(await verifyToken(token, undefined as any)).toBeNull();
    });
});