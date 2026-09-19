import { _getCrypto } from './_helpers.js';

const ENCODER = new TextEncoder();
const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

function _base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

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

async function _sign(payload: string, secret: string): Promise<string> {
    const crypto = _getCrypto();
    if (!crypto) throw new Error('Crypto API not available');

    const key = await crypto.subtle.importKey(
        'raw',
        ENCODER.encode(secret),
        ALGORITHM,
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(ALGORITHM.name, key, ENCODER.encode(payload));
    return _base64UrlEncode(new Uint8Array(signature));
}

function _parseExpiry(expiresIn: string | undefined): number | undefined {
    if (!expiresIn) return undefined;
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) throw new RangeError('Invalid expiresIn format (e.g., "24h", "7d")');
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return Date.now() + value * multipliers[unit as keyof typeof multipliers];
}

/**
 * Generates a JWT-like signed token with expiration.
 *
 * @param payload - The payload to encode in the token.
 * @param secret - The secret key for signing.
 * @param expiresIn - Optional expiration string (e.g., "24h", "7d", "1h", "30m").
 * @returns A promise that resolves to the signed token string.
 *
 * @example
 * await generateToken({ userId: '123', role: 'admin' }, 'secret', '24h');
 * // => 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3MDAwMDAwMDB9.signature'
 */
export async function generateToken(
    payload: Record<string, unknown>,
    secret: string,
    expiresIn?: string
): Promise<string> {
    if (!secret || typeof secret !== 'string') {
        throw new TypeError('Secret must be a non-empty string');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new TypeError('Payload must be a non-null object');
    }

    const exp = _parseExpiry(expiresIn);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = { ...payload, ...(exp ? { exp: Math.floor(exp / 1000) } : {}) };

    const encodedHeader = _base64UrlEncode(ENCODER.encode(JSON.stringify(header)));
    const encodedBody = _base64UrlEncode(ENCODER.encode(JSON.stringify(body)));
    const signingInput = `${encodedHeader}.${encodedBody}`;
    const signature = await _sign(signingInput, secret);

    return `${signingInput}.${signature}`;
}