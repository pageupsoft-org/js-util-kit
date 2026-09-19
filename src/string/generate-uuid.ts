import { _getCrypto } from '../auth/_helpers.js';

/**
 * Generates a cryptographically secure UUID (version 4).
 *
 * @returns A UUID string in the format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
 *
 * @example
 * generateUuid(); // => '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUuid(): string {
    const crypto = _getCrypto();
    if (!crypto) {
        throw new Error('Crypto API not available');
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}