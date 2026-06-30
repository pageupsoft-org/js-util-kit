const _ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random string of the given length using the supplied character set.
 * Defaults to alphanumeric characters (`A–Z`, `a–z`, `0–9`).
 *
 * Note: uses `Math.random()` and is **not** cryptographically secure.
 * Do not use for passwords, tokens, or secrets.
 *
 * @param length - Number of characters to generate. Must be a finite, non-negative
 *   number; non-integer values are truncated toward zero.
 * @param chars - Optional character pool. Defaults to `A–Za–z0–9`.
 * @returns A random string of the requested length.
 * @throws {RangeError} When `length` is not a finite, non-negative number.
 * @throws {RangeError} When `chars` is an empty string.
 *
 * @example
 * generateRandomString(8);       // => e.g. 'aB3xKq7Z'
 *
 * @example
 * generateRandomString(4, '01'); // => e.g. '1001'
 */
export function generateRandomString(length: number, chars = _ALPHANUMERIC): string {
    if (!isFinite(length) || length < 0) {
        throw new RangeError('`length` must be a finite, non-negative number.');
    }
    if (chars.length === 0) {
        throw new RangeError('`chars` must be a non-empty string.');
    }
    const len = Math.trunc(length);
    let result = '';
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
