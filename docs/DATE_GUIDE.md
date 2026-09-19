# Date Utilities Guide

Comprehensive guide for `js-util-kit` date utilities.

## Overview

The date module provides utilities for formatting, parsing, and manipulating dates. All functions work in both browser and Node.js.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `formatDate` | Format date with custom pattern | Display dates to users |
| `formatDateTime` | Format date and time with custom pattern | Display date-times to users |
| `parseDate` | Parse date string with pattern | Reading date inputs |
| `addBusinessDays` | Add business days to a date | Scheduling, due dates |
| `calculateAge` | Calculate age from birth date | User profiles, validation |
| `compareDatesIgnoringTime` | Check if two dates are same day | Grouping, comparisons |
| `convertLocalToUTC` | Convert local date to UTC | Timezone handling |
| `convertUTCToLocal` | Convert UTC date to local | Timezone handling |
| `getStartOfDay` | Get start of day (00:00:00) | Day boundaries |
| `getEndOfDay` | Get end of day (23:59:59) | Day boundaries |
| `isWeekend` | Check if date falls on weekend | Business logic |

---

## Prerequisites

🌐 **Universal** — works everywhere.

---

## Function Details

### `formatDate`

```typescript
formatDate(value: Date | string | null | undefined, format = 'YYYY-MM-DD'): string
```

**What:** Formats a date using a token-based format string and local time.

**When:** Displaying dates in UI, reports, emails, logs.

**Why:** Consistent formatting without Intl API complexity or moment.js dependency.

**Supported Tokens:**
| Token | Meaning | Example |
|-------|---------|---------|
| `YYYY` | 4-digit year | `2026` |
| `MM` | 2-digit month | `07` |
| `DD` | 2-digit day | `30` |

**Example:**
```typescript
import { formatDate } from 'js-util-kit';

const date = new Date(2026, 5, 30); // June 30, 2026

formatDate(date);                 // '2026-06-30'
formatDate(date, 'YYYY-MM-DD');   // '2026-06-30'
formatDate(date, 'DD/MM/YYYY');   // '30/06/2026'
formatDate(date, 'MM/DD/YYYY');   // '06/30/2026'
formatDate('2026-06-30');         // '2026-06-30'
formatDate(null);                 // ''
formatDate(undefined);            // ''
formatDate('invalid');            // ''
```

---

### `formatDateTime`

```typescript
formatDateTime(value: Date | string | null | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string
```

**What:** Formats a date and time using a token-based format string and local time.

**When:** Displaying date-times in UI, logs, timestamps.

**Supported Tokens:**
| Token | Meaning | Example |
|-------|---------|---------|
| `YYYY` | 4-digit year | `2026` |
| `MM` | 2-digit month | `06` |
| `DD` | 2-digit day | `30` |
| `HH` | 2-digit hour (24h) | `14` |
| `mm` | 2-digit minute | `05` |
| `ss` | 2-digit second | `09` |

**Example:**
```typescript
import { formatDateTime } from 'js-util-kit';

const date = new Date(2026, 5, 30, 14, 30, 0); // June 30, 2026, 14:30:00

formatDateTime(date);                         // '2026-06-30 14:30:00'
formatDateTime(date, 'YYYY-MM-DD HH:mm:ss');  // '2026-06-30 14:30:00'
formatDateTime(date, 'DD/MM/YYYY HH:mm');     // '30/06/2026 14:30'
formatDateTime(date, 'MM/DD/YYYY HH:mm');     // '06/30/2026 14:30'
formatDateTime(null);                         // ''
formatDateTime('not-a-date');                 // ''
```

---

### `parseDate`

```typescript
parseDate(dateStr: string, format: string): Date | undefined
```

**What:** Parses a date string using a format pattern.

**When:** Converting user input, CSV data, or string dates to `Date` objects.

**Why:** Strict parsing with explicit format — unlike `new Date()` which has ambiguous behavior.

**Supported Tokens:** `YYYY`, `MM`, `DD`, `HH`, `mm`

**Example:**
```typescript
import { parseDate } from 'js-util-kit';

parseDate('30/07/2026', 'DD/MM/YYYY');
// Date(2026-07-30T00:00:00)

parseDate('07/30/2026', 'MM/DD/YYYY');
// Date(2026-07-30T00:00:00)

parseDate('2026-07-30', 'YYYY-MM-DD');
// Date(2026-07-30T00:00:00)

parseDate('2026-07-30 14:05', 'YYYY-MM-DD HH:mm');
// Date(2026-07-30T14:05:00)

parseDate('invalid', 'YYYY-MM-DD');
// undefined

parseDate('30-07-2026', 'YYYY-MM-DD');
// undefined (pattern mismatch)
```

---

### `addBusinessDays`

```typescript
addBusinessDays(
  date: Date | string | null | undefined,
  days: number
): Date | null
```

**What:** Adds a number of business days (Monday–Friday) to a date, skipping Saturdays and Sundays. Negative values move backwards in time.

**When:** Due dates, SLA calculations, business day scheduling.

**Why:** Automatically skips weekends. Immutable — original date unchanged.

**Example:**
```typescript
import { addBusinessDays } from 'js-util-kit';

// Friday + 1 business day = Monday
const friday = new Date(2026, 5, 26); // June 26, 2026 (Friday)
addBusinessDays(friday, 1);  // Monday, June 29, 2026
addBusinessDays(friday, 3);  // Wednesday, July 1, 2026
addBusinessDays(friday, -1); // Thursday, June 25, 2026

// Null handling
addBusinessDays(null, 1);    // null
addBusinessDays('invalid', 1); // null

// Throws RangeError for non-finite days
addBusinessDays(friday, Infinity);  // RangeError
addBusinessDays(friday, NaN);       // RangeError
```

---

### `calculateAge`

```typescript
calculateAge(birthDate: Date | string | null | undefined): number | null
```

**What:** Calculates a person's age in full years as of today's local date.

**When:** User profiles, age verification, birthday calculations.

**Why:** Accurate age calculation handling leap years and birthdays.

**Note:** Reads `new Date()` internally and is therefore not a pure function. In tests, use `jest.useFakeTimers()` / `jest.setSystemTime()` to control today's date.

**Example:**
```typescript
import { calculateAge } from 'js-util-kit';

// Today is 2026-06-30
calculateAge(new Date(1996, 5, 30));  // 30
calculateAge(new Date(1996, 6, 1));   // 29 (birthday not yet)
calculateAge('1996-06-30');            // 30

// Returns null for invalid or future dates
calculateAge(null);                    // null
calculateAge('invalid');               // null
calculateAge(new Date(2027, 0, 1));    // null (future date)
```

---

### `compareDatesIgnoringTime`

```typescript
compareDatesIgnoringTime(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): number | null
```

**What:** Compares two dates ignoring their time components, using local calendar dates.

**When:** Sorting dates by day, grouping events by date, date range checks.

**Why:** `Date` comparison includes time, which can cause unexpected ordering.

**Returns:** `-1` if `a` is before `b`, `0` if equal, `1` if after, or `null` for any null, undefined, or invalid input.

**Example:**
```typescript
import { compareDatesIgnoringTime } from 'js-util-kit';

const a = new Date(2026, 5, 29);
const b = new Date(2026, 5, 30);

compareDatesIgnoringTime(a, b);  // -1

// Same calendar date, different times
const morning = new Date(2026, 5, 30, 0, 0);
const evening = new Date(2026, 5, 30, 23, 59);
compareDatesIgnoringTime(morning, evening);  // 0

// Null handling
compareDatesIgnoringTime(null, b);     // null
compareDatesIgnoringTime(a, 'invalid'); // null
```

---

### `convertLocalToUtc`

```typescript
convertLocalToUtc(date: Date | string | null | undefined): Date | null
```

**What:** Converts a local `Date` to a new `Date` whose UTC time values reflect the equivalent UTC wall-clock time.

**When:** Storing dates in UTC, sending to APIs that expect UTC. This is the inverse of `convertUtcToLocal`.

**Why:** Shifts the timestamp backwards by the runtime's UTC offset. The result depends on the runtime timezone.

**Example:**
```typescript
import { convertLocalToUtc } from 'js-util-kit';

// In UTC+2: local 10:00 → 08:00 UTC
const local = new Date(2026, 5, 30, 10, 0, 0);
const utc = convertLocalToUtc(local);
utc?.toISOString();  // '2026-06-30T08:00:00.000Z' (UTC+2 runtime)

// Null handling
convertLocalToUtc(null);  // null
```

---

### `convertUtcToLocal`

```typescript
convertUtcToLocal(date: Date | string | null | undefined): Date | null
```

**What:** Converts a UTC `Date` to a new `Date` whose UTC time values reflect the equivalent local wall-clock time.

**When:** Displaying UTC dates in user's local timezone.

**Why:** Shifts the timestamp forward by the runtime's UTC offset so that `toISOString()` on the result displays the local time.

**Example:**
```typescript
import { convertUtcToLocal } from 'js-util-kit';

// In UTC+2: 08:00 UTC → local 10:00
const utc = new Date('2026-06-30T08:00:00Z');
const local = convertUtcToLocal(utc);
local?.toISOString();  // '2026-06-30T10:00:00.000Z' (UTC+2 runtime)

// Null handling
convertUtcToLocal(null);  // null
```

---

### `getStartOfDay`

```typescript
getStartOfDay(date: Date | string | null | undefined): Date | null
```

**What:** Returns a new `Date` set to the start of the given day (00:00:00.000) in local time.

**When:** Day boundary calculations, date range queries.

**Example:**
```typescript
import { getStartOfDay } from 'js-util-kit';

const date = new Date(2026, 5, 30, 14, 30, 45);
getStartOfDay(date);
// Date for 2026-06-30T00:00:00.000

// Null handling
getStartOfDay(null);  // null
```

---

### `getEndOfDay`

```typescript
getEndOfDay(date: Date | string | null | undefined): Date | null
```

**What:** Returns a new `Date` set to the end of the given day (23:59:59.999) in local time.

**When:** Day boundary calculations, inclusive date range queries.

**Example:**
```typescript
import { getEndOfDay } from 'js-util-kit';

const date = new Date(2026, 5, 30, 8, 0, 0);
getEndOfDay(date);
// Date for 2026-06-30T23:59:59.999

// Null handling
getEndOfDay(null);  // null
```

---

### `isWeekend`

```typescript
isWeekend(value: Date | string | null | undefined): boolean
```

**What:** Returns `true` if the given date falls on a Saturday or Sunday (local time).

**When:** Business day calculations, scheduling, UI indicators.

**Example:**
```typescript
import { isWeekend } from 'js-util-kit';

isWeekend(new Date(2026, 5, 27));  // true (Saturday)
isWeekend(new Date(2026, 5, 28));  // true (Sunday)
isWeekend(new Date(2026, 5, 29));  // false (Monday)

// Null handling
isWeekend(null);      // false
isWeekend('invalid'); // false
```

---

## Common Patterns

### Format a Date for Display
```typescript
import { formatDate, parseDate, compareDatesIgnoringTime } from 'js-util-kit';

function formatUserDate(dateStr: string): string {
  const date = parseDate(dateStr, 'YYYY-MM-DD');
  if (!date) return 'Invalid date';

  const today = new Date();
  if (compareDatesIgnoringTime(date, today) === 0) return 'Today';
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (compareDatesIgnoringTime(date, yesterday) === 0) return 'Yesterday';

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (compareDatesIgnoringTime(date, tomorrow) === 0) return 'Tomorrow';

  return formatDate(date, 'DD/MM/YYYY');
}
```

### Parse User Input
```typescript
import { parseDate } from 'js-util-kit';

function parseUserBirthday(input: string): Date | null {
  // Try multiple common formats
  const formats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
  ];

  for (const format of formats) {
    const date = parseDate(input, format);
    if (date) return date;
  }
  return null;
}
```

### Business Day Scheduling
```typescript
import { addBusinessDays, isWeekend } from 'js-util-kit';

function getNextBusinessDay(date: Date): Date | null {
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function scheduleMeeting(daysAhead: number): Date | null {
  return addBusinessDays(new Date(), daysAhead);
}
```

### Date Range Query
```typescript
import { getStartOfDay, getEndOfDay } from 'js-util-kit';

function getDateRange(date: Date) {
  const start = getStartOfDay(date);
  const end = getEndOfDay(date);
  return { start, end };
}

// For database queries
const today = new Date();
const range = getDateRange(today);
// SELECT * FROM events WHERE timestamp >= range.start AND timestamp <= range.end
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `formatDate` | Yes | Yes | None |
| `formatDateTime` | Yes | Yes | None |
| `parseDate` | Yes | Yes | None |
| `addBusinessDays` | Yes | Yes | None |
| `calculateAge` | Yes | Yes | None |
| `compareDatesIgnoringTime` | Yes | Yes | None |
| `convertLocalToUTC` | Yes | Yes | None |
| `convertUTCToLocal` | Yes | Yes | None |
| `getStartOfDay` | Yes | Yes | None |
| `getEndOfDay` | Yes | Yes | None |
| `isWeekend` | Yes | Yes | None |

All functions are **pure** and have **zero external dependencies**.