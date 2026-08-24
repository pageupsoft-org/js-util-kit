/** @jest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearLocalStorage, getLocalStorage, removeLocalStorage, setLocalStorage, clearSessionStorage, getSessionStorage, removeSessionStorage, setSessionStorage } from './index.js';

describe('setLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('stores a JSON-serialized value', () => {
        const result = setLocalStorage('user', { id: 1, name: 'Ratnesh' });

        expect(result).toBe(true);
        expect(localStorage.getItem('user')).toBe('{"id":1,"name":"Ratnesh"}');
    });

    it('stores complex nested objects', () => {
        const value = {
            user: { id: 42, profile: { locale: 'en-US' } },
            roles: ['admin', 'editor'],
            flags: { beta: true },
        };

        const result = setLocalStorage('complex', value);
        expect(result).toBe(true);
        expect(JSON.parse(localStorage.getItem('complex') ?? '{}')).toEqual(value);
    });

    it('returns false when localStorage write throws', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });

        expect(setLocalStorage('k', 'v')).toBe(false);
    });
});

describe('getLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('returns parsed value for an existing key', () => {
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        expect(getLocalStorage<{ id: number }>('user')).toEqual({ id: 1 });
    });

    it('returns null when the key does not exist', () => {
        expect(getLocalStorage('missing')).toBeNull();
    });

    it('returns null for malformed JSON', () => {
        localStorage.setItem('bad', '{invalid-json');
        expect(getLocalStorage('bad')).toBeNull();
    });
});

describe('removeLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('removes an existing key', () => {
        localStorage.setItem('token', JSON.stringify('abc'));

        expect(removeLocalStorage('token')).toBe(true);
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('is a no-op for a missing key', () => {
        expect(removeLocalStorage('missing')).toBe(true);
    });

    it('returns false when remove throws', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('remove failed');
        });

        expect(removeLocalStorage('token')).toBe(false);
    });
});

describe('clearLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('clears only keys that start with the provided prefix', () => {
        localStorage.setItem('app:user', '1');
        localStorage.setItem('app:token', '2');
        localStorage.setItem('other:key', '3');

        expect(clearLocalStorage('app:')).toBe(true);
        expect(localStorage.getItem('app:user')).toBeNull();
        expect(localStorage.getItem('app:token')).toBeNull();
        expect(localStorage.getItem('other:key')).toBe('3');
    });

    it('clears everything for empty prefix', () => {
        localStorage.setItem('a', '1');
        localStorage.setItem('b', '2');

        expect(clearLocalStorage('')).toBe(true);
        expect(localStorage.length).toBe(0);
    });

    it('returns false when clear throws', () => {
        jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
            throw new Error('clear failed');
        });

        expect(clearLocalStorage()).toBe(false);
    });
});

describe('setSessionStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stores a JSON-serialized value', () => {
        const result = setSessionStorage('user', { id: 1, name: 'Ratnesh' });

        expect(result).toBe(true);
        expect(sessionStorage.getItem('user')).toBe('{"id":1,"name":"Ratnesh"}');
    });

    it('returns false when sessionStorage write throws', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });

        expect(setSessionStorage('k', 'v')).toBe(false);
    });
});

describe('getSessionStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns parsed value for an existing key', () => {
        sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
        expect(getSessionStorage<{ id: number }>('user')).toEqual({ id: 1 });
    });

    it('returns null when the key does not exist', () => {
        expect(getSessionStorage('missing')).toBeNull();
    });

    it('returns null for malformed JSON', () => {
        sessionStorage.setItem('bad', '{invalid-json');
        expect(getSessionStorage('bad')).toBeNull();
    });
});

describe('removeSessionStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('removes an existing key', () => {
        sessionStorage.setItem('token', JSON.stringify('abc'));

        expect(removeSessionStorage('token')).toBe(true);
        expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('is a no-op for a missing key', () => {
        expect(removeSessionStorage('missing')).toBe(true);
    });

    it('returns false when remove throws', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('remove failed');
        });

        expect(removeSessionStorage('token')).toBe(false);
    });
});

describe('clearSessionStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('clears only keys that start with the provided prefix', () => {
        sessionStorage.setItem('app:user', '1');
        sessionStorage.setItem('app:token', '2');
        sessionStorage.setItem('other:key', '3');

        expect(clearSessionStorage('app:')).toBe(true);
        expect(sessionStorage.getItem('app:user')).toBeNull();
        expect(sessionStorage.getItem('app:token')).toBeNull();
        expect(sessionStorage.getItem('other:key')).toBe('3');
    });

    it('clears everything for empty prefix', () => {
        sessionStorage.setItem('a', '1');
        sessionStorage.setItem('b', '2');

        expect(clearSessionStorage('')).toBe(true);
        expect(sessionStorage.length).toBe(0);
    });

    it('returns false when clear throws', () => {
        jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
            throw new Error('clear failed');
        });

        expect(clearSessionStorage()).toBe(false);
    });
});