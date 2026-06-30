import { describe, it, expect } from '@jest/globals';
import {
    groupBy,
    sortBy,
    distinct,
    distinctBy,
    chunk,
    moveItem,
    removeDuplicates,
} from './index.js';

// ---------------------------------------------------------------------------
// groupBy
// ---------------------------------------------------------------------------

describe('groupBy', () => {
    const people = [
        { name: 'Alice', dept: 'Eng' },
        { name: 'Bob',   dept: 'Mkt' },
        { name: 'Eve',   dept: 'Eng' },
    ];

    it('groups elements by the key returned by keySelector', () => {
        const result = groupBy(people, p => p.dept);
        expect(result['Eng']).toEqual([people[0], people[2]]);
        expect(result['Mkt']).toEqual([people[1]]);
    });

    it('preserves insertion order within each group', () => {
        const result = groupBy([1, 2, 3, 4], n => (n % 2 === 0 ? 'even' : 'odd'));
        expect(result['odd']).toEqual([1, 3]);
        expect(result['even']).toEqual([2, 4]);
    });

    it('returns {} for an empty array', () => {
        expect(groupBy([], p => p)).toEqual({});
    });

    it('returns a single-key record for a single-element array', () => {
        expect(groupBy([{ v: 'x' }], item => item.v)).toEqual({ x: [{ v: 'x' }] });
    });

    it('returns {} for null', () => {
        expect(groupBy(null, () => 'k')).toEqual({});
    });

    it('returns {} for undefined', () => {
        expect(groupBy(undefined, () => 'k')).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// sortBy
// ---------------------------------------------------------------------------

describe('sortBy', () => {
    it('sorts numbers ascending by default', () => {
        expect(sortBy([3, 1, 4, 1, 5], n => n)).toEqual([1, 1, 3, 4, 5]);
    });

    it('sorts numbers descending', () => {
        expect(sortBy([3, 1, 4, 1, 5], n => n, 'desc')).toEqual([5, 4, 3, 1, 1]);
    });

    it('sorts strings alphabetically ascending', () => {
        expect(sortBy(['banana', 'apple', 'cherry'], s => s)).toEqual(['apple', 'banana', 'cherry']);
    });

    it('sorts objects by a numeric property', () => {
        const arr = [{ age: 30 }, { age: 20 }, { age: 25 }];
        expect(sortBy(arr, o => o.age)).toEqual([{ age: 20 }, { age: 25 }, { age: 30 }]);
    });

    it('does not mutate the original array', () => {
        const original = [3, 1, 2];
        sortBy(original, n => n);
        expect(original).toEqual([3, 1, 2]);
    });

    it('returns [] for an empty array', () => {
        expect(sortBy([], n => n)).toEqual([]);
    });

    it('returns a copy for a single-element array', () => {
        expect(sortBy([42], n => n)).toEqual([42]);
    });

    it('returns [] for null', () => {
        expect(sortBy<number>(null, n => n)).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(sortBy<number>(undefined, n => n)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// distinct
// ---------------------------------------------------------------------------

describe('distinct', () => {
    it('removes duplicate primitive values', () => {
        expect(distinct([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('removes duplicate strings', () => {
        expect(distinct(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('keeps separate object references even when their values are identical', () => {
        const obj = { id: 1 };
        const result = distinct([obj, { id: 1 }, obj]);
        // obj appears twice but only one reference; the literal {id:1} is a different ref
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(obj);
    });

    it('returns [] for an empty array', () => {
        expect(distinct([])).toEqual([]);
    });

    it('returns a single-element array unchanged', () => {
        expect(distinct([7])).toEqual([7]);
    });

    it('returns [] for null', () => {
        expect(distinct(null)).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(distinct(undefined)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// distinctBy
// ---------------------------------------------------------------------------

describe('distinctBy', () => {
    it('removes duplicates based on the derived key', () => {
        const arr = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 1, name: 'Duplicate Alice' },
        ];
        expect(distinctBy(arr, item => item.id)).toEqual([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ]);
    });

    it('keeps only the first occurrence when all keys are the same', () => {
        const arr = [{ v: 1 }, { v: 1 }, { v: 1 }];
        expect(distinctBy(arr, item => item.v)).toHaveLength(1);
    });

    it('returns the full array when no keys collide', () => {
        const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
        expect(distinctBy(arr, item => item.id)).toHaveLength(3);
    });

    it('works with a string key selector', () => {
        expect(distinctBy(['apple', 'apricot', 'banana'], s => s[0])).toEqual(['apple', 'banana']);
    });

    it('returns [] for an empty array', () => {
        expect(distinctBy([], () => 'k')).toEqual([]);
    });

    it('returns [] for null', () => {
        expect(distinctBy(null, () => 'k')).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(distinctBy(undefined, () => 'k')).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------

describe('chunk', () => {
    it('splits an array into chunks of the given size', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('splits evenly when the array length is divisible by size', () => {
        expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it('returns a single chunk when size equals the array length', () => {
        expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    it('returns a single chunk when size is larger than the array length', () => {
        expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
    });

    it('returns [] for an empty array', () => {
        expect(chunk([], 3)).toEqual([]);
    });

    it('returns [] for null', () => {
        expect(chunk(null, 2)).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(chunk(undefined, 2)).toEqual([]);
    });

    it('throws RangeError for size 0', () => {
        expect(() => chunk([1, 2, 3], 0)).toThrow(RangeError);
    });

    it('throws RangeError for a negative size', () => {
        expect(() => chunk([1, 2, 3], -1)).toThrow(RangeError);
    });

    it('throws RangeError for Infinity', () => {
        expect(() => chunk([1, 2, 3], Infinity)).toThrow(RangeError);
    });
});

// ---------------------------------------------------------------------------
// moveItem
// ---------------------------------------------------------------------------

describe('moveItem', () => {
    it('moves an element from the start to the end', () => {
        expect(moveItem([1, 2, 3, 4], 0, 3)).toEqual([2, 3, 4, 1]);
    });

    it('moves an element from the end to the start', () => {
        expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
    });

    it('moves an element to a middle position', () => {
        expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    });

    it('returns an unchanged copy when fromIndex equals toIndex', () => {
        const result = moveItem([1, 2, 3], 1, 1);
        expect(result).toEqual([1, 2, 3]);
    });

    it('does not mutate the original array', () => {
        const original = [1, 2, 3, 4];
        moveItem(original, 0, 3);
        expect(original).toEqual([1, 2, 3, 4]);
    });

    it('returns an unchanged copy when fromIndex is out of bounds', () => {
        expect(moveItem([1, 2, 3], 5, 0)).toEqual([1, 2, 3]);
    });

    it('returns an unchanged copy when toIndex is out of bounds', () => {
        expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
    });

    it('returns an unchanged copy when fromIndex is negative', () => {
        expect(moveItem([1, 2, 3], -1, 0)).toEqual([1, 2, 3]);
    });

    it('returns [] for null', () => {
        expect(moveItem(null, 0, 1)).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(moveItem(undefined, 0, 1)).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// removeDuplicates
// ---------------------------------------------------------------------------

describe('removeDuplicates', () => {
    it('removes duplicate numbers', () => {
        expect(removeDuplicates([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('removes duplicate strings', () => {
        expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('removes duplicate booleans', () => {
        expect(removeDuplicates([true, false, true])).toEqual([true, false]);
    });

    it('returns [] for an empty array', () => {
        expect(removeDuplicates([])).toEqual([]);
    });

    it('returns the array unchanged when there are no duplicates', () => {
        expect(removeDuplicates([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('returns a single-element array for all-same-value input', () => {
        expect(removeDuplicates([7, 7, 7])).toEqual([7]);
    });

    it('returns [] for null', () => {
        expect(removeDuplicates(null)).toEqual([]);
    });

    it('returns [] for undefined', () => {
        expect(removeDuplicates(undefined)).toEqual([]);
    });
});
