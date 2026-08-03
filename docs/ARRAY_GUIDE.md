# Array Utilities Guide

Comprehensive guide for `@rsiddha/js-utils` array utilities.

## Overview

The array module provides type-safe utilities for chunking, deduplication, shuffling, flattening, grouping, and sorting arrays.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `chunk` | Split array into chunks | Pagination, batch processing |
| `unique` | Remove duplicates | Data cleanup |
| `shuffle` | Randomize array order | Randomization, sampling |
| `flatten` | Flatten nested arrays | Normalizing nested data |
| `groupBy` | Group array by key function | Analytics, categorization |
| `sortBy` | Sort by one or more key functions | Flexible ordering |

---

## Prerequisites

🌐 **Universal** — works everywhere.

---

## Function Details

### `chunk`

```typescript
chunk<T>(array: readonly T[], size: number): readonly T[][]
```

**What:** Splits an array into chunks of the specified size.

**When:** Batch processing API calls, pagination, sending bulk emails in batches, memory-efficient streaming.

**Why:** Manual loop-based chunking is error-prone. This handles edge cases (empty arrays, size > length, size <= 0).

**Example:**
```typescript
import { chunk } from '@rsiddha/js-utils';

// Batch API calls
const userIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const batches = chunk(userIds, 5);
// [['u1', 'u2', 'u3', 'u4', 'u5'], ['u6', 'u7']]

batches.forEach(async (batch) => {
  await api.processBatch(batch);
});

// Pagination
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
chunk(items, 3);
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

// Edge cases
chunk([], 5);         // []
chunk([1, 2, 3], 5); // [[1, 2, 3]] (size > length)
chunk([1, 2, 3], 1);  // [[1], [2], [3]]
chunk([1, 2, 3], 0);  // [[1], [2], [3]] (size 0 = 1)
```

---

### `unique`

```typescript
unique<T>(array: readonly T[]): readonly T[]
```

**What:** Removes duplicate values using strict equality (`===`).

**When:** Deduplication of IDs, removing repeated entries, data normalization.

**Why:** More concise than `Set` conversion with type preservation. Maintains original order.

**Example:**
```typescript
import { unique } from '@rsiddha/js-utils';

unique([1, 2, 2, 3, 1, 4]);           // [1, 2, 3, 4]
unique(['a', 'b', 'a', 'c', 'b']);    // ['a', 'b', 'c']
unique([{ id: 1 }, { id: 1 }]);       // [{ id: 1 }, { id: 1 }] (objects by reference)
unique([null, undefined, null]);       // [null, undefined]
unique([]);                             // []

// Order is preserved
unique([3, 1, 2, 1, 3]); // [3, 1, 2]
```

**Note:** For deduplication by property, use `unique` with `sortBy` or map first:
```typescript
const users = [{ id: 1 }, { id: 2 }, { id: 1 }];
const uniqueUsers = unique(users.map(u => u.id)).map(id => users.find(u => u.id === id)!);
// [{ id: 1 }, { id: 2 }]
```

---

### `shuffle`

```typescript
shuffle<T>(array: readonly T[]): readonly T[]
```

**What:** Returns a shuffled copy of the array using Fisher-Yates algorithm.

**When:** Randomizing lists, random sampling, card games, recommendation ordering.

**Why:** Immutable (original unchanged), cryptographically secure random source, unbiased shuffle.

**Example:**
```typescript
import { shuffle } from '@rsiddha/js-utils';

const original = ['a', 'b', 'c', 'd', 'e'];
const shuffled = shuffle(original);

// original is unchanged
original; // ['a', 'b', 'c', 'd', 'e']

// shuffled is a randomized copy
shuffled; // e.g., ['d', 'a', 'e', 'c', 'b']

// Random recommendation
const products = ['p1', 'p2', 'p3', 'p4', 'p5'];
const featured = shuffle(products).slice(0, 3);
// e.g., ['p4', 'p1', 'p5']

// Empty and single-element arrays
shuffle([]);     // []
shuffle(['only']); // ['only']
```

---

### `flatten`

```typescript
flatten<T>(array: readonly (T | readonly T[])[]): readonly T[]
```

**What:** Flattens one level of nesting.

**When:** Normalizing nested arrays from APIs, reducing depth for processing.

**Why:** Shallow flatten only — does not recursively flatten to avoid unexpected behavior.

**Example:**
```typescript
import { flatten } from '@rsiddha/js-utils';

flatten([[1, 2], [3, 4], [5]]);        // [1, 2, 3, 4, 5]
flatten([1, [2, 3], 4]);               // [1, 2, 3, 4]
flatten([[1, [2, 3]], [4]]);          // [1, [2, 3], 4] (only one level)
flatten([]);                              // []
flatten([[[1]], [[2]]]);               // [[1], [2]] (nested arrays remain)
flatten([1, 2, 3]);                     // [1, 2, 3] (no nesting)
```

**Deep flatten (for nested arrays):**
```typescript
function deepFlatten<T>(arr: unknown[]): T[] {
  return arr.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) return acc.concat(deepFlatten(item));
    return [...acc, item as T];
  }, []);
}

deepFlatten([[1, [2]], [3, [4, [5]]]]); // [1, 2, 3, 4, 5]
```

---

### `groupBy`

```typescript
groupBy<T>(array: readonly T[], keyFn: (item: T) => string): Record<string, readonly T[]>
```

**What:** Groups array elements by the value returned by a key function.

**When:** Categorization, analytics, reporting, dashboard filtering.

**Why:** Cleaner than manual `reduce` loops with `{}` initialization.

**Example:**
```typescript
import { groupBy } from '@rsiddha/js-utils';

const users = [
  { name: 'Alice', role: 'admin', dept: 'engineering' },
  { name: 'Bob', role: 'user', dept: 'marketing' },
  { name: 'Carol', role: 'admin', dept: 'engineering' },
  { name: 'Dave', role: 'user', dept: 'sales' },
  { name: 'Eve', role: 'user', dept: 'marketing' },
];

const byDept = groupBy(users, (u) => u.dept);
// {
//   engineering: [{ name: 'Alice', ... }, { name: 'Carol', ... }],
//   marketing: [{ name: 'Bob', ... }, { name: 'Eve', ... }],
//   sales: [{ name: 'Dave', ... }],
// }

const byRole = groupBy(users, (u) => u.role);
// {
//   admin: [{ name: 'Alice', ... }, { name: 'Carol', ... }],
//   user: [{ name: 'Bob', ... }, { name: 'Dave', ... }, { name: 'Eve', ... }],
// }

// Analytics aggregation
const orders = [
  { product: 'A', quantity: 3, price: 10 },
  { product: 'B', quantity: 1, price: 50 },
  { product: 'A', quantity: 2, price: 10 },
];

const revenueByProduct = groupBy(orders, (o) => o.product);
// { A: [{ quantity: 3, price: 10 }, { quantity: 2, price: 10 }], B: [{ quantity: 1, price: 50 }] }

// Count per group (using groupBy + map)
const counts = Object.fromEntries(
  Object.entries(groupBy(users, (u) => u.dept)).map(([dept, members]) => [dept, members.length])
);
// { engineering: 2, marketing: 2, sales: 1 }
```

---

### `sortBy`

```typescript
sortBy<T>(array: readonly T[], keyFn: (item: T) => string | number, order?: 'asc' | 'desc'): readonly T[]
```

**What:** Sorts array by a key function, returning a new array.

**When:** Flexible sorting without localeCompare or manual comparator functions.

**Why:** Declarative API — specify what to sort by, not how. Supports ascending/descending order.

**Example:**
```typescript
import { sortBy } from '@rsiddha/js-utils';

const users = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 },
];

// Sort by name (ascending by default)
sortBy(users, (u) => u.name);
// [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 35 }, { name: 'Charlie', age: 30 }]

// Sort by age descending
sortBy(users, (u) => u.age, 'desc');
// [{ name: 'Bob', age: 35 }, { name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }]

// Sort by string with locale awareness
sortBy(['café', 'apple', 'Zebra'], (s) => s);
// ['apple', 'café', 'Zebra'] (case-sensitive)

// Sort numbers
sortBy([3, 1, 4, 1, 5, 9, 2, 6], (n) => n);
// [1, 1, 2, 3, 4, 5, 6, 9]

// Original array unchanged
sortBy(users, (u) => u.age);
users; // still in original order

// Empty array
sortBy([], (x) => x); // []
```

---

## Common Patterns

### Pagination with Chunk + Slice
```typescript
import { chunk } from '@rsiddha/js-utils';

function paginate<T>(items: readonly T[], page: number, pageSize: number): { items: readonly T[]; totalPages: number; totalItems: number } {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);
  return { items: paginatedItems, totalPages, totalItems };
}

const items = Array.from({ length: 100 }, (_, i) => i + 1);
paginate(items, 3, 10); // { items: [21..30], totalPages: 10, totalItems: 100 }
```

### Data Processing Pipeline
```typescript
import { shuffle, chunk, sortBy, unique, flatten } from '@rsiddha/js-utils';

// Process orders: deduplicate, sort, chunk for batch processing
function processOrders(orders: Array<{ id: string; amount: number; status: string }>): readonly readonly { id: string; amount: number }[][] {
  const uniqueOrders = unique(orders.map(o => o.id)).map(id => orders.find(o => o.id === id)!);
  const sorted = sortBy(uniqueOrders, (o) => o.amount, 'desc');
  return chunk(sorted, 50);
}
```

### Grouped Bar Chart Data
```typescript
import { groupBy, sortBy } from '@rsiddha/js-utils';

const sales = [
  { month: 'Jan', region: 'North', revenue: 10000 },
  { month: 'Jan', region: 'South', revenue: 8000 },
  { month: 'Feb', region: 'North', revenue: 12000 },
  { month: 'Feb', region: 'South', revenue: 9000 },
  { month: 'Mar', region: 'North', revenue: 11000 },
  { month: 'Mar', region: 'South', revenue: 15000 },
];

const byMonth = groupBy(sales, (s) => s.month);
// { Jan: [...], Feb: [...], Mar: [...] }

const monthsSorted = sortBy(Object.keys(byMonth), (m) => m);
// ['Feb', 'Jan', 'Mar']

// Revenue per region per month
const pivot = monthsSorted.map(month => {
  const regionMap = byMonth[month];
  return {
    month,
    northRevenue: regionMap.find(r => r.region === 'North')?.revenue ?? 0,
    southRevenue: regionMap.find(r => r.region === 'South')?.revenue ?? 0,
    total: regionMap.reduce((sum, r) => sum + r.revenue, 0),
  };
});
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `chunk` | Yes | Yes | None |
| `unique` | Yes | Yes | None |
| `shuffle` | Yes | Yes | None |
| `flatten` | Yes | Yes | None |
| `groupBy` | Yes | Yes | None |
| `sortBy` | Yes | Yes | None |