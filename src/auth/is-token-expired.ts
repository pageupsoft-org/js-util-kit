import { decodeJwt } from './decode-jwt.js';

/**
 * Returns whether a JWT should be treated as expired.
 *
 * This function decodes the token payload and checks the `exp` claim against
 * the current Unix time in seconds. Fail-safe behavior is applied: malformed
 * tokens, missing/invalid `exp`, or uncertain cases are treated as expired.
 *
 * @param token - The JWT string to evaluate. Returns `true` for null, undefined, or malformed tokens.
 * @param clockSkewSeconds - Optional tolerated clock skew in seconds. Defaults to `0`.
 * @returns `true` when the token is expired or uncertain; otherwise `false`.
 *
 * @example
 * isTokenExpired('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDAwMDAwMDB9.signature'); // => false
 */
export function isTokenExpired(
    token: string | null | undefined,
    clockSkewSeconds: number = 0
): boolean {
    if (typeof token !== 'string' || token.length === 0) return true;

    const payload = decodeJwt(token);
    if (payload == null) return true;

    const expClaim = payload.exp;
    if (typeof expClaim !== 'number' || !Number.isFinite(expClaim)) return true;

    const normalizedClockSkew =
        Number.isFinite(clockSkewSeconds) && clockSkewSeconds > 0
            ? clockSkewSeconds
            : 0;

    const currentUnixTime = Math.floor(Date.now() / 1000);
    return expClaim <= currentUnixTime + normalizedClockSkew;
}