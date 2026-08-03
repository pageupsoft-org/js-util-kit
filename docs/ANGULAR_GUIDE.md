# Angular Integration Guide

This guide covers integrating `@rsiddha/js-utils` logger and error handling utilities into Angular applications.

## Installation

```bash
npm install @rsiddha/js-utils
```

## Logger Integration

### 1. Create a Logger Service

```typescript
// src/app/core/services/logger.service.ts
import { Injectable, inject } from '@angular/core';
import { createLogger, createConsoleLogSink, createHttpLogSink, Logger, LogLevel } from '@rsiddha/js-utils';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly logger: Logger;

  constructor() {
    const isProduction = environment.production;

    this.logger = createLogger({
      minLevel: isProduction ? 'warn' : 'debug',
      baseContext: {
        app: 'my-angular-app',
        environment: environment.name,
        version: environment.version,
      },
      redaction: {
        enabled: true,
        keys: ['password', 'token', 'authorization', 'secret', 'apiKey'],
        replacement: '[REDACTED]',
      },
      sink: isProduction
        ? createHttpLogSink({
            url: environment.logEndpoint,
            batchSize: 50,
            flushIntervalMs: 5000,
            maxRetries: 3,
          })
        : createConsoleLogSink({ pretty: true, includeTimestamp: true }),
    });
  }

  trace(message: string, context?: Record<string, unknown>): void {
    this.logger.trace(message, { context });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, { context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, { context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, { context });
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.logger.error(message, { error, context });
  }

  fatal(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.logger.fatal(message, { error, context });
  }

  getLogger(): Logger {
    return this.logger;
  }
}
```

### 2. Global Error Handler

```typescript
// src/app/core/handlers/global-error.handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { normalizeError, toAppError } from '@rsiddha/js-utils';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    const appError = toAppError(error);
    const envelope = normalizeError(appError, {
      includeStack: true,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });

    this.logger.error('Unhandled error', envelope, {
      context: { source: 'global-error-handler' },
    });

    if (!environment.production) {
      console.error(error);
    }
  }
}
```

### 3. HTTP Interceptor for Error Logging

```typescript
// src/app/core/interceptors/error-logging.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { normalizeError, AppError } from '@rsiddha/js-utils';

export const errorLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const appError = new AppError(error.message, {
        code: `HTTP_${error.status}`,
        context: {
          url: req.url,
          method: req.method,
          status: error.status,
          statusText: error.statusText,
        },
      });

      const envelope = normalizeError(appError, { includeStack: false });

      logger.error(`HTTP ${error.status}: ${req.method} ${req.url}`, envelope);

      return throwError(() => error);
    })
  );
};
```

### 4. Provide in App Config

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';
import { errorLoggingInterceptor } from './core/interceptors/error-logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([errorLoggingInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
```

### 5. Usage in Components/Services

```typescript
// src/app/features/user/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from '@core/services/logger.service';
import { AppError, NotFoundError, normalizeError } from '@rsiddha/js-utils';

interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly apiUrl = '/api/users';

  getUser(id: string): Observable<User> {
    this.logger.debug('Fetching user', { context: { userId: id } });

    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        const envelope = normalizeError(error, {
          context: { operation: 'getUser', userId: id },
        });

        if (error.status === 404) {
          this.logger.warn('User not found', envelope);
          throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { userId: id } });
        }

        this.logger.error('Failed to fetch user', envelope);
        throw new AppError('Failed to fetch user', { code: 'USER_FETCH_FAILED', cause: error });
      })
    );
  }

  createUser(userData: Partial<User>): Observable<User> {
    this.logger.info('Creating user', { context: { email: userData.email } });

    return this.http.post<User>(this.apiUrl, userData).pipe(
      catchError((error) => {
        const envelope = normalizeError(error, { context: { operation: 'createUser' } });

        if (error.status === 400) {
          this.logger.warn('Validation error', envelope);
          throw new AppError('Validation failed', { code: 'VALIDATION_ERROR', context: envelope.context });
        }

        this.logger.error('Failed to create user', envelope);
        throw new AppError('Failed to create user', { code: 'USER_CREATE_FAILED', cause: error });
      })
    );
  }
}
```

## Error Handling Patterns

### Custom Domain Errors

```typescript
// src/app/core/errors/domain.errors.ts
import { AppError } from '@rsiddha/js-utils';

export class PaymentError extends AppError {
  constructor(message: string, public readonly paymentId: string, options?: { code?: string; context?: Record<string, unknown> }) {
    super(message, {
      name: 'PaymentError',
      code: options?.code ?? 'PAYMENT_ERROR',
      context: { paymentId, ...options?.context },
    });
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(paymentId: string, balance: number, required: number) {
    super('Insufficient funds', paymentId, {
      code: 'INSUFFICIENT_FUNDS',
      context: { balance, required },
    });
  }
}
```

### Using Domain Errors in Components

```typescript
// src/app/features/payment/payment.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { PaymentService } from './payment.service';
import { InsufficientFundsError, PaymentError } from '@core/errors/domain.errors';
import { LoggerService } from '@core/services/logger.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
})
export class PaymentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly logger = inject(LoggerService);

  form = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentMethodId: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    try {
      await this.paymentService.processPayment(this.form.value);
      this.logger.info('Payment processed successfully');
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        this.logger.warn('Insufficient funds', { context: error.context });
        // Show user-friendly message
      } else if (error instanceof PaymentError) {
        this.logger.error('Payment failed', normalizeError(error));
        // Handle other payment errors
      } else {
        this.logger.error('Unexpected payment error', normalizeError(error));
      }
    }
  }
}
```

## Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  name: 'development',
  version: '1.0.0',
  logEndpoint: 'http://localhost:3001/logs',
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  name: 'production',
  version: '1.0.0',
  logEndpoint: 'https://logs.myapp.com/events',
};
```

## Best Practices

1. **Use `LoggerService` as a singleton** - Provide in root for tree-shaking
2. **Redact sensitive data** - Always enable redaction in production
3. **Use domain errors** - Extend `AppError` for business logic errors
4. **Normalize at boundaries** - Use `normalizeError` in HTTP interceptors and global error handler
5. **Configure log levels per environment** - Debug in dev, warn/error in prod
6. **Use HTTP sink in production** - Batch logs for efficient transport

## Testing

```typescript
// src/app/core/services/logger.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { createNoopLogSink, createLogger, Logger } from '@rsiddha/js-utils';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let logger: Logger;

  beforeEach(() => {
    logger = createLogger({ sink: createNoopLogSink() });
    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: { getLogger: () => logger } }],
    });
    service = TestBed.inject(LoggerService);
  });

  it('should log without throwing', () => {
    expect(() => service.info('Test message')).not.toThrow();
    expect(() => service.error('Test error', new Error('fail'))).not.toThrow();
  });
});
```