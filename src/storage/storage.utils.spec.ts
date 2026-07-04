/** @jest-environment jsdom */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearItems, getItem, removeItem, setItem } from './index.js';

describe('setItem', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('stores a JSON-serialized value', () => {
        const result = setItem('user', { id: 1, name: 'Ratnesh' });

        expect(result).toBe(true);
        expect(localStorage.getItem('user')).toBe('{"id":1,"name":"Ratnesh"}');
    });

    it('stores complex nested objects', () => {
        const value = {
            user: { id: 42, profile: { locale: 'en-US' } },
            roles: ['admin', 'editor'],
            flags: { beta: true },
        };

        const result = setItem('complex', value);
        expect(result).toBe(true);
        expect(JSON.parse(localStorage.getItem('complex') ?? '{}')).toEqual(value);
    });

    it('returns false when localStorage write throws', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });

        expect(setItem('k', 'v')).toBe(false);
    });
});

describe('getItem', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('returns parsed value for an existing key', () => {
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        expect(getItem<{ id: number }>('user')).toEqual({ id: 1 });
    });

    it('returns null when the key does not exist', () => {
        expect(getItem('missing')).toBeNull();
    });

    it('returns null for malformed JSON', () => {
        localStorage.setItem('bad', '{invalid-json');
        expect(getItem('bad')).toBeNull();
    });
});

describe('removeItem', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('removes an existing key', () => {
        localStorage.setItem('token', JSON.stringify('abc'));

        expect(removeItem('token')).toBe(true);
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('is a no-op for a missing key', () => {
        expect(removeItem('missing')).toBe(true);
    });

    it('returns false when remove throws', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('remove failed');
        });

        expect(removeItem('token')).toBe(false);
    });
});

describe('clearItems', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('clears only keys that start with the provided prefix', () => {
        localStorage.setItem('app:user', '1');
        localStorage.setItem('app:token', '2');
        localStorage.setItem('other:key', '3');

        expect(clearItems('app:')).toBe(true);
        expect(localStorage.getItem('app:user')).toBeNull();
        expect(localStorage.getItem('app:token')).toBeNull();
        expect(localStorage.getItem('other:key')).toBe('3');
    });

    it('clears everything for empty prefix', () => {
        localStorage.setItem('a', '1');
        localStorage.setItem('b', '2');

        expect(clearItems('')).toBe(true);
        expect(localStorage.length).toBe(0);
    });

    it('returns false when clear throws', () => {
        jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
            throw new Error('clear failed');
        });

        expect(clearItems()).toBe(false);
    });
});