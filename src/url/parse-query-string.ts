/**
 * Parses a query string into a plain object.
 *
 * Accepts input with or without a leading `?`.
 *
 * @param queryString - The query string to parse. Returns an empty object for null, undefined, or empty input.
 * @returns A plain object of key/value pairs.
 *
 * @example
 * parseQueryString('?q=hello&page=2'); // => { q: 'hello', page: '2' }
 */
export function parseQueryString(queryString: string | null | undefined): Record<string, string> {
    if (typeof queryString !== 'string') return {};

    const normalizedQuery = queryString.startsWith('?')
        ? queryString.slice(1)
        : queryString;

    if (normalizedQuery.length === 0) return {};

    const searchParams = new URLSearchParams(normalizedQuery);
    const result: Record<string, string> = {};

    for (const [key, value] of searchParams.entries()) {
        result[key] = value;
    }

    return result;
}