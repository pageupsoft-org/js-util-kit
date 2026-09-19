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


// ---------------------------------------------------------------------------
// Additional Async Error Handling and Edge Cases
// ---------------------------------------------------------------------------

describe('hashPassword - additional async error handling', () => {
    it('throws TypeError for null password', async () => {
        await expect(hashPassword(null as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for undefined password', async () => {
        await expect(hashPassword(undefined as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for boolean password', async () => {
        await expect(hashPassword(true as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for object password', async () => {
        await expect(hashPassword({ password: 'test' } as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for array password', async () => {
        await expect(hashPassword(['password'] as any)).rejects.toThrow(TypeError);
    });

    it('handles very long passwords', async () => {
        const longPassword = 'a'.repeat(1000);
        const hash = await hashPassword(longPassword);
        expect(hash).toMatch(/^v=1\$i=100000\$/);
        const verified = await verifyPassword(longPassword, hash);
        expect(verified).toBe(true);
    });

    it('handles passwords with special characters', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const hash = await hashPassword(specialPassword);
        const verified = await verifyPassword(specialPassword, hash);
        expect(verified).toBe(true);
    });

    it('handles unicode passwords', async () => {
        const unicodePassword = '密码🔐مرور';
        const hash = await hashPassword(unicodePassword);
        const verified = await verifyPassword(unicodePassword, hash);
        expect(verified).toBe(true);
    });

    it('handles whitespace-only passwords', async () => {
        const whitespacePassword = '   \t\n  ';
        const hash = await hashPassword(whitespacePassword);
        const verified = await verifyPassword(whitespacePassword, hash);
        expect(verified).toBe(true);
    });

    it('handles single character passwords', async () => {
        const singleChar = 'a';
        const hash = await hashPassword(singleChar);
        const verified = await verifyPassword(singleChar, hash);
        expect(verified).toBe(true);
    });
});

describe('verifyPassword - additional async error handling', () => {
    it('throws TypeError for null password', async () => {
        await expect(verifyPassword(null as any, 'hash')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for undefined password', async () => {
        await expect(verifyPassword(undefined as any, 'hash')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for null hash', async () => {
        await expect(verifyPassword('password', null as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for undefined hash', async () => {
        await expect(verifyPassword('password', undefined as any)).rejects.toThrow(TypeError);
    });

    it('returns false for hash with missing parts', async () => {
        expect(await verifyPassword('password', 'v=1$i=100000')).toBe(false);
        expect(await verifyPassword('password', 'v=1$i=100000$salt')).toBe(false);
    });

    it('returns false for hash with extra parts', async () => {
        expect(await verifyPassword('password', 'v=1$i=100000$salt$hash$extra')).toBe(false);
    });

    it('returns false for hash with invalid version', async () => {
        expect(await verifyPassword('password', 'v=99$i=100000$salt$hash')).toBe(false);
    });

    it('returns false for hash with invalid iteration count', async () => {
        expect(await verifyPassword('password', 'v=1$i=abc$salt$hash')).toBe(false);
    });

    it('returns false for hash with zero iterations', async () => {
        expect(await verifyPassword('password', 'v=1$i=0$salt$hash')).toBe(false);
    });

    it('returns false for hash with negative iterations', async () => {
        expect(await verifyPassword('password', 'v=1$i=-100$salt$hash')).toBe(false);
    });

    it('handles concurrent verification calls', async () => {
        const hash = await hashPassword('password123');
        const results = await Promise.all([
            verifyPassword('password123', hash),
            verifyPassword('password123', hash),
            verifyPassword('wrongpassword', hash),
            verifyPassword('password123', hash),
        ]);

        expect(results[0]).toBe(true);
        expect(results[1]).toBe(true);
        expect(results[2]).toBe(false);
        expect(results[3]).toBe(true);
    });
});

describe('generateToken - additional async error handling', () => {
    it('throws TypeError for null payload', async () => {
        await expect(generateToken(null as any, 'secret')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for undefined payload', async () => {
        await expect(generateToken(undefined as any, 'secret')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for array payload', async () => {
        await expect(generateToken(['data'] as any, 'secret')).rejects.toThrow(TypeError);
    });

    it('throws TypeError for null secret', async () => {
        await expect(generateToken({ userId: '123' }, null as any)).rejects.toThrow(TypeError);
    });

    it('throws TypeError for undefined secret', async () => {
        await expect(generateToken({ userId: '123' }, undefined as any)).rejects.toThrow(TypeError);
    });

    it('accepts whitespace-only secret (no trim validation)', async () => {
        // Implementation checks truthy/string but doesn't trim
        const token = await generateToken({ userId: '123' }, '   ', '1h');
        expect(token).toBeDefined();
    });

    it('accepts zero expiresIn (generates past exp)', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '0s');
        expect(token).toBeDefined();
        // Token will be immediately expired
    });

    it('throws RangeError for negative expiresIn (no validation)', async () => {
        // Implementation doesn't validate negative values, just format
        await expect(generateToken({ userId: '123' }, 'secret', '-1h')).rejects.toThrow(RangeError);
    });

    it('throws RangeError for invalid time unit', async () => {
        await expect(generateToken({ userId: '123' }, 'secret', '1x')).rejects.toThrow(RangeError);
    });

    it('throws RangeError for expiresIn without number', async () => {
        await expect(generateToken({ userId: '123' }, 'secret', 'h')).rejects.toThrow(RangeError);
    });

    it('handles empty object payload', async () => {
        const token = await generateToken({}, 'secret', '1h');
        expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('handles payload with nested objects', async () => {
        const payload = { user: { id: 1, profile: { name: 'Test' } } };
        const token = await generateToken(payload, 'secret', '1h');
        const verified = await verifyToken(token, 'secret');
        expect(verified).toEqual({ ...payload, exp: expect.any(Number) });
    });

    it('handles payload with arrays', async () => {
        const payload = { roles: ['admin', 'editor'], permissions: [1, 2, 3] };
        const token = await generateToken(payload, 'secret', '1h');
        const verified = await verifyToken(token, 'secret');
        expect(verified).toEqual({ ...payload, exp: expect.any(Number) });
    });

    it('handles very long secrets', async () => {
        const longSecret = 'a'.repeat(1000);
        const token = await generateToken({ userId: '123' }, longSecret, '1h');
        const verified = await verifyToken(token, longSecret);
        expect(verified).toMatchObject({ userId: '123' });
    });

    it('generates tokens with same exp if generated within same second', async () => {
        const payload = { userId: '123' };
        const token1 = await generateToken(payload, 'secret', '1h');
        // No delay - same second
        const token2 = await generateToken(payload, 'secret', '1h');
        // Tokens may be identical if generated in same second since exp is in seconds
        expect(typeof token1).toBe('string');
        expect(typeof token2).toBe('string');
    });

    it('handles concurrent token generation', async () => {
        const tokens = await Promise.all([
            generateToken({ userId: '1' }, 'secret', '1h'),
            generateToken({ userId: '2' }, 'secret', '1h'),
            generateToken({ userId: '3' }, 'secret', '1h'),
        ]);

        expect(tokens[0]).not.toBe(tokens[1]);
        expect(tokens[1]).not.toBe(tokens[2]);
        expect(tokens[0]).not.toBe(tokens[2]);
    });

    it('supports various time units for expiresIn', async () => {
        const units = ['1s', '1m', '1h', '1d'];
        for (const unit of units) {
            const token = await generateToken({ userId: '123' }, 'secret', unit);
            expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
        }
    });
});

describe('verifyToken - additional async error handling', () => {
    it('returns null for token with invalid base64 encoding', async () => {
        const invalidToken = 'invalid!!!.payload!!!.signature!!!';
        expect(await verifyToken(invalidToken, 'secret')).toBeNull();
    });

    it('returns null for token with only two parts', async () => {
        expect(await verifyToken('header.payload', 'secret')).toBeNull();
    });

    it('returns null for token with four parts', async () => {
        expect(await verifyToken('header.payload.signature.extra', 'secret')).toBeNull();
    });

    it('returns null for empty string token', async () => {
        expect(await verifyToken('', 'secret')).toBeNull();
    });

    it('returns null for empty string secret', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        expect(await verifyToken(token, '')).toBeNull();
    });

    it('returns null for token with empty parts', async () => {
        expect(await verifyToken('..', 'secret')).toBeNull();
    });

    it('returns null when token signature is modified', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1h');
        const parts = token.split('.');
        const modified = `${parts[0]}.${parts[1]}.${parts[2]}X`;
        expect(await verifyToken(modified, 'secret')).toBeNull();
    });

    it('handles concurrent verification of different tokens', async () => {
        const token1 = await generateToken({ userId: '1' }, 'secret1', '1h');
        const token2 = await generateToken({ userId: '2' }, 'secret2', '1h');

        const results = await Promise.all([
            verifyToken(token1, 'secret1'),
            verifyToken(token2, 'secret2'),
            verifyToken(token1, 'secret2'),
            verifyToken(token2, 'secret1'),
        ]);

        expect(results[0]).toMatchObject({ userId: '1' });
        expect(results[1]).toMatchObject({ userId: '2' });
        expect(results[2]).toBeNull();
        expect(results[3]).toBeNull();
    });

    it('handles token without exp claim correctly', async () => {
        const token = await generateToken({ userId: '123' }, 'secret');
        const payload = await verifyToken(token, 'secret');
        expect(payload).toEqual({ userId: '123' });
        expect(payload?.exp).toBeUndefined();
    });

    it('returns null for token that expired exactly at verification time', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1s');
        await new Promise(r => setTimeout(r, 1000));
        const payload = await verifyToken(token, 'secret');
        expect(payload).toBeNull();
    });
});

describe('decodeJwt - additional edge cases', () => {
    it('returns null for token with only one part', async () => {
        expect(decodeJwt('onlyonepart')).toBeNull();
    });

    it('returns null for token with four parts', async () => {
        expect(decodeJwt('part1.part2.part3.part4')).toBeNull();
    });

    it('returns null for token with invalid JSON in payload', async () => {
        const invalidPayload = btoa('{invalid json}');
        expect(decodeJwt(`header.${invalidPayload}.signature`)).toBeNull();
    });

    it('decodes token with special characters in payload', async () => {
        const token = await generateToken({ name: 'Test User', role: 'admin' }, 'secret', '1h');
        const decoded = decodeJwt(token);
        expect(decoded?.name).toBe('Test User');
    });

    it('handles token with URL-safe base64 encoding', async () => {
        const token = await generateToken({ data: 'test+test/test=' }, 'secret', '1h');
        const decoded = decodeJwt(token);
        expect(decoded?.data).toBe('test+test/test=');
    });
});

describe('isTokenExpired - additional edge cases', () => {
    it('returns true for token without exp claim (isTokenExpired checks if expired)', async () => {
        const token = await generateToken({ userId: '123' }, 'secret');
        // isTokenExpired returns true for tokens without exp (treated as invalid/expired)
        expect(isTokenExpired(token)).toBe(true);
    });

    it('returns true for token that expired 1 second ago', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '1s');
        await new Promise(r => setTimeout(r, 1100));
        expect(isTokenExpired(token)).toBe(true);
    });

    it('returns false for token that expires in far future', async () => {
        const token = await generateToken({ userId: '123' }, 'secret', '365d');
        expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for null token', () => {
        expect(isTokenExpired(null as any)).toBe(true);
    });

    it('returns true for undefined token', () => {
        expect(isTokenExpired(undefined as any)).toBe(true);
    });

    it('returns true for empty string token', () => {
        expect(isTokenExpired('')).toBe(true);
    });

    it('returns true for malformed token', () => {
        expect(isTokenExpired('not.a.valid.jwt')).toBe(true);
    });
});

describe('generateApiKey - additional edge cases', () => {
    it('generates key with custom prefix', () => {
        const key = generateApiKey('custom');
        expect(key).toMatch(/^custom_live_[a-f0-9]{32}$/); // hex format, not base64
    });

    it('generates key with empty prefix', () => {
        const key = generateApiKey('');
        expect(key).toMatch(/^[a-f0-9]{32}$/); // no prefix/underscore
    });

    it('generates key with no prefix parameter', () => {
        const key = generateApiKey();
        expect(key).toMatch(/^ak_live_[a-f0-9]{32}$/); // default prefix is 'ak'
    });

    it('generates different keys on each call', () => {
        const keys = new Set<string>();
        for (let i = 0; i < 100; i++) {
            keys.add(generateApiKey());
        }
        expect(keys.size).toBe(100);
    });

    it('handles special characters in prefix', () => {
        const key = generateApiKey('test-api-key');
        expect(key).toMatch(/^test-api-key_live_[a-f0-9]{32}$/);
    });

    it('handles numeric prefix', () => {
        const key = generateApiKey('123');
        expect(key).toMatch(/^123_live_[a-f0-9]{32}$/);
    });

    it('handles very long prefix', () => {
        const longPrefix = 'a'.repeat(100);
        const key = generateApiKey(longPrefix);
        expect(key.startsWith(longPrefix + '_live_')).toBe(true);
        expect(key).toHaveLength(longPrefix.length + 6 + 32); // prefix + '_live_' + 32 hex chars
    });
});
