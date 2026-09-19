import { describe, it, expect } from '@jest/globals';
import {
    deepClone,
    isEqual,
    mergeObjects,
    removeEmptyProperties,
    pick,
    omit,
} from './index.js';

// ---------------------------------------------------------------------------
// deepClone
// ---------------------------------------------------------------------------

describe('deepClone', () => {
    it('creates a deep copy of a nested object', () => {
        const original = { a: 1, nested: { b: 2 } };
        const clone = deepClone(original);
        clone.nested.b = 99;
        expect(original.nested.b).toBe(2);
    });

    it('creates a deep copy of an array', () => {
        const original = [1, [2, 3], { x: 4 }];
        const clone = deepClone(original);
        (clone[1] as number[])[0] = 99;
        expect((original[1] as number[])[0]).toBe(2);
    });

    it('clones a Date object as an equal but separate instance', () => {
        const original = new Date('2026-01-15');
        const clone = deepClone(original);
        expect(clone).not.toBe(original);
        expect(clone.getTime()).toBe(original.getTime());
    });

    it('returns a primitive value as-is', () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone('hello')).toBe('hello');
        expect(deepClone(true)).toBe(true);
    });

    it('clones an empty object to a separate reference', () => {
        const original = {};
        const clone = deepClone(original);
        expect(clone).not.toBe(original);
        expect(clone).toEqual({});
    });

    it('returns null for null input', () => {
        expect(deepClone(null)).toBeNull();
    });

    it('returns undefined for undefined input', () => {
        expect(deepClone(undefined)).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// isEqual
// ---------------------------------------------------------------------------

describe('isEqual', () => {
    it('returns true for two plain objects with the same shape and values', () => {
        expect(isEqual({ a: 1, b: 'two' }, { a: 1, b: 'two' })).toBe(true);
    });

    it('returns false when a value differs', () => {
        expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false when a key is missing in one object', () => {
        expect(isEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('returns true for deeply nested equal objects', () => {
        expect(isEqual({ x: { y: { z: 0 } } }, { x: { y: { z: 0 } } })).toBe(true);
    });

    it('returns true for two equal arrays', () => {
        expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns false for arrays of different length', () => {
        expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('returns true for two Date objects with the same timestamp', () => {
        expect(isEqual(new Date('2026-01-01'), new Date('2026-01-01'))).toBe(true);
    });

    it('returns false for two Dates with different timestamps', () => {
        expect(isEqual(new Date('2026-01-01'), new Date('2026-06-30'))).toBe(false);
    });

    it('returns true for two equal primitives', () => {
        expect(isEqual(42, 42)).toBe(true);
    });

    it('returns true for two empty objects', () => {
        expect(isEqual({}, {})).toBe(true);
    });

    it('returns false when comparing an array and a plain object', () => {
        expect(isEqual([], {})).toBe(false);
    });

    it('returns true for null compared to null', () => {
        expect(isEqual(null, null)).toBe(true);
    });

    it('returns false for null compared to undefined', () => {
        expect(isEqual(null, undefined)).toBe(false);
    });

    it('returns false for undefined compared to a value', () => {
        expect(isEqual(undefined, 0)).toBe(false);
    });

    it('returns true for equal objects with matching circular self-references', () => {
        const a: Record<string, unknown> = { name: 'root' };
        a.self = a;
        const b: Record<string, unknown> = { name: 'root' };
        b.self = b;

        expect(() => isEqual(a, b)).not.toThrow();
        expect(isEqual(a, b)).toBe(true);
    });

    it('returns false for circular objects that differ elsewhere', () => {
        const a: Record<string, unknown> = { name: 'root', value: 1 };
        a.self = a;
        const b: Record<string, unknown> = { name: 'root', value: 2 };
        b.self = b;

        expect(isEqual(a, b)).toBe(false);
    });

    it('returns true for equal arrays with matching circular self-references', () => {
        const a: unknown[] = [1, 2];
        a.push(a);
        const b: unknown[] = [1, 2];
        b.push(b);

        expect(() => isEqual(a, b)).not.toThrow();
        expect(isEqual(a, b)).toBe(true);
    });

    it('returns true for mutually circular references (a.other = b, b.other = a)', () => {
        const a: Record<string, unknown> = { name: 'a' };
        const b: Record<string, unknown> = { name: 'a' };
        a.other = b;
        b.other = a;

        expect(() => isEqual(a, b)).not.toThrow();
        expect(isEqual(a, b)).toBe(true);
    });

    it('returns false for two distinct Map instances even with identical entries', () => {
        expect(isEqual(new Map([['a', 1]]), new Map([['a', 1]]))).toBe(false);
    });

    it('returns false for two distinct Map instances with different entries', () => {
        expect(isEqual(new Map([['a', 1]]), new Map([['b', 2]]))).toBe(false);
    });

    it('returns true for the same Map instance compared to itself', () => {
        const m = new Map([['a', 1]]);
        expect(isEqual(m, m)).toBe(true);
    });

    it('returns false for two distinct Set instances even with identical members', () => {
        expect(isEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(false);
    });

    it('returns false for two distinct RegExp instances even with identical source/flags', () => {
        expect(isEqual(/abc/gi, /abc/gi)).toBe(false);
    });

    it('returns true for the same RegExp instance compared to itself', () => {
        const r = /abc/gi;
        expect(isEqual(r, r)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// mergeObjects
// ---------------------------------------------------------------------------

describe('mergeObjects', () => {
    it('merges two flat objects, source values take precedence', () => {
        expect(mergeObjects({ a: 1, b: 2 }, { b: 99, c: 3 })).toEqual({ a: 1, b: 99, c: 3 });
    });

    it('deep-merges nested plain objects', () => {
        expect(
            mergeObjects({ a: { x: 1, y: 2 } }, { a: { y: 99, z: 3 } })
        ).toEqual({ a: { x: 1, y: 99, z: 3 } });
    });

    it('replaces arrays rather than merging them', () => {
        expect(mergeObjects({ items: [1, 2] }, { items: [3, 4, 5] })).toEqual({ items: [3, 4, 5] });
    });

    it('does not mutate the target', () => {
        const target = { a: 1 };
        mergeObjects(target, { b: 2 });
        expect(target).toEqual({ a: 1 });
    });

    it('does not mutate the source', () => {
        const source = { b: 2 };
        mergeObjects({ a: 1 }, source);
        expect(source).toEqual({ b: 2 });
    });

    it('treats null target as {}', () => {
        expect(mergeObjects(null, { a: 1 })).toEqual({ a: 1 });
    });

    it('treats null source as {}', () => {
        expect(mergeObjects({ a: 1 }, null)).toEqual({ a: 1 });
    });

    it('returns {} when both inputs are null', () => {
        expect(mergeObjects(null, null)).toEqual({});
    });

    it('returns {} when merging two empty objects', () => {
        expect(mergeObjects({}, {})).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// removeEmptyProperties
// ---------------------------------------------------------------------------

describe('removeEmptyProperties', () => {
    it('removes null, undefined, and empty-string values', () => {
        expect(
            removeEmptyProperties({ a: 1, b: null, c: '', d: undefined, e: 'ok' })
        ).toEqual({ a: 1, e: 'ok' });
    });

    it('retains 0 and false (not considered empty)', () => {
        expect(removeEmptyProperties({ a: 0, b: false })).toEqual({ a: 0, b: false });
    });

    it('retains empty arrays and empty objects (not considered empty)', () => {
        expect(removeEmptyProperties({ a: [], b: {} })).toEqual({ a: [], b: {} });
    });

    it('returns {} for an object that has only empty properties', () => {
        expect(removeEmptyProperties({ a: null, b: '' })).toEqual({});
    });

    it('returns {} for an empty object', () => {
        expect(removeEmptyProperties({})).toEqual({});
    });

    it('returns {} for null', () => {
        expect(removeEmptyProperties(null)).toEqual({});
    });

    it('returns {} for undefined', () => {
        expect(removeEmptyProperties(undefined)).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// pick
// ---------------------------------------------------------------------------

describe('pick', () => {
    const obj = { a: 1, b: 'two', c: true };

    it('returns a new object with only the specified keys', () => {
        expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: true });
    });

    it('returns a single-key object when one key is picked', () => {
        expect(pick(obj, ['b'])).toEqual({ b: 'two' });
    });

    it('returns {} when an empty keys array is provided', () => {
        expect(pick(obj, [])).toEqual({});
    });

    it('ignores keys that do not exist on the object', () => {
        expect(pick({ x: 1 } as { x: number; y?: number }, ['y'])).toEqual({});
    });

    it('does not mutate the original object', () => {
        const original = { a: 1, b: 2 };
        pick(original, ['a']);
        expect(original).toEqual({ a: 1, b: 2 });
    });

    it('returns {} for null', () => {
        expect(pick(null as unknown as typeof obj, ['a'])).toEqual({});
    });

    it('returns {} for undefined', () => {
        expect(pick(undefined as unknown as typeof obj, ['a'])).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// omit
// ---------------------------------------------------------------------------

describe('omit', () => {
    const obj = { a: 1, b: 'two', c: true };

    it('returns a new object without the specified keys', () => {
        expect(omit(obj, ['b'])).toEqual({ a: 1, c: true });
    });

    it('removes multiple keys at once', () => {
        expect(omit(obj, ['a', 'b'])).toEqual({ c: true });
    });

    it('returns a copy of the full object when an empty keys array is provided', () => {
        expect(omit(obj, [])).toEqual({ a: 1, b: 'two', c: true });
    });

    it('returns {} when all keys are omitted', () => {
        expect(omit(obj, ['a', 'b', 'c'])).toEqual({});
    });

    it('does not mutate the original object', () => {
        const original = { a: 1, b: 2 };
        omit(original, ['a']);
        expect(original).toEqual({ a: 1, b: 2 });
    });

    it('returns {} for null', () => {
        expect(omit(null as unknown as typeof obj, ['a'])).toEqual({});
    });

    it('returns {} for undefined', () => {
        expect(omit(undefined as unknown as typeof obj, ['a'])).toEqual({});
    });
});
