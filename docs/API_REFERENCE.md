# API Reference

Complete API reference for `js-util-kit` organized by domain and environment compatibility.

## Environment Compatibility Legend

| Badge | Meaning |
|-------|---------|
| 🌐 **Universal** | Works in both browser and Node.js |
| 🌍 **Browser Only** | Requires browser APIs (DOM, localStorage, etc.) |
| 🖥️ **Node.js Only** | Requires Node.js APIs (fs, http, etc.) |

---

## 📦 Logger Domain (`src/logger`)

### Core Logger

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `createLogger` | Function | 🌐 Universal | Creates a structured logger with level filtering, redaction, and sink support |
| `Logger` | Interface | 🌐 Universal | Logger interface with `trace`, `debug`, `info`, `warn`, `error`, `fatal` methods |
| `CreateLoggerOptions` | Interface | 🌐 Universal | Configuration options for `createLogger` |
| `LogCallOptions` | Interface | 🌐 Universal | Per-call options: `context`, `data`, `error` |

### Log Levels & Filtering

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `LogLevel` | Type | 🌐 Universal | `'trace' \| 'debug' \| 'info' \| 'warn' \| 'error' \| 'fatal'` |
| `shouldLogLevel` | Function | 🌐 Universal | Compares candidate level against minimum level |

### Log Sinks

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `LogSink` | Interface | 🌐 Universal | Interface for log sinks: `emit(event: LoggerEvent): void` |
| `createNoopLogSink` | Function | 🌐 Universal | Creates a no-op sink (testing, disabled logging) |
| `createConsoleLogSink` | Function | 🌐 Universal | Creates a console sink with pretty/structured output |
| `ConsoleLogSinkOptions` | Interface | 🌐 Universal | Options: `consoleLike`, `pretty`, `includeTimestamp` |
| `createHttpLogSink` | Function | 🌐 Universal | Creates resilient HTTP transport sink with queueing, batching, retry, circuit breaker |
| `HttpLogSink` | Interface | 🌐 Universal | Extended sink with `flush()`, `shutdown()`, `getQueueSize()`, `getMetricsSnapshot()` |
| `HttpLogSinkOptions` | Interface | 🌐 Universal | Extensive HTTP sink configuration |

### Redaction & Payload Processing

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `redactLogPayload` | Function | 🌐 Universal | Redacts sensitive data from nested payloads |
| `RedactionOptions` | Interface | 🌐 Universal | `enabled`, `keys`, `paths`, `replacement`, `keyMatcher`, `pathMatcher` |

### Event Types

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `LoggerEvent` | Interface | 🌐 Universal | Log event structure: `timestamp`, `level`, `message`, `context`, `data`, `error` |
| `ErrorEnvelope` | Interface | 🌐 Universal | Normalized error shape (from error domain) |

### Resilience & Transport Profiles

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `createRetryCircuitPolicyPreset` | Function | 🌐 Universal | Creates retry + circuit breaker preset (`conservative`, `balanced`, `aggressive`) |
| `createTransportResilienceProfilePreset` | Function | 🌐 Universal | Creates full transport profile (`availability-first`, `cost-efficient`, `test-hardened`) |
| `createProviderResilienceTemplate` | Function | 🌐 Universal | Creates provider-ready HTTP sink template (`datadog-http`, `elk-http`, `opentelemetry-http`) |
| `createObservabilityDashboardContractPreset` | Function | 🌐 Universal | Creates dashboard contract preset (`operations`, `reliability`, `diagnostics`) |

### Provider-Specific Sinks

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `createProviderLogSink` | Function | 🌐 Universal | Generic provider sink factory |
| `createDatadogProviderLogSink` | Function | 🌐 Universal | Datadog-formatted log sink |
| `createElkProviderLogSink` | Function | 🌐 Universal | ELK/Elasticsearch-formatted log sink |
| `createOpenTelemetryProviderLogSink` | Function | 🌐 Universal | OpenTelemetry-formatted log sink |

### Payload Mappers & Validators

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `toDatadogLogEvent` | Function | 🌐 Universal | Maps `LoggerEvent` → Datadog log event |
| `toElkLogDocument` | Function | 🌐 Universal | Maps `LoggerEvent` → ELK document |
| `toOpenTelemetryLogRecord` | Function | 🌐 Universal | Maps `LoggerEvent` → OTel log record |
| `isDatadogLogPayload` | Function | 🌐 Universal | Type guard for Datadog payload |
| `isElkLogDocument` | Function | 🌐 Universal | Type guard for ELK document |
| `isOpenTelemetryLogRecord` | Function | 🌐 Universal | Type guard for OTel log record |

### Error Logging Helper

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `logUnknownError` | Function | 🌐 Universal | Logs unknown error through logger with context |

---

## 🚨 Error Domain (`src/error`)

### Error Classes

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `AppError` | Class | 🌐 Universal | Base application error with `code`, `context`, `cause` |
| `AppErrorOptions` | Interface | 🌐 Universal | Options: `name`, `code`, `context`, `cause` |
| `ValidationError` | Class | 🌐 Universal | Specialized `AppError` for validation failures (default code: `VALIDATION_ERROR`) |
| `NotFoundError` | Class | 🌐 Universal | Specialized `AppError` for missing resources (default code: `NOT_FOUND`) |

### Error Normalization & Conversion

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `normalizeError` | Function | 🌐 Universal | Converts unknown value → `ErrorEnvelope` |
| `NormalizeErrorOptions` | Interface | 🌐 Universal | `includeStack`, `maxCauseDepth`, `defaultMessage`, `context` |
| `toAppError` | Function | 🌐 Universal | Converts unknown value → `AppError` instance |
| `enrichErrorEnvelope` | Function | 🌐 Universal | Merges additional context into existing `ErrorEnvelope` |

### Error Types & Guards

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `ErrorEnvelope` | Interface | 🌐 Universal | Normalized error: `name`, `message`, `timestamp`, `stack?`, `code?`, `cause?`, `context?` |
| `ErrorContext` | Interface | 🌐 Universal | Key-value context object |
| `isErrorEnvelope` | Function | 🌐 Universal | Type guard: checks if value is `ErrorEnvelope` |

---

## ✅ Validation Domain (`src/validation`)

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `isValidEmail` | Function | 🌐 Universal | Validates email format (RFC 5322 compliant) |
| `isValidPhoneNumber` | Function | 🌐 Universal | Validates phone number (E.164 format) |
| `isValidUrl` | Function | 🌐 Universal | Validates URL format |
| `isStrongPassword` | Function | 🌐 Universal | Checks password strength (configurable rules) |
| `validateFileSize` | Function | 🌐 Universal | Validates file size against limits |
| `validateFileExtension` | Function | 🌐 Universal | Validates file extension against allowlist |

---

## 🔤 String Domain (`src/string`)

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `capitalize` | Function | 🌐 Universal | Capitalizes first letter of each word |
| `capitalizeFirstLetter` | Function | 🌐 Universal | Capitalizes only first letter of string |
| `truncateText` | Function | 🌐 Universal | Truncates text with ellipsis |
| `toTitleCase` | Function | 🌐 Universal | Converts to title case |
| `maskSensitiveData` | Function | 🌐 Universal | Masks sensitive data (cards, SSN, etc.) |
| `sanitizeFilename` | Function | 🌐 Universal | Sanitizes string for safe filename |
| `removeSpecialCharacters` | Function | 🌐 Universal | Removes non-alphanumeric characters |
| `removeExtraWhitespaces` | Function | 🌐 Universal | Normalizes whitespace |
| `isNullOrWhitespace` | Function | 🌐 Universal | Checks if string is null/empty/whitespace |
| `generateRandomString` | Function | 🌐 Universal | Generates cryptographically secure random string |

---

## 🔢 Number Domain (`src/number`)

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `clamp` | Function | 🌐 Universal | Clamps number between min/max |
| `roundToDecimalPlaces` | Function | 🌐 Universal | Rounds to specified decimal places |
| `formatCurrency` | Function | 🌐 Universal | Formats number as currency (locale-aware) |
| `formatPercentage` | Function | 🌐 Universal | Formats number as percentage |
| `calculatePercentage` | Function | 🌐 Universal | Calculates percentage (part/total × 100) |
| `isNumeric` | Function | 🌐 Universal | Checks if value is numeric |
| `randomNumber` | Function | 🌐 Universal | Generates random number in range |

---

## 📦 Object Domain (`src/object`)

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `deepClone` | Function | 🌐 Universal | Deep clones object (handles circular refs) |
| `mergeObjects` | Function | 🌐 Universal | Deep merges objects |
| `pick` | Function | 🌐 Universal | Creates object with only specified keys |
| `omit` | Function | 🌐 Universal | Creates object without specified keys |
| `isEqual` | Function | 🌐 Universal | Deep equality check |
| `removeEmptyProperties` | Function | 🌐 Universal | Removes null/undefined/empty string properties |

---

## 💾 Storage Domain (`src/storage`) 🌍 Browser Only

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `setItem` | Function | 🌍 Browser Only | Type-safe localStorage/sessionStorage setter |
| `getItem` | Function | 🌍 Browser Only | Type-safe localStorage/sessionStorage getter |
| `removeItem` | Function | 🌍 Browser Only | Removes item from storage |
| `clearItems` | Function | 🌍 Browser Only | Clears all items from storage |

---

## 🌐 Browser Domain (`src/browser`) 🌍 Browser Only

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `isMobileDevice` | Function | 🌍 Browser Only | Detects mobile device via user agent |
| `isTouchDevice` | Function | 🌍 Browser Only | Detects touch capability |
| `copyToClipboard` | Function | 🌍 Browser Only | Copies text to clipboard |
| `downloadBlob` | Function | 🌍 Browser Only | Triggers blob download |
| `openInNewTab` | Function | 🌍 Browser Only | Opens URL in new tab |
| `scrollToElement` | Function | 🌍 Browser Only | Smooth scrolls to element |

---

## 📁 File Domain (`src/file`) 🌍 Browser Only

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `getFileExtension` | Function | 🌐 Universal | Extracts file extension from path/name |
| `formatFileSize` | Function | 🌐 Universal | Formats bytes as human-readable string |
| `downloadFile` | Function | 🌍 Browser Only | Triggers file download from URL/blob |
| `convertFileToBase64` | Function | 🌍 Browser Only | Converts File/Blob to base64 string |

---

## 🔗 URL Domain (`src/url`) 🌐 Universal

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `parseQueryString` | Function | 🌐 Universal | Parses query string to object |
| `buildQueryString` | Function | 🌐 Universal | Builds query string from object |
| `appendQueryParameters` | Function | 🌐 Universal | Appends params to existing URL |
| `getBaseUrl` | Function | 🌐 Universal | Extracts base URL from full URL |

---

## 📅 Date Domain (`src/date`) 🌐 Universal

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `formatDate` | Function | 🌐 Universal | Formats date with custom pattern |
| `parseDate` | Function | 🌐 Universal | Parses date string with pattern |
| `addDays` | Function | 🌐 Universal | Adds days to date |
| `subtractDays` | Function | 🌐 Universal | Subtracts days from date |
| `isSameDay` | Function | 🌐 Universal | Checks if two dates are same day |
| `getDaysBetween` | Function | 🌐 Universal | Gets days between two dates |

---

## 🔐 Auth Domain (`src/auth`) 🌐 Universal

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `generateApiKey` | Function | 🌐 Universal | Generates secure API key |
| `hashPassword` | Function | 🌐 Universal | Hashes password with bcrypt |
| `verifyPassword` | Function | 🌐 Universal | Verifies password against hash |
| `generateToken` | Function | 🌐 Universal | Generates JWT-like token |
| `verifyToken` | Function | 🌐 Universal | Verifies token signature |

---

## 📊 Array Domain (`src/array`) 🌐 Universal

| Export | Type | Environment | Description |
|--------|------|-------------|-------------|
| `chunk` | Function | 🌐 Universal | Splits array into chunks |
| `unique` | Function | 🌐 Universal | Removes duplicates |
| `shuffle` | Function | 🌐 Universal | Fisher-Yates shuffle |
| `flatten` | Function | 🌐 Universal | Flattens nested arrays |
| `groupBy` | Function | 🌐 Universal | Groups array by key function |
| `sortBy` | Function | 🌐 Universal | Sorts array by key(s) |

---

## Usage by Environment

### Frontend (Browser) Applications
All **Universal** and **Browser Only** utilities are available.

```typescript
// Logger
import { createLogger, createConsoleLogSink } from 'js-util-kit';

// Error Handling
import { AppError, normalizeError, toAppError } from 'js-util-kit';

// Validation
import { isValidEmail, isStrongPassword } from 'js-util-kit';

// Browser-specific
import { copyToClipboard, downloadFile, isMobileDevice } from 'js-util-kit';
```

### Backend (Node.js/Express) Applications
All **Universal** utilities are available. Browser-only utilities will not work.

```typescript
// Logger with HTTP sink
import { createLogger, createHttpLogSink, createProviderResilienceTemplate } from 'js-util-kit';

// Error Handling
import { AppError, ValidationError, NotFoundError, normalizeError } from 'js-util-kit';

// Validation, String, Number, Object, URL, Date, Auth, Array
import { isValidEmail, clamp, deepClone, parseQueryString } from 'js-util-kit';

// File utilities (Universal only)
import { getFileExtension, formatFileSize } from 'js-util-kit';
```

### Shared Utilities (Both Environments)
The following domains work identically in both environments:
- `logger` (with appropriate sink)
- `error`
- `validation`
- `string`
- `number`
- `object`
- `url`
- `date`
- `auth`
- `array`
- `file` (partial: `getFileExtension`, `formatFileSize` only)

---

## TypeScript Support

All utilities are written in TypeScript with full type definitions included. The package exports types via:

```json
{
  "types": "./dist/index.d.mts"
}
```

Import types directly:

```typescript
import type { Logger, LogLevel, CreateLoggerOptions } from 'js-util-kit';
import type { ErrorEnvelope, AppErrorOptions } from 'js-util-kit';
```