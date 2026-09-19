import { describe, it, expect } from '@jest/globals';
import {
    groupBy,
    sortArray,
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
// sortArray
// ---------------------------------------------------------------------------

describe('sortArray', () => {
    it('sorts by multiple rules with tie-breakers', () => {
        const users = [
            { lastName: 'Stone', age: 30 },
            { lastName: 'Stone', age: 22 },
            { lastName: 'Adams', age: 40 },
        ];

        const result = [...users].sort(sortArray([
            { property: 'lastName', direction: 'asc' },
            { property: 'age', direction: 'desc' },
        ]));

        expect(result).toEqual([
            { lastName: 'Adams', age: 40 },
            { lastName: 'Stone', age: 30 },
            { lastName: 'Stone', age: 22 },
        ]);
    });

    it('sorts using a selector function', () => {
        const products = [
            { name: 'Mouse', price: 19.99 },
            { name: 'Keyboard', price: 49.99 },
            { name: 'Cable', price: 9.99 },
        ];

        const result = [...products].sort(sortArray([
            { property: item => item.price, direction: 'asc' },
        ]));

        expect(result.map(p => p.name)).toEqual(['Cable', 'Mouse', 'Keyboard']);
    });

    it('sorts dates by timestamp', () => {
        const rows = [
            { at: new Date('2024-06-10') },
            { at: new Date('2022-01-01') },
            { at: new Date('2023-03-15') },
        ];

        const result = [...rows].sort(sortArray([{ property: 'at', direction: 'asc' }]));
        expect(result.map(r => r.at.toISOString().slice(0, 10))).toEqual([
            '2022-01-01',
            '2023-03-15',
            '2024-06-10',
        ]);
    });

    it('puts nullish values last by default', () => {
        const rows = [
            { score: null as number | null | undefined },
            { score: 10 },
            { score: undefined },
            { score: 5 },
        ];

        const result = [...rows].sort(sortArray([{ property: 'score', direction: 'asc' }]));
        expect(result.map(r => r.score)).toEqual([5, 10, null, undefined]);
    });

    it('supports nulls first option', () => {
        const rows = [
            { score: null as number | null | undefined },
            { score: 10 },
            { score: undefined },
            { score: 5 },
        ];

        const result = [...rows].sort(
            sortArray([{ property: 'score', direction: 'asc' }], { nulls: 'first' })
        );
        expect(result.map(r => r.score)).toEqual([null, undefined, 5, 10]);
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

// ---------------------------------------------------------------------------
// Additional Edge Cases for Array Utilities
// ---------------------------------------------------------------------------

describe('groupBy - additional edge cases', () => {
    it('handles arrays with null and undefined elements', () => {
        const arr: Array<{ id: number } | null | undefined> = [{ id: 1 }, null, { id: 2 }, undefined, { id: 1 }];
        const result = groupBy(arr, item => (item ? String(item.id) : 'null'));
        expect(result['1']).toHaveLength(2);
        expect(result['2']).toHaveLength(1);
        expect(result['null']).toHaveLength(2);
    });

    it('handles numeric keys correctly', () => {
        const arr = [{ age: 10 }, { age: 20 }, { age: 10 }];
        const result = groupBy(arr, item => String(item.age));
        expect(result['10']).toHaveLength(2);
        expect(result['20']).toHaveLength(1);
    });

    it('handles empty string as a valid group key', () => {
        const arr = [{ name: '' }, { name: 'test' }, { name: '' }];
        const result = groupBy(arr, item => item.name);
        expect(result['']).toHaveLength(2);
        expect(result['test']).toHaveLength(1);
    });

    it('groups by boolean values', () => {
        const arr = [1, 2, 3, 4, 5, 6];
        const result = groupBy(arr, n => String(n % 2 === 0));
        expect(result['true']).toEqual([2, 4, 6]);
        expect(result['false']).toEqual([1, 3, 5]);
    });
});

describe('sortBy - additional edge cases', () => {
    it('handles null values in selector results', () => {
        const arr = [{ value: 1 }, { value: null }, { value: 3 }];
        const result = sortBy(arr, item => item.value ?? -Infinity);
        expect(result[0]?.value).toBeNull();
    });

    it('sorts dates correctly', () => {
        const dates = [new Date('2026-03-01'), new Date('2026-01-01'), new Date('2026-02-01')];
        const sorted = sortBy(dates, d => d.getTime());
        expect(sorted[0]?.getFullYear()).toBe(2026);
        expect(sorted[0]?.getMonth()).toBe(0); // January
    });

    it('handles negative numbers', () => {
        expect(sortBy([-3, -1, -5, -2], n => n)).toEqual([-5, -3, -2, -1]);
    });

    it('handles floating point numbers', () => {
        expect(sortBy([3.14, 2.71, 3.14159, 2.718], n => n)).toEqual([2.71, 2.718, 3.14, 3.14159]);
    });

    it('maintains stable sort for equal values', () => {
        const arr = [
            { id: 1, value: 5 },
            { id: 2, value: 5 },
            { id: 3, value: 3 },
        ];
        const sorted = sortBy(arr, item => item.value);
        expect(sorted[1]?.id).toBe(1);
        expect(sorted[2]?.id).toBe(2);
    });
});

describe('sortArray - additional edge cases', () => {
    it('returns a comparator function for empty rules array', () => {
        const arr = [{ a: 1 }, { a: 2 }];
        const sorted = [...arr].sort(sortArray([]));
        expect(sorted).toEqual(arr); // No sort rules, order unchanged
    });

    it('sorts with single rule', () => {
        const arr = [{ age: 30 }, { age: 20 }];
        const sorted = [...arr].sort(sortArray([{ property: 'age', direction: 'asc' }]));
        expect(sorted[0]?.age).toBe(20);
    });

    it('sorts with null values', () => {
        const arr = [{ x: 1 }, { x: null }, { x: 3 }];
        const sorted = [...arr].sort(sortArray([{ property: 'x', direction: 'asc' }]));
        expect(sorted[2]?.x).toBeNull(); // nulls last by default
    });
});

describe('distinct - additional edge cases', () => {
    it('handles array with single element', () => {
        expect(distinct([42])).toEqual([42]);
    });

    it('handles array with all null values', () => {
        expect(distinct([null, null, null])).toEqual([null]);
    });

    it('handles array with all undefined values', () => {
        expect(distinct([undefined, undefined])).toEqual([undefined]);
    });

    it('handles mixed null and undefined', () => {
        expect(distinct([null, undefined, null, undefined])).toEqual([null, undefined]);
    });

    it('handles zeros and negative zeros', () => {
        expect(distinct([0, -0, 0])).toEqual([0]);
    });

    it('handles NaN values', () => {
        const result = distinct([NaN, NaN, 1]);
        expect(result).toHaveLength(2);
        expect(result[1]).toBe(1);
    });

    it('preserves order of first occurrence', () => {
        expect(distinct([3, 1, 2, 3, 1])).toEqual([3, 1, 2]);
    });
});

describe('distinctBy - additional edge cases', () => {
    it('handles empty key selector result', () => {
        const arr = [{ name: '' }, { name: 'test' }, { name: '' }];
        const result = distinctBy(arr, item => item.name);
        expect(result).toHaveLength(2);
    });

    it('handles null key results', () => {
        const arr = [{ id: 1 }, { id: null }, { id: 2 }, { id: null }];
        const result = distinctBy(arr, item => item.id);
        expect(result).toHaveLength(3);
    });

    it('handles numeric keys', () => {
        const arr = [{ value: 1 }, { value: 2 }, { value: 1 }];
        const result = distinctBy(arr, item => item.value);
        expect(result).toHaveLength(2);
    });

    it('handles boolean keys', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = distinctBy(arr, n => n % 2 === 0);
        expect(result).toHaveLength(2);
    });
});

describe('chunk - additional edge cases', () => {
    it('handles size larger than array length', () => {
        expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });

    it('handles size equal to array length', () => {
        expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    it('handles single element array', () => {
        expect(chunk([1], 2)).toEqual([[1]]);
    });

    it('handles array with null and undefined elements', () => {
        expect(chunk([1, null, undefined, 2], 2)).toEqual([
            [1, null],
            [undefined, 2],
        ]);
    });

    it('creates single-element chunks when size is 1', () => {
        expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it('handles exact division', () => {
        expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
            [1, 2],
            [3, 4],
            [5, 6],
        ]);
    });
});

describe('moveItem - additional edge cases', () => {
    it('handles moving to same position', () => {
        expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    });

    it('handles single element array', () => {
        expect(moveItem([1], 0, 0)).toEqual([1]);
    });

    it('handles moving last to first', () => {
        expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
    });

    it('handles moving first to last', () => {
        expect(moveItem([1, 2, 3, 4], 0, 3)).toEqual([2, 3, 4, 1]);
    });

    it('handles moving middle element forward', () => {
        expect(moveItem([1, 2, 3, 4, 5], 2, 4)).toEqual([1, 2, 4, 5, 3]);
    });

    it('handles moving middle element backward', () => {
        expect(moveItem([1, 2, 3, 4, 5], 3, 1)).toEqual([1, 4, 2, 3, 5]);
    });

    it('handles array with duplicate values', () => {
        expect(moveItem([1, 2, 2, 3], 1, 3)).toEqual([1, 2, 3, 2]);
    });

    it('returns unchanged copy for negative fromIndex (not supported)', () => {
        expect(moveItem([1, 2, 3, 4], -1, 0)).toEqual([1, 2, 3, 4]);
    });

    it('returns unchanged copy for negative toIndex (not supported)', () => {
        expect(moveItem([1, 2, 3, 4], 0, -1)).toEqual([1, 2, 3, 4]);
    });
});

describe('removeDuplicates - additional edge cases', () => {
    it('handles array with single duplicate', () => {
        expect(removeDuplicates([1, 1])).toEqual([1]);
    });

    it('handles mixed types that are equal', () => {
        expect(removeDuplicates<number | string>([1, '1', 1, '1'])).toEqual([1, '1']);
    });

    it('handles array with objects (reference equality)', () => {
        const obj: { id: number } = { id: 1 };
        expect(distinct([obj, obj, { id: 1 }])).toHaveLength(2);
    });

    it('handles zero and negative zero as same', () => {
        expect(removeDuplicates([0, -0, 0, -0])).toEqual([0]);
    });

    it('handles large arrays efficiently', () => {
        const large = Array.from({ length: 1000 }, (_, i) => i % 100);
        const result = removeDuplicates(large);
        expect(result).toHaveLength(100);
    });

    it('preserves first occurrence order', () => {
        expect(removeDuplicates([5, 3, 5, 1, 3])).toEqual([5, 3, 1]);
    });

    it('handles consecutive duplicates', () => {
        expect(removeDuplicates([1, 1, 1, 2, 2, 3])).toEqual([1, 2, 3]);
    });
});
