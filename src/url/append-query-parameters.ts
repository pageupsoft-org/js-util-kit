type QueryParameterValue = string | number | boolean | null | undefined;

/**
 * Appends or updates query parameters on an existing URL.
 *
 * Existing parameters are preserved unless explicitly overridden by incoming
 * keys. Null and undefined parameter values are skipped.
 *
 * @param url - The URL to update. Returns an empty string for null, undefined, empty, or invalid URLs.
 * @param params - Parameters to merge. Null or undefined values are ignored.
 * @returns The updated URL string, or an empty string for invalid URL input.
 *
 * @example
 * appendQueryParameters('https://example.com?a=1', { b: 2 }); // => 'https://example.com/?a=1&b=2'
 */
export function appendQueryParameters(
    url: string | null | undefined,
    params: Record<string, QueryParameterValue> | null | undefined
): string {
    if (typeof url !== 'string') return '';

    const normalizedUrl = url.trim();
    if (normalizedUrl.length === 0) return '';
    if (!URL.canParse(normalizedUrl)) return '';

    const parsedUrl = new URL(normalizedUrl);

    if (params != null) {
        for (const [key, value] of Object.entries(params)) {
            if (value == null) continue;
            parsedUrl.searchParams.set(key, String(value));
        }
    }

    return parsedUrl.toString();
}