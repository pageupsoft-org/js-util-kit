export function _decodeBase64Url(value: string): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;

    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    try {
        if (typeof atob === 'function') {
            const binary = atob(paddedBase64);
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            if (typeof TextDecoder !== 'undefined') {
                return new TextDecoder().decode(bytes);
            }

            let text = '';
            for (const byte of bytes) {
                text += String.fromCharCode(byte);
            }
            return text;
        }

        const bufferLike = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer;
        if (bufferLike != null) {
            return bufferLike.from(paddedBase64, 'base64').toString('utf8');
        }

        return null;
    } catch {
        // Graceful fallback for malformed base64url segments.
        return null;
    }
}

export function _getJwtPayloadSegment(token: string): string | null {
    if (typeof token !== 'string' || token.length === 0) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return parts[1] ?? null;
}