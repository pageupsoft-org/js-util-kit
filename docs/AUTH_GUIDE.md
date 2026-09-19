# Auth Utilities Guide

Comprehensive guide for `js-util-kit` auth utilities (JWT handling, API keys, password hashing).

## Overview

The auth module provides utilities for secure token generation, password hashing, JWT decoding, and verification. Works in both browser and Node.js.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `generateApiKey` | Generate secure API key | Server-to-server auth |
| `hashPassword` | Hash password with PBKDF2 | User registration |
| `verifyPassword` | Verify password against hash | User login |
| `generateToken` | Generate JWT-like token | Session tokens |
| `verifyToken` | Verify token signature and expiry | Auth middleware |
| `decodeJwt` | Decode JWT payload without verification | Client-side token inspection |
| `isTokenExpired` | Check if JWT is expired | Token validation |

---

## Prerequisites

🌐 **Universal** — works in both browser and Node.js.

---

## Function Details

### `generateApiKey`

```typescript
generateApiKey(prefix?: string): string
```

**What:** Generates a cryptographically secure API key.

**When:** Creating API keys for users, services, or integrations.

**Why:** Uses Web Crypto API / Node `crypto.randomBytes` — not predictable like `Math.random()`.

**Example:**
```typescript
import { generateApiKey } from 'js-util-kit';

// Default key
generateApiKey();
// 'ak_live_a1b2c3d4e5f6...' (with prefix)

// Custom prefix
generateApiKey('sk');
// 'sk_live_a1b2c3d4e5f6...'

// No prefix
generateApiKey('');
// 'a1b2c3d4e5f6...' (raw key)

// Batch create keys for multiple users
const keys = ['user1', 'user2', 'user3'].map(() => generateApiKey());
```

**Format:** `<prefix>_live_<32_hex_chars>` where random portion is 16 bytes (32 hex characters).

---

### `hashPassword`

```typescript
hashPassword(password: string): Promise<string>
```

**What:** Hashes a password using PBKDF2 with SHA-256 (100,000 iterations).

**When:** User registration, password changes, credential migration.

**Why:** PBKDF2 is a standard key derivation function — slow by design, resistant to brute force. No external dependencies.

**Example:**
```typescript
import { hashPassword, verifyPassword } from 'js-util-kit';

// Registration
async function registerUser(email: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const hash = await hashPassword(password);
  // Store: { email, passwordHash: hash }
}

// Login
async function loginUser(email: string, password: string): Promise<boolean> {
  const user = await db.findUser(email);
  if (!user) return false;
  return verifyPassword(password, user.passwordHash);
}
```

**Format:** `v=1$i=100000$base64salt$base64hash`

---

### `verifyPassword`

```typescript
verifyPassword(password: string, hash: string): Promise<boolean>
```

**What:** Verifies a plaintext password against a PBKDF2 hash.

**When:** User login, password re-verification (before changing password).

**Why:** Constant-time comparison prevents timing attacks.

**Example:**
```typescript
import { verifyPassword } from 'js-util-kit';

const isValid = await verifyPassword('userPassword123', 'v=1$i=100000$...');
// true or false
```

**Security:** Always use `verifyPassword` rather than comparing hashes manually.

---

### `generateToken`

```typescript
generateToken(payload: Record<string, unknown>, secret: string, expiresIn?: string): Promise<string>
```

**What:** Generates a JWT-like signed token with expiration using HS256.

**When:** Session tokens, email verification tokens, password reset tokens.

**Why:** Self-contained tokens with expiry — no server-side session storage needed.

**Example:**
```typescript
import { generateToken, verifyToken } from 'js-util-kit';

// Session token (expires in 24 hours)
const token = await generateToken(
  { userId: 'u-123', role: 'admin' },
  'my-secret-key',
  '24h'
);
// 'eyJhbGciOiJIUzI1NiJ9...'

// Verification token (expires in 1 hour)
const verifyToken = await generateToken(
  { email: 'user@example.com', action: 'verify-email' },
  'my-secret-key',
  '1h'
);
```

**Expiration Units:** `s` (seconds), `m` (minutes), `h` (hours), `d` (days).

---

### `verifyToken`

```typescript
verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null>
```

**What:** Verifies a token's signature and checks expiry. Returns payload if valid.

**When:** Auth middleware, protecting API endpoints.

**Why:** Validates token integrity and expiration in one call.

**Example:**
```typescript
import { verifyToken } from 'js-util-kit';

async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = await verifyToken(token, 'my-secret-key');

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach user info to request
  req.user = { id: payload.userId as string, role: payload.role as string };
  next();
}
```

**Returns:** Token payload if valid and not expired, `null` otherwise.

---

### `decodeJwt`

```typescript
decodeJwt(token: string | null | undefined): Record<string, unknown> | null
```

**What:** Decodes a JWT payload without verifying its signature.

**⚠️ SECURITY WARNING:** This function does not validate or verify token integrity. It only decodes payload claims for client-side convenience and must not be used as a trust or authorization check.

**When:** Client-side token inspection, extracting user info from token for UI display.

**Example:**
```typescript
import { decodeJwt } from 'js-util-kit';

decodeJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature'); // => { sub: '123' }
decodeJwt(null); // null
```

---

### `isTokenExpired`

```typescript
isTokenExpired(token: string | null | undefined, clockSkewSeconds?: number): boolean
```

**What:** Returns whether a JWT should be treated as expired by checking the `exp` claim.

**When:** Quick client-side expiry checks, conditional UI rendering.

**Why:** Fail-safe behavior — malformed tokens, missing/invalid `exp`, or uncertain cases are treated as expired.

**Example:**
```typescript
import { isTokenExpired } from 'js-util-kit';

isTokenExpired('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDAwMDAwMDB9.signature'); // => false
isTokenExpired(expiredToken); // => true
isTokenExpired(null); // => true
```

**Clock Skew:** Optional `clockSkewSeconds` parameter to tolerate clock differences between client and server.

---

## Common Patterns

### Complete Registration Flow
```typescript
import { hashPassword, generateToken, verifyToken } from 'js-util-kit';

class AuthService {
  async register(email: string, password: string): Promise<{ userId: string; token: string }> {
    // 1. Hash password
    const passwordHash = await hashPassword(password);

    // 2. Save user
    const user = await this.db.createUser(email, passwordHash);

    // 3. Generate session token
    const token = await generateToken(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      '7d'
    );

    return { userId: user.id, token };
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    // 1. Find user
    const user = await this.db.findUser(email);
    if (!user) throw new Error('Invalid credentials');

    // 2. Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    // 3. Generate token
    const token = await generateToken(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      '7d'
    );

    return { token };
  }

  async refreshSession(token: string): Promise<{ newToken: string }> {
    const payload = await verifyToken(token, process.env.JWT_SECRET!);
    if (!payload) throw new Error('Invalid token');

    return {
      newToken: await generateToken(
        payload as Record<string, unknown>,
        process.env.JWT_SECRET!,
        '7d'
      ),
    };
  }
}
```

### Password Reset Flow
```typescript
import { generateToken, verifyToken, hashPassword } from 'js-util-kit';

async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.findUser(email);
  if (!user) return; // Don't reveal if email exists

  // Generate reset token (expires in 1 hour)
  const resetToken = await generateToken(
    { userId: user.id, action: 'reset-password', email },
    process.env.RESET_SECRET!,
    '1h'
  );

  // Send email with reset link
  await sendEmail(email, 'Password Reset', `Reset link: /reset?token=${resetToken}`);
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
  const payload = await verifyToken(token, process.env.RESET_SECRET!);
  if (!payload || payload.action !== 'reset-password') {
    throw new Error('Invalid or expired reset token');
  }

  const hash = await hashPassword(newPassword);
  await db.updateUserPassword(payload.userId as string, hash);
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | React Native | Dependencies |
|----------|---------|---------|--------------|--------------|
| `generateApiKey` | Yes | Yes (v15+) | Requires polyfill | Web Crypto API |
| `hashPassword` | Yes | Yes (v15+) | Requires polyfill | Web Crypto API |
| `verifyPassword` | Yes | Yes (v15+) | Requires polyfill | Web Crypto API |
| `generateToken` | Yes | Yes (v15+) | Requires polyfill | Web Crypto API |
| `verifyToken` | Yes | Yes (v15+) | Requires polyfill | Web Crypto API |
| `decodeJwt` | Yes | Yes | Yes | None |
| `isTokenExpired` | Yes | Yes | Yes | None |

All functions are **pure** and have **zero external dependencies**.

---

## React Native Compatibility

### Prerequisites

Auth utilities require the Web Crypto API, which is not available in React Native by default. You must install a polyfill:

#### Option 1: Expo

```bash
npx expo install expo-crypto
```

#### Option 2: React Native CLI

```bash
npm install react-native-quick-crypto
npm install react-native-get-random-values
```

### Setup

Import the polyfill **before** any auth utilities:

```typescript
// index.js or App.tsx (must be at the very top)
import 'react-native-get-random-values';

// Now you can use auth utilities
import { generateApiKey, hashPassword } from 'js-util-kit';
```

### Example: React Native Login

```typescript
// App.tsx
import 'react-native-get-random-values'; // Must be first!
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { hashPassword, verifyPassword } from 'js-util-kit';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      // In a real app, fetch user from backend
      const user = await fetchUser(email);
      
      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        setError('Invalid credentials');
        return;
      }
      
      // Navigate to home
      navigation.navigate('Home');
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
      <Button title="Login" onPress={handleLogin} />
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

### Troubleshooting

**Error: "Crypto API not available"**

This means the polyfill wasn't loaded. Check:
1. Polyfill import is **first** in your entry file (index.js or App.tsx)
2. Polyfill package is installed: `npm ls react-native-get-random-values`
3. Metro bundler was restarted after installing polyfill

**Error: "btoa is not defined" or "atob is not defined"**

Some older React Native versions don't include base64 functions. Install:

```bash
npm install base-64
```

Then polyfill globally:

```typescript
// index.js
import { encode, decode } from 'base-64';

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}
```

### Alternative: Backend-Only Auth

For simpler React Native integration, handle all auth operations on the backend:

```typescript
// React Native - only JWT decoding (no crypto needed)
import { decodeJwt, isTokenExpired } from 'js-util-kit';

// Get token from backend
const response = await fetch('https://api.example.com/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const { token } = await response.json();

// Decode for UI display (doesn't require crypto)
const payload = decodeJwt(token);
console.log(`User ID: ${payload?.userId}`);

// Check expiry client-side
if (isTokenExpired(token)) {
  // Refresh token or re-login
}
```

---

## Node.js Version Compatibility

**Minimum Version**: Node.js **v15.0.0**

Auth utilities use the Web Crypto API (`crypto.subtle`), which was added in Node.js v15.

### For Node.js <v15

Install a polyfill:

```bash
npm install @peculiar/webcrypto
```

Setup:

```typescript
// server.ts (top of file)
import { Crypto } from '@peculiar/webcrypto';

if (!globalThis.crypto) {
  globalThis.crypto = new Crypto();
}

// Now auth utilities will work
import { generateApiKey } from 'js-util-kit';
```

---

## Browser Compatibility

All auth utilities work in modern browsers:

- ✅ Chrome 60+
- ✅ Firefox 57+
- ✅ Safari 11+
- ✅ Edge 79+

Older browsers (IE11, Safari <11) do not support Web Crypto API and are not supported.