# URL Utilities Guide

Comprehensive guide for `@rsiddha/js-utils` URL utilities.

## Overview

The URL module provides utilities for parsing, building, and manipulating URLs and query strings. All functions work in both browser and Node.js.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `parseQueryString` | Parse query string to object | Extracting URL parameters |
| `buildQueryString` | Build query string from object | Constructing API URLs |
| `appendQueryParameters` | Append params to existing URL | Pagination, filters |
| `getBaseUrl` | Extract base URL | API base configuration |

---

## Function Details

### `parseQueryString`

```typescript
parseQueryString(queryString: string): Record<string, string>
```

**What:** Parses a query string into a key-value object.

**When:** Extracting URL parameters for routing, search, or API calls.

**Why:** Consistent parsing without regex. Handles URL encoding automatically.

**Example:**
```typescript
import { parseQueryString } from '@rsiddha/js-utils';

parseQueryString('name=John&age=30');
// { name: 'John', age: '30' }

parseQueryString('?q=search+term&page=2');
// { q: 'search term', page: '2' }

parseQueryString('');
// {}

parseQueryString('?single');
// { single: '' }

parseQueryString('items%5B0%5D=apple&items%5B1%5D=banana');
// { 'items[0]': 'apple', 'items[1]': 'banana' }
```

**Note:** Values are always strings. Use `+` for spaces which are decoded automatically. Duplicate keys use the last value.

---

### `buildQueryString`

```typescript
buildQueryString(params: Record<string, unknown>): string
```

**What:** Builds a query string from an object. Values are URL-encoded.

**When:** Constructing GET request URLs, pagination links, filter parameters.

**Why:** Consistent encoding without manual `encodeURIComponent` calls.

**Example:**
```typescript
import { buildQueryString } from '@rsiddha/js-utils';

buildQueryString({ name: 'John Doe', age: 30 });
// 'name=John+Doe&age=30'

buildQueryString({ q: 'hello world', page: 2, limit: 25 });
// 'q=hello+world&page=2&limit=25'

buildQueryString({});
// ''

buildQueryString({ filter: null, sort: 'name' });
// 'filter=null&sort=name'

buildQueryString({ search: 'café', tag: 'hello & world' });
// 'search=caf%C3%A9&tag=hello+%26+world'
```

**Note:** `null` and `undefined` values are converted to their string representations. Arrays are joined with commas.

---

### `appendQueryParameters`

```typescript
appendQueryParameters(url: string, params: Record<string, unknown>): string
```

**What:** Appends query parameters to an existing URL, preserving existing params.

**When:** Adding pagination, filters, or sort options to URLs. SPA route changes.

**Why:** Merges new params without losing existing ones or double-encoding.

**Example:**
```typescript
import { appendQueryParameters } from '@rsiddha/js-utils';

appendQueryParameters('/api/users', { page: 1, limit: 20 });
// '/api/users?page=1&limit=20'

appendQueryParameters('/api/users?q=john', { page: 2, sort: 'name' });
// '/api/users?q=john&page=2&sort=name'

appendQueryParameters('/api/users?q=search', {});
// '/api/users?q=search'

appendQueryParameters('/api/users', {});
// '/api/users'
```

**Existing params:** Preserved. If a param key already exists, the new value overwrites it.

---

### `getBaseUrl`

```typescript
getBaseUrl(url: string): string
```

**What:** Extracts the base URL (protocol + host + pathname) without query strings or hashes.

**When:** Determining API base URL, extracting origin, routing logic.

**Why:** Reliable base URL extraction without brittle string splitting.

**Example:**
```typescript
import { getBaseUrl } from '@rsiddha/js-utils';

getBaseUrl('https://example.com/api/users?id=1#section');
// 'https://example.com/api/users'

getBaseUrl('https://api.example.com/v2/items?page=2');
// 'https://api.example.com/v2/items'

getBaseUrl('http://localhost:3000/');
// 'http://localhost:3000/'

getBaseUrl('/relative/path?q=1');
// '/relative/path'
```

---

## Common Patterns

### Pagination Component
```typescript
import { parseQueryString, buildQueryString, appendQueryParameters } from '@rsiddha/js-utils';

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    return `${window.location.pathname}?${buildQueryString(Object.fromEntries(params))}`;
  };

  return (
    <nav>
      {Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <a key={page} href={buildPageUrl(page)} className={isActive ? 'active' : ''}>
            {page}
          </a>
        );
      })}
    </nav>
  );
}
```

### API Client with URL Helpers
```typescript
import { appendQueryParameters, parseQueryString, getBaseUrl } from '@rsiddha/js-utils';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    return params ? appendQueryParameters(url, params) : url;
  }

  private async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  // Usage
  async getUsers(filters: { page?: number; limit?: number; q?: string }): Promise<unknown[]> {
    return this.get('/users', filters);
  }
}

const client = new ApiClient('https://api.example.com');
client.getUsers({ page: 2, limit: 25, q: 'john' });
// Fetches: https://api.example.com/users?page=2&limit=25&q=john
```

### Deep Link Handling
```typescript
import { parseQueryString, buildQueryString, appendQueryParameters } from '@rsiddha/js-utils';

function updateDeepLink(params: Record<string, unknown>): void {
  const current = parseQueryString(window.location.search.replace('?', ''));
  const merged = { ...current, ...params };
  const newQuery = buildQueryString(merged);
  window.history.replaceState(null, '', `?${newQuery}`);
}

// Update filter without page reload
updateDeepLink({ category: 'electronics', page: 1 });
// URL becomes: ?category=electronics&page=1
// Preserve other existing params like sort, view, etc.
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `parseQueryString` | Yes | Yes | None |
| `buildQueryString` | Yes | Yes | None |
| `appendQueryParameters` | Yes | Yes | None |
| `getBaseUrl` | Yes | Yes | None |