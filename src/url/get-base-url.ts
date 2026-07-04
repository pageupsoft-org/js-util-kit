/**
 * Returns the origin (protocol + host) of a URL.
 *
 * @param url - The URL to inspect. Returns an empty string for null, undefined, empty, or invalid URLs.
 * @returns The origin string, or an empty string when the URL is invalid.
 *
 * @example
 * getBaseUrl('https://example.com/path?x=1'); // => 'https://example.com'
 */
export function getBaseUrl(url: string | null | undefined): string {
    if (typeof url !== 'string') return '';

    const normalizedUrl = url.trim();
    if (normalizedUrl.length === 0) return '';
    if (!URL.canParse(normalizedUrl)) return '';

    return new URL(normalizedUrl).origin;
}