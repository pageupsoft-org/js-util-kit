/**
 * Returns `true` when the value is a valid absolute URL.
 *
 * This validator accepts HTTP and HTTPS URLs and rejects relative URLs.
 *
 * @param value - The URL value to validate. Returns `false` for null or undefined.
 * @returns `true` for valid absolute HTTP/HTTPS URLs; otherwise `false`.
 *
 * @example
 * isValidUrl('https://example.com/path?q=1#top'); // => true
 */
export function isValidUrl(value: string | null | undefined): boolean {
    if (value == null) return false;

    const urlValue = value.trim();
    if (urlValue.length === 0) return false;

    if (!URL.canParse(urlValue)) return false;

    const parsedUrl = new URL(urlValue);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
}