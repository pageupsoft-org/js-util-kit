# String Utilities Guide

Comprehensive guide for `js-util-kit` string manipulation utilities.

## Installation

```bash
npm install js-util-kit
```

## Quick Reference

| Function | Description | Use Case |
|----------|-------------|----------|
| `capitalize` | Capitalize first letter of each word | Names, titles |
| `capitalizeFirstLetter` | Capitalize only first letter | Sentences |
| `truncateText` | Truncate with ellipsis | Previews, cards |
| `toTitleCase` | Convert to Title Case | Headings |
| `maskSensitiveData` | Mask cards, SSN, emails | Logging, UI |
| `sanitizeFilename` | Safe filename from string | File uploads |
| `removeSpecialCharacters` | Remove non-alphanumeric | Slugs, IDs |
| `removeExtraWhitespaces` | Normalize whitespace | User input |
| `isNullOrWhitespace` | Check empty/whitespace | Validation |
| `generateRandomString` | Crypto-secure random string | Tokens, IDs |

---

## Function Details

### `capitalize`

```typescript
capitalize(str: string): string
```

**What:** Capitalizes the first letter of each word.

**When:** Display names, titles, headings from user input.

**Why:** Consistent capitalization regardless of user entry style.

**Example:**
```typescript
import { capitalize } from 'js-util-kit';

capitalize('john doe');           // 'John Doe'
capitalize('MARY JANE');          // 'Mary Jane'
capitalize('van der waals');      // 'Van Der Waals'
capitalize('o\'connor');          // 'O\'Connor'
capitalize('');                   // ''
```

**Output:** Each word's first letter uppercase, rest lowercase. Words split by whitespace.

---

### `capitalizeFirstLetter`

```typescript
capitalizeFirstLetter(str: string): string
```

**What:** Capitalizes only the first character of the string.

**When:** Sentence case, first letter of a paragraph.

**Why:** Preserves original casing of rest of string.

**Example:**
```typescript
import { capitalizeFirstLetter } from 'js-util-kit';

capitalizeFirstLetter('hello world');     // 'Hello world'
capitalizeFirstLetter('HELLO WORLD');     // 'HELLO WORLD'
capitalizeFirstLetter('hello');           // 'Hello'
capitalizeFirstLetter('');                // ''
```

**Output:** First character uppercase, remainder unchanged.

---

### `truncateText`

```typescript
truncateText(str: string, maxLength: number, suffix?: string): string
```

**What:** Truncates string to maxLength, appends suffix (default: `...`).

**When:** Card previews, table cells, tooltip text, meta descriptions.

**Why:** Prevents layout breakage, indicates truncated content.

**Example:**
```typescript
import { truncateText } from 'js-util-kit';

truncateText('This is a long description', 20);        // 'This is a long...'
truncateText('Short', 20);                             // 'Short'
truncateText('Exact length', 13);                      // 'Exact length'
truncateText('Custom suffix here', 10, ' [read more]'); // 'Custom [read more]'
truncateText('', 10);                                  // ''
```

**Output:** String ≤ maxLength. If truncated, suffix replaces last characters.

---

### `toTitleCase`

```typescript
toTitleCase(str: string): string
```

**What:** Converts to Title Case (major words capitalized, minor words lowercase).

**When:** Book titles, article headlines, proper headings.

**Why:** Follows title case conventions (AP/Chicago style).

**Example:**
```typescript
import { toTitleCase } from 'js-util-kit';

toTitleCase('the quick brown fox');           // 'The Quick Brown Fox'
toTitleCase('a tale of two cities');          // 'A Tale of Two Cities'
toTitleCase('war and peace');                 // 'War and Peace'
toTitleCase('of mice and men');               // 'Of Mice and Men'
toTitleCase('in the beginning');              // 'In the Beginning'
```

**Minor words (lowercased unless first/last):** a, an, the, and, but, or, for, nor, on, at, to, from, by, in, of, vs, vs., etc.

---

### `maskSensitiveData`

```typescript
maskSensitiveData(str: string, options?: MaskOptions): string
interface MaskOptions {
  maskChar?: string;        // default: '*'
  showFirst?: number;       // default: 0
  showLast?: number;        // default: 4
  patterns?: RegExp[];      // custom patterns
}
```

**What:** Masks sensitive patterns (credit cards, SSN, emails, phone, custom).

**When:** Logging, debug output, UI display of sensitive data.

**Why:** Prevents accidental exposure in logs, screenshots, support tickets.

**Example:**
```typescript
import { maskSensitiveData } from 'js-util-kit';

// Credit cards
maskSensitiveData('4111 1111 1111 1111');           // '************1111'
maskSensitiveData('4111-1111-1111-1111', { showLast: 4, showFirst: 2 }); // '41************1111'

// SSN
maskSensitiveData('123-45-6789');                   // '***-**-6789'
maskSensitiveData('123456789', { maskChar: 'X' });  // 'XXXXX6789'

// Email
maskSensitiveData('user@example.com');              // 'us***@example.com'
maskSensitiveData('john.doe@company.org', { showFirst: 1 }); // 'j***@company.org'

// Phone
maskSensitiveData('+1-555-123-4567');               // '***-***-4567'

// Custom pattern
maskSensitiveData('API_KEY_abcdef123456', {
  patterns: [/API_KEY_[a-z0-9]+/i],
  showLast: 6
}); // 'API_KEY_****123456'

// Multiple in one string
maskSensitiveData('Card: 4111 1111 1111 1111, SSN: 123-45-6789');
// 'Card: ************1111, SSN: ***-**-6789'
```

**Built-in patterns:** Credit cards (13-19 digits), SSN (XXX-XX-XXXX), Emails, Phones (various formats).

---

### `sanitizeFilename`

```typescript
sanitizeFilename(filename: string, options?: SanitizeOptions): string
interface SanitizeOptions {
  replacement?: string;    // default: '_'
  maxLength?: number;      // default: 255
  allowUnicode?: boolean;  // default: false
}
```

**What:** Converts any string to a safe filesystem filename.

**When:** User-generated filenames, uploads, exports, generated files.

**Why:** Prevents path traversal, invalid chars, reserved names, length issues.

**Example:**
```typescript
import { sanitizeFilename } from 'js-util-kit';

sanitizeFilename('My Document.pdf');                    // 'My_Document.pdf'
sanitizeFilename('../../etc/passwd');                   // '____etc_passwd'
sanitizeFilename('file:name?.txt');                     // 'file_name_.txt'
sanitizeFilename('CON.txt');                            // '_CON.txt' (Windows reserved)
sanitizeFilename('file\x00name.txt');                   // 'file_name.txt' (null bytes)
sanitizeFilename('a'.repeat(300));                      // Truncated to 255 chars
sanitizeFilename('café.pdf', { allowUnicode: true });   // 'café.pdf'
sanitizeFilename('café.pdf');                           // 'caf_.pdf'
```

**Replaces:** `< > : " / \ | ? *`, control chars, leading/trailing dots/spaces, Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9).

---

### `removeSpecialCharacters`

```typescript
removeSpecialCharacters(str: string, allowSpaces?: boolean): string
```

**What:** Removes non-alphanumeric characters (optionally keeps spaces).

**When:** Generating slugs, IDs, search keys, normalized comparison.

**Why:** Creates predictable, safe strings from user input.

**Example:**
```typescript
import { removeSpecialCharacters } from 'js-util-kit';

removeSpecialCharacters('Hello, World!');        // 'HelloWorld'
removeSpecialCharacters('Hello, World!', true);  // 'Hello World'
removeSpecialCharacters('user@domain.com');      // 'userdomaincom'
removeSpecialCharacters('Price: $19.99');        // 'Price1999'
removeSpecialCharacters('Café résumé');          // 'Caf rsum' (accents removed)
removeSpecialCharacters('αβγ123');               // 'αβγ123' (unicode letters kept)
```

---

### `removeExtraWhitespaces`

```typescript
removeExtraWhitespaces(str: string): string
```

**What:** Collapses multiple whitespace to single space, trims ends.

**When:** Cleaning user input, normalizing pasted text, form values.

**Why:** Prevents "invisible" validation failures, consistent storage.

**Example:**
```typescript
import { removeExtraWhitespaces } from 'js-util-kit';

removeExtraWhitespaces('  Hello    World  ');    // 'Hello World'
removeExtraWhitespaces('Line\n\n\nbreak');       // 'Line break'
removeExtraWhitespaces('\tTab\t\tspace\t');      // 'Tab space'
removeExtraWhitespaces('Normal text');           // 'Normal text'
removeExtraWhitespaces('');                      // ''
```

---

### `isNullOrWhitespace`

```typescript
isNullOrWhitespace(str: string | null | undefined): boolean
```

**What:** Returns true if null, undefined, empty, or only whitespace.

**When:** Validation guards, optional field checks, default fallbacks.

**Why:** Single check replaces `!str || !str.trim()`.

**Example:**
```typescript
import { isNullOrWhitespace } from 'js-util-kit';

isNullOrWhitespace(null);            // true
isNullOrWhitespace(undefined);       // true
isNullOrWhitespace('');              // true
isNullOrWhitespace('   ');           // true
isNullOrWhitespace('\t\n');          // true
isNullOrWhitespace('hello');         // false
isNullOrWhitespace('  hello  ');     // false
```

---

### `generateRandomString`

```typescript
generateRandomString(length: number, charset?: string): string
```

**What:** Cryptographically secure random string (uses `crypto.getRandomValues`).

**When:** API keys, session IDs, CSRF tokens, temporary passwords, unique IDs.

**Why:** `Math.random()` is predictable; this uses Web Crypto API / Node crypto.

**Example:**
```typescript
import { generateRandomString } from 'js-util-kit';

// Default charset: A-Z a-z 0-9
generateRandomString(32);              // 'K7m9Xp2Qr4...' (32 chars)

// Custom charsets
generateRandomString(16, '0123456789');                    // Numeric only
generateRandomString(24, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');   // Uppercase only
generateRandomString(64, 'abcdef0123456789');             // Hex

// URL-safe (no + / =)
generateRandomString(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_');

// Repeatable for testing (seed not supported - use jest mock)
```

**Security:** Uses `crypto.getRandomValues()` (browser) or `crypto.randomBytes()` (Node). Suitable for secrets.

---

## Common Patterns

### User Display Name Formatter
```typescript
import { capitalize, truncateText, isNullOrWhitespace } from 'js-util-kit';

function formatDisplayName(rawName: string | null | undefined, maxLen = 30): string {
  if (isNullOrWhitespace(rawName)) return 'Anonymous';
  const cleaned = capitalize(rawName.trim());
  return truncateText(cleaned, maxLen);
}

formatDisplayName('  john doe  ');     // 'John Doe'
formatDisplayName('VERY LONG NAME THAT EXCEEDS THE LIMIT'); // 'Very Long Name That Exceeds...'
formatDisplayName(null);               // 'Anonymous'
```

### Slug Generator
```typescript
import { toTitleCase, removeSpecialCharacters, removeExtraWhitespaces } from 'js-util-kit';

function generateSlug(title: string): string {
  const cleaned = removeExtraWhitespaces(title.toLowerCase());
  const noSpecial = removeSpecialCharacters(cleaned, true);
  return noSpecial.split(' ').join('-');
}

generateSlug('  My Blog Post: "Hello World!"  '); // 'my-blog-post-hello-world'
```

### Safe Log Output
```typescript
import { maskSensitiveData } from 'js-util-kit';

function safeLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'creditCard', 'ssn'];
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k)) && typeof value === 'string') {
      result[key] = maskSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
```

### File Upload Handler
```typescript
import { sanitizeFilename, validateFileExtension, validateFileSize } from 'js-util-kit';

function processUpload(file: File): { safeName: string } | { error: string } {
  const extCheck = validateFileExtension(file.name, ['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
  if (!extCheck.valid) return { error: 'Invalid file type' };

  const sizeCheck = validateFileSize(file.size, { maxBytes: 10 * 1024 * 1024 });
  if (!sizeCheck.valid) return { error: 'File too large (max 10MB)' };

  const safeName = sanitizeFilename(file.name, { maxLength: 200 });
  return { safeName };
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `capitalize` | ✅ | ✅ | None |
| `capitalizeFirstLetter` | ✅ | ✅ | None |
| `truncateText` | ✅ | ✅ | None |
| `toTitleCase` | ✅ | ✅ | None |
| `maskSensitiveData` | ✅ | ✅ | None |
| `sanitizeFilename` | ✅ | ✅ | None |
| `removeSpecialCharacters` | ✅ | ✅ | None |
| `removeExtraWhitespaces` | ✅ | ✅ | None |
| `isNullOrWhitespace` | ✅ | ✅ | None |
| `generateRandomString` | ✅ | ✅ | Web Crypto / Node crypto |

All functions are **pure**, **synchronous**, and **zero-dependency**.