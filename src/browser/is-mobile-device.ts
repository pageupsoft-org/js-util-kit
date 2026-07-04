/**
 * Returns `true` when the current runtime appears to be a mobile device.
 *
 * Uses a user-agent heuristic and returns `false` outside browser environments
 * (for example during server-side rendering).
 *
 * @returns `true` when a mobile device is detected; otherwise `false`.
 *
 * @example
 * isMobileDevice(); // => false
 */
export function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}