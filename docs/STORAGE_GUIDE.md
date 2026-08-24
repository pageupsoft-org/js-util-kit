# Storage Utilities Guide

Comprehensive guide for `js-util-kit` browser storage utilities (`localStorage` / `sessionStorage`).

## Overview

The storage module provides type-safe wrappers around browser storage APIs. Values are automatically serialized/deserialized as JSON, eliminating the common `localStorage.setItem` bug where you accidentally store `[object Object]`.

## Exports

| Function | Description |
|----------|-------------|
| `setLocalStorage` | Type-safe localStorage setter with JSON serialization |
| `getLocalStorage` | Type-safe localStorage getter with JSON deserialization |
| `removeLocalStorage` | Remove key from localStorage |
| `clearLocalStorage` | Clear all items from localStorage |
| `setSessionStorage` | Type-safe sessionStorage setter with JSON serialization |
| `getSessionStorage` | Type-safe sessionStorage getter with JSON deserialization |
| `removeSessionStorage` | Remove key from sessionStorage |
| `clearSessionStorage` | Clear all items from sessionStorage |

## Prerequisites

🌍 **Browser Only** — these utilities require the browser `localStorage` or `sessionStorage` APIs. They do not work in Node.js.

---

## Function Details

### `setLocalStorage`

```typescript
setLocalStorage<T>(key: string, value: T): boolean
```

**What:** Stores a value serialized as JSON in localStorage.

**When:** Persisting user preferences, theme settings, cached API data, form drafts, authentication tokens.

**Why:** Automatic JSON serialization — no more `JSON.stringify` bugs. Type-safe with generics for reading back.

**Example:**
```typescript
import { setLocalStorage, getLocalStorage } from 'js-util-kit';

// Store primitives
setLocalStorage('theme', 'dark');
setLocalStorage('fontSize', 14);
setLocalStorage('notificationsEnabled', true);

// Store objects (auto-serialized)
setLocalStorage('userPrefs', {
  theme: 'dark',
  fontSize: 14,
  recentFiles: ['file1.ts', 'file2.ts'],
});

// Store arrays
setLocalStorage('recentSearches', ['react', 'typescript', 'utils']);
```

**Error Handling:** If `localStorage` is full (quota exceeded), the function returns `false` instead of throwing.

---

### `getLocalStorage`

```typescript
getLocalStorage<T>(key: string): T | null
```

**What:** Retrieves and parses JSON from localStorage.

**When:** Reading user settings, cached data, or any previously stored value.

**Why:** Automatic JSON parsing with a typed generic.

**Example:**
```typescript
import { getLocalStorage } from 'js-util-kit';

// Retrieve primitives
const theme: string | null = getLocalStorage('theme');
const fontSize: number | null = getLocalStorage('fontSize');
const notificationsOn: boolean | null = getLocalStorage('notificationsEnabled');

// Retrieve objects with full type safety
interface UserPrefs {
  theme: string;
  fontSize: number;
  recentFiles: string[];
}

const prefs: UserPrefs | null = getLocalStorage('userPrefs');

// Retrieve arrays
const searches: string[] | null = getLocalStorage('recentSearches');
```

**Fallback:** If the key doesn't exist or the stored JSON is corrupted/invalid, returns `null`.

---

### `removeLocalStorage`

```typescript
removeLocalStorage(key: string): boolean
```

**What:** Removes a single key from localStorage.

**When:** User logout (remove token), preferences reset, cleaning stale cache keys.

**Example:**
```typescript
import { removeLocalStorage } from 'js-util-kit';

// Remove a single key
removeLocalStorage('theme');
removeLocalStorage('fontSize');

// Bulk removal
['theme', 'fontSize', 'token'].forEach(key => {
  removeLocalStorage(key);
});
```

---

### `clearLocalStorage`

```typescript
clearLocalStorage(prefix?: string): boolean
```

**What:** Clears keys from localStorage by prefix. When `prefix` is omitted, empty string, or null, clears all localStorage entries.

**When:** User account deletion, factory reset, testing/cleanup.

**Example:**
```typescript
import { clearLocalStorage } from 'js-util-kit';

// Clear all user data on logout
function logout(): void {
  clearLocalStorage();
}

// Clear only app-specific keys
clearLocalStorage('app:');
```

**Warning:** `clearLocalStorage()` without prefix removes ALL keys with no undo. Use `removeLocalStorage` for targeted removal.

---

### `setSessionStorage`

```typescript
setSessionStorage<T>(key: string, value: T): boolean
```

**What:** Stores a value serialized as JSON in sessionStorage.

**When:** Temporary data that should not persist across browser sessions (tab/window close), like form drafts, temporary tokens, or wizard state.

**Example:**
```typescript
import { setSessionStorage, getSessionStorage } from 'js-util-kit';

// Store temporary data
setSessionStorage('tempToken', 'eyJhbGciOiJIUzI1NiJ9...');
setSessionStorage('formDraft', { step: 2, data: { name: 'John' } });
```

---

### `getSessionStorage`

```typescript
getSessionStorage<T>(key: string): T | null
```

**What:** Retrieves and parses JSON from sessionStorage.

**Example:**
```typescript
import { getSessionStorage } from 'js-util-kit';

const token: string | null = getSessionStorage('tempToken');
const draft: { step: number; data: object } | null = getSessionStorage('formDraft');
```

---

### `removeSessionStorage`

```typescript
removeSessionStorage(key: string): boolean
```

**What:** Removes a single key from sessionStorage.

**Example:**
```typescript
import { removeSessionStorage } from 'js-util-kit';

removeSessionStorage('tempToken');
```

---

### `clearSessionStorage`

```typescript
clearSessionStorage(prefix?: string): boolean
```

**What:** Clears keys from sessionStorage by prefix. When `prefix` is omitted, empty string, or null, clears all sessionStorage entries.

**Example:**
```typescript
import { clearSessionStorage } from 'js-util-kit';

clearSessionStorage(); // Clear all
clearSessionStorage('wizard:'); // Clear wizard-specific keys
```

---

## Common Patterns

### User Preferences (localStorage)
```typescript
import { setLocalStorage, getLocalStorage } from 'js-util-kit';

interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
  soundEnabled: boolean;
}

const DEFAULTS: AppSettings = { theme: 'light', fontSize: 16, language: 'en', soundEnabled: true };

function getSettings(): AppSettings | null {
  return getLocalStorage('settings');
}

function saveSettings(settings: Partial<AppSettings>): boolean {
  const current = getSettings();
  return setLocalStorage('settings', { ...DEFAULTS, ...current, ...settings });
}
```

### Authentication Token (sessionStorage)
```typescript
import { setSessionStorage, getSessionStorage, removeSessionStorage } from 'js-util-kit';

const TOKEN_KEY = 'auth_token';

function storeToken(token: string): boolean {
  return setSessionStorage(TOKEN_KEY, token);
}

function getToken(): string | null {
  return getSessionStorage(TOKEN_KEY);
}

function clearToken(): boolean {
  return removeSessionStorage(TOKEN_KEY);
}
```

### Cached API Data with TTL (localStorage)
```typescript
import { setLocalStorage, getLocalStorage, removeLocalStorage } from 'js-util-kit';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

function getCached<T>(key: string, ttlMs = 300000): T | null {
  const entry = getLocalStorage<CacheEntry<T>>(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    removeLocalStorage(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs = 300000): boolean {
  return setLocalStorage(key, { data, timestamp: Date.now(), ttl: ttlMs });
}
```

---

## Environment Compatibility

| Function | Browser | Node.js |
|----------|---------|---------|
| `setLocalStorage` | Yes | No |
| `getLocalStorage` | Yes | No |
| `removeLocalStorage` | Yes | No |
| `clearLocalStorage` | Yes | No |
| `setSessionStorage` | Yes | No |
| `getSessionStorage` | Yes | No |
| `removeSessionStorage` | Yes | No |
| `clearSessionStorage` | Yes | No |