/**
 * Opens a URL in a new browser tab with security flags enabled.
 *
 * Uses `window.open` with `noopener,noreferrer` and validates the URL before
 * attempting to open it.
 *
 * @param url - The absolute URL to open. Returns `false` for null, undefined, empty, or invalid values.
 * @returns `true` when the browser accepts the open request; otherwise `false`.
 *
 * @example
 * openInNewTab('https://example.com'); // => true
 */
export function openInNewTab(url: string | null | undefined): boolean {
    if (typeof url !== 'string' || url.trim().length === 0) return false;
    if (typeof window === 'undefined') return false;

    const normalizedUrl = url.trim();
    if (!URL.canParse(normalizedUrl)) return false;

    const parsedUrl = new URL(normalizedUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return false;

    const openedWindow = window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer');
    return openedWindow !== null;
}