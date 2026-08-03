# Express/Node.js Integration Guide

This guide covers integrating `@rsiddha/js-utils` logger and error handling utilities into Express.js and Node.js backend applications.

## Installation

```bash
npm install @rsiddha/js-utils
```

## Logger Integration

### 1. Logger Factory

```typescript
// src/lib/logger/index.ts
import { createLogger, createConsoleLogSink, createHttpLogSink, createProviderResilienceTemplate, Logger, LogLevel } from '@rsiddha/js-utils';

export interface LoggerConfig {
  serviceName: string;
  environment: 'development' | 'staging' | 'production';
  logLevel?: LogLevel;
  logEndpoint?: string;
  datadogApiKey?: string;
  elkUrl?: string;
}

let defaultLogger: Logger | null = null;

export function createAppLogger(config: LoggerConfig): Logger {
  const isProduction = config.environment === 'production';
  const minLevel = config.logLevel ?? (isProduction ? 'info' : 'debug');

  // Choose sink based on configuration
  let sink;
  if (config.datadogApiKey) {
    // Datadog HTTP sink
    const template = createProviderResilienceTemplate('datadog-http', {
      profile: isProduction ? 'availability-first' : 'cost-efficient',
      datadogMapper: { service: config.serviceName, env: config.environment, source: 'node' },
    });

    sink = createHttpLogSink({
      url: `https://http-intake.logs.datadoghq.com/v1/input/${config.datadogApiKey}`,
      headers: { 'DD-API-KEY': config.datadogApiKey },
      ...template,
    });
  } else if (config.elkUrl) {
    // ELK/Elasticsearch sink
    const template = createProviderResilienceTemplate('elk-http', {
      profile: isProduction ? 'availability-first' : 'cost-efficient',
      elkMapper: { index: `${config.serviceName}-logs-${new Date().toISOString().split('T')[0]}` },
    });

    sink = createHttpLogSink({
      url: config.elkUrl,
      ...template,
    });
  } else if (config.logEndpoint) {
    // Generic HTTP sink
    sink = createHttpLogSink({
      url: config.logEndpoint,
      batchSize: 100,
      flushIntervalMs: 5000,
      maxRetries: 3,
    });
  } else {
    // Console sink for development
    sink = createConsoleLogSink({
      pretty: !isProduction,
      includeTimestamp: true,
    });
  }

  return createLogger({
    minLevel,
    sink,
    baseContext: {
      service: config.serviceName,
      environment: config.environment,
      hostname: process.env.HOSTNAME ?? 'unknown',
      pid: process.pid,
    },
    redaction: {
      enabled: true,
      keys: ['password', 'token', 'authorization', 'secret', 'apiKey', 'creditCard', 'ssn'],
      paths: ['request.headers.authorization', 'request.headers.cookie', 'user.password'],
      replacement: '[REDACTED]',
    },
  });
}

export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = createAppLogger({
      serviceName: process.env.SERVICE_NAME ?? 'app',
      environment: (process.env.NODE_ENV as any) ?? 'development',
    });
  }
  return defaultLogger;
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

// Graceful shutdown
export async function shutdownLogger(): Promise<void> {
  if (defaultLogger && 'shutdown' in defaultLogger && typeof defaultLogger.shutdown === 'function') {
    await defaultLogger.shutdown();
  }
}

process.on('SIGTERM', shutdownLogger);
process.on('SIGINT', shutdownLogger);
```

### 2. Express Request Logger Middleware

```typescript
// src/lib/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { getLogger, Logger } from '../logger';

export function createRequestLogger(logger: Logger = getLogger()) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] as string ?? crypto.randomUUID();

    // Attach request ID to request for downstream use
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log request
    logger.info('HTTP Request', {
      context: {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Log response
    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNs) / 1_000_000;

      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      logger[logLevel]('HTTP Response', {
        context: {
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs),
          contentLength: res.get('content-length'),
        },
      });
    });

    next();
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
```

### 3. Global Error Handler

```typescript
// src/lib/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../logger';
import { normalizeError, AppError, toAppError, isErrorEnvelope, ErrorEnvelope } from '@rsiddha/js-utils';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export function createErrorHandler(logger = getLogger()) {
  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.requestId ?? 'unknown';
    const appError = toAppError(error);
    const envelope = normalizeError(appError, {
      includeStack: process.env.NODE_ENV !== 'production',
      context: {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    // Determine status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (isErrorEnvelope(envelope)) {
      // Use error code if available
      if (envelope.code) {
        errorCode = envelope.code;
        // Map common error codes to status codes
        statusCode = mapErrorCodeToStatus(envelope.code);
      }
      message = envelope.message;
    }

    // Log error
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](`Request failed: ${req.method} ${req.originalUrl}`, envelope);

    // Send response
    const response: ApiErrorResponse = {
      error: {
        code: errorCode,
        message,
        requestId,
        details: process.env.NODE_ENV !== 'production' ? envelope.context : undefined,
      },
    };

    res.status(statusCode).json(response);
  };
}

function mapErrorCodeToStatus(code: string): number {
  const codeMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };
  return codeMap[code] ?? 500;
}
```

### 4. Express App Setup

```typescript
// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import { createAppLogger, getLogger, shutdownLogger } from './lib/logger';
import { createRequestLogger } from './lib/middleware/requestLogger';
import { createErrorHandler } from './lib/middleware/errorHandler';
import { AppError, ValidationError, NotFoundError } from '@rsiddha/js-utils';

const app: Application = express();

// Initialize logger
const logger = createAppLogger({
  serviceName: 'api-gateway',
  environment: (process.env.NODE_ENV as any) ?? 'development',
  logLevel: 'debug',
  logEndpoint: process.env.LOG_ENDPOINT,
  datadogApiKey: process.env.DATADOG_API_KEY,
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(createRequestLogger(logger));

// Health check (no auth, no rate limit)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', require('./routes').default);

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Route not found'));
});

// Error handler (must be last)
app.use(createErrorHandler(logger));

// Graceful shutdown
const server = app.listen(process.env.PORT ?? 3000, () => {
  logger.info('Server started', { context: { port: process.env.PORT ?? 3000 } });
});

async function gracefulShutdown(): Promise<void> {
  logger.info('Shutting down...');
  server.close();
  await shutdownLogger();
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, logger };
```

## Route Handlers with Error Handling

### 1. Controller Pattern

```typescript
// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../lib/logger';
import { AppError, ValidationError, NotFoundError, normalizeError } from '@rsiddha/js-utils';
import { UserService } from '../services/userService';

const logger = getLogger();

export class UserController {
  constructor(private readonly userService: UserService) {}

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      logger.debug('Fetching user', { context: { userId: id, requestId: req.requestId } });

      const user = await this.userService.getUser(id);

      logger.info('User fetched', { context: { userId: id, requestId: req.requestId } });
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body;
      logger.info('Creating user', { context: { email: userData.email, requestId: req.requestId } });

      const user = await this.userService.createUser(userData);

      logger.info('User created', { context: { userId: user.id, requestId: req.requestId } });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      logger.debug('Updating user', { context: { userId: id, requestId: req.requestId } });

      const user = await this.userService.updateUser(id, updates);

      logger.info('User updated', { context: { userId: id, requestId: req.requestId } });
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      logger.debug('Deleting user', { context: { userId: id, requestId: req.requestId } });

      await this.userService.deleteUser(id);

      logger.info('User deleted', { context: { userId: id, requestId: req.requestId } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
```

### 2. Service Layer

```typescript
// src/services/userService.ts
import { AppError, NotFoundError, ValidationError, normalizeError } from '@rsiddha/js-utils';
import { getLogger } from '../lib/logger';
import { UserRepository } from '../repositories/userRepository';

const logger = getLogger();

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      logger.warn('User not found', { context: { userId: id } });
      throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND', context: { userId: id } });
    }

    return user;
  }

  async createUser(data: { email: string; name: string }): Promise<User> {
    // Validate
    if (!data.email?.includes('@')) {
      throw new ValidationError('Invalid email', { code: 'VALIDATION_EMAIL', context: { field: 'email' } });
    }

    if (!data.name?.trim()) {
      throw new ValidationError('Name is required', { code: 'VALIDATION_NAME', context: { field: 'name' } });
    }

    // Check duplicate
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email already registered', { code: 'EMAIL_EXISTS', context: { email: data.email } });
    }

    const user = await this.userRepository.create({
      email: data.email.toLowerCase(),
      name: data.name.trim(),
    });

    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new AppError('Email already in use', { code: 'EMAIL_EXISTS', context: { email: data.email } });
      }
    }

    const updated = await this.userRepository.update(id, data);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id); // Throws if not found
    await this.userRepository.delete(id);
  }
}
```

## Async Error Wrapper

```typescript
// src/lib/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncHandler): AsyncHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### Usage in Routes

```typescript
// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { asyncHandler } from '../lib/utils/asyncHandler';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/users/:id', asyncHandler(userController.getUser));
router.post('/users', asyncHandler(userController.createUser));
router.patch('/users/:id', asyncHandler(userController.updateUser));
router.delete('/users/:id', asyncHandler(userController.deleteUser));

export default router;
```

## Background Jobs / Workers

```typescript
// src/workers/emailWorker.ts
import { getLogger } from '../lib/logger';
import { normalizeError, AppError } from '@rsiddha/js-utils';

const logger = getLogger();

interface EmailJob {
  to: string;
  subject: string;
  body: string;
  retryCount?: number;
}

export async function processEmailJob(job: EmailJob): Promise<void> {
  const jobLogger = logger;
  const context = { jobId: job.to, retryCount: job.retryCount ?? 0 };

  try {
    jobLogger.info('Processing email job', { context });

    // Simulate email sending
    await sendEmail(job.to, job.subject, job.body);

    jobLogger.info('Email sent successfully', { context });
  } catch (error) {
    const envelope = normalizeError(error, { context: { ...context, operation: 'sendEmail' } });
    jobLogger.error('Email job failed', envelope);

    // Re-throw for queue retry mechanism
    throw new AppError('Email delivery failed', { code: 'EMAIL_DELIVERY_FAILED', cause: error });
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // Implementation here
  await new Promise((resolve) => setTimeout(resolve, 100));
}
```

## Database Integration (Example with Prisma)

```typescript
// src/repositories/userRepository.ts
import { PrismaClient } from '@prisma/client';
import { getLogger } from '../lib/logger';
import { AppError, normalizeError } from '@rsiddha/js-utils';
import { User } from '../services/userService';

const logger = getLogger();
const prisma = new PrismaClient();

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (error) {
      const envelope = normalizeError(error, { context: { operation: 'findById', userId: id } });
      logger.error('Database error', envelope);
      throw new AppError('Database query failed', { code: 'DB_QUERY_FAILED', cause: error });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      const envelope = normalizeError(error, { context: { operation: 'findByEmail', email } });
      logger.error('Database error', envelope);
      throw new AppError('Database query failed', { code: 'DB_QUERY_FAILED', cause: error });
    }
  }

  async create(data: { email: string; name: string }): Promise<User> {
    try {
      return await prisma.user.create({ data });
    } catch (error) {
      const envelope = normalizeError(error, { context: { operation: 'create', email: data.email } });
      logger.error('Database error', envelope);
      throw new AppError('Failed to create user', { code: 'DB_CREATE_FAILED', cause: error });
    }
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      return await prisma.user.update({ where: { id }, data });
    } catch (error) {
      const envelope = normalizeError(error, { context: { operation: 'update', userId: id } });
      logger.error('Database error', envelope);
      throw new AppError('Failed to update user', { code: 'DB_UPDATE_FAILED', cause: error });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (error) {
      const envelope = normalizeError(error, { context: { operation: 'delete', userId: id } });
      logger.error('Database error', envelope);
      throw new AppError('Failed to delete user', { code: 'DB_DELETE_FAILED', cause: error });
    }
  }
}
```

## Configuration

```typescript
// src/config/index.ts
export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  serviceName: process.env.SERVICE_NAME ?? 'api',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logEndpoint: process.env.LOG_ENDPOINT,
  datadogApiKey: process.env.DATADOG_API_KEY,
  elkUrl: process.env.ELK_URL,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
```

## Best Practices

1. **Initialize logger early** - Before any other modules
2. **Use request IDs** - Trace requests across services
3. **Redact sensitive data** - Never log passwords, tokens, PII
4. **Structured logging** - Use context objects, not string concatenation
5. **Error codes** - Use consistent error codes for client handling
6. **Graceful shutdown** - Flush HTTP sinks on SIGTERM/SIGINT
7. **Async wrapper** - Always wrap async route handlers
8. **Domain errors** - Extend `AppError` for business logic errors
9. **Log at appropriate level** - Debug for details, info for events, warn for recoverable, error for failures

## Testing

```typescript
// src/lib/logger/__tests__/logger.test.ts
import { createLogger, createNoopLogSink, createConsoleLogSink } from '@rsiddha/js-utils';
import { createAppLogger } from '../logger';

describe('Logger', () => {
  it('creates logger with noop sink', () => {
    const logger = createLogger({ sink: createNoopLogSink() });
    expect(() => logger.info('test')).not.toThrow();
  });

  it('creates logger with console sink', () => {
    const logger = createLogger({ sink: createConsoleLogSink({ pretty: true }) });
    expect(() => logger.info('test')).not.toThrow();
  });

  it('creates app logger with config', () => {
    const logger = createAppLogger({
      serviceName: 'test',
      environment: 'development',
      logLevel: 'debug',
    });
    expect(() => logger.debug('test')).not.toThrow();
  });

  it('redacts sensitive data', () => {
    const logs: any[] = [];
    const sink = {
      emit: (event: any) => logs.push(event),
    };
    const logger = createLogger({
      sink,
      redaction: { enabled: true, keys: ['password'] },
    });

    logger.info('login', { data: { password: 'secret123' } });

    expect(logs[0].data.password).toBe('[REDACTED]');
  });
});
```

## Docker Integration

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production
ENV LOG_ENDPOINT=https://logs.mycompany.com/events

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

## Kubernetes Logging

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: api
          image: mycompany/api-service:latest
          env:
            - name: NODE_ENV
              value: "production"
            - name: LOG_ENDPOINT
              value: "https://logs.mycompany.com/events"
            - name: DATADOG_API_KEY
              valueFrom:
                secretKeyRef:
                  name: datadog-secret
                  key: api-key
          ports:
            - containerPort: 3000
```