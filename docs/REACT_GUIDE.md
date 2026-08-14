# React Integration Guide

This guide covers integrating `js-util-kit` logger and error handling utilities into React applications (including Next.js, Remix, Vite, CRA).

## Installation

```bash
npm install js-util-kit
```

## Logger Integration

### 1. Create Logger Context

```typescript
// src/lib/logger/LoggerContext.tsx
import React, { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { createLogger, createConsoleLogSink, createHttpLogSink, Logger, LogLevel } from 'js-util-kit';

interface LoggerContextValue {
  logger: Logger;
}

const LoggerContext = createContext<LoggerContextValue | null>(null);

interface LoggerProviderProps {
  children: ReactNode;
  minLevel?: LogLevel;
  logEndpoint?: string;
  environment?: string;
}

export function LoggerProvider({
  children,
  minLevel = 'info',
  logEndpoint,
  environment = 'development',
}: LoggerProviderProps) {
  const logger = useMemo(() => {
    const isProduction = environment === 'production';

    return createLogger({
      minLevel: isProduction ? 'warn' : minLevel,
      baseContext: {
        app: 'my-react-app',
        environment,
        version: process.env.REACT_APP_VERSION ?? '1.0.0',
      },
      redaction: {
        enabled: true,
        keys: ['password', 'token', 'authorization', 'secret', 'apiKey', 'creditCard'],
        replacement: '[REDACTED]',
      },
      sink: isProduction && logEndpoint
        ? createHttpLogSink({
            url: logEndpoint,
            batchSize: 50,
            flushIntervalMs: 5000,
            maxRetries: 3,
          })
        : createConsoleLogSink({ pretty: !isProduction, includeTimestamp: true }),
    });
  }, [environment, logEndpoint, minLevel]);

  // Flush on unmount (for HTTP sink)
  useEffect(() => {
    return () => {
      // Type-safe check for HttpLogSink
      if ('flush' in logger && typeof logger.flush === 'function') {
        logger.flush();
      }
    };
  }, [logger]);

  return <LoggerContext.Provider value={{ logger }}>{children}</LoggerContext.Provider>;
}

export function useLogger(): Logger {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within LoggerProvider');
  }
  return context.logger;
}
```

### 2. Global Error Boundary

```typescript
// src/lib/errors/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { normalizeError, toAppError } from 'js-util-kit';
import { useLogger } from '../logger/LoggerContext';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const logger = this.props.logger;
    const appError = toAppError(error);
    const envelope = normalizeError(appError, {
      includeStack: true,
      context: {
        componentStack: errorInfo.componentStack ?? '',
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    });

    logger.fatal('React component error', envelope);

    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return React.createElement(this.props.fallback, {
          error: this.state.error!,
          reset: this.reset,
        });
      }

      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <details style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={this.reset}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject logger
export function ErrorBoundaryWrapper({ children, fallback }: Props) {
  const logger = useLogger();

  return <ErrorBoundary logger={logger} fallback={fallback}>{children}</ErrorBoundary>;
}
```

### 3. API Error Handling Hook

```typescript
// src/lib/hooks/useApiError.ts
import { useCallback } from 'react';
import { useLogger } from '../logger/LoggerContext';
import { normalizeError, AppError, toAppError } from 'js-util-kit';

export function useApiError() {
  const logger = useLogger();

  const handleError = useCallback(
    (error: unknown, operation: string, context?: Record<string, unknown>) => {
      const appError = toAppError(error);
      const envelope = normalizeError(appError, {
        includeStack: true,
        context: { operation, timestamp: new Date().toISOString(), ...context },
      });

      logger.error(`API Error: ${operation}`, envelope);
      return envelope;
    },
    [logger]
  );

  const wrapError = useCallback(
    <T,>(promise: Promise<T>, operation: string, context?: Record<string, unknown>): Promise<T> => {
      return promise.catch((error) => {
        handleError(error, operation, context);
        throw error;
      });
    },
    [handleError]
  );

  return { handleError, wrapError };
}
```

### 4. App Setup

```typescript
// src/main.tsx (Vite/CRA)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LoggerProvider } from './lib/logger/LoggerContext';
import { ErrorBoundaryWrapper } from './lib/errors/ErrorBoundary';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <LoggerProvider
      environment={import.meta.env.MODE}
      logEndpoint={import.meta.env.VITE_LOG_ENDPOINT}
    >
      <ErrorBoundaryWrapper>
        <App />
      </ErrorBoundaryWrapper>
    </LoggerProvider>
  </React.StrictMode>
);
```

```typescript
// app/layout.tsx (Next.js App Router)
import { LoggerProvider } from '@/lib/logger/LoggerContext';
import { ErrorBoundaryWrapper } from '@/lib/errors/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LoggerProvider
          environment={process.env.NODE_ENV}
          logEndpoint={process.env.NEXT_PUBLIC_LOG_ENDPOINT}
        >
          <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
        </LoggerProvider>
      </body>
    </html>
  );
}
```

### 5. Usage in Components

```typescript
// src/features/auth/AuthForm.tsx
import { useState } from 'react';
import { useLogger } from '@/lib/logger/LoggerContext';
import { useApiError } from '@/lib/hooks/useApiError';
import { ValidationError, AppError } from 'js-util-kit';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginForm() {
  const logger = useLogger();
  const { wrapError } = useApiError();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (data: LoginForm): string | null => {
    if (!data.email.includes('@')) return 'Invalid email';
    if (data.password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate(form);
    if (validationError) {
      logger.warn('Validation failed', { context: { field: 'email', value: form.email } });
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await wrapError(
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        'login',
        { email: form.email }
      );

      logger.info('User logged in', { context: { email: form.email } });
      // Redirect or update auth state
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      {error && <div role="alert">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### 6. Service Layer with Error Handling

```typescript
// src/services/api/client.ts
import { useLogger } from '@/lib/logger/LoggerContext';
import { normalizeError, AppError, NotFoundError } from 'js-util-kit';

class ApiClient {
  private logger: ReturnType<typeof useLogger> | null = null;

  setLogger(logger: ReturnType<typeof useLogger>) {
    this.logger = logger;
  }

  private logError(operation: string, error: unknown, context?: Record<string, unknown>) {
    if (!this.logger) return;
    const envelope = normalizeError(error, { context: { operation, ...context } });
    this.logger.error(`API: ${operation}`, envelope);
  }

  async get<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) throw new NotFoundError('Resource not found');
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      this.logError('GET', error, { url });
      throw error;
    }
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      this.logError('POST', error, { url });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
```

```typescript
// src/services/api/userService.ts
import { apiClient } from './client';
import { AppError, NotFoundError, normalizeError } from 'js-util-kit';

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function getUser(id: string): Promise<User> {
  try {
    return await apiClient.get<User>(`/api/users/${id}`);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new AppError('Failed to fetch user', { code: 'USER_FETCH_FAILED', cause: error });
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  try {
    return await apiClient.post<User>(`/api/users/${id}`, data);
  } catch (error) {
    throw new AppError('Failed to update user', { code: 'USER_UPDATE_FAILED', cause: error });
  }
}
```

## Custom Domain Errors

```typescript
// src/lib/errors/domain.ts
import { AppError } from 'js-util-kit';

export class AuthError extends AppError {
  constructor(message: string, public readonly code: string = 'AUTH_ERROR', context?: Record<string, unknown>) {
    super(message, { name: 'AuthError', code, context });
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('Authentication token has expired', 'TOKEN_EXPIRED');
  }
}

export class PermissionDeniedError extends AuthError {
  constructor(resource: string) {
    super(`Permission denied for ${resource}`, 'PERMISSION_DENIED', { resource });
  }
}
```

## Environment Variables

```bash
# .env.development
VITE_LOG_ENDPOINT=http://localhost:3001/logs

# .env.production
VITE_LOG_ENDPOINT=https://logs.myapp.com/events
```

## Best Practices

1. **Use React Context for logger** - Provides singleton instance across component tree
2. **Wrap async operations** - Use `useApiError` hook for consistent error handling
3. **Redact in production** - Always enable redaction with sensitive keys
4. **Flush on unmount** - Call `logger.flush()` for HTTP sinks in cleanup
5. **Use Error Boundaries** - Catch render errors with normalized logging
6. **Domain errors for business logic** - Extend `AppError` for typed error handling

## Testing

```typescript
// src/lib/logger/LoggerContext.test.tsx
import { render, screen, act } from '@testing-library/react';
import { createNoopLogSink, createLogger, Logger } from 'js-util-kit';
import { LoggerProvider, useLogger } from './LoggerContext';

const testLogger = createLogger({ sink: createNoopLogSink() });

function TestComponent() {
  const logger = useLogger();
  return <button onClick={() => logger.info('clicked')}>Click me</button>;
}

test('logger works in context', () => {
  render(
    <LoggerProvider>
      <TestComponent />
    </LoggerProvider>
  );

  act(() => {
    screen.getByText('Click me').click();
  });

  // No throw = success
});
```