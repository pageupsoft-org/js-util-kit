# Object Utilities Guide

Comprehensive guide for `@rsiddha/js-utils` object utilities.

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

**What:** Creates a deep copy of any value, including objects with circular references.

**When:** State snapshots, undo/redo stacks, immutable updates, cloning config objects.

**Why:** Structured cloning (`structuredClone`) is not available in all environments. `JSON.parse(JSON.stringify())` loses types, Date, RegExp, Map, Set, etc.

**Example:**
```typescript
import { deepClone } from '@rsiddha/js-utils';

const original = {
  name: 'config',
  nested: { value: 42, items: [1, 2, 3] },
  date: new Date('2026-07-30'),
  regex: /test/gi,
};

const clone = deepClone(original);
clone.nested.value = 99;
clone.date.setFullYear(2027);

original.nested.value; // 42 (unchanged)
original.date.getFullYear(); // 2026 (unchanged)

// Circular references
const circular: any = { name: 'root' };
circular.self = circular;
const clonedCircular = deepClone(circular);
console.log(clonedCircular.self === clonedCircular); // true (preserved)

// Arrays and Maps
deepClone(new Map([['key', 'value']]));
deepClone(new Set([1, 2, 3]));
deepClone([1, { a: 2 }, [3, 4]]);
```

**Preserves:** `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, `TypedArray`, `URL`, `URLSearchParams`, circular references, prototypes (via `Object.create`).

---

### `mergeObjects`

```typescript
mergeObjects<T extends Record<string, unknown>>(...objects: (T | undefined | null)[]): T
```

**What:** Deep merges multiple objects into one. Later objects override earlier ones.

**When:** Config composition, applying defaults over user preferences, combining settings.

**Why:** Shallow spread (`{ ...a, ...b }`) only merges one level deep. Nested objects get replaced entirely.

**Example:**
```typescript
import { mergeObjects } from '@rsiddha/js-utils';

const defaults = {
  theme: 'light',
  font: { size: 14, family: 'Arial', weight: 'normal' },
  notifications: { email: true, push: false },
};

const userPrefs = {
  theme: 'dark',
  font: { size: 16, weight: 'bold' },
};

const config = mergeObjects(defaults, userPrefs);
// {
//   theme: 'dark',                // overridden
//   font: { size: 16, family: 'Arial', weight: 'bold' }, // deep merged
//   notifications: { email: true, push: false }, // preserved
// }
```

**Merge Rules:**
- Primitives: later value wins
- Objects: deep recursive merge
- Arrays: later array replaces earlier (no concatenation)
- `null`/`undefined` sources are skipped
- Original objects are not mutated (pure function)

```typescript
// Safe defaults pattern
function createConfig(userInput: Record<string, unknown>) {
  return mergeObjects(
    {
      timeout: 30000,
      retries: 3,
      logging: { level: 'info', pretty: false },
    },
    userInput,
  );
}
```

---

### `pick`

```typescript
pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>
```

**What:** Creates a new object with only the specified keys.

**When:** Selecting fields for API responses, creating subsets of large objects, DTO mapping.

**Why:** TypeScript enforces type safety — keys not in `T` are rejected at compile time.

**Example:**
```typescript
import { pick } from '@rsiddha/js-utils';

const user = {
  id: 'u-123',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret',
  ssn: '123-45-6789',
  role: 'admin',
  createdAt: new Date(),
};

// Safe: TypeScript enforces the keys exist on user
const publicProfile = pick(user, ['id', 'name', 'email', 'role']);
// { id: 'u-123', name: 'John Doe', email: 'john@example.com', role: 'admin' }

// Empty keys list returns empty object
pick(user, []); // {}

// Non-existent key (TypeScript error at compile time)
// pick(user, ['nonexistent']); // ❌ Compile error

// Works with interfaces
interface UserDTO { id: string; name: string; email: string; }
const dto = pick(user, ['id', 'name', 'email']) as UserDTO;
```

---

### `omit`

```typescript
omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>
```

**What:** Creates a new object without the specified keys. Opposite of `pick`.

**When:** Stripping sensitive data before logging, removing internal fields for API responses, sanitizing request payloads.

**Why:** Cleaner than manually destructuring or filtering keys.

**Example:**
```typescript
import { omit } from '@rsiddha/js-utils';

const internal = {
  id: 'u-123',
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: '$2b$12$...',
  apiKey: 'sk-abc123',
  ssn: '123-45-6789',
};

// Remove sensitive fields before logging
const safe = omit(internal, ['passwordHash', 'apiKey', 'ssn']);
// { id: 'u-123', name: 'John Doe', email: 'john@example.com' }

// Sanitize for API response (remove internal fields)
const apiResponse = omit(internal, ['passwordHash']);
// { id: 'u-123', name: 'John Doe', email: 'john@example.com', apiKey: 'sk-abc123', ssn: '123-45-6789' }
```

---

### `isEqual`

```typescript
isEqual(a: unknown, b: unknown): boolean
```

**What:** Deep equality check supporting circular references, `Date`, `RegExp`, `Map`, `Set`, typed arrays.

**When:** Detecting state changes, memoization, testing, diffing.

**Why:** `===` only checks reference equality; `JSON.stringify` loses type fidelity and fails on circular refs.

**Example:**
```typescript
import { isEqual } from '@rsiddha/js-utils';

// Primitives
isEqual(1, 1);                     // true
isEqual('a', 'a');                 // true
isEqual(null, null);               // true
isEqual(0, -0);                    // false (distinguishes -0 from +0)
isEqual(NaN, NaN);                 // true (matches JSON.stringify behavior)

// Objects
isEqual({ a: 1, b: 2 }, { a: 1, b: 2 });     // true
isEqual({ a: 1 }, { a: 1, b: 2 });            // false
isEqual({ a: { b: { c: 3 } } }, { a: { b: { c: 3 } } }); // true (deep)

// Arrays
isEqual([1, 2, 3], [1, 2, 3]);               // true
isEqual([1, 2], [1, 2, 3]);                  // false
isEqual([1, 2, 3], [1, 3, 2]);               // false (order matters)

// Date
isEqual(new Date('2026-01-01'), new Date('2026-01-01')); // true

// Map and Set
isEqual(new Map([['a', 1]]), new Map([['a', 1]])); // true
isEqual(new Set([1, 2, 3]), new Set([1, 2, 3]));   // true

// Circular references
const a: any = { name: 'root' };
a.self = a;
const b: any = { name: 'root' };
b.self = b;
isEqual(a, b);          // true (circular refs handled)
isEqual(a, { name: 'root' }); // false (different structure)
```

---

### `removeEmptyProperties`

```typescript
removeEmptyProperties<T extends Record<string, unknown>>(obj: T, options?: RemoveOptions): Partial<T>
interface RemoveOptions {
  removeNull?: boolean;      // default: true
  removeUndefined?: boolean;  // default: true
  removeEmptyString?: boolean; // default: true
  removeZero?: boolean;       // default: false
  removeNaN?: boolean;       // default: false
}
```

**What:** Removes properties with empty/nullish/falsy values from an object.

**When:** Cleanup API payloads before sending to database, reducing object size, preparing clean query params.

**Why:** Many databases/ORMs fail on null/undefined keys or ignore them unexpectedly.

**Example:**
```typescript
import { removeEmptyProperties } from '@rsiddha/js-utils';

const dirty = {
  name: 'John',
  email: '',
  phone: null,
  address: undefined,
  age: 0,
  active: false,
  nickname: '   ',
};

// Default (removes null, undefined, empty string)
removeEmptyProperties(dirty);
// { name: 'John', age: 0, active: false }

// Preserve zeros (useful for numeric fields)
removeEmptyProperties(dirty, { removeZero: false });
// { name: 'John', age: 0, active: false }

// Keep empty strings as placeholders
removeEmptyProperties(dirty, { removeEmptyString: false });
// { name: 'John', email: '', age: 0, active: false }

// Remove ALL falsy values including false
removeEmptyProperties(dirty, { removeZero: true, removeNaN: true });
// { name: 'John' }

// Note: '   ' (whitespace-only string) is NOT removed by default
// Use with trim + removeEmptyString for whitespace removal
```

---

## Common Patterns

### Immutable State Update
```typescript
import { deepClone, pick } from '@rsiddha/js-utils';

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
import { pick, omit } from '@rsiddha/js-utils';

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
import { mergeObjects } from '@rsiddha/js-utils';

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
import { isEqual } from '@rsiddha/js-utils';
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
import { removeEmptyProperties, buildQueryString } from '@rsiddha/js-utils';

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