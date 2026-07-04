# @rsiddha/js-utils

A framework-agnostic utility library for JavaScript and TypeScript projects.

Designed for frontend and backend runtimes, including Angular, React, React Native, and Node.js, this package provides small, focused, pure utility functions across common domains such as arrays, dates, strings, validation, URL handling, browser helpers, storage, files, and JWT convenience decoding.

## 1. Package Overview

- Package name: @rsiddha/js-utils
- Runtime style: ESM + CJS outputs
- Language: TypeScript (strict)
- Scope: small utility primitives with predictable behavior and safe fallbacks
- Philosophy: pure-by-default utilities, graceful null/undefined handling, no runtime dependencies

## 2. Features

- 70+ utilities across 11 domains.
- Typed APIs with clear null/undefined behavior.
- Browser-focused helpers for clipboard, storage, download, and scroll actions.
- Validation helpers for common app inputs (email, URL, password, phone, file metadata).
- URL and query-string helpers based on native URL and URLSearchParams APIs.
- JWT payload decoding convenience (without signature verification).
- Zero runtime dependencies.

## 3. Installation

```bash
npm install @rsiddha/js-utils
```

```bash
yarn add @rsiddha/js-utils
```

```bash
pnpm add @rsiddha/js-utils
```

## 4. Requirements / Compatibility

- JavaScript runtime: modern browser or Node.js runtime with ES2019+ features recommended.
- TypeScript: strict mode supported.
- Module systems:
	- ESM import supported.
	- CommonJS require supported.
- Browser-only subsets:
	- browser, storage, and file domain functions require DOM APIs.
	- These functions are designed with graceful fallbacks for unavailable APIs where documented.

Assumption: React Native compatibility depends on the specific API used. Pure functions work directly; DOM-specific utilities require equivalent polyfills or platform APIs.

## 5. Quick Start

```ts
import {
	distinct,
	formatDate,
	isValidEmail,
	buildQueryString,
	isTokenExpired,
} from '@rsiddha/js-utils';

const ids = distinct([1, 1, 2, 3]);
// [1, 2, 3]

const date = formatDate('2026-07-04');
// '2026-07-04'

const ok = isValidEmail('user@example.com');
// true

const qs = buildQueryString({ page: 2, q: 'open source', draft: null });
// 'page=2&q=open+source'

const expired = isTokenExpired('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDAwMDAwMDB9.signature');
// false (example depends on current time)
```

## 6. Import Examples

### ESM

```ts
import { chunk, formatCurrency } from '@rsiddha/js-utils';
```

### CommonJS

```js
const { chunk, formatCurrency } = require('@rsiddha/js-utils');
```

### TypeScript

```ts
import { getItem, setItem, parseQueryString } from '@rsiddha/js-utils';

type Session = { token: string; role: string };
const session = getItem<Session>('session');
```

## 7. API Reference

Notes:

- All functions are named exports.
- Unless explicitly stated, functions do not mutate their inputs.
- Time complexity is approximate and reflects dominant operations.
- Throws are listed only when a function intentionally throws (many functions use safe fallbacks instead).

### Array Utilities

#### chunk
- Description: Split an array into groups of fixed size.
- Parameters: array, size.
- Returns: T[][].
- Throws: RangeError for invalid size.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- chunk([1, 2, 3, 4], 2) => [[1, 2], [3, 4]]
	- chunk(null, 3) => []

#### distinct
- Description: Remove duplicate entries using Set semantics.
- Parameters: array.
- Returns: T[].
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- distinct([1, 1, 2]) => [1, 2]
	- distinct(null) => []

#### distinctBy
- Description: Deduplicate items using a selector key.
- Parameters: array, keySelector.
- Returns: T[].
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- distinctBy([{ id: 1 }, { id: 1 }, { id: 2 }], x => x.id) => [{ id: 1 }, { id: 2 }]
	- distinctBy(null, x => x) => []

#### groupBy
- Description: Group values by a computed key.
- Parameters: array, keySelector.
- Returns: Record<string, T[]>.
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- groupBy(['a', 'ab'], x => String(x.length)) => { '1': ['a'], '2': ['ab'] }
	- groupBy(null, () => 'x') => {}

#### moveItem
- Description: Move an item from one index to another in a copied array.
- Parameters: array, fromIndex, toIndex.
- Returns: T[].
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- moveItem(['a', 'b', 'c'], 0, 2) => ['b', 'c', 'a']
	- moveItem(null, 0, 1) => []

#### removeDuplicates
- Description: Remove duplicate primitive values.
- Parameters: array.
- Returns: primitive[].
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- removeDuplicates([1, 1, 2]) => [1, 2]
	- removeDuplicates(null) => []

#### sortBy
- Description: Sort items by key selector and direction.
- Parameters: array, keySelector, direction ('asc' | 'desc').
- Returns: T[].
- Throws: None.
- Complexity: O(n log n).
- Mutates input: No.
- Examples:
	- sortBy([{ n: 2 }, { n: 1 }], x => x.n) => [{ n: 1 }, { n: 2 }]
	- sortBy(null, x => x, 'desc') => []

### Auth Utilities

#### decodeJwt
- Description: Decode JWT payload claims from base64url payload segment.
- Parameters: token.
- Returns: Record<string, unknown> | null.
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Limitations: This does not verify JWT signatures.
- Examples:
	- decodeJwt(tokenWithPayload) => { sub: '123', exp: 9999999999 }
	- decodeJwt('not-a-jwt') => null

#### isTokenExpired
- Description: Fail-safe expiry check using exp claim and optional clock skew.
- Parameters: token, clockSkewSeconds (optional).
- Returns: boolean.
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- isTokenExpired(validFutureToken) => false
	- isTokenExpired(null) => true

### Browser Utilities

#### copyToClipboard
- Description: Copy text using Clipboard API with fallback behavior.
- Parameters: text.
- Returns: Promise<boolean>.
- Throws: None (resolves false on failure paths).
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- await copyToClipboard('hello') => true
	- await copyToClipboard('') => false

#### openInNewTab
- Description: Open validated HTTP/HTTPS URL in new tab with noopener,noreferrer.
- Parameters: url.
- Returns: boolean.
- Throws: None.
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- openInNewTab('https://example.com') => true
	- openInNewTab('bad-url') => false

#### downloadBlob
- Description: Download a Blob using object URL and temporary anchor.
- Parameters: blob, filename.
- Returns: boolean.
- Throws: None.
- Complexity: O(n) for blob-backed browser work.
- Mutates input: No.
- Examples:
	- downloadBlob(new Blob(['x']), 'x.txt') => true
	- downloadBlob(null, 'x.txt') => false

#### isMobileDevice
- Description: Detect mobile device using user-agent heuristics.
- Parameters: none.
- Returns: boolean.
- Throws: None.
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- isMobileDevice() => true (mobile UA)
	- isMobileDevice() => false (desktop UA)

#### isTouchDevice
- Description: Detect touch capability via feature checks.
- Parameters: none.
- Returns: boolean.
- Throws: None.
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- isTouchDevice() => true (touch support)
	- isTouchDevice() => false (non-touch environment)

#### scrollToElement
- Description: Scroll to element by id.
- Parameters: elementId, options.
- Returns: boolean.
- Throws: None.
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- scrollToElement('section-1', { behavior: 'smooth' }) => true
	- scrollToElement('missing') => false

### Date Utilities

Functions: addBusinessDays, calculateAge, compareDatesIgnoringTime, convertLocalToUtc, convertUtcToLocal, formatDate, formatDateTime, getEndOfDay, getStartOfDay, isWeekend.

All date utilities return safe defaults for invalid/null/undefined dates and avoid mutating input Date instances.

- addBusinessDays(date, days)
	- Throws: TypeError/RangeError for invalid day count.
	- Complexity: O(days).
	- Examples: addBusinessDays('2026-07-03', 1) => next business day; addBusinessDays(null, 2) => null.
- calculateAge(birthDate)
	- Complexity: O(1).
	- Examples: calculateAge('2000-01-01') => number; calculateAge(null) => null.
- compareDatesIgnoringTime(a, b)
	- Complexity: O(1).
	- Examples: compareDatesIgnoringTime('2026-01-01', '2026-01-01') => 0; invalid => null.
- convertLocalToUtc(date)
	- Complexity: O(1).
	- Examples: convertLocalToUtc(new Date()) => Date; invalid => null.
- convertUtcToLocal(date)
	- Complexity: O(1).
	- Examples: convertUtcToLocal(new Date()) => Date; invalid => null.
- formatDate(value, format?)
	- Complexity: O(1).
	- Examples: formatDate(new Date(), 'YYYY/MM/DD'); formatDate(null) => ''.
- formatDateTime(value, format?)
	- Complexity: O(1).
	- Examples: formatDateTime(new Date()); formatDateTime(null) => ''.
- getEndOfDay(date)
	- Complexity: O(1).
	- Examples: getEndOfDay('2026-07-04'); getEndOfDay(null) => null.
- getStartOfDay(date)
	- Complexity: O(1).
	- Examples: getStartOfDay('2026-07-04'); getStartOfDay(null) => null.
- isWeekend(date)
	- Complexity: O(1).
	- Examples: isWeekend('2026-07-04') => true/false; isWeekend(null) => false.

### File Utilities

#### downloadFile
- Description: Download a file from Blob via temporary anchor and object URL.
- Parameters: blob, fileName.
- Returns: boolean.
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- downloadFile(new Blob(['hello']), 'hello.txt') => true
	- downloadFile(null, 'hello.txt') => false

#### getFileExtension
- Description: Extract final extension segment from filename.
- Parameters: fileName.
- Returns: string.
- Throws: None.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- getFileExtension('archive.tar.gz') => 'gz'
	- getFileExtension('README') => ''

#### formatFileSize
- Description: Format bytes using binary units (1024-based).
- Parameters: bytes.
- Returns: string.
- Throws: None.
- Complexity: O(1).
- Mutates input: No.
- Examples:
	- formatFileSize(1536) => '1.5 KB'
	- formatFileSize(0) => '0 B'

#### convertFileToBase64
- Description: Convert Blob/File to Base64 data URL.
- Parameters: file.
- Returns: Promise<string>.
- Throws: Rejects with Error on invalid input/read failure.
- Complexity: O(n).
- Mutates input: No.
- Examples:
	- await convertFileToBase64(new Blob(['a'])) => 'data:...'
	- await convertFileToBase64(null) => rejects

### Number Utilities

Functions: calculatePercentage, clamp, formatCurrency, formatPercentage, isNumeric, randomNumber, roundToDecimalPlaces.

- calculatePercentage(part, total)
	- Return: number | null.
	- Complexity: O(1).
	- Examples: calculatePercentage(25, 100) => 25; calculatePercentage(null, 100) => null.
- clamp(value, min, max)
	- Return: number | null.
	- Complexity: O(1).
	- Examples: clamp(20, 0, 10) => 10; clamp(null, 0, 10) => null.
- formatCurrency(value, currencyCode, locale?)
	- Return: string.
	- Complexity: O(1).
	- Examples: formatCurrency(1200.5, 'USD'); formatCurrency(null, 'USD') => ''.
- formatPercentage(value, decimalPlaces?, locale?)
	- Throws: RangeError for invalid decimalPlaces.
	- Return: string.
	- Complexity: O(1).
	- Examples: formatPercentage(12.5); formatPercentage(null) => ''.
- isNumeric(value)
	- Return: boolean.
	- Complexity: O(1).
	- Examples: isNumeric(123) => true; isNumeric(null) => false.
- randomNumber(min, max)
	- Return: number.
	- Complexity: O(1).
	- Examples: randomNumber(1, 5); randomNumber(5, 1) behavior follows implementation.
- roundToDecimalPlaces(value, decimalPlaces)
	- Throws: RangeError for invalid decimalPlaces.
	- Return: number | null.
	- Complexity: O(1).
	- Examples: roundToDecimalPlaces(1.234, 2) => 1.23; roundToDecimalPlaces(null, 2) => null.

### Object Utilities

Functions: deepClone, isEqual, mergeObjects, omit, pick, removeEmptyProperties.

- deepClone(value)
	- Return: deep copy.
	- Complexity: O(n).
	- Mutates input: No.
	- Examples: deepClone({ a: 1 }); deepClone([1, { b: 2 }]).
- isEqual(a, b)
	- Return: boolean deep equality.
	- Complexity: O(n).
	- Examples: isEqual({ a: 1 }, { a: 1 }) => true; isEqual([1], [2]) => false.
- mergeObjects(target, source)
	- Return: merged object.
	- Complexity: O(n).
	- Mutates input: No.
	- Examples: mergeObjects({ a: 1 }, { b: 2 }); mergeObjects(null, { b: 2 }).
- omit(obj, keys)
	- Return: object without keys.
	- Complexity: O(n).
	- Examples: omit({ a: 1, b: 2 }, ['b']) => { a: 1 }; omit(null, ['a']) => {}.
- pick(obj, keys)
	- Return: object with selected keys.
	- Complexity: O(n).
	- Examples: pick({ a: 1, b: 2 }, ['b']) => { b: 2 }; pick(null, ['a']) => {}.
- removeEmptyProperties(obj)
	- Return: shallow object without null/undefined/'' values.
	- Complexity: O(n).
	- Examples: removeEmptyProperties({ a: 1, b: '' }) => { a: 1 }; removeEmptyProperties(null) => {}.

### Storage Utilities (Browser)

Functions: setItem, getItem, removeItem, clearItems.

- setItem(key, value)
	- Return: boolean.
	- Behavior: JSON.stringify before write.
	- Examples: setItem('user', { id: 1 }) => true; setItem('', {}) => false.
- getItem<T>(key)
	- Return: T | null.
	- Behavior: JSON.parse; returns null for missing/invalid/unavailable storage.
	- Examples: getItem<{ id: number }>('user'); getItem('missing') => null.
- removeItem(key)
	- Return: boolean.
	- Behavior: no-op true for missing keys when storage works.
	- Examples: removeItem('user') => true; removeItem(null) => false.
- clearItems(prefix?)
	- Return: boolean.
	- Behavior: clears all when prefix is null/undefined/empty string.
	- Examples: clearItems('app:') => true; clearItems('') => true.

### String Utilities

Functions: capitalize, capitalizeFirstLetter, generateRandomString, isNullOrWhitespace, maskSensitiveData, removeExtraWhitespaces, removeSpecialChar, sanitizeFilename, toTitleCase, truncateText.

- capitalize(value)
	- Return: string.
	- Complexity: O(1).
	- Examples: capitalize('hello') => 'Hello'; requires string input.
- capitalizeFirstLetter(value)
	- Return: string.
	- Complexity: O(1).
	- Examples: capitalizeFirstLetter('hello') => 'Hello'; capitalizeFirstLetter(null) => ''.
- generateRandomString(length, chars?)
	- Throws: RangeError for invalid length/chars.
	- Return: string.
	- Complexity: O(n).
	- Examples: generateRandomString(8); generateRandomString(4, 'ABC').
- isNullOrWhitespace(value)
	- Return: boolean.
	- Complexity: O(n).
	- Examples: isNullOrWhitespace('  ') => true; isNullOrWhitespace('a') => false.
- maskSensitiveData(value, visibleChars?)
	- Throws: RangeError for invalid visibleChars.
	- Return: string.
	- Complexity: O(n).
	- Examples: maskSensitiveData('1234567890') => '******7890'; maskSensitiveData(null) => ''.
- removeExtraWhitespaces(value)
	- Return: string.
	- Complexity: O(n).
	- Examples: removeExtraWhitespaces(' a   b ') => 'a b'; removeExtraWhitespaces(null) => ''.
- removeSpecialChar(value)
	- Return: string.
	- Complexity: O(n).
	- Examples: removeSpecialChar('a@b!') => 'ab'; removeSpecialChar(null) => ''.
- sanitizeFilename(value)
	- Return: string.
	- Complexity: O(n).
	- Examples: sanitizeFilename('my:file?.txt') => 'myfile.txt'; sanitizeFilename(null) => ''.
- toTitleCase(value)
	- Return: string.
	- Complexity: O(n).
	- Examples: toTitleCase('hello world') => 'Hello World'; toTitleCase(null) => ''.
- truncateText(value, maxLength)
	- Throws: RangeError for invalid maxLength.
	- Return: string.
	- Complexity: O(n).
	- Examples: truncateText('hello world', 5) => 'hello...'; truncateText(null, 5) => ''.

### URL Utilities

Functions: buildQueryString, parseQueryString, appendQueryParameters, getBaseUrl.

- buildQueryString(parameters)
	- Return: string without leading '?'.
	- Complexity: O(n).
	- Examples: buildQueryString({ q: 'x', page: 1 }) => 'q=x&page=1'; buildQueryString(null) => ''.
- parseQueryString(queryString)
	- Return: Record<string, string>.
	- Complexity: O(n).
	- Examples: parseQueryString('?a=1') => { a: '1' }; parseQueryString('') => {}.
- appendQueryParameters(url, params)
	- Return: string URL or ''.
	- Complexity: O(n).
	- Examples: appendQueryParameters('https://e.com?a=1', { b: 2 }); invalid URL => ''.
- getBaseUrl(url)
	- Return: origin or ''.
	- Complexity: O(1).
	- Examples: getBaseUrl('https://e.com/x') => 'https://e.com'; getBaseUrl(null) => ''.

### Validation Utilities

Functions: isValidEmail, isValidPhoneNumber, isValidUrl, isStrongPassword, validateFileExtension, validateFileSize.

- isValidEmail(value)
	- Return: boolean.
	- Complexity: O(n).
	- Limitation: Practical regex, not full RFC 5322 parser.
	- Examples: isValidEmail('a@b.com') => true; isValidEmail(null) => false.
- isValidPhoneNumber(value, format?)
	- Return: boolean.
	- Complexity: O(n).
	- Examples: isValidPhoneNumber('+1 415-555-2671') => true; isValidPhoneNumber(null) => false.
- isValidUrl(value)
	- Return: boolean for absolute http/https URLs.
	- Complexity: O(n).
	- Examples: isValidUrl('https://example.com') => true; isValidUrl('x') => false.
- isStrongPassword(value, rules?)
	- Return: boolean.
	- Complexity: O(n).
	- Examples: isStrongPassword('Abcdef1!') => true; isStrongPassword(null) => false.
- validateFileExtension(fileName, allowedExtensions)
	- Return: boolean.
	- Complexity: O(n).
	- Examples: validateFileExtension('report.PDF', ['pdf']) => true; invalid inputs => false.
- validateFileSize(file, maxSizeInBytes)
	- Return: boolean.
	- Complexity: O(1).
	- Examples: validateFileSize(new Blob(['a']), 10) => true; validateFileSize(null, 10) => false.

## 8. Usage Examples

### Angular service

```ts
import { Injectable } from '@angular/core';
import { buildQueryString, isValidEmail } from '@rsiddha/js-utils';

@Injectable({ providedIn: 'root' })
export class SearchService {
	toQuery(params: Record<string, unknown>) {
		return buildQueryString(params as Record<string, string | number | boolean | null | undefined>);
	}

	canInvite(email: string) {
		return isValidEmail(email);
	}
}
```

### React / React Native data prep

```ts
import { distinctBy, groupBy, truncateText } from '@rsiddha/js-utils';

const uniqueUsers = distinctBy(users, user => user.id);
const postsByType = groupBy(posts, post => post.type);
const preview = truncateText(longDescription, 120);
```

### Node.js backend utility use

```ts
import { getBaseUrl, parseQueryString, isTokenExpired } from '@rsiddha/js-utils';

const base = getBaseUrl('https://api.example.com/v1/users?x=1');
const query = parseQueryString('sort=desc&page=2');
const expired = isTokenExpired(authHeaderToken);
```

## 9. Best Practices

- Prefer safe-return utilities for user input validation and parsing boundaries.
- Use fail-safe auth helpers as convenience only; perform real auth verification on trusted backend.
- Keep browser-only helpers behind environment checks in SSR apps.
- Treat formatting helpers as presentation logic and keep business logic separate.

## 10. Performance Considerations

- O(1) helpers: numeric checks, simple date operations, URL origin extraction.
- O(n) helpers: deduplication, cloning, parse/string transformations, query operations.
- O(n log n): sortBy.
- For large datasets, avoid repeated deepClone/isEqual in tight render loops.

## 11. Edge Cases

- Most utilities treat null/undefined as safe defaults rather than throwing.
- Validation helpers generally return false for uncertain or malformed data.
- Storage helpers return false/null when localStorage is unavailable or blocked.
- Auth helper decodeJwt does not validate token signatures.

## 12. Common Mistakes

- Assuming decodeJwt verifies authenticity. It does not.
- Passing relative URLs to openInNewTab or getBaseUrl expecting success.
- Using capitalize with nullable values; use capitalizeFirstLetter when input may be null/undefined.
- Relying on browser-only functions in SSR without guards.

## 13. FAQ

### Does this package mutate arrays or objects?

No, exported utilities are designed to avoid mutating inputs.

### Are browser APIs required everywhere?

No. Only browser, storage, and file utilities rely on DOM/web APIs.

### Is JWT signature verification included?

No. decodeJwt only decodes payload claims and does not verify integrity.

### Why do many functions return safe defaults instead of throwing?

The library favors predictable, ergonomic behavior at runtime boundaries.

## 14. Changelog Entry

Not requested in this release. Suggested summary for next changelog:

- Added new domains: browser, validation, url, storage, auth, file.
- Expanded utility coverage with robust null-safe behavior and comprehensive tests.

## 15. Contributing

Contributions are welcome. Please review:

- CONTRIBUTING.md
- docs/STYLE_GUIDE.md

Core expectations:

- One exported function per file.
- Full JSDoc for every exported function.
- Named exports only.
- Domain barrel updates and passing test/build checks.

## 16. License

ISC

## TSDoc / JSDoc Guidance

The source files already contain JSDoc for exported functions. For new functions, use this format:

```ts
/**
 * Summary sentence.
 *
 * @param paramName - Description.
 * @returns Description.
 * @throws {TypeError} When input type is invalid.
 * @example
 * functionName(input); // => output
 * @since x.y.z
 */
```

