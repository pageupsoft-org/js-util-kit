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
clamp(value: number, min: number, max: number): number
```

**What:** Restricts a number to a range `[min, max]`.

**When:** Slider inputs, rating systems, API parameter validation, pagination.

**Why:** Prevents invalid values without branching if/else logic.

**Example:**
```typescript
import { clamp } from 'js-util-kit';

// Rating (1-5)
clamp(7, 1, 5);    // 5 (capped at max)
clamp(-2, 1, 5);   // 1 (floored at min)
clamp(3, 1, 5);    // 3 (within range)
clamp(0, 1, 5);    // 1 (exact min)
clamp(5, 1, 5);    // 5 (exact max)

// API pagination
const page = clamp(req.query.page ?? 1, 1, 100);

// RGB color values
const r = clamp(255 + 50, 0, 255); // 255
const g = clamp(-10, 0, 255);      // 0

// Edge cases
clamp(3, 3, 3);    // 3 (min === max)
clamp(5, 10, 1);   // 1 (min > max, returns min effectively via clamping)
```

**Throws:** `TypeError` if any argument is not a finite number.

---

### `roundToDecimalPlaces`

```typescript
roundToDecimalPlaces(value: number, decimalPlaces: number, roundingMode?: 'half-up' | 'half-down' | 'half-even' | 'floor' | 'ceil'): number
```

**What:** Rounds to a specified number of decimal places.

**When:** Currency display, measurement precision, scientific notation, financial calculations.

**Why:** Avoids floating-point artifacts (e.g., `0.1 + 0.2 !== 0.3`).

**Example:**
```typescript
import { roundToDecimalPlaces } from 'js-util-kit';

// Basic rounding
roundToDecimalPlaces(3.14159, 2);              // 3.14
roundToDecimalPlaces(3.145, 2);                // 3.15
roundToDecimalPlaces(2.555, 2);                // 2.56
roundToDecimalPlaces(0.1 + 0.2, 2);           // 0.3 (not 0.30000000000000004)

// Zero decimal places
roundToDecimalPlaces(3.5, 0);                  // 4
roundToDecimalPlaces(3.14159, 0);            // 3

// Negative decimal places (round to tens/hundreds)
roundToDecimalPlaces(1542, -2);               // 1500
roundToDecimalPlaces(1542, -3);               // 2000

// Rounding modes
roundToDecimalPlaces(2.55, 1, 'half-up');     // 2.6
roundToDecimalPlaces(2.55, 1, 'half-down');   // 2.5
roundToDecimalPlaces(2.55, 1, 'half-even');   // 2.6
roundToDecimalPlaces(2.55, 1, 'floor');       // 2.5
roundToDecimalPlaces(2.55, 1, 'ceil');        // 2.6

// Financial (half-even = banker's rounding)
roundToDecimalPlaces(1.005, 2, 'half-even'); // 1.00 (rounds to even)
roundToDecimalPlaces(1.015, 2, 'half-even'); // 1.02 (rounds to even)
```

**Defaults:** `decimalPlaces = 0`, `roundingMode = 'half-up'`.

---

### `formatCurrency`

```typescript
formatCurrency(amount: number, options?: CurrencyOptions): string
interface CurrencyOptions {
  locale?: string;       // default: 'en-US'
  currency?: string;     // default: 'USD'
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: 'currency' | 'decimal';
}
```

**What:** Formats a number as a locale-aware currency string.

**When:** Pricing display, invoicing, financial reports, e-commerce.

**Why:** Proper locale formatting without i18n libraries.

**Example:**
```typescript
import { formatCurrency } from 'js-util-kit';

// Default (USD, en-US)
formatCurrency(1999.99);                    // '$1,999.99'
formatCurrency(0);                          // '$0.00'
formatCurrency(-50);                        // '-$50.00'

// Japanese Yen
formatCurrency(1999, { currency: 'JPY', locale: 'ja-JP' });   // '￥1,999'

// Euro (Germany)
formatCurrency(1999.99, { currency: 'EUR', locale: 'de-DE' }); // '1.999,99 €'

// British Pound
formatCurrency(99.95, { currency: 'GBP', locale: 'en-GB' });   // '£99.95'

// No fraction digits
formatCurrency(1999.99, { maximumFractionDigits: 0 }); // '$2,000'

// Compact format
formatCurrency(1500000, { currency: 'USD', notation: 'compact' }); // varies by Intl support

// Zero and negative
formatCurrency(0);     // '$0.00'
formatCurrency(-42.5); // '-$42,50'
```

**Note:** Uses `Intl.NumberFormat` internally. Falls back to basic `$N,NNN.NN` format if unavailable.

---

### `formatPercentage`

```typescript
formatPercentage(value: number, options?: PercentageOptions): string
interface PercentageOptions {
  decimals?: number;    // default: 0 (no decimal places)
  suffix?: string;      // default: '%'
  locale?: string;      // default: undefined
}
```

**What:** Formats a decimal (0-1) or ratio as a percentage string.

**When:** Progress bars, test scores, survey results, statistics.

**Why:** Consistent formatting with configurable precision.

**Example:**
```typescript
import { formatPercentage } from 'js-util-kit';

// Basic usage (0-1 scale)
formatPercentage(0.856);                     // '86%'
formatPercentage(0.5);                       // '50%'
formatPercentage(1);                         // '100%'
formatPercentage(0);                         // '0%'

// Decimals
formatPercentage(0.12345, { decimals: 2 });  // '12.35%'

// Custom suffix
formatPercentage(0.42, { suffix: ' percent' }); // '42 percent'

// Ratio (0-100 scale)
formatPercentage(73, { decimals: 1 });       // '73.0%'

// Edge cases
formatPercentage(1.2);                         // '120%'
formatPercentage(-0.05);                      // '-5%'
formatPercentage(0.001, { decimals: 3 });     // '0.100%'
```

**Note:** By default expects values 0-1 (decimal form). Multiply by 100 for ratio form or use `{ decimals }` appropriately.

---

### `calculatePercentage`

```typescript
calculatePercentage(part: number, total: number, options?: { decimals?: number }): number
```

**What:** Calculates part/total × 100, rounded to specified decimals.

**When:** Analytics (conversion rate), progress (items completed), statistics.

**Why:** Avoids manual division/multiplication errors.

**Example:**
```typescript
import { calculatePercentage } from 'js-util-kit';

// Basic
calculatePercentage(25, 100);                 // 25
calculatePercentage(1, 3, { decimals: 2 });  // 33.33

// Progress
calculatePercentage(7, 10);                  // 70
calculatePercentage(0, 10);                  // 0
calculatePercentage(10, 10);                 // 100

// Large numbers
calculatePercentage(1250, 5000);             // 25

// Edge cases
calculatePercentage(0, 1000);                // 0
calculatePercentage(1000, 0);               // Infinity (throws RangeError if total === 0)
calculatePercentage(5, 10, { decimals: 0 }); // 50
```

---

### `isNumeric`

```typescript
isNumeric(value: unknown): boolean
```

**What:** Checks if a value is a finite number (not `NaN`, `Infinity`, strings, objects).

**When:** Input validation before mathematical operations, type narrowing.

**Why:** Safer than `typeof value === 'number'` (excludes NaN/Infinity).

**Example:**
```typescript
import { isNumeric } from 'js-util-kit';

isNumeric(42);                          // true
isNumeric(3.14);                        // true
isNumeric(-1);                          // true
isNumeric(0);                           // true
isNumeric(NaN);                          // false
isNumeric(Infinity);                     // false
isNumeric(-Infinity);                    // false
isNumeric('42');                         // false
isNumeric('3.14');                       // false
isNumeric(null);                         // false
isNumeric(undefined);                    // false
isNumeric({});                           // false
isNumeric([]);                           // false
isNumeric(new Number(42));               // false
```

---

### `randomNumber`

```typescript
randomNumber(min: number, max: number, options?: { inclusive?: boolean }): number
```

**What:** Generates a pseudo-random number in `[min, max]` using `Math.random()`.

**When:** Random sampling, demo data, games, A/B test assignment.

**Why:** Convenient bounded random number generation for non-security use cases.

**Security:** Uses `Math.random()` and is **not** cryptographically secure. Do not use for tokens, passwords, or any security-sensitive randomness — use `generateUuid` (Web Crypto-based) instead.

**Example:**
```typescript
import { randomNumber } from 'js-util-kit';

// Integer (1-6, simulating a die)
randomNumber(1, 6, { inclusive: true });       // e.g., 4

// Float (0-1)
randomNumber(0, 1);                              // e.g., 0.7382...

// Random index into array
const arr = ['a', 'b', 'c', 'd', 'e'];
const index = randomNumber(0, arr.length - 1, { inclusive: true });
arr[index];

// Random percentage
randomNumber(0, 100, { inclusive: true });       // e.g., 42
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