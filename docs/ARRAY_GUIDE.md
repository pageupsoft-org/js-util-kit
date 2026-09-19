# Array Utilities Guide

Comprehensive guide for `js-util-kit` array utilities.

## Overview

The array module provides type-safe utilities for chunking, deduplication, grouping, and sorting arrays.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `chunk` | Split array into chunks | Pagination, batch processing |
| `distinct` | Remove duplicates (reference equality) | Data cleanup |
| `distinctBy` | Remove duplicates by key function | Object deduplication |
| `removeDuplicates` | Remove duplicate primitives | Primitive array cleanup |
| `groupBy` | Group array by key function | Analytics, categorization |
| `moveItem` | Move element from one index to another | Reordering, drag-and-drop |
| `sortBy` | Sort by selector function | Simple ordering |
| `sortArray` | Build reusable sort comparator rules | Multi-field and locale-aware sorting |

---

## Prerequisites

🌐 **Universal** — works everywhere.

---

## Function Details

### `chunk`

```typescript
chunk<T>(array: readonly T[] | null | undefined, size: number): T[][]
```

**What:** Splits an array into consecutive sub-arrays of at most `size` elements.

**When:** Batch processing API calls, pagination, sending bulk emails in batches, memory-efficient streaming.

**Why:** Manual loop-based chunking is error-prone. This handles edge cases (null/undefined arrays, empty arrays, size validation).

**Example:**
```typescript
import { chunk } from 'js-util-kit';

// Batch API calls
const userIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const batches = chunk(userIds, 3);
// [['u1', 'u2', 'u3'], ['u4', 'u5', 'u6'], ['u7']]

for (const batch of batches) {
  await api.processBatch(batch);
}

// Pagination
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
chunk(items, 4);
// [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]

// Edge cases
chunk(null, 5);       // []
chunk([], 5);         // []
chunk([1, 2, 3], 5);  // [[1, 2, 3]] (size > length)
chunk([1, 2, 3], 1);  // [[1], [2], [3]]

// Throws RangeError for invalid size
chunk([1, 2, 3], 0);      // RangeError: size must be > 0
chunk([1, 2, 3], -1);     // RangeError: size must be > 0
chunk([1, 2, 3], Infinity); // RangeError: size must be finite
```

---

### `distinct`

```typescript
distinct<T>(array: readonly T[] | null | undefined): T[]
```

**What:** Returns a new array containing only the first occurrence of each element, using `Set` (reference equality for objects, value equality for primitives).

**When:** Deduplication of primitives, removing repeated entries. For objects, two values are equal only when they share the same reference.

**Why:** Simple and clean API for removing duplicates. More explicit than spread with Set.

**Example:**
```typescript
import { distinct } from 'js-util-kit';

distinct([1, 2, 2, 3, 1, 4]);           // [1, 2, 3, 4]
distinct(['a', 'b', 'a', 'c', 'b']);    // ['a', 'b', 'c']
distinct([null, undefined, null]);      // [null, undefined]
distinct([]);                           // []
distinct(null);                         // []

// Objects use reference equality
const obj = { id: 1 };
distinct([obj, { id: 1 }, obj]);
// [obj, { id: 1 }] — two different references kept

// Order is preserved
distinct([3, 1, 2, 1, 3]); // [3, 1, 2]
```

**Note:** For object deduplication by property, use `distinctBy` instead.

---

### `distinctBy`

```typescript
distinctBy<T>(
  array: readonly T[] | null | undefined,
  keySelector: (item: T) => unknown
): T[]
```

**What:** Returns a new array containing only the first element for each unique value returned by `keySelector`. Subsequent elements with the same key are discarded.

**When:** Deduplicating objects by a property or computed value.

**Why:** Clean functional API for property-based deduplication without manual Set tracking.

**Example:**
```typescript
import { distinctBy } from 'js-util-kit';

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 1, name: 'Duplicate Alice' }
];

distinctBy(users, u => u.id);
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]

const products = [
  { sku: 'A1', category: 'electronics', price: 100 },
  { sku: 'B2', category: 'clothing', price: 50 },
  { sku: 'C3', category: 'electronics', price: 150 }
];

// Dedupe by category (first seen wins)
distinctBy(products, p => p.category);
// [{ sku: 'A1', category: 'electronics', ... }, { sku: 'B2', category: 'clothing', ... }]

// Dedupe by computed value
distinctBy(users, u => u.name.toLowerCase());

// Edge cases
distinctBy(null, x => x);  // []
distinctBy([], x => x);    // []
```

---

### `removeDuplicates`

```typescript
removeDuplicates<T extends string | number | boolean | bigint>(
  array: readonly T[] | null | undefined
): T[]
```

**What:** Returns a new array with duplicate **primitive** values removed, preserving the first occurrence of each value.

**When:** Deduplication of primitive arrays where type safety for primitives is desired.

**Why:** Typed specifically for primitives where `Set` guarantees value equality. More type-safe than generic `distinct` for primitive-only arrays.

**Example:**
```typescript
import { removeDuplicates } from 'js-util-kit';

removeDuplicates([1, 2, 2, 3, 1]);       // [1, 2, 3]
removeDuplicates(['a', 'b', 'a', 'c']);  // ['a', 'b', 'c']
removeDuplicates([true, false, true]);   // [true, false]
removeDuplicates([1n, 2n, 1n]);          // [1n, 2n]

// Edge cases
removeDuplicates(null);  // []
removeDuplicates([]);    // []

// Order is preserved
removeDuplicates([3, 1, 2, 1, 3]); // [3, 1, 2]
```

---

### `groupBy`

```typescript
groupBy<T>(
  array: readonly T[] | null | undefined,
  keySelector: (item: T) => string
): Record<string, T[]>
```

**What:** Groups the elements of an array into a `Record` keyed by the string returned by `keySelector`.

**When:** Categorization, analytics, reporting, dashboard filtering.

**Why:** Cleaner than manual `reduce` loops with `{}` initialization. The insertion order of each group matches the original array.

**Example:**
```typescript
import { groupBy } from 'js-util-kit';

const users = [
  { name: 'Alice', role: 'admin', dept: 'Eng' },
  { name: 'Bob', role: 'user', dept: 'Mkt' },
  { name: 'Carol', role: 'admin', dept: 'Eng' },
  { name: 'Dave', role: 'user', dept: 'Sales' },
  { name: 'Eve', role: 'user', dept: 'Mkt' },
];

const byDept = groupBy(users, u => u.dept);
// {
//   Eng: [{ name: 'Alice', ... }, { name: 'Carol', ... }],
//   Mkt: [{ name: 'Bob', ... }, { name: 'Eve', ... }],
//   Sales: [{ name: 'Dave', ... }]
// }

const byRole = groupBy(users, u => u.role);
// {
//   admin: [{ name: 'Alice', ... }, { name: 'Carol', ... }],
//   user: [{ name: 'Bob', ... }, { name: 'Dave', ... }, { name: 'Eve', ... }]
// }

// Analytics aggregation
const orders = [
  { product: 'A', quantity: 3, price: 10 },
  { product: 'B', quantity: 1, price: 50 },
  { product: 'A', quantity: 2, price: 10 },
];

const byProduct = groupBy(orders, o => o.product);
// { A: [...], B: [...] }

// Count per group
const counts = Object.fromEntries(
  Object.entries(byProduct).map(([product, items]) => [product, items.length])
);
// { A: 2, B: 1 }

// Edge cases
groupBy(null, x => String(x));  // {}
groupBy([], x => String(x));    // {}
```

---

### `moveItem`

```typescript
moveItem<T>(
  array: readonly T[] | null | undefined,
  fromIndex: number,
  toIndex: number
): T[]
```

**What:** Returns a new array with the element at `fromIndex` moved to `toIndex`, without mutating the original array.

**When:** Reordering lists, drag-and-drop implementations, task prioritization.

**Why:** Immutable array reordering without manual splice operations. Handles out-of-bounds indices gracefully.

**Example:**
```typescript
import { moveItem } from 'js-util-kit';

const items = ['a', 'b', 'c', 'd'];

moveItem(items, 0, 3);
// ['b', 'c', 'd', 'a'] — moved first to last

moveItem(items, 3, 0);
// ['d', 'a', 'b', 'c'] — moved last to first

moveItem(items, 1, 2);
// ['a', 'c', 'b', 'd'] — moved 'b' one position right

// Original unchanged
items; // ['a', 'b', 'c', 'd']

// Out of bounds returns unchanged copy
moveItem(items, 0, 99);  // ['a', 'b', 'c', 'd']
moveItem(items, -1, 2);  // ['a', 'b', 'c', 'd']

// Edge cases
moveItem(null, 0, 1);    // []
moveItem([], 0, 1);      // []
```

---

### `sortBy`

```typescript
sortBy<T>(
  array: readonly T[] | null | undefined,
  selector: (item: T) => number | string,
  direction: 'asc' | 'desc' = 'asc'
): T[]
```

**What:** Returns a new array sorted by the value returned by `selector`, without mutating the original array.

**When:** Flexible sorting without complex comparator functions.

**Why:** Declarative API — specify what to sort by, not how. Supports ascending/descending order.

**Example:**
```typescript
import { sortBy } from 'js-util-kit';

const users = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 },
];

// Sort by name (ascending by default)
sortBy(users, u => u.name);
// [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 35 }, { name: 'Charlie', age: 30 }]

// Sort by age descending
sortBy(users, u => u.age, 'desc');
// [{ name: 'Bob', age: 35 }, { name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }]

// Sort strings
sortBy(['banana', 'apple', 'cherry'], s => s);
// ['apple', 'banana', 'cherry']

sortBy(['banana', 'apple', 'cherry'], s => s, 'desc');
// ['cherry', 'banana', 'apple']

// Sort numbers
sortBy([3, 1, 4, 1, 5, 9, 2, 6], n => n);
// [1, 1, 2, 3, 4, 5, 6, 9]

// Original array unchanged
const original = [3, 1, 2];
sortBy(original, n => n);
original; // [3, 1, 2]

// Edge cases
sortBy(null, x => x);  // []
sortBy([], x => x);    // []
```

---

### `sortArray`

```typescript
sortArray<T>(
  rules: readonly SortRule<T>[],
  options?: SortArrayOptions
): (a: T, b: T) => number
```

**What:** Creates a comparator function that you pass to `Array.prototype.sort`.

**When:** Multi-column sorting, reusable sorting policies, locale-aware string sort, and custom null ordering.

**Why:** More expressive than writing large inline comparator functions repeatedly.

**Example:**
```typescript
import { sortArray } from 'js-util-kit';

const users = [
  { firstName: 'Ava', lastName: 'Stone', age: 30 },
  { firstName: 'Ben', lastName: 'Stone', age: 22 },
  { firstName: 'Cara', lastName: 'Adams', age: 40 },
];

// Sort by last name asc, then age desc
const byLastThenAge = sortArray<typeof users[number]>([
  { property: 'lastName', direction: 'asc' },
  { property: 'age', direction: 'desc' },
]);

const sortedUsers = [...users].sort(byLastThenAge);
// [
//   { firstName: 'Cara', lastName: 'Adams', age: 40 },
//   { firstName: 'Ava', lastName: 'Stone', age: 30 },
//   { firstName: 'Ben', lastName: 'Stone', age: 22 }
// ]

// Sort by selector function + locale-aware string compare
const products = [
  { name: 'Éclair', price: 5 },
  { name: 'apple', price: 3 },
  { name: 'Banana', price: 4 },
];

const byName = sortArray<typeof products[number]>(
  [{ property: (p) => p.name, direction: 'asc' }],
  { locales: 'en', localeCompareOptions: { sensitivity: 'base' } }
);

const sortedProducts = [...products].sort(byName);

// Null handling control
const rows = [
  { label: 'A', score: 10 },
  { label: 'B', score: null },
  { label: 'C', score: undefined },
];

const byScoreNullLast = sortArray<typeof rows[number]>(
  [{ property: 'score', direction: 'asc' }],
  { nulls: 'last' }
);

[...rows].sort(byScoreNullLast);
// [{ label: 'A', score: 10 }, { label: 'B', score: null }, { label: 'C', score: undefined }]
```

---

## Common Patterns

### Pagination with Chunk
```typescript
import { chunk } from 'js-util-kit';

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);
  return { items: paginatedItems, totalPages, totalItems, page };
}

const items = Array.from({ length: 100 }, (_, i) => i + 1);
paginate(items, 3, 10);
// { items: [21..30], totalPages: 10, totalItems: 100, page: 3 }
```

### Data Processing Pipeline
```typescript
import { distinctBy, sortBy, chunk } from 'js-util-kit';

// Process orders: deduplicate by ID, sort by amount, chunk for batch processing
function processOrders(orders: Array<{ id: string; amount: number; status: string }>) {
  const uniqueOrders = distinctBy(orders, o => o.id);
  const sorted = sortBy(uniqueOrders, o => o.amount, 'desc');
  return chunk(sorted, 50);
}
```

### Grouped Bar Chart Data
```typescript
import { groupBy, sortBy } from 'js-util-kit';

const sales = [
  { month: 'Jan', region: 'North', revenue: 10000 },
  { month: 'Jan', region: 'South', revenue: 8000 },
  { month: 'Feb', region: 'North', revenue: 12000 },
  { month: 'Feb', region: 'South', revenue: 9000 },
];

const byMonth = groupBy(sales, s => s.month);
// { Jan: [...], Feb: [...] }

const monthsSorted = sortBy(Object.keys(byMonth), m => m);

// Revenue per region per month
const pivot = monthsSorted.map(month => {
  const items = byMonth[month] || [];
  return {
    month,
    northRevenue: items.find(r => r.region === 'North')?.revenue ?? 0,
    southRevenue: items.find(r => r.region === 'South')?.revenue ?? 0,
    total: items.reduce((sum, r) => sum + r.revenue, 0),
  };
});
```

### Drag-and-Drop Reordering
```typescript
import { moveItem } from 'js-util-kit';

function handleDrop(items: string[], fromIndex: number, toIndex: number) {
  return moveItem(items, fromIndex, toIndex);
}

const tasks = ['Task A', 'Task B', 'Task C', 'Task D'];
const reordered = handleDrop(tasks, 0, 2);
// ['Task B', 'Task C', 'Task A', 'Task D']
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `chunk` | Yes | Yes | None |
| `distinct` | Yes | Yes | None |
| `distinctBy` | Yes | Yes | None |
| `removeDuplicates` | Yes | Yes | None |
| `groupBy` | Yes | Yes | None |
| `moveItem` | Yes | Yes | None |
| `sortBy` | Yes | Yes | None |
| `sortArray` | Yes | Yes | None |