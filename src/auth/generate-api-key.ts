import { _getCrypto } from './_helpers.js';

/**
 * Generates a cryptographically secure API key.
 *
 * @param prefix - Optional prefix for the API key. Defaults to 'ak'.
 * @returns The generated API key with format: `${prefix}_live_<32_hex_chars>`
 *
 * @example
 * generateApiKey(); // => 'ak_live_a1b2c3d4e5f6...'
 * @example
 * generateApiKey('sk'); // => 'sk_live_a1b2c3d4e5f6...'
 */
export function generateApiKey(prefix = 'ak'): string {
    if (prefix !== undefined && typeof prefix !== 'string') {
        throw new TypeError('Prefix must be a string');
    }
    const crypto = _getCrypto();
    if (!crypto) {
        throw new Error('Crypto API not available');
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const randomHex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

    if (prefix === '') {
        return randomHex;
    }
    return `${prefix}_live_${randomHex}`;
}