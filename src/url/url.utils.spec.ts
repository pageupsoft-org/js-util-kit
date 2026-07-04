import { describe, expect, it } from '@jest/globals';
import {
    buildQueryString,
    parseQueryString,
    appendQueryParameters,
    getBaseUrl,
} from './index.js';

describe('buildQueryString', () => {
    it('builds a query string from valid parameters', () => {
        expect(buildQueryString({ q: 'hello', page: 2 })).toBe('q=hello&page=2');
    });

    it('skips null and undefined values and encodes keys and values', () => {
        expect(
            buildQueryString({
                'search term': 'a+b c',
                includeArchived: false,
                empty: null,
                unset: undefined,
            })
        ).toBe('search+term=a%2Bb+c&includeArchived=false');
    });

    it('returns empty string for invalid input', () => {
        expect(buildQueryString(null)).toBe('');
        expect(buildQueryString(undefined)).toBe('');
    });
});

describe('parseQueryString', () => {
    it('parses query string with a leading question mark', () => {
        expect(parseQueryString('?q=hello&page=2')).toEqual({ q: 'hello', page: '2' });
    });

    it('handles empty query string and optional leading question mark', () => {
        expect(parseQueryString('name=john')).toEqual({ name: 'john' });
        expect(parseQueryString('')).toEqual({});
    });

    it('returns empty object for invalid input', () => {
        expect(parseQueryString(null)).toEqual({});
        expect(parseQueryString(undefined)).toEqual({});
    });
});

describe('appendQueryParameters', () => {
    it('appends query parameters to a valid URL', () => {
        expect(appendQueryParameters('https://example.com/path', { q: 'hello', page: 1 })).toBe(
            'https://example.com/path?q=hello&page=1'
        );
    });

    it('merges with existing query parameters and overrides duplicate keys', () => {
        const updatedUrl = appendQueryParameters('https://example.com/path?foo=1&bar=2', {
            bar: 3,
            baz: 'ok',
            skip: null,
        });

        const parsedUrl = new URL(updatedUrl);
        expect(parsedUrl.searchParams.get('foo')).toBe('1');
        expect(parsedUrl.searchParams.get('bar')).toBe('3');
        expect(parsedUrl.searchParams.get('baz')).toBe('ok');
        expect(parsedUrl.searchParams.get('skip')).toBeNull();
    });

    it('returns empty string for invalid input', () => {
        expect(appendQueryParameters(null, { a: 1 })).toBe('');
        expect(appendQueryParameters(undefined, { a: 1 })).toBe('');
        expect(appendQueryParameters('ht!tp://bad-url', { a: 1 })).toBe('');
    });
});

describe('getBaseUrl', () => {
    it('returns the origin of a valid URL', () => {
        expect(getBaseUrl('https://example.com/path?x=1')).toBe('https://example.com');
    });

    it('handles trailing slash URLs', () => {
        expect(getBaseUrl('https://example.com/')).toBe('https://example.com');
    });

    it('returns empty string for invalid input', () => {
        expect(getBaseUrl(null)).toBe('');
        expect(getBaseUrl(undefined)).toBe('');
        expect(getBaseUrl('://bad-url')).toBe('');
    });
});