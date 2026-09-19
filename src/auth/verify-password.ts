import { _getCrypto } from './_helpers.js';

/**
 * Verifies a plaintext password against a PBKDF2 hash.
 *
 * @param password - The plaintext password to verify.
 * @param hash - The hash string to verify against (format: `v=1$i=100000$salt$hash`).
 * @returns A promise that resolves to true if the password matches, false otherwise.
 *
 * @example
 * await verifyPassword('myPassword123', 'v=1$i=100000$base64salt$base64hash'); // => true
 * @example
 * await verifyPassword('wrongPassword', 'v=1$i=100000$base64salt$base64hash'); // => false
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (typeof password !== 'string' || password.length === 0) {
        throw new TypeError('Password must be a non-empty string');
    }
    if (typeof hash !== 'string' || hash.length === 0) {
        throw new TypeError('Hash must be a non-empty string');
    }

    try {
        const parts = hash.split('$');
        if (parts.length !== 4 || !parts[0]?.startsWith('v=1') || !parts[1] || !parts[2] || !parts[3]) {
            return false;
        }

        const iterations = parseInt((parts[1] || '').replace('i=', ''), 10);
        const salt = _base64Decode(parts[2]!) as Uint8Array<ArrayBuffer>;
        const expectedHash = _base64Decode(parts[3]!);

        const crypto = _getCrypto();
        if (!crypto) throw new Error('Crypto API not available');

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt,
                iterations,
                hash: 'SHA-256',
            },
            keyMaterial,
            expectedHash.length * 8
        );

        const derivedHash = new Uint8Array(derivedBits);

        if (derivedHash.length !== expectedHash.length) return false;

        let match = true;
        for (let i = 0; i < derivedHash.length; i++) {
            if (derivedHash[i] !== expectedHash[i]) {
                match = false;
            }
        }
        return match;
    } catch {
        return false;
    }
}

function _base64Decode(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}