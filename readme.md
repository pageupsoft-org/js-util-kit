# js-util-kit

A comprehensive TypeScript utility library providing type-safe, zero-dependency utilities for modern JavaScript/TypeScript applications.

## Documentation

| Guide                                                                                                                    | Description                                                            |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [Changelog](https://github.com/pageupsoft-org/js-util-kit/blob/main/CHANGELOG.md)                                        | Release notes and version history                                      |
| [Logger & Error Handler Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/LOGGER_ERROR_USAGE_GUIDE.md) | Comprehensive guide for logging and error handling utilities           |
| [API Reference](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/API_REFERENCE.md)                           | Complete API reference for all exported utilities                      |
| [Validation Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/VALIDATION_GUIDE.md)                     | Email, phone, URL, password, file size, and extension validation       |
| [String Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/STRING_GUIDE.md)                             | Capitalization, masking, sanitization, and random string generation    |
| [Number Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/NUMBER_GUIDE.md)                             | Clamping, rounding, currency/percentage formatting, and random numbers |
| [Object Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/OBJECT_GUIDE.md)                             | Deep clone, merge, pick, omit, equality, and cleanup utilities         |
| [Storage Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/STORAGE_GUIDE.md)                           | Type-safe localStorage/sessionStorage wrappers (browser)               |
| [Browser Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/BROWSER_GUIDE.md)                           | Device detection, clipboard, downloads, and scroll utilities           |
| [File Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/FILE_GUIDE.md)                                 | File extension, size formatting, downloads, and base64 conversion      |
| [URL Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/URL_GUIDE.md)                                   | Query string parsing/building and URL manipulation                     |
| [Date Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/DATE_GUIDE.md)                                 | Formatting, parsing, and date math utilities                           |
| [Auth Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/AUTH_GUIDE.md)                                 | Token generation, password hashing, and verification                   |
| [Array Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/ARRAY_GUIDE.md)                               | Chunking, deduplication, grouping, and sorting                         |
| [Angular Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/ANGULAR_GUIDE.md)               | Angular-specific integration and usage patterns                        |
| [React Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/REACT_GUIDE.md)                   | React-specific integration and usage patterns                          |
| [Express Integration Guide](https://github.com/pageupsoft-org/js-util-kit/blob/main/docs/EXPRESS_GUIDE.md)               | Express/Node.js backend integration guide                              |

## Installation

```bash
npm install js-util-kit
```

## Requirements

js-util-kit does not require a specific runtime or framework version.

Compatibility depends on the APIs required by the individual utilities being used. Some utilities rely on platform-specific capabilities such as Web Crypto, DOM APIs, browser storage, or file APIs.

See the platform compatibility section below for details.

## Platform Compatibility

| Platform                | Status      | Notes                                                       |
| ----------------------- | ----------- | ----------------------------------------------------------- |
| JavaScript / TypeScript | ✅ Supported | Core utilities are framework-independent                    |
| Node.js                 | ✅ Supported | Utilities work when the required runtime APIs are available |
| Browsers                | ✅ Supported | Browser-compatible utilities are available                  |
| Angular                 | ✅ Supported | See [Angular Guide](./docs/ANGULAR_GUIDE.md)                |
| React                   | ✅ Supported | See [React Guide](./docs/REACT_GUIDE.md)                    |
| Next.js / Remix         | ✅ Supported | Use server-compatible utilities during SSR                  |
| React Native            | ⚠️ Partial   | See React Native compatibility below                        |

### React Native Compatibility

Most utilities work in React Native, but browser-specific utilities such as storage, downloads, and browser APIs may require platform-specific alternatives or polyfills. Authentication utilities may also require a compatible crypto implementation.

#### React Native Auth Setup

To use auth utilities in React Native, install a compatible crypto polyfill:

```bash
# Option 1: Expo
npx expo install expo-crypto

# Option 2: React Native CLI
npm install react-native-quick-crypto
npm install react-native-get-random-values
```

Then import the required polyfill before using auth functions:

```typescript
// index.js or App.tsx
import 'react-native-get-random-values';
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
- Angular

Browser-specific functions, including browser APIs, storage, and certain file operations, should be executed in a browser/client environment. When called during server rendering, supported browser-specific utilities will gracefully return `false` or `null` where applicable instead of throwing errors.

#### Next.js Example

```typescript
// app/page.tsx (Next.js App Router)
import { formatDate, formatCurrency } from 'js-util-kit';

export default function Page() {
  // These work during SSR:
  const date = formatDate(new Date()); // ✅ Works on server
  const price = formatCurrency(99.99, 'USD'); // ✅ Works on server
  
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
  formatDate
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