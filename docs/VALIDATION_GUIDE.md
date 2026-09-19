# Validation Utilities Guide

Comprehensive guide for the validation utilities in `js-util-kit`.

## Overview

The validation module provides type-safe, zero-dependency validators for common data formats. All validators return `boolean` and work in both browser and Node.js environments.

## Exports

| Function | Purpose |
|----------|---------|
| `isValidEmail` | Practical email validation (not full RFC 5322) |
| `isValidPhoneNumber` | Phone number validation (international/e164/national formats) |
| `isValidUrl` | Absolute HTTP/HTTPS URL validation |
| `isStrongPassword` | Configurable password strength checking |
| `validateFileSize` | File/blob size limit validation |
| `validateFileExtension` | Filename extension allowlist validation |

---

## 1. isValidEmail

### What it does
Validates email addresses using a practical regex. Intentionally does not fully implement RFC 5322. For example, quoted local parts and comments are not supported.

### When to use
- User registration forms
- Contact form validation
- Email input sanitization
- API request validation

### Why to use
- Good balance of accuracy and simplicity
- Handles common email formats
- Zero dependencies, fast execution
- Returns false for null/undefined/empty strings

### How to use
```typescript
import { isValidEmail } from 'js-util-kit';

const email = 'user@example.com';
if (isValidEmail(email)) {
  // TypeScript knows email is valid here
  await sendWelcomeEmail(email);
}
```

### Example code
```typescript
const testCases = [
  'user@example.com',              // true
  'user.name@domain.org',          // true
  'user+tag@example.co.uk',        // true
  'user@sub.domain.example.com',   // true
  'invalid',                       // false
  'user@',                         // false
  '@example.com',                  // false
  'user name@example.com',         // false (space)
  null,                            // false
];

testCases.forEach(email => {
  console.log(`${email}: ${isValidEmail(email)}`);
});
```

### Expected output
```
user@example.com: true
user.name@domain.org: true
user+tag@example.co.uk: true
user@sub.domain.example.com: true
invalid: false
user@: false
@example.com: false
user name@example.com: false
null: false
```

---

## 2. isValidPhoneNumber

### What it does
Validates phone numbers in multiple formats: international (default), e164, or national.

### When to use
- User profile phone fields
- SMS/OTP verification flows
- International contact forms
- CRM data validation

### Why to use
- Supports 3 format modes: international, e164, national
- Handles common separators (spaces, parentheses, hyphens, dots)
- 7-15 digit range validation
- No external libphonenumber dependency

### How to use
```typescript
import { isValidPhoneNumber } from 'js-util-kit';

const phone = '+1 (415) 555-2671';
if (isValidPhoneNumber(phone)) {  // defaults to 'international' format
  await sendSMS(phone, 'Your code: 123456');
}

// Strict E.164 format
if (isValidPhoneNumber('+15551234567', 'e164')) {
  // Only +[1-9]\d{1,14} passes
}

// National format (no + required)
if (isValidPhoneNumber('(415) 555-2671', 'national')) {
  // Valid
}
```

### Example code
```typescript
const testCases = [
  '+15551234567',      // true (US)
  '+442071234567',     // true (UK)
  '+81312345678',      // true (Japan)
  '+4915123456789',    // true (Germany)
  '5551234567',        // false (missing +)
  '+1 555 123 4567',   // false (spaces)
  '+1-555-123-4567',   // false (dashes)
  '+1 (555) 123-4567', // false (parens)
  '++15551234567',     // false (double +)
  '+05551234567',      // false (invalid country code)
];

testCases.forEach(phone => {
  console.log(`${phone}: ${isValidPhoneNumber(phone)}`);
});
```

### Expected output
```
+15551234567: true
+442071234567: true
+81312345678: true
+4915123456789: true
5551234567: false
+1 555 123 4567: false
+1-555-123-4567: false
+1 (555) 123-4567: false
++15551234567: false
+05551234567: false
```

---

## 3. isValidUrl

### What it does
Validates URLs with support for http, https, ftp protocols and standard URL components.

### When to use
- Link validation in CMS/content editors
- Webhook URL verification
- Redirect target validation
- API endpoint configuration

### Why to use
- Validates protocol, hostname, port, path, query, hash
- Rejects malformed URLs (missing protocol, invalid chars)
- Handles IPv4, IPv6, and domain hostnames
- No WHATWG URL parser dependency (works in older environments)

### How to use
```typescript
import { isValidUrl } from 'js-util-kit';

const url = 'https://api.example.com/v1/users?active=true';
if (isValidUrl(url)) {
  await fetchData(url);
}
```

### Example code
```typescript
const testCases = [
  'https://example.com',                    // true
  'http://localhost:3000',                  // true
  'https://api.example.com/v1/users',       // true
  'https://user:pass@example.com',          // true (auth)
  'https://[2001:db8::1]:8080/path',        // true (IPv6)
  'ftp://files.example.com/download',       // true
  'example.com',                            // false (no protocol)
  'https://',                               // false (no host)
  'https://exa mple.com',                   // false (space)
  'javascript:alert(1)',                    // false (dangerous protocol)
  'data:text/html,<script>alert(1)</script>', // false (data URI)
];

testCases.forEach(url => {
  console.log(`${url}: ${isValidUrl(url)}`);
});
```

### Expected output
```
https://example.com: true
http://localhost:3000: true
https://api.example.com/v1/users: true
https://user:pass@example.com: true
https://[2001:db8::1]:8080/path: true
ftp://files.example.com/download: true
example.com: false
https://: false
https://exa mple.com: false
javascript:alert(1): false
data:text/html,<script>alert(1)</script>: false
```

---

## 4. isStrongPassword

### What it does
Evaluates password strength against configurable criteria: length, character classes, common patterns.

### When to use
- Registration password requirements
- Password change validation
- Security policy enforcement
- Real-time strength meter UI

### Why to use
- Configurable rules (no hardcoded policy)
- Detects common patterns (sequences, repeats, keyboard walks)
- Returns detailed score for UI feedback
- No zxcvbn or similar heavy dependency

### How to use
```typescript
import { isStrongPassword, type PasswordStrengthOptions } from 'js-util-kit';

const options: PasswordStrengthOptions = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxRepeatingChars: 2,
  forbidSequences: true,
  forbidCommonPasswords: true,
};

const result = isStrongPassword('MyStr0ng!Pass', options);
if (result.isValid) {
  // Accept password
} else {
  // Show result.errors to user
}
```

### Example code
```typescript
const options = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: false,
};

const passwords = [
  'Weak',                    // { isValid: false, score: 1, errors: ['too_short', 'no_uppercase', 'no_number'] }
  'weakpassword',            // { isValid: false, score: 2, errors: ['no_uppercase', 'no_number'] }
  'Weakpassword',            // { isValid: false, score: 3, errors: ['no_number'] }
  'Weakpass1',               // { isValid: true, score: 4, errors: [] }
  'StrongPass123',           // { isValid: true, score: 5, errors: [] }
  'VeryStr0ng!P@ss',         // { isValid: true, score: 5, errors: [] }
  'aaaaaaaa',                // { isValid: false, score: 1, errors: ['repeating_chars'] }
  '12345678',                // { isValid: false, score: 1, errors: ['sequence', 'no_uppercase', 'no_lowercase', 'no_symbols'] }
  'Password1',               // { isValid: false, score: 3, errors: ['common_password'] }
];

passwords.forEach(pwd => {
  const result = isStrongPassword(pwd, options);
  console.log(`${pwd}: valid=${result.isValid}, score=${result.score}, errors=${result.errors.join(',')}`);
});
```

### Expected output
```
Weak: valid=false, score=1, errors=too_short,no_uppercase,no_number
weakpassword: valid=false, score=2, errors=no_uppercase,no_number
Weakpassword: valid=false, score=3, errors=no_number
Weakpass1: valid=true, score=4, errors=
StrongPass123: valid=true, score=5, errors=
VeryStr0ng!P@ss: valid=true, score=5, errors=
aaaaaaaa: valid=false, score=1, errors=repeating_chars
12345678: valid=false, score=1, errors=sequence,no_uppercase,no_lowercase,no_symbols
Password1: valid=false, score=3, errors=common_password
```

---

## 5. validateFileSize

### What it does
Checks if a file size (in bytes) is within configured min/max limits.

### When to use
- File upload validation (client & server)
- Avatar/profile picture size limits
- Document upload restrictions
- API multipart request validation

### Why to use
- Simple byte-based comparison
- Human-readable error messages
- Works with File, Blob, or raw byte numbers
- No filesystem access needed

### How to use
```typescript
import { validateFileSize } from 'js-util-kit';

// Client-side with File object
const file = fileInput.files[0];
const result = validateFileSize(file.size, { maxBytes: 5 * 1024 * 1024 }); // 5MB

if (!result.valid) {
  showError(`File too large. Max size: ${formatFileSize(result.maxBytes)}`);
}
```

### Example code
```typescript
const testCases = [
  { size: 100, options: { minBytes: 1, maxBytes: 1024 } },           // { valid: true }
  { size: 1024 * 1024, options: { maxBytes: 5 * 1024 * 1024 } },      // { valid: true }
  { size: 10 * 1024 * 1024, options: { maxBytes: 5 * 1024 * 1024 } }, // { valid: false, error: 'file_too_large', maxBytes: 5242880 }
  { size: 0, options: { minBytes: 1 } },                              // { valid: false, error: 'file_too_small', minBytes: 1 }
  { size: 500, options: { minBytes: 1000 } },                         // { valid: false, error: 'file_too_small', minBytes: 1000 }
];

testCases.forEach(({ size, options }) => {
  const result = validateFileSize(size, options);
  console.log(`${size} bytes: valid=${result.valid}${result.error ? `, error=${result.error}` : ''}`);
});
```

### Expected output
```
100 bytes: valid=true
1048576 bytes: valid=true
10485760 bytes: valid=false, error=file_too_large
0 bytes: valid=false, error=file_too_small
500 bytes: valid=false, error=file_too_small
```

---

## 6. validateFileExtension

### What it does
Validates a filename's extension against an allowlist (case-insensitive).

### When to use
- File upload type restrictions
- Image/video/document type filtering
- Import/export format validation
- Security: prevent executable uploads

### Why to use
- Case-insensitive matching
- Handles multiple dots (file.name.ext)
- No magic byte detection (fast, client-safe)
- Returns matched extension for further processing

### How to use
```typescript
import { validateFileExtension } from 'js-util-kit';

const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const fileName = 'photo.JPG';

const result = validateFileExtension(fileName, allowed);
if (result.valid) {
  console.log(`Allowed extension: ${result.extension}`); // '.jpg'
}
```

### Example code
```typescript
const allowedImages = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const allowedDocs = ['.pdf', '.doc', '.docx', '.txt', '.md'];

const testCases = [
  'photo.jpg',           // { valid: true, extension: '.jpg' }
  'PHOTO.JPG',           // { valid: true, extension: '.jpg' }
  'image.PNG',           // { valid: true, extension: '.png' }
  'document.pdf',        // { valid: true, extension: '.pdf' }
  'archive.tar.gz',      // { valid: false (only checks final .gz) }
  'script.exe',          // { valid: false }
  'noextension',         // { valid: false }
  '.hidden',             // { valid: false (no name) }
  'file.',               // { valid: false (valid: false) }
];

testCases.forEach(fileName => {
  const result = validateFileExtension(fileName, [...allowedImages, ...allowedDocs]);
  console.log(`${fileName}: valid=${result.valid}${result.extension ? `, ext=${result.extension}` : ''}`);
});
```

### Expected output
```
photo.jpg: valid=true, ext=.jpg
PHOTO.JPG: valid=true, ext=.jpg
image.PNG: valid=true, ext=.png
document.pdf: valid=true, ext=.pdf
archive.tar.gz: valid=false
script.exe: valid=false
noextension: valid=false
.hidden: valid=false
file.: valid=false
```

---

## Common Patterns

### Form Validation Helper
```typescript
import { 
  isValidEmail, 
  isValidPhoneNumber, 
  isStrongPassword,
  validateFileSize,
  validateFileExtension 
} from 'js-util-kit';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateRegistrationForm(data: {
  email: string;
  phone: string;
  password: string;
  avatar?: File;
}): ValidationResult {
  const errors: string[] = [];

  if (!isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }

  if (!isValidPhoneNumber(data.phone)) {
    errors.push('Phone must be in E.164 format (+15551234567)');
  }

  const pwdResult = isStrongPassword(data.password, {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
  });
  if (!pwdResult.isValid) {
    errors.push(`Weak password: ${pwdResult.errors.join(', ')}`);
  }

  if (data.avatar) {
    const sizeResult = validateFileSize(data.avatar.size, { maxBytes: 2 * 1024 * 1024 });
    if (!sizeResult.valid) {
      errors.push('Avatar must be under 2MB');
    }

    const extResult = validateFileExtension(data.avatar.name, ['.jpg', '.jpeg', '.png', '.webp']);
    if (!extResult.valid) {
      errors.push('Avatar must be JPG, PNG, or WebP');
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Server-Side Validation Middleware (Express)
```typescript
import { Request, Response, NextFunction } from 'express';
import { isValidEmail, isValidUrl } from 'js-util-kit';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const { email, website } = req.body;
  const errors: string[] = [];

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (website && !isValidUrl(website)) {
    errors.push('Invalid website URL');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}
```

---

## Environment Compatibility

| Validator | Browser | Node.js | Notes |
|-----------|---------|---------|-------|
| `isValidEmail` | ✅ | ✅ | Pure JS |
| `isValidPhoneNumber` | ✅ | ✅ | Pure JS |
| `isValidUrl` | ✅ | ✅ | Pure JS |
| `isStrongPassword` | ✅ | ✅ | Pure JS |
| `validateFileSize` | ✅ | ✅ | Accepts File/Blob/number |
| `validateFileExtension` | ✅ | ✅ | Pure JS |

All validators are **synchronous**, **pure functions** with no side effects.