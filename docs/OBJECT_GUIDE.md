# Object Utilities Guide

Comprehensive guide for `js-util-kit` object utilities.

## Overview

The object module provides type-safe utilities for deep cloning, merging, picking, omitting, comparing, and cleaning objects.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `deepClone` | Deep clone with circular reference support | State snapshots, immutability |
| `mergeObjects` | Deep merge multiple objects | Config composition, defaults |
| `pick` | Extract specified keys | API responses, DTOs |
| `omit` | Remove specified keys | Sanitization, security |
| `isEqual` | Deep equality check | Change detection, memoization |
| `removeEmptyProperties` | Remove null/undefined/empty values | API payload cleanup |

---

## Function Details

### `deepClone`

```typescript
deepClone<T>(value: T): T
```

**What:** Creates a deep copy of a value using `structuredClone` when available (Node.js ≥ 17, modern browsers). Falls back to `JSON.parse(JSON.stringify(value))` in older environments.

**When:** State snapshots, undo/redo stacks, immutable updates, cloning config objects.

**Why:** Provides consistent deep cloning across environments. `structuredClone` preserves more types than JSON serialization.

**Example:**
```typescript
import { deepClone } from 'js-util-kit';

const original = {
  name: 'config',
  nested: { value: 42, items: [1, 2, 3] },
};

const clone = deepClone(original);
clone.nested.value = 99;

original.nested.value; // 42 (unchanged)

// Arrays
const arr = [1, { a: 2 }, [3, 4]];
const clonedArr = deepClone(arr);

// Primitives and null/undefined
deepClone(null);      // null
deepClone(undefined); // undefined
deepClone(42);        // 42
deepClone('text');    // 'text'
```

**Preserves (in structuredClone environments):** `Date`, `Map`, `Set`, `RegExp`, `ArrayBuffer`, `TypedArray`, circular references.

**Fallback Limitations (JSON-based):** Does not preserve `Date` objects (converted to strings), `undefined` values, `Map`, `Set`, `RegExp`, or circular references.

---

### `mergeObjects`

```typescript
mergeObjects<T extends object, S extends object>(
  target: T | null | undefined,
  source: S | null | undefined
): T & S
```

**What:** Deep-merges `source` into `target` and returns a new object without mutating either input. When the same key holds a plain object in both inputs, the objects are merged recursively.

**When:** Config composition, applying defaults over user preferences, combining settings.

**Why:** Shallow spread (`{ ...a, ...b }`) only merges one level deep. Nested objects get replaced entirely.

**Example:**
```typescript
import { mergeObjects } from 'js-util-kit';

const defaults = {
  theme: 'light',
  font: { size: 14, family: 'Arial' },
  notifications: { email: true, push: false },
};

const userPrefs = {
  theme: 'dark',
  font: { size: 16 },
};

const config = mergeObjects(defaults, userPrefs);
// {
//   theme: 'dark',                              // overridden
//   font: { size: 16, family: 'Arial' },        // deep merged
//   notifications: { email: true, push: false } // preserved
// }

// Null/undefined handling
mergeObjects(null, { a: 1 });  // { a: 1 }
mergeObjects({ a: 1 }, null);  // { a: 1 }
mergeObjects(null, null);      // {}
```

**Merge Rules:**
- Primitives: source value wins
- Plain objects: deep recursive merge
- Arrays: source array replaces target (no concatenation)
- `null`/`undefined` inputs are treated as `{}`
- Original objects are not mutated (pure function)

---

### `pick`

```typescript
pick<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  keys: readonly K[]
): Pick<T, K>
```

**What:** Returns a new object containing only the specified keys from `obj`.

**When:** Selecting fields for API responses, creating subsets of large objects, DTO mapping.

**Why:** TypeScript enforces type safety — keys not in `T` are rejected at compile time.

**Example:**
```typescript
import { pick } from 'js-util-kit';

const user = {
  id: 'u-123',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret',
  role: 'admin',
};

const publicProfile = pick(user, ['id', 'name', 'email', 'role']);
// { id: 'u-123', name: 'John Doe', email: 'john@example.com', role: 'admin' }

// Null handling
pick(null, ['id']);  // {}
pick(user, []);      // {}
```

---

### `omit`

```typescript
omit<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  keys: readonly K[]
): Omit<T, K>
```

**What:** Returns a new object with the specified keys excluded from `obj`. Opposite of `pick`.

**When:** Stripping sensitive data before logging, removing internal fields for API responses.

**Why:** Cleaner than manually destructuring or filtering keys.

**Example:**
```typescript
import { omit } from 'js-util-kit';

const internal = {
  id: 'u-123',
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: '$2b$12$...',
  apiKey: 'sk-abc123',
};

// Remove sensitive fields
const safe = omit(internal, ['passwordHash', 'apiKey']);
// { id: 'u-123', name: 'John Doe', email: 'john@example.com' }

// Null handling
omit(null, ['password']);  // {}
```

---

### `isEqual`

```typescript
isEqual(a: unknown, b: unknown): boolean
```

**What:** Performs a recursive deep equality check between two values. Uses value semantics: two `Date` objects with the same timestamp are equal, and two plain objects with the same keys and values are equal regardless of reference identity.

**When:** Detecting state changes, memoization, testing, diffing.

**Why:** `===` only checks reference equality; `JSON.stringify` loses type fidelity and fails on circular refs.

**Supports:** Primitives, `null`, `undefined`, `Date`, `Array`, and plain objects. Circular references are handled safely.

**Does not support:** `Map`, `Set`, `RegExp`, or class instances with custom equality (these are compared by reference only).

**Example:**
```typescript
import { isEqual } from 'js-util-kit';

// Primitives
isEqual(1, 1);           // true
isEqual('a', 'a');       // true
isEqual(null, null);     // true

// Objects
isEqual({ a: 1, b: 2 }, { a: 1, b: 2 });  // true
isEqual({ a: 1 }, { a: 1, b: 2 });        // false
isEqual({ a: { b: { c: 3 } } }, { a: { b: { c: 3 } } }); // true

// Arrays
isEqual([1, 2, 3], [1, 2, 3]);  // true
isEqual([1, 2], [1, 2, 3]);     // false

// Date
isEqual(new Date('2026-01-01'), new Date('2026-01-01')); // true

// Map/Set compared by reference only
const map = new Map([['a', 1]]);
isEqual(map, map);                               // true
isEqual(new Map([['a', 1]]), new Map([['a', 1]])); // false

// Circular references
const a: any = { name: 'root' };
a.self = a;
const b: any = { name: 'root' };
b.self = b;
isEqual(a, b); // true
```

---

### `removeEmptyProperties`

```typescript
removeEmptyProperties<T extends object>(
  obj: T | null | undefined
): Partial<T>
```

**What:** Returns a shallow copy of an object with all "empty" properties removed. A property is considered **empty** when its value is strictly `null`, `undefined`, or an empty string (`''`).

**When:** Cleanup API payloads before sending, reducing object size, preparing clean query params.

**Why:** All other falsy values — `0`, `false`, `NaN`, and empty arrays or objects — are retained.

**Example:**
```typescript
import { removeEmptyProperties } from 'js-util-kit';

const dirty = {
  name: 'John',
  email: '',
  phone: null,
  address: undefined,
  age: 0,
  active: false,
};

removeEmptyProperties(dirty);
// { name: 'John', age: 0, active: false }

// Null handling
removeEmptyProperties(null);  // {}

// Only owns enumerable string-keyed properties are inspected
// Nested objects are not recursively pruned
```

---

## Common Patterns

### Immutable State Update
```typescript
import { deepClone, pick } from 'js-util-kit';

interface State {
  users: Record<string, { name: string; email: string; role: string }>;
  selectedId: string | null;
}

function updateUserRole(state: State, userId: string, newRole: string): State {
  const next = deepClone(state);
  if (next.users[userId]) {
    next.users[userId].role = newRole;
  }
  return next;
}
```

### API Response Builder
```typescript
import { pick, omit } from 'js-util-kit';

interface UserDocument {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  ssn: string;
  role: 'admin' | 'user' | 'readonly';
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(doc: UserDocument) {
  return pick(doc, ['id', 'name', 'email', 'role', 'createdAt']);
}

function toAdminUser(doc: UserDocument) {
  return omit(doc, ['passwordHash', 'ssn']);
}

function toLoginResponse(doc: UserDocument, token: string) {
  return {
    token,
    user: pick(doc, ['id', 'name', 'email', 'role']),
  };
}
```

### Config Merger with Deep Defaults
```typescript
import { mergeObjects } from 'js-util-kit';

const APP_DEFAULTS = {
  server: { port: 3000, host: '0.0.0.0', timeout: 30000 },
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  logging: { level: 'info', format: 'json', pretty: false },
  rateLimit: { max: 100, window: 60000 },
};

function loadConfig(envConfig: Record<string, unknown>) {
  return mergeObjects(APP_DEFAULTS, envConfig);
}
```

### Change Detection for React
```typescript
import { isEqual } from 'js-util-kit';
import { useRef, useMemo } from 'react';

function useDeepCompareMemo<T>(factory: () => T, deps: unknown[]): T {
  const prevDeps = useRef(deps);
  const changed = !isEqual(prevDeps.current, deps);
  prevDeps.current = deps;

  return useMemo(factory, changed ? deps : []);
}
```

### Clean Query Params
```typescript
import { removeEmptyProperties } from 'js-util-kit';
import { buildQueryString } from 'js-util-kit';

function buildSearchParams(filters: Record<string, unknown>): string {
  const cleaned = removeEmptyProperties(filters);
  return buildQueryString(cleaned);
}

buildSearchParams({
  name: 'John',
  email: '',     // removed
  status: null,  // removed
  page: 1,
  active: false, // preserved (boolean)
});
// 'name=John&page=1&active=false'
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `deepClone` | ✅ | ✅ | None |
| `mergeObjects` | ✅ | ✅ | None |
| `pick` | ✅ | ✅ | None |
| `omit` | ✅ | ✅ | None |
| `isEqual` | ✅ | ✅ | None |
| `removeEmptyProperties` | ✅ | ✅ | None |

All functions are **pure** — original objects are never mutated.