import { _decodeBase64Url, _getJwtPayloadSegment } from './_helpers.js';

/**
 * Decodes a JWT payload without verifying its signature.
 *
 * SECURITY WARNING: This function does not validate or verify token integrity.
 * It only decodes payload claims for client-side convenience and must not be
 * used as a trust or authorization check.
 *
 * @param token - The JWT string to decode. Returns `null` for null, undefined, or malformed tokens.
 * @returns The decoded payload object, or `null` when decoding/parsing fails.
 *
 * @example
 * decodeJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature'); // => { sub: '123' }
 */
export function decodeJwt(token: string | null | undefined): Record<string, unknown> | null {
    if (typeof token !== 'string' || token.length === 0) return null;

    const payloadSegment = _getJwtPayloadSegment(token);
    if (payloadSegment == null) return null;

    const decodedPayload = _decodeBase64Url(payloadSegment);
    if (decodedPayload == null) return null;

    try {
        const parsed = JSON.parse(decodedPayload) as unknown;
        if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }

        return parsed as Record<string, unknown>;
    } catch {
        // Graceful fallback for malformed JSON payloads.
        return null;
    }
}