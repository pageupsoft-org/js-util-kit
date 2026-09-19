# Number Utilities Guide

Comprehensive guide for `js-util-kit` number utilities.

## Overview

The number module provides type-safe utilities for formatting, clamping, calculating, and generating numbers. All functions are pure, synchronous, and work in both browser and Node.js.

## Exports

| Function | Purpose | Use Case |
|----------|---------|----------|
| `clamp` | Clamp a number between min/max | Input validation, ranges |
| `roundToDecimalPlaces` | Round to N decimal places | Currency, measurements |
| `formatCurrency` | Format as locale-aware currency | Pricing, financial display |
| `formatPercentage` | Format as percentage | Progress, stats |
| `calculatePercentage` | Calculate part/total percentage | Analytics, scores |
| `isNumeric` | Check if value is numeric | Type checking, validation |
| `randomNumber` | Generate random number in range | Randomization, sampling |

---

## Function Details

### `clamp`

```typescript
clamp(
  value: number | null | undefined,
  min: number,
  max: number
): number | null
```

**What:** Clamps a number within a `[min, max]` range. If `min` is greater than `max`, the two are silently swapped before clamping.

**When:** Slider inputs, rating systems, API parameter validation, pagination.

**Why:** Prevents invalid values without branching if/else logic.

**Example:**
```typescript
import { clamp } from 'js-util-kit';

// Rating (1-5)
clamp(7, 1, 5);    // 5 (capped at max)
clamp(-2, 1, 5);   // 1 (floored at min)
clamp(3, 1, 5);    // 3 (within range)

// Min/max swap
clamp(5, 10, 0);   // 5 (range swapped to [0, 10])

// Null handling
clamp(null, 0, 10);      // null
clamp(undefined, 0, 10); // null
clamp(NaN, 0, 10);       // null
clamp(Infinity, 0, 10);  // null
```

---

### `roundToDecimalPlaces`

```typescript
roundToDecimalPlaces(
  value: number | null | undefined,
  places: number
): number | null
```

**What:** Rounds a number to a specified number of decimal places using `Math.round`.

**When:** Currency display, measurement precision, scientific notation, financial calculations.

**Why:** Avoids floating-point artifacts (e.g., `0.1 + 0.2 !== 0.3`).

**Example:**
```typescript
import { roundToDecimalPlaces } from 'js-util-kit';

// Basic rounding
roundToDecimalPlaces(3.14159, 2);   // 3.14
roundToDecimalPlaces(3.7, 0);       // 4
roundToDecimalPlaces(0.1 + 0.2, 2); // 0.3

// Null handling
roundToDecimalPlaces(null, 2);      // null
roundToDecimalPlaces(NaN, 2);       // null
roundToDecimalPlaces(Infinity, 2);  // null

// Throws RangeError for invalid places
roundToDecimalPlaces(3.14, -1);     // RangeError
roundToDecimalPlaces(3.14, NaN);    // RangeError
```

**Throws:** `RangeError` when `places` is not a finite, non-negative number.

---

### `formatCurrency`

```typescript
formatCurrency(
  value: number | null | undefined,
  currencyCode: string,
  locale = 'en-US'
): string
```

**What:** Formats a number as a currency string using the native `Intl.NumberFormat` API.

**When:** Pricing display, invoicing, financial reports, e-commerce.

**Why:** Proper locale formatting without i18n libraries.

**Example:**
```typescript
import { formatCurrency } from 'js-util-kit';

// Default (USD, en-US)
formatCurrency(1234.56, 'USD');          // '$1,234.56'
formatCurrency(0, 'USD');                // '$0.00'
formatCurrency(-50, 'USD');              // '-$50.00'

// Japanese Yen
formatCurrency(1999, 'JPY', 'ja-JP');    // '￥1,999'

// Euro (Germany)
formatCurrency(1999.99, 'EUR', 'de-DE'); // '1.999,99 €'

// Null handling
formatCurrency(null, 'USD');             // ''
formatCurrency(NaN, 'USD');              // ''
formatCurrency(Infinity, 'USD');         // ''

// Invalid currency code
formatCurrency(100, 'INVALID');          // ''
```

**Note:** Uses `Intl.NumberFormat` internally. Returns empty string for null/undefined/non-finite values or invalid currency codes.

---

### `formatPercentage`

```typescript
formatPercentage(
  value: number | null | undefined,
  decimalPlaces = 2,
  locale = 'en-US'
): string
```

**What:** Formats a number as a percentage string using the native `Intl.NumberFormat` API. The input is expected on a **0–100 scale** (e.g. pass `25` to display `'25.00%'`).

**When:** Progress bars, test scores, survey results, statistics.

**Why:** Consistent formatting with configurable precision.

**Example:**
```typescript
import { formatPercentage } from 'js-util-kit';

// Basic usage (0-100 scale)
formatPercentage(25.5);         // '25.50%'
formatPercentage(100);          // '100.00%'
formatPercentage(0);            // '0.00%'

// Custom decimals
formatPercentage(25.5, 0);      // '26%'
formatPercentage(25.5, 3);      // '25.500%'

// Null handling
formatPercentage(null);         // ''
formatPercentage(NaN);          // ''
formatPercentage(Infinity);     // ''

// Throws RangeError for invalid decimalPlaces
formatPercentage(25, -1);       // RangeError
formatPercentage(25, NaN);      // RangeError
```

**Throws:** `RangeError` when `decimalPlaces` is not a finite, non-negative number.

---

### `calculatePercentage`

```typescript
calculatePercentage(
  part: number | null | undefined,
  total: number | null | undefined
): number | null
```

**What:** Calculates what percentage `part` is of `total` on a 0–100 scale. Returns `0` when `total` is `0` to avoid division by zero.

**When:** Analytics (conversion rate), progress (items completed), statistics.

**Why:** Avoids manual division/multiplication errors.

**Example:**
```typescript
import { calculatePercentage } from 'js-util-kit';

// Basic
calculatePercentage(25, 100);   // 25
calculatePercentage(1, 3);      // 33.333...

// Progress
calculatePercentage(7, 10);     // 70
calculatePercentage(0, 10);     // 0
calculatePercentage(10, 10);    // 100

// Division by zero guard
calculatePercentage(5, 0);      // 0

// Null handling
calculatePercentage(null, 100); // null
calculatePercentage(25, null);  // null
calculatePercentage(NaN, 100);  // null
```

---

### `isNumeric`

```typescript
isNumeric(value: number | null | undefined): boolean
```

**What:** Returns `true` when the value is a finite, non-NaN number. `Infinity`, `-Infinity`, and `NaN` are considered non-numeric.

**When:** Input validation before mathematical operations, type narrowing.

**Why:** Safer than `typeof value === 'number'` (excludes NaN/Infinity).

**Example:**
```typescript
import { isNumeric } from 'js-util-kit';

isNumeric(42);        // true
isNumeric(3.14);      // true
isNumeric(0);         // true
isNumeric(-1);        // true
isNumeric(NaN);       // false
isNumeric(Infinity);  // false
isNumeric(-Infinity); // false
isNumeric(null);      // false
isNumeric(undefined); // false
```

---

### `randomNumber`

```typescript
randomNumber(min: number, max: number): number
```

**What:** Generates a random integer in the range `[min, max]` (inclusive) using `Math.random()`.

**When:** Random sampling, demo data, games, test data generation.

**Why:** Convenient bounded random number generation for non-security use cases.

**Security:** Uses `Math.random()` and is **not** cryptographically secure. Do not use for tokens, passwords, or any security-sensitive randomness — use `generateUuid` or `generateApiKey` instead.

**Example:**
```typescript
import { randomNumber } from 'js-util-kit';

// Integer (1-6, simulating a die)
randomNumber(1, 6);              // e.g., 4

// Random index
const arr = ['a', 'b', 'c', 'd'];
const index = randomNumber(0, arr.length - 1);
arr[index];

// Random percentage
randomNumber(0, 100);            // e.g., 42
```

---

## Common Patterns

### Pagination Calculator
```typescript
import { clamp, calculatePercentage } from 'js-util-kit';

class Paginator {
  constructor(
    public readonly totalItems: number,
    public readonly pageSize = 10,
    public readonly currentPage = 1
  ) {}

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get safePage(): number {
    return clamp(this.currentPage, 1, this.totalPages || 1);
  }

  get startIndex(): number {
    return (this.safePage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize - 1, this.totalItems - 1);
  }

  get progress(): number {
    return this.totalItems === 0 ? 0 : calculatePercentage(this.startIndex, this.totalItems, { decimals: 1 });
  }
}

const paginator = new Paginator(250, 25, 12);
paginator.safePage;    // 10 (clamped to max)
paginator.totalPages;   // 10
paginator.progress;     // 89.6
```

### Price Calculator with Tax
```typescript
import { roundToDecimalPlaces, formatCurrency } from 'js-util-kit';

function calculatePrice(subtotal: number, taxRate: number, discount: number = 0): { subtotal: number; discount: number; tax: number; total: number; totalFormatted: string } {
  const discounted = subtotal * (1 - discount / 100);
  const roundedSubtotal = roundToDecimalPlaces(discounted, 2);
  const tax = roundedSubtotal * taxRate / 100;
  const roundedTax = roundToDecimalPlaces(tax, 2);
  const total = roundToDecimalPlaces(roundedSubtotal + roundedTax, 2);

  return {
    subtotal: roundedSubtotal,
    discount,
    tax: roundedTax,
    total,
    totalFormat: formatCurrency(total),
  };
}

calculatePrice(49.99, 8.25, 10);
// { subtotal: 44.99, discount: 10, tax: 3.71, total: 48.70, totalFormat: '$48.70' }
```

### Progress Bar Rendering
```typescript
import { formatPercentage, calculatePercentage, clamp } from 'js-util-kit';

function renderProgressBar(current: number, total: number, barWidth = 20): string {
  const pct = clamp(calculatePercentage(current, total, { decimals: 0 }), 0, 100);
  const filled = Math.round((pct / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  return `[${bar}] ${formatPercentage(pct / 100)}`;
}

renderProgressBar(7, 10);    // '[████████░░░░] 70%'
renderProgressBar(10, 10);   // '[████████████] 100%'
renderProgressBar(0, 10);     // '[░░░░░░░░░░░░] 0%'
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `clamp` | ✅ | ✅ | None |
| `roundToDecimalPlaces` | ✅ | ✅ | None |
| `formatCurrency` | ✅ | ✅ | Intl.NumberFormat |
| `formatPercentage` | ✅ | ✅ | None |
| `calculatePercentage` | ✅ | ✅ | None |
| `isNumeric` | ✅ | ✅ | None |
| `randomNumber` | ✅ | ✅ | None (`Math.random()`, not cryptographically secure) |