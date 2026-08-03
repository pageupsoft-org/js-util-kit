# Auth Utilities Guide

Comprehensive guide for `@rsiddha/js-utils` auth utilities (JWT-like tokens, password hashing, API keys).

## Overview

The auth module provides utilities for secure token generation, password hashing, and verification. Works in both browser and Node.js.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `generateApiKey` | Generate secure API key | Server-to-server auth |
| `hashPassword` | Hash password with bcrypt | User registration |
| `verifyPassword` | Verify password against hash | User login |
| `generateToken` | Generate JWT-like token | Session tokens |
| `verifyToken` | Verify token signature | Auth middleware |

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
import { generateApiKey } from '@rsiddha/js-utils';

// Default key
generateApiKey();
// 'ak_live_a1b2c3d4e5f6...' (with prefix)

// Custom prefix
generateApiKey('sk');
// 'sk_a1b2c3d4e5f6...'

// No prefix
generateApiKey('');
// 'a1b2c3d4e5f6...' (raw key)

// Batch create keys for multiple users
const keys = ['user1', 'user2', 'user3'].map(() => generateApiKey());
```

**Format:** `<prefix>_live_<random_hex>` where random portion is 32 hex characters.

---

### `hashPassword`

```typescript
hashPassword(password: string, rounds?: number): Promise<string>
```

**What:** Hashes a password using bcrypt with the specified number of rounds.

**When:** User registration, password changes, credential migration.

**Why:** Bcrypt is the industry standard for password hashing — slow by design, resistant to brute force.

**Rounds Guide:**
| Rounds | Time (approx) | Use Case |
|--------|---------------|----------|
| 10 | ~100ms | Development / testing |
| 12 | ~400ms | Staging / low-security |
| 14 | ~1.6s | **Production recommended** |
| 16 | ~6.4s | High security |

**Example:**
```typescript
import { hashPassword, verifyPassword } from '@rsiddha/js-utils';

// Registration
async function registerUser(email: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  const hash = await hashPassword(password, 14);
  // Store: { email, passwordHash: hash }
}

// Login
async function loginUser(email: string, password: string): Promise<boolean> {
  const user = await db.findUser(email);
  if (!user) return false;
  return verifyPassword(password, user.passwordHash);
}
```

---

### `verifyPassword`

```typescript
verifyPassword(password: string, hash: string): Promise<boolean>
```

**What:** Verifies a plaintext password against a bcrypt hash.

**When:** User login, password re-verification (before changing password).

**Why:** Constant-time comparison prevents timing attacks.

**Example:**
```typescript
import { verifyPassword } from '@rsiddha/js-utils';

const isValid = await verifyPassword('userPassword123', '$2b$14$...');
// true or false
```

**Security:** Always use `verifyPassword` rather than comparing hashes manually.

---

### `generateToken`

```typescript
generateToken(payload: Record<string, unknown>, secret: string, expiresIn?: string): Promise<string>
```

**What:** Generates a JWT-like signed token with expiration.

**When:** Session tokens, email verification tokens, password reset tokens.

**Why:** Self-contained tokens with expiry — no server-side session storage needed.

**Example:**
```typescript
import { generateToken, verifyToken } from '@rsiddha/js-utils';

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

**When:** Auth middleware, protecting API endpoints. Express route protection.

**Why:** Validates token integrity and expiration in one call.

**Example:**
```typescript
import { verifyToken } from '@rsiddha/js-utils';

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

## Common Patterns

### Complete Registration Flow
```typescript
import { hashPassword, generateToken, verifyToken } from '@rsiddha/js-utils';

class AuthService {
  async register(email: string, password: string): Promise<{ userId: string; token: string }> {
    // 1. Hash password
    const passwordHash = await hashPassword(password, 14);

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
import { generateToken, verifyToken, hashPassword } from '@rsiddha/js-utils';

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

  const hash = await hashPassword(newPassword, 14);
  await db.updateUserPassword(payload.userId as string, hash);
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `generateApiKey` | Yes | Yes | Web Crypto / Node crypto |
| `hashPassword` | Yes | Yes | bcrypt (bundled / native) |
| `verifyPassword` | Yes | Yes | bcrypt (bundled / native) |
| `generateToken` | Yes | Yes | Web Crypto / Node crypto |
| `verifyToken` | Yes | Yes | Web Crypto / Node crypto |