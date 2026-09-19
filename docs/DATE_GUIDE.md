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
formatDate(date: Date | string | null | undefined, pattern?: string): string
```

**What:** Formats a date using a pattern with tokens for year, month, day.

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

**Example:**
```typescript
import { formatDate } from 'js-util-kit';

const date = new Date('2026-07-30T14:05:09');

formatDate(date);                        // '2026-07-30'
formatDate(date, 'YYYY-MM-DD');           // '2026-07-30'
formatDate(date, 'MM/DD/YYYY');           // '07/30/2026'
formatDate(date, 'DD-MMM-YYYY');          // '30-07-2026'
formatDate(date, 'YYYY');                  // '2026'
formatDate('2026-07-30', 'MMMM DD, YYYY'); // 'July 30, 2026'
formatDate(new Date());                     // Today's date in default format
formatDate(null);                           // ''
```

---

### `formatDateTime`

```typescript
formatDateTime(date: Date | string | null | undefined, pattern?: string): string
```

**What:** Formats a date and time using a pattern with tokens for year, month, day, hour, minute, second.

**When:** Displaying date-times in UI, logs, timestamps.

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
| `H` | Hour without padding (24h) | `2` |
| `hh` | 2-digit hour (12h) | `02` |
| `h` | Hour without padding (12h) | `2` |
| `mm` | 2-digit minute | `05` |
| `m` | Minute without padding | `5` |
| `ss` | 2-digit second | `09` |
| `s` | Second without padding | `9` |
| `A` | AM/PM uppercase | `PM` |
| `a` | AM/PM lowercase | `pm` |

**Example:**
```typescript
import { formatDateTime } from 'js-util-kit';

const date = new Date('2026-07-30T14:05:09');

formatDateTime(date);                        // '2026-07-30 14:05:09'
formatDateTime(date, 'YYYY-MM-DD HH:mm:ss');  // '2026-07-30 14:05:09'
formatDateTime(date, 'MM/DD/YYYY HH:mm');     // '07/30/2026 14:05'
formatDateTime(date, 'DD/MM/YYYY hh:mm A');   // '30/07/2026 02:05 PM'
formatDateTime(date, 'YYYY');                  // '2026'
formatDateTime('2026-07-30', 'YYYY-MM-DD');   // '2026-07-30 00:00:00'
formatDateTime(new Date());                     // Current date-time in default format
formatDateTime(null);                           // ''
```

---

### `parseDate`

```typescript
parseDate(dateStr: string, pattern: string): Date | undefined
```

**What:** Parses a date string using a known format pattern.

**When:** Converting user input, CSV data, or string dates to `Date` objects.

**Why:** Strict parsing without ambiguity — unlike `new Date('2026-07-30')` which varies by implementation.

**Supported Tokens:** `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A`, `a`

**Example:**
```typescript
import { parseDate } from 'js-util-kit';

parseDate('30/07/2026', 'DD/MM/YYYY'); // Date(2026-07-30T00:00:00)
parseDate('07/30/2026', 'MM/DD/YYYY'); // Date(2026-07-30T00:00:00)
parseDate('2026-07-30', 'YYYY-MM-DD');  // Date(2026-07-30T00:00:00)
parseDate('2026-07-30 14:05', 'YYYY-MM-DD HH:mm'); // Date(2026-07-30T14:05:00)
parseDate('30/07/2026 02:05 PM', 'DD/MM/YYYY hh:mm A'); // Date(2026-07-30T14:05:00)
parseDate('invalid', 'YYYY-MM-DD');      // undefined
parseDate('30-07-2026', 'YYYY-MM-DD');   // undefined (pattern mismatch)
parseDate('');                            // undefined
```

---

### `addBusinessDays`

```typescript
addBusinessDays(date: Date | string, days: number): Date
```

**What:** Returns a new Date with N business days added (skips weekends).

**When:** Due dates, SLA calculations, business day scheduling.

**Why:** Automatically skips weekends. Immutable — original date unchanged.

**Example:**
```typescript
import { addBusinessDays } from 'js-util-kit';

const friday = new Date('2026-07-31'); // Friday
addBusinessDays(friday, 1);  // Monday, Aug 3
addBusinessDays(friday, 3);  // Wednesday, Aug 5
addBusinessDays(friday, -1); // Thursday, Jul 30

// Month/year boundary handling
addBusinessDays(new Date('2026-01-30'), 1); // Feb 2 (skips weekend)
```

---

### `calculateAge`

```typescript
calculateAge(birthDate: Date | string, referenceDate?: Date | string): number
```

**What:** Calculates age in years from a birth date.

**When:** User profiles, age verification, birthday calculations.

**Why:** Accurate age calculation handling leap years and birthdays.

**Example:**
```typescript
import { calculateAge } from 'js-util-kit';

calculateAge('2000-01-01');                    // Age as of today
calculateAge('2000-01-01', '2026-01-01');      // 26
calculateAge('2000-12-31', '2026-01-01');      // 25 (birthday not yet)
calculateAge('2010-02-29', '2026-02-28');      // 15 (leap year handling)
```

---

### `compareDatesIgnoringTime`

```typescript
compareDatesIgnoringTime(dateA: Date | string, dateB: Date | string): number
```

**What:** Compares two dates ignoring time components. Returns -1, 0, or 1.

**When:** Sorting dates by day, grouping events by date, date range checks.

**Why:** `Date` comparison includes time, which can cause unexpected ordering.

**Example:**
```typescript
import { compareDatesIgnoringTime } from 'js-util-kit';

compareDatesIgnoringTime('2026-07-30T10:00', '2026-07-30T23:59'); // 0 (same day)
compareDatesIgnoringTime('2026-07-30', '2026-07-31'); // -1
compareDatesIgnoringTime('2026-07-31', '2026-07-30'); // 1
```

---

### `convertLocalToUTC`

```typescript
convertLocalToUTC(date: Date | string): Date
```

**What:** Converts a local date to UTC.

**When:** Storing dates in UTC, sending to APIs that expect UTC.

**Example:**
```typescript
import { convertLocalToUTC } from 'js-util-kit';

// Local midnight becomes UTC midnight of previous/next day depending on timezone
convertLocalToUTC('2026-07-30T00:00:00'); // 2026-07-29T22:00:00.000Z (if UTC+2)
```

---

### `convertUTCToLocal`

```typescript
convertUTCToLocal(date: Date | string): Date
```

**What:** Converts a UTC date to local time.

**When:** Displaying UTC dates in user's local timezone.

**Example:**
```typescript
import { convertUTCToLocal } from 'js-util-kit';

convertUTCToLocal('2026-07-30T00:00:00.000Z'); // 2026-07-30T02:00:00 (if UTC+2)
```

---

### `getStartOfDay`

```typescript
getStartOfDay(date: Date | string): Date
```

**What:** Returns a new Date set to 00:00:00.000 of the given date.

**When:** Day boundary calculations, date range queries.

**Example:**
```typescript
import { getStartOfDay } from 'js-util-kit';

getStartOfDay('2026-07-30T14:05:09'); // 2026-07-30T00:00:00.000
```

---

### `getEndOfDay`

```typescript
getEndOfDay(date: Date | string): Date
```

**What:** Returns a new Date set to 23:59:59.999 of the given date.

**When:** Day boundary calculations, inclusive date range queries.

**Example:**
```typescript
import { getEndOfDay } from 'js-util-kit';

getEndOfDay('2026-07-30T14:05:09'); // 2026-07-30T23:59:59.999
```

---

### `isWeekend`

```typescript
isWeekend(date: Date | string): boolean
```

**What:** Checks if a date falls on Saturday or Sunday.

**When:** Business day calculations, scheduling, UI indicators.

**Example:**
```typescript
import { isWeekend } from 'js-util-kit';

isWeekend('2026-07-30'); // false (Thursday)
isWeekend('2026-08-01'); // true (Saturday)
isWeekend('2026-08-02'); // true (Sunday)
```

---

## Common Patterns

### Format a Date for Display
```typescript
import { formatDate, parseDate } from 'js-util-kit';

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

  return formatDate(date, 'MMMM DD, YYYY');
}
```

### Parse User Input
```typescript
import { parseDate, formatDate } from 'js-util-kit';

function parseUserBirthday(input: string): Date | null {
  // Try multiple common formats
  const formats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'MM-DD-YYYY',
    'DD-MM-YYYY'
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

function getNextBusinessDay(date: Date): Date {
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function scheduleMeeting(daysAhead: number): Date {
  return addBusinessDays(new Date(), daysAhead);
 }
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