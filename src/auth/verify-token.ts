import { _getCrypto } from './_helpers.js';
import { decodeJwt } from './decode-jwt.js';

const ENCODER = new TextEncoder();
const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

function _base64UrlDecode(str: string): Uint8Array | null {
    try {
        const padded = str.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch {
        return null;
    }
}

async function _verify(signingInput: string, signature: string, secret: string): Promise<boolean> {
    const crypto = _getCrypto();
    if (!crypto) throw new Error('Crypto API not available');

    const key = await crypto.subtle.importKey(
        'raw',
        ENCODER.encode(secret),
        ALGORITHM,
        false,
        ['verify']
    );
    const sigBytes = _base64UrlDecode(signature);
    if (!sigBytes) return false;
    return crypto.subtle.verify(ALGORITHM.name, key, sigBytes as Uint8Array<ArrayBuffer>, ENCODER.encode(signingInput));
}

/**
 * Verifies a JWT-like token's signature and expiration.
 *
 * @param token - The token string to verify.
 * @param secret - The secret key used for signing.
 * @returns A promise that resolves to the decoded payload if valid, null otherwise.
 *
 * @example
 * const payload = await verifyToken('eyJhbGciOiJIUzI1NiJ9...', 'secret');
 * // => { userId: '123', role: 'admin', exp: 1700000000 }
 * @example
 * await verifyToken('invalid.token', 'secret'); // => null
 */
export async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
    if (!token || typeof token !== 'string') return null;
    if (!secret || typeof secret !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const encodedHeader = parts[0];
    const encodedBody = parts[1];
    const signature = parts[2];
    if (!encodedHeader || !encodedBody || !signature) return null;
    const signingInput = `${encodedHeader}.${encodedBody}`;

    const isValid = await _verify(signingInput, signature, secret);
    if (!isValid) return null;

    const payload = decodeJwt(token);
    if (!payload) return null;

    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
        return null;
    }

    return payload;
}