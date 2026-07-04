type QueryParameterValue = string | number | boolean | null | undefined;

/**
 * Builds a URL query string from an object of parameters.
 *
 * Keys with null or undefined values are skipped. Keys and values are encoded
 * using the native `URLSearchParams` behavior.
 *
 * @param parameters - The parameter object. Returns an empty string for null or undefined input.
 * @returns A query string without a leading `?`, or an empty string when no valid parameters exist.
 *
 * @example
 * buildQueryString({ q: 'hello world', page: 2 }); // => 'q=hello+world&page=2'
 */
export function buildQueryString(
    parameters: Record<string, QueryParameterValue> | null | undefined
): string {
    if (parameters == null) return '';

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(parameters)) {
        if (value == null) continue;
        searchParams.append(key, String(value));
    }

    return searchParams.toString();
}