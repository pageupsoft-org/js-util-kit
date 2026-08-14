# Storage Utilities Guide

Comprehensive guide for `js-util-kit` browser storage utilities (`localStorage` / `sessionStorage`).

## Overview

The storage module provides type-safe wrappers around browser storage APIs. Values are automatically serialized/deserialized as JSON, eliminating the common `localStorage.setItem` bug where you accidentally store `[object Object]`.

## Exports

| Function | Description |
|----------|-------------|
| `setItem` | Type-safe storage setter with JSON serialization |
| `getItem` | Type-safe storage getter with JSON deserialization |
| `removeItem` | Remove key from storage |
| `clearItems` | Clear all items from storage |

## Prerequisites

🌍 **Browser Only** — these utilities require the browser `localStorage` or `sessionStorage` APIs. They do not work in Node.js.

---

## Function Details

### `setItem`

```typescript
setItem<T>(storage: 'local' | 'session', key: string, value: T): void
```

**What:** Stores a value serialized as JSON in browser storage.

**When:** Persisting user preferences, theme settings, cached API data, form drafts, authentication tokens.

**Why:** Automatic JSON serialization — no more `JSON.stringify` bugs. Type-safe with generics for reading back.

**Example:**
```typescript
import { setItem, getItem } from 'js-util-kit';

// Store primitives
setItem('local', 'theme', 'dark');
setItem('local', 'fontSize', 14);
setItem('local', 'notificationsEnabled', true);

// Store objects (auto-serialized)
setItem('local', 'userPrefs', {
  theme: 'dark',
  fontSize: 14,
  recentFiles: ['file1.ts', 'file2.ts'],
});

// Store arrays
setItem('local', 'recentSearches', ['react', 'typescript', 'utils']);

// Use sessionStorage instead of localStorage
setItem('session', 'tempToken', 'eyJhbGciOiJIUzI1NiJ9...');
```

**Error Handling:** If `localStorage` is full (quota exceeded), the function silently catches the error.

---

### `getItem`

```typescript
getItem<T>(storage: 'local' | 'session', key: string, fallback?: T): T
```

**What:** Retrieves and parses JSON from browser storage.

**When:** Reading user settings, cached data, or any previously stored value.

**Why:** Automatic JSON parsing with a typed generic and fallback support.

**Example:**
```typescript
import { getItem } from 'js-util-kit';

// Retrieve primitives
const theme: string = getItem('local', 'theme', 'light');
const fontSize: number = getItem('local', 'fontSize', 16);
const notificationsOn: boolean = getItem('local', 'notificationsEnabled', true);

// Retrieve objects with full type safety
interface UserPrefs {
  theme: string;
  fontSize: number;
  recentFiles: string[];
}

const prefs: UserPrefs = getItem('local', 'userPrefs', {
  theme: 'light',
  fontSize: 16,
  recentFiles: [],
});

// Retrieve arrays
const searches: string[] = getItem('local', 'recentSearches', []);

// Fallback when key doesn't exist
const lang: string = getItem('local', 'language', 'en');
```

**Fallback:** If the key doesn't exist or the stored JSON is corrupted/invalid, returns the `fallback` value. If no fallback is provided, returns `undefined`.

---

### `removeItem`

```typescript
removeItem(storage: 'local' | 'session', key: string): void
```

**What:** Removes a single key from browser storage.

**When:** User logout (remove token), preferences reset, cleaning stale cache keys.

**Example:**
```typescript
import { removeItem } from 'js-util-kit';

// Remove a single key
removeItem('local', 'theme');
removeItem('session', 'tempToken');

// Bulk removal
['theme', 'fontSize', 'token'].forEach(key => {
  removeItem('local', key);
});
```

---

### `clearItems`

```typescript
clearItems(storage: 'local' | 'session'): void
```

**What:** Clears all keys from `localStorage` or `sessionStorage`.

**When:** User account deletion, factory reset, testing/cleanup.

**Example:**
```typescript
import { clearItems } from 'js-util-kit';

// Clear all user data on logout
function logout(): void {
  clearItems('local');
  clearItems('session');
}
```

**Warning:** `clearItems` removes ALL keys with no undo. Use `removeItem` for targeted removal.

---

## Common Patterns

### User Preferences
```typescript
import { setItem, getItem } from 'js-util-kit';

interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
  soundEnabled: boolean;
}

const DEFAULTS: AppSettings = { theme: 'light', fontSize: 16, language: 'en', soundEnabled: true };

function getSettings(): AppSettings {
  return getItem('local', 'settings', DEFAULTS);
}

function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  setItem('local', 'settings', { ...current, ...settings });
}
```

### Authentication Token
```typescript
import { setItem, getItem, removeItem } from 'js-util-kit';

const TOKEN_KEY = 'auth_token';

function storeToken(token: string): void {
  setItem('session', TOKEN_KEY, token);
}

function getToken(): string | undefined {
  return getItem('session', TOKEN_KEY);
}

function clearToken(): void {
  removeItem('session', TOKEN_KEY);
}
```

### Cached API Data with TTL
```typescript
import { setItem, getItem, removeItem } from 'js-util-kit';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function getCached<T>(key: string, ttlMs = 300000): T | null {
  const entry = getItem<CacheEntry<T>>('local', key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    removeItem('local', key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs = 300000): void {
  setItem('local', key, { data, timestamp: Date.now(), ttl: ttlMs });
}
```

---

## Environment Compatibility

| Function | Browser | Node.js |
|----------|---------|---------|
| `setItem` | Yes | No |
| `getItem` | Yes | No |
| `removeItem` | Yes | No |
| `clearItems` | Yes | No |