/**
 * Returns `true` when touch input appears to be supported.
 *
 * Uses feature detection and returns `false` outside browser environments
 * (for example during server-side rendering).
 *
 * @returns `true` when touch support is detected; otherwise `false`.
 *
 * @example
 * isTouchDevice(); // => false
 */
export function isTouchDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    const hasTouchStart = typeof (window as Window & { ontouchstart?: unknown }).ontouchstart !== 'undefined';

    return (
        hasTouchStart ||
        (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0)
    );
}