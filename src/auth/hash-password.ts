import { _getCrypto } from './_helpers.js';

const ENCODER = new TextEncoder();
const ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

function _base64Encode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function _base64Decode(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function _deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
    const crypto = _getCrypto();
    if (!crypto) throw new Error('Crypto API not available');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        ENCODER.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: ITERATIONS,
            hash: HASH_ALGORITHM,
        },
        keyMaterial,
        KEY_LENGTH
    );

    return new Uint8Array(derivedBits);
}

/**
 * Hashes a password using PBKDF2 with SHA-256.
 *
 * @param password - The plaintext password to hash.
 * @returns A promise that resolves to the hash string (format: `v=1$i=100000$salt$hash`).
 *
 * @example
 * await hashPassword('myPassword123'); // => 'v=1$i=100000$base64salt$base64hash'
 */
export async function hashPassword(password: string): Promise<string> {
    if (typeof password !== 'string' || password.length === 0) {
        throw new TypeError('Password must be a non-empty string');
    }

    const crypto = _getCrypto();
    if (!crypto) throw new Error('Crypto API not available');

    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH)) as Uint8Array<ArrayBuffer>;
    const hash = await _deriveKey(password, salt);

    const saltB64 = _base64Encode(salt);
    const hashB64 = _base64Encode(hash);

    return `v=1$i=${ITERATIONS}$${saltB64}$${hashB64}`;
}