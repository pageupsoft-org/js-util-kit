# js-util-kit

A comprehensive TypeScript utility library providing type-safe, zero-dependency utilities for modern JavaScript/TypeScript applications.

## Documentation

| Guide | Description |
|-------|-------------|
| [Changelog](https://github.com/pageupsoft-org/js-util-kit/blob/main/CHANGELOG.md) | Release notes and version history |
| [Logger & Error Handler Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/LOGGER_ERROR_USAGE_GUIDE.md) | Comprehensive guide for logging and error handling utilities |
| [API Reference](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/API_REFERENCE.md) | Complete API reference for all exported utilities |
| [Validation Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/VALIDATION_GUIDE.md) | Email, phone, URL, password, file size, and extension validation |
| [String Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/STRING_GUIDE.md) | Capitalization, masking, sanitization, and random string generation |
| [Number Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/NUMBER_GUIDE.md) | Clamping, rounding, currency/percentage formatting, and random numbers |
| [Object Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/OBJECT_GUIDE.md) | Deep clone, merge, pick, omit, equality, and cleanup utilities |
| [Storage Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/STORAGE_GUIDE.md) | Type-safe localStorage/sessionStorage wrappers (browser) |
| [Browser Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/BROWSER_GUIDE.md) | Device detection, clipboard, downloads, and scroll utilities |
| [File Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/FILE_GUIDE.md) | File extension, size formatting, downloads, and base64 conversion |
| [URL Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/URL_GUIDE.md) | Query string parsing/building and URL manipulation |
| [Date Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/DATE_GUIDE.md) | Formatting, parsing, and date math utilities |
| [Auth Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/AUTH_GUIDE.md) | Token generation, password hashing, and verification |
| [Array Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/ARRAY_GUIDE.md) | Chunking, deduplication, grouping, and sorting |
| [Angular Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/ANGULAR_GUIDE.md) | Angular-specific integration and usage patterns |
| [React Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/REACT_GUIDE.md) | React-specific integration and usage patterns |
| [Express Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/EXPRESS_GUIDE.md) | Express/Node.js backend integration guide |

## Installation

```bash
npm install js-util-kit
```

## Requirements

- **Node.js**: v15.0.0+ (for auth utilities requiring Web Crypto API)
- **TypeScript**: v4.5+ (optional, types included)
- **Modern Browsers**: Chrome 60+, Firefox 57+, Safari 11+, Edge 79+

For Node.js <v15, auth utilities will throw "Crypto API not available". Use Node.js v15+ or install a polyfill like `@peculiar/webcrypto`.

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Node.js v15+ | ✅ Full Support | All modules work |
| Modern Browsers | ✅ Full Support | All modules work |
| Angular | ✅ Full Support | See [Angular Guide](./docs/ANGULAR_GUIDE.md) |
| React | ✅ Full Support | See [React Guide](./docs/REACT_GUIDE.md) |
| Next.js/Remix | ✅ SSR Compatible | All utilities SSR-safe |
| React Native | ⚠️ Partial | See limitations below |

### React Native Compatibility

React Native has limited support due to missing Web APIs:

| Module | Status | Notes |
|--------|--------|-------|
| Array | ✅ Full | All functions work |
| Auth | ⚠️ Requires Polyfill | Needs crypto polyfill (see below) |
| Browser | ❌ Not Available | Use RN-specific libraries |
| Date | ✅ Full | All functions work |
| Error | ✅ Full | All functions work |
| File | ⚠️ Partial | Only getFileExtension/formatFileSize work |
| Logger | ✅ Full | All functions work |
| Number | ✅ Full | All functions work |
| Object | ✅ Full | All functions work |
| Storage | ❌ Not Available | Use @react-native-async-storage/async-storage |
| String | ✅ Full | All functions work |
| URL | ✅ Full | All functions work |
| Validation | ✅ Full | All functions work |

#### React Native Auth Setup

To use auth utilities in React Native, install a crypto polyfill:

```bash
# Option 1: Expo
npx expo install expo-crypto

# Option 2: React Native CLI
npm install react-native-quick-crypto
npm install react-native-get-random-values
```

Then import before using auth functions:

```typescript
// index.js or App.tsx
import 'react-native-get-random-values'; // Must be first!
import { generateApiKey, hashPassword } from 'js-util-kit';
```

#### React Native Alternatives

For unavailable modules, use these React Native equivalents:

- **Browser utilities**: Use platform-specific APIs
  - `copyToClipboard` → `@react-native-clipboard/clipboard`
  - `downloadFile` → `react-native-fs` or `expo-file-system`
  - `openInNewTab` → `Linking.openURL()`
- **Storage utilities**: Use `@react-native-async-storage/async-storage`
- **File utilities**: Use `react-native-fs` or `expo-file-system` for base64 conversion

### Server-Side Rendering (SSR)

All utilities are SSR-safe and can be imported in:
- Next.js (App Router & Pages Router)
- Remix
- Nuxt
- SvelteKit
- Angular Universal

Browser-specific functions (browser/*, storage/*, some file/*) will gracefully return `false` or `null` during server rendering without throwing errors.

#### Next.js Example

```typescript
// app/page.tsx (Next.js App Router)
import { formatDate, formatCurrency, sanitizeHtml } from 'js-util-kit';

export default function Page() {
  // These work during SSR:
  const date = formatDate(new Date()); // ✅ Works on server
  const price = formatCurrency(99.99); // ✅ Works on server
  
  // These are client-only (use in useEffect or 'use client' components):
  const handleCopy = () => {
    copyToClipboard('text'); // ⚠️ Returns false on server
  };
  
  return <div>{date} - {price}</div>;
}
```

## Tree-Shaking Support

js-util-kit is fully tree-shakeable. Import only what you need to minimize bundle size:

```typescript
// ❌ Imports entire library (~170KB)
import * as utils from 'js-util-kit';

// ✅ Imports only formatCurrency function (~2KB)
import { formatCurrency } from 'js-util-kit';

// ✅ Multiple specific imports
import { 
  formatCurrency, 
  formatDate, 
  sanitizeHtml 
} from 'js-util-kit';
```

## Features

- **Logger** - Structured logging with level filtering, redaction, and multiple sinks
- **Error Handling** - Normalized error envelopes, AppError classes, and error conversion utilities
- **Validation** - Email, phone, URL, password, and file validation utilities
- **String Utilities** - Capitalization, masking, sanitization, and transformation
- **Number Utilities** - Formatting, clamping, random numbers, percentages
- **Object Utilities** - Deep clone, merge, pick, omit, equality checks
- **Storage Utilities** - Type-safe localStorage/sessionStorage wrappers
- **Browser Utilities** - Device detection, clipboard, downloads, scroll utilities
- **File Utilities** - File size formatting, base64 conversion, downloads
- **URL Utilities** - Query string parsing/building, base URL extraction
- **Date Utilities** - Formatting, parsing, and date math
- **Auth Utilities** - Token generation, password hashing, and verification
- **Array Utilities** - Chunking, deduplication, grouping, and sorting

## License

ISC