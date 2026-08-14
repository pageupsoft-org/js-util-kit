# Date Utilities Guide

Comprehensive guide for `js-util-kit` date utilities.

## Overview

The date module provides utilities for formatting, parsing, and manipulating dates. All functions work in both browser and Node.js.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `formatDate` | Format date with custom pattern | Display dates to users |
| `parseDate` | Parse date string with pattern | Reading date inputs |
| `addDays` | Add N days to a date | Scheduling, due dates |
| `subtractDays` | Subtract N days from a date | Countdown, expiry |
| `isSameDay` | Check if two dates are same day | Grouping, comparisons |
| `getDaysBetween` | Get days between two dates | Countdown, duration |

---

## Prerequisites

🌐 **Universal** — works everywhere.

---

## Function Details

### `formatDate`

```typescript
formatDate(date: Date | string, pattern?: string): string
```

**What:** Formats a date using a pattern with tokens for year, month, day, etc.

**When:** Displaying dates in UI, reports, emails, logs.

**Why:** Consistent formatting without Intl API complexity or moment.js dependency.

**Token Reference:**
| Token | Meaning | Example |
|-------|---------|---------|
| `YYYY` | 4-digit year | `2026` |
| `YY` | 2-digit year | `26` |
| `MM` | 2-digit month | `07` |
| `M` | Month without padding | `7` |
| `DD` | 2-digit day | `30` |
| `D` | Day without padding | `3` |
| `HH` | 2-digit hour (24h) | `14` |
| `H` | Hour without padding | `2` |
| `hh` | 2-digit hour (12h) | `02` |
| `h` | Hour 12h without padding | `2` |
| `mm` | 2-digit minute | `05` |
| `m` | Minute without padding | `5` |
| `ss` | 2-digit second | `09` |
| `s` | Second without padding | `9` |
| `A` | AM/PM uppercase | `PM` |
| `a` | AM/PM lowercase | `pm` |

**Example:**
```typescript
import { formatDate } from 'js-util-kit';

const date = new Date('2026-07-30T14:05:09');

formatDate(date);                        // '30/07/2026'
formatDate(date, 'YYYY-MM-DD');           // '2026-07-30'
formatDate(date, 'MM/DD/YYYY');           // '07/30/2026'
formatDate(date, 'DD-MON-YYYY');          // '30-Jul-2026'
formatDate(date, 'YYYY/MM/DD HH:mm:ss');  // '2026/07/30 14:05:09'
formatDate(date, 'hh:mm A');               // '02:05 PM'
formatDate(date, 'YYYY');                  // '2026'
formatDate('2026-07-30', 'MMMM DD, YYYY'); // 'July 30, 2026'
formatDate(new Date());                     // Today's date in default format
```

---

### `parseDate`

```typescript
parseDate(dateStr: string, pattern?: string): Date | undefined
```

**What:** Parses a date string using a known format pattern.

**When:** Converting user input, CSV data, or string dates to `Date` objects.

**Why:** Strict parsing without ambiguity — unlike `new Date('2026-07-30')` which varies by implementation.

**Example:**
```typescript
import { parseDate } from 'js-util-kit';

parseDate('30/07/2026', 'DD/MM/YYYY'); // Date(2026-07-30T00:00:00)
parseDate('07/30/2026', 'MM/DD/YYYY'); // Date(2026-07-30T00:00:00)
parseDate('2026-07-30', 'YYYY-MM-DD');  // Date(2026-07-30T00:00:00)
parseDate('2026-07-30 14:05', 'YYYY-MM-DD HH:mm'); // Date(2026-07-30T14:05:00)
parseDate('invalid', 'YYYY-MM-DD');      // undefined
parseDate('30-07-2026', 'YYYY-MM-DD');   // undefined (pattern mismatch)
parseDate('');                            // undefined
```

---

### `addDays`

```typescript
addDays(date: Date | string, days: number): Date
```

**What:** Returns a new Date with N days added (can be negative to subtract).

**When:** Due dates, expiry calculations, scheduling, calendar logic.

**Why:** Immutable — original date unchanged. Handles month/year overflow correctly.

**Example:**
```typescript
import { addDays } from 'js-util-kit';

const today = new Date('2026-07-30');

addDays(today, 7);    // Aug 6, 2026
addDays(today, 1);    // Jul 31, 2026
addDays(today, -1);   // Jul 29, 2026
addDays(today, 30);   // Aug 29, 2026
addDays(today, 365);  // Jul 30, 2027

// Month/year boundary handling
addDays(new Date('2026-01-31'), 1); // Feb 1, 2026
addDays(new Date('2026-12-31'), 1); // Jan 1, 2027
addDays(new Date('2026-02-28'), 1); // Mar 1, 2026 (non-leap)
addDays(new Date('2024-02-28'), 1); // Feb 29, 2024 (leap year)
```

---

### `subtractDays`

```typescript
subtractDays(date: Date | string, days: number): Date
```

**What:** Returns a new Date with N days subtracted.

**When:** Countdowns, expiry checks, looking back in time.

**Why:** Convenience wrapper for negative `addDays`. Semantically clear.

**Example:**
```typescript
import { subtractDays } from 'js-util-kit';

const today = new Date('2026-07-30');

subtractDays(today, 1);   // Jul 29, 2026
subtractDays(today, 7);    // Jul 23, 2026
subtractDays(today, 365);  // Jul 30, 2025

// Days since a past date
const lastLogin = new Date('2026-07-20');
const daysAgo = subtractDays(today, lastLogin.getDate());
// 10 days ago from today
```

---

### `isSameDay`

```typescript
isSameDay(dateA: Date | string, dateB: Date | string): boolean
```

**What:** Checks if two dates represent the same calendar day (ignoring time).

**When:** Grouping events by day, checking if a date is today, daily report filtering.

**Why:** `===` and `===` on Date objects compare timestamps, not calendar days.

**Example:**
```typescript
import { isSameDay } from 'js-util-kit';

isSameDay('2026-07-30', '2026-07-30');     // true
isSameDay('2026-07-30T10:00', '2026-07-30T23:59'); // true (same day, different times)
isSameDay('2026-07-30', '2026-07-31');     // false
isSameDay('2026-07-30', '2025-07-30');     // false (different year)
isSameDay(new Date(), new Date());           // true
```

---

### `getDaysBetween`

```typescript
getDaysBetween(dateA: Date | string, dateB: Date | string): number
```

**What:** Returns the number of days between two dates (absolute value).

**When:** Countdown timers, duration calculations, age calculations.

**Why:** Simple day count without time-of-day noise.

**Example:**
```typescript
import { getDaysBetween } from 'js-util-kit';

getDaysBetween('2026-07-30', '2026-08-06');  // 7
getDaysBetween('2026-01-01', '2026-12-31');  // 365
getDaysBetween('2026-07-30', '2026-07-30');  // 0
getDaysBetween('2026-07-30', '2025-07-30');  // 365

// Order doesn't matter
getDaysBetween('2025-01-01', '2026-01-01');  // 365

// With decimals (truncated to whole days)
getDaysBetween('2026-07-30T10:00', '2026-07-31T06:00'); // 0 (same calendar day boundary)
```

---

## Common Patterns

### Format a Date for Display
```typescript
import { formatDate, isSameDay } from 'js-util-kit';

function formatUserDate(dateStr: string): string {
  const date = parseDate(dateStr, 'YYYY-MM-DD');
  if (!date) return 'Invalid date';

  if (isSameDay(date, new Date())) return 'Today';
  if (isSameDay(date, addDays(new Date(), -1))) return 'Yesterday';
  if (isSameDay(date, addDays(new Date(), 1))) return 'Tomorrow';

  return formatDate(date, 'MMMM DD, YYYY');
}
```

### Countdown Timer
```typescript
import { getDaysBetween, formatDate } from 'js-util-kit';

function getCountdown(targetDateStr: string): string {
  const target = parseDate(targetDateStr, 'YYYY-MM-DD')!;
  const days = getDaysBetween(new Date(), target);
  const formattedTarget = formatDate(target, 'MMMM DD, YYYY');

  if (days <= 0) return 'Expired';
  return `${days} day${days !== 1 ? 's' : ''} until ${formattedTarget}`;
}

getCountdown('2026-12-31'); // '153 days until December 31, 2026'
```

### Expiry Check
```typescript
import { getDaysBetween } from 'js-util-kit';

function isExpired(expiryDate: Date): boolean {
  return getDaysBetween(new Date(), expiryDate) < 0;
}

function daysUntilExpiry(expiryDate: Date): number {
  return Math.max(0, getDaysBetween(new Date(), expiryDate));
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `formatDate` | Yes | Yes | None |
| `parseDate` | Yes | Yes | None |
| `addDays` | Yes | Yes | None |
| `subtractDays` | Yes | Yes | None |
| `isSameDay` | Yes | Yes | None |
| `getDaysBetween` | Yes | Yes | None |