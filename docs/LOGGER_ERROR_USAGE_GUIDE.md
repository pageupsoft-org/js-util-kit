# Logger and Error Usage Guide

This guide explains the full logger and error toolkit in this library:

- What each utility means
- When to use it
- Why to use it
- Example usage

Scope of this guide:

- Error domain exports from src/error/index.ts
- Logger domain exports from src/logger/index.ts

## 1. Quick Start Mental Model

Use this decision path:

1. Need consistent app errors from unknown failures.
   - Use normalizeError and toAppError.
2. Need structured logs with level filtering.
   - Use createLogger.
3. Need output target for logs.
   - Start with createConsoleLogSink or createHttpLogSink.
4. Need strong transport resilience.
   - Use createRetryCircuitPolicyPreset and createTransportResilienceProfilePreset.
5. Need vendor-ready transport payloads.
   - Use createProviderResilienceTemplate.
6. Need platform dashboards for operations.
   - Use createObservabilityDashboardContractPreset.

## 2. Error Module: Every Export

### 2.1 ErrorEnvelope and Related Types

Meaning:
- ErrorEnvelope is the normalized shape for application errors.

When to use:
- Any time you need to pass errors across boundaries (API, job, queue, logging).

Why to use:
- It avoids random error shapes and gives stable fields: name, message, timestamp, plus optional stack, code, cause, context.

Example:
```ts
import type { ErrorEnvelope } from 'js-util-kit';

const envelope: ErrorEnvelope = {
    name: 'ValidationError',
    message: 'Email is invalid',
    timestamp: new Date().toISOString(),
    code: 'VALIDATION_EMAIL',
    context: { field: 'email' },
};
```

### 2.2 AppError

Meaning:
- Base class for domain-level application errors with code/context/cause support.

When to use:
- Service layer, use-case layer, controller layer for known business failures.

Why to use:
- You can throw meaningful errors and later convert them to stable envelopes.

Example:
```ts
import { AppError } from 'js-util-kit';

throw new AppError('Payment gateway unavailable', {
    code: 'PAYMENT_UNAVAILABLE',
    context: { provider: 'stripe' },
});
```

### 2.3 ValidationError

Meaning:
- Specialized AppError for input validation failures.

When to use:
- Request DTO validation, form validation, schema failures.

Why to use:
- Gives semantic intent and default error code VALIDATION_ERROR.

Example:
```ts
import { ValidationError } from 'js-util-kit';

throw new ValidationError('Email is invalid', {
    code: 'VALIDATION_EMAIL',
    context: { field: 'email' },
});
```

### 2.4 NotFoundError

Meaning:
- Specialized AppError for missing resources.

When to use:
- User not found, order not found, entity lookup misses.

Why to use:
- Gives semantic intent and default code NOT_FOUND.

Example:
```ts
import { NotFoundError } from 'js-util-kit';

throw new NotFoundError('User was not found', {
    code: 'USER_NOT_FOUND',
    context: { userId: 'u-123' },
});
```

### 2.5 isErrorEnvelope

Meaning:
- Type guard to check whether a value already has ErrorEnvelope shape.

When to use:
- Before re-normalizing third-party error payloads.

Why to use:
- Prevents duplicate normalization and preserves upstream fields.

Example:
```ts
import { isErrorEnvelope, normalizeError } from 'js-util-kit';

function ensureEnvelope(value: unknown) {
    return isErrorEnvelope(value) ? value : normalizeError(value);
}
```

### 2.6 normalizeError

Meaning:
- Converts unknown values into a stable ErrorEnvelope.

When to use:
- catch blocks, global handlers, worker failures, unknown runtime exceptions.

Why to use:
- You always get a predictable error payload even from strings, booleans, plain objects, and nested causes.

Example:
```ts
import { normalizeError } from 'js-util-kit';

try {
    riskyOperation();
} catch (err) {
    const envelope = normalizeError(err, {
        includeStack: true,
        defaultMessage: 'Unexpected failure',
        context: { operation: 'riskyOperation' },
        maxCauseDepth: 3,
    });

    console.error(envelope);
}
```

### 2.7 enrichErrorEnvelope

Meaning:
- Merges additional context into an existing ErrorEnvelope.

When to use:
- Add request metadata at API boundary, add retry metadata in job systems.

Why to use:
- Keeps immutable workflow while enriching traceability.

Example:
```ts
import { enrichErrorEnvelope, normalizeError } from 'js-util-kit';

const base = normalizeError(new Error('DB timeout'));
const enriched = enrichErrorEnvelope(base, {
    requestId: 'req-101',
    tenantId: 'tenant-a',
});
```

### 2.8 toAppError

Meaning:
- Converts unknown values into AppError instances.

When to use:
- You need class-based error behavior in internal flows but inputs are unknown.

Why to use:
- Creates one canonical error class for service-layer error handling.

Example:
```ts
import { toAppError } from 'js-util-kit';

function wrapUnknown(value: unknown) {
    const appError = toAppError(value);
    throw appError;
}
```

## 3. Logger Module: Every Export

### 3.1 createLogger

Meaning:
- Creates a structured logger with level methods: trace, debug, info, warn, error, fatal.

When to use:
- Everywhere you need consistent application logging.

Why to use:
- Centralized min-level filtering, redaction, normalized error capture.

Example:
```ts
import { createLogger, createConsoleLogSink } from 'js-util-kit';

const logger = createLogger({
    minLevel: 'info',
    sink: createConsoleLogSink({ pretty: true }),
    baseContext: { service: 'billing-api' },
    redaction: { enabled: true },
});

logger.info('Service started');
logger.error('Charge failed', { error: new Error('Gateway timeout') });
```

### 3.2 shouldLogLevel

Meaning:
- Compares candidate log level against minimum level.

When to use:
- Custom sinks or pre-filtering logic.

Why to use:
- Reuses the same level semantics as createLogger.

Example:
```ts
import { shouldLogLevel } from 'js-util-kit';

const allowed = shouldLogLevel('warn', 'info');
```

### 3.3 redactLogPayload

Meaning:
- Redacts sensitive data in nested payloads by key/path/custom matchers.

When to use:
- Before writing payloads to logs or external transport.

Why to use:
- Prevents leaking credentials and tokens.

Example:
```ts
import { redactLogPayload } from 'js-util-kit';

const payload = {
    user: 'a@company.com',
    password: 'secret',
    headers: { authorization: 'Bearer abc' },
};

const safe = redactLogPayload(payload, {
    enabled: true,
    replacement: '[MASKED]',
});
```

### 3.4 createNoopLogSink

Meaning:
- Sink that accepts logs and does nothing.

When to use:
- Tests, feature toggles, temporary logger wiring.

Why to use:
- Safe default with zero side effects.

Example:
```ts
import { createLogger, createNoopLogSink } from 'js-util-kit';

const logger = createLogger({ sink: createNoopLogSink() });
logger.info('This is intentionally discarded');
```

### 3.5 createConsoleLogSink

Meaning:
- Sends structured events to console methods.

When to use:
- Local dev, CLI tools, lightweight runtime logging.

Why to use:
- Human-readable diagnostics without network transport.

Example:
```ts
import { createLogger, createConsoleLogSink } from 'js-util-kit';

const logger = createLogger({
    sink: createConsoleLogSink({
        pretty: true,
        includeTimestamp: true,
    }),
});

logger.warn('Cache miss', { context: { key: 'user:42' } });
```

### 3.6 createHttpLogSink

Meaning:
- Resilient HTTP transport sink with queueing, batching, retry, sampling, circuit breaker, and observability hooks.

When to use:
- Production delivery of logs to remote systems.

Why to use:
- Transport failures are isolated from app flow while still exposing rich telemetry.

Minimal example:
```ts
import { createLogger, createHttpLogSink } from 'js-util-kit';

const sink = createHttpLogSink({
    url: 'https://logs.example.com/events',
    method: 'POST',
    timeoutMs: 5000,
    maxRetries: 1,
    batchSize: 10,
    flushIntervalMs: 500,
});

const logger = createLogger({ sink });
logger.info('Order accepted', { context: { orderId: 'o-1' } });
```

Key option groups and when/why:

- Delivery controls: method, headers, contentType.
  - Use when endpoint contract is strict.
  - Why: explicit protocol compliance.
- Resilience controls: maxRetries, retryDelayMs, backoff, jitter.
  - Use when endpoint can fail transiently.
  - Why: reduce lost logs during short outages.
- Queue controls: batchSize, flushIntervalMs, maxQueueSize, overflowStrategy.
  - Use when throughput spikes.
  - Why: smooth traffic and bound memory.
- Sampling controls: requestSamplingPolicy, requestSampleRate, shouldSampleRequest.
  - Use when volume/cost is high.
  - Why: keep representative telemetry.
- Safety controls: deadLetter hooks.
  - Use when drops must be tracked.
  - Why: postmortem traceability.
- Circuit and retry budget controls.
  - Use when unstable endpoints can overload systems.
  - Why: contain blast radius.
- Observability hooks: onBatchOutcome, onFlushOutcome, onRequestAudit, metrics.*.
  - Use when building dashboards/alerts.
  - Why: actionable runtime visibility.

### 3.7 createRetryCircuitPolicyPreset

Meaning:
- Named preset for retry and circuit configuration.

When to use:
- You want safe defaults instead of hand-tuning every knob.

Why to use:
- Consistent resilience policy across services.

Example:
```ts
import { createHttpLogSink, createRetryCircuitPolicyPreset } from 'js-util-kit';

const policy = createRetryCircuitPolicyPreset('balanced');
const sink = createHttpLogSink({
    url: 'https://logs.example.com/events',
    ...policy,
});
```

### 3.8 createTransportResilienceProfilePreset

Meaning:
- Higher-level transport profile combining retry/circuit plus sampling/timeout/queue/chaos defaults.

When to use:
- You want one profile per environment or use case.

Why to use:
- Fast setup with predictable behavior.

Example:
```ts
import { createHttpLogSink, createTransportResilienceProfilePreset } from 'js-util-kit';

const profile = createTransportResilienceProfilePreset('availability-first');
const sink = createHttpLogSink({
    url: 'https://logs.example.com/events',
    ...profile,
});
```

### 3.9 createProviderResilienceTemplate

Meaning:
- Provider-focused HTTP template combining resilience profile and provider-specific serialization.

When to use:
- Shipping logs to Datadog, ELK bulk, or OpenTelemetry HTTP shape.

Why to use:
- Reduces glue code and serializes payloads correctly.

Example:
```ts
import { createHttpLogSink, createProviderResilienceTemplate } from 'js-util-kit';

const template = createProviderResilienceTemplate('elk-http', {
    profile: 'cost-efficient',
    elkMapper: { index: 'app-logs-2026.07.29' },
});

const sink = createHttpLogSink({
    url: 'https://elk.example.com/_bulk',
    ...template,
});
```

### 3.10 createObservabilityDashboardContractPreset

Meaning:
- Standardized metric/event contract presets for dashboards.

When to use:
- Team wants shared dashboard naming and panel conventions.

Why to use:
- Cross-service consistency and faster observability rollout.

Example:
```ts
import { createObservabilityDashboardContractPreset } from 'js-util-kit';

const contract = createObservabilityDashboardContractPreset('reliability');
console.log(contract.metrics, contract.events, contract.recommendedPanels);
```

### 3.11 createProviderLogSink

Meaning:
- Generic safe map-and-emit adapter for custom provider payloads.

When to use:
- Provider is not covered by built-in presets.

Why to use:
- Keeps map, validate, emit, error handling in one safe sink.

Example:
```ts
import { createProviderLogSink } from 'js-util-kit';

const sink = createProviderLogSink({
    mapEvent: (event) => ({ text: event.message, level: event.level }),
    validatePayload: (payload) => typeof payload.text === 'string',
    emitPayload: async (payload) => {
        await sendToCustomProvider(payload);
    },
});
```

### 3.12 createDatadogProviderLogSink

Meaning:
- Datadog-oriented provider sink with default Datadog payload validation.

When to use:
- You are emitting Datadog-style events.

Why to use:
- Less boilerplate and built-in schema safety.

Example:
```ts
import { createDatadogProviderLogSink } from 'js-util-kit';

const sink = createDatadogProviderLogSink({
    mapper: { service: 'checkout-api', env: 'prod', source: 'node' },
    emitPayload: async (payload) => {
        await sendToDatadog(payload);
    },
});
```

### 3.13 createElkProviderLogSink

Meaning:
- ELK-oriented provider sink with default ELK payload validation.

When to use:
- You emit ELK-compatible documents.

Why to use:
- Safer mapping and ready validation path.

Example:
```ts
import { createElkProviderLogSink } from 'js-util-kit';

const sink = createElkProviderLogSink({
    mapper: { index: 'app-logs' },
    emitPayload: async (payload) => {
        await sendToElk(payload);
    },
});
```

### 3.14 createOpenTelemetryProviderLogSink

Meaning:
- OpenTelemetry-style provider sink with default payload validation.

When to use:
- You want OTel log record structure for transport.

Why to use:
- Consistent severity/body/attributes mapping.

Example:
```ts
import { createOpenTelemetryProviderLogSink } from 'js-util-kit';

const sink = createOpenTelemetryProviderLogSink({
    mapper: { scopeName: 'checkout-api' },
    emitPayload: async (payload) => {
        await sendToOtel(payload);
    },
});
```

### 3.15 Mapping Helpers

Included helpers:
- toDatadogLogEvent
- toElkLogDocument
- toOpenTelemetryLogRecord

Meaning:
- Convert LoggerEvent into provider-specific shapes.

When to use:
- You need payload transformation outside built-in sinks.

Why to use:
- Centralized, tested mapping semantics.

Example:
```ts
import { toDatadogLogEvent } from 'js-util-kit';

const payload = toDatadogLogEvent(
    {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Charge failed',
    },
    { service: 'billing', env: 'prod' }
);
```

### 3.16 Payload Validators

Included validators:
- isDatadogLogPayload
- isElkLogDocument
- isOpenTelemetryLogRecord

Meaning:
- Runtime checks for provider payload structure.

When to use:
- Before sending externally or accepting mapped payload from dynamic pipelines.

Why to use:
- Fail-safe guardrails around provider schema assumptions.

Example:
```ts
import { isElkLogDocument } from 'js-util-kit';

const ok = isElkLogDocument(candidatePayload);
```

### 3.17 logUnknownError

Meaning:
- Convenience helper to log unknown error values through logger.error.

When to use:
- Common catch blocks where error can be anything.

Why to use:
- Consistent error logging call shape.

Example:
```ts
import { logUnknownError } from 'js-util-kit';

try {
    runTask();
} catch (error) {
    logUnknownError(logger, error, 'Task failed', { task: 'syncUsers' });
}
```

## 4. Recommended Usage Patterns

### 4.1 Frontend App Pattern

When:
- Browser apps, dashboards, admin portals.

Why:
- Need lightweight local logs, optional remote sink, strict redaction.

Example:
```ts
import {
    createConsoleLogSink,
    createHttpLogSink,
    createLogger,
    createTransportResilienceProfilePreset,
} from 'js-util-kit';

const remoteProfile = createTransportResilienceProfilePreset('cost-efficient');
const remoteSink = createHttpLogSink({
    url: '/api/logs',
    ...remoteProfile,
});

const logger = createLogger({
    minLevel: 'info',
    sink: remoteSink,
    redaction: {
        enabled: true,
        keys: ['token', 'password', 'authorization'],
    },
});
```

### 4.2 Backend Service Pattern

When:
- APIs, workers, schedulers, event consumers.

Why:
- Need high reliability, auditability, and observability.

Example:
```ts
import {
    createHttpLogSink,
    createLogger,
    createObservabilityDashboardContractPreset,
    createProviderResilienceTemplate,
} from 'js-util-kit';

const template = createProviderResilienceTemplate('datadog-http', {
    profile: 'availability-first',
    datadogMapper: { service: 'orders-api', env: 'prod', source: 'node' },
});

const contract = createObservabilityDashboardContractPreset('reliability');

const sink = createHttpLogSink({
    url: 'https://http-intake.logs.datadoghq.com/v1/input/<api-key>',
    ...template,
    onRequestAudit: (audit) => {
        // Forward audit metrics into your metrics backend.
        void audit;
    },
});

const logger = createLogger({
    sink,
    minLevel: 'info',
    baseContext: { service: 'orders-api' },
});

logger.info('Logger initialized', {
    context: { dashboardContract: contract.preset },
});
```

### 4.3 Error Handling Pattern

When:
- You need predictable user/API errors and structured logs together.

Why:
- Produces stable envelopes and reliable telemetry.

Example:
```ts
import {
    NotFoundError,
    ValidationError,
    enrichErrorEnvelope,
    logUnknownError,
    normalizeError,
} from 'js-util-kit';

function getUserOrThrow(user: { id: string } | null) {
    if (user == null) {
        throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND' });
    }

    return user;
}

function validateEmail(email: string) {
    if (!email.includes('@')) {
        throw new ValidationError('Invalid email', { context: { field: 'email' } });
    }
}

try {
    validateEmail('bad-email');
} catch (error) {
    const envelope = enrichErrorEnvelope(normalizeError(error), {
        requestId: 'req-55',
    });

    logUnknownError(logger, envelope, 'Request failed', { route: '/users' });
}
```

## 5. Practical Preset Selection Guide

Choose transport profile:

- availability-first:
  - Use for critical systems where delivery is prioritized.
  - Why: aggressive retry/circuit and full sampling.
- cost-efficient:
  - Use for high-volume logs with budget constraints.
  - Why: probabilistic sampling and conservative retry policy.
- test-hardened:
  - Use in resilience testing and staging chaos runs.
  - Why: built-in chaos defaults with balanced retry policy.

Choose dashboard contract:

- operations:
  - Day-to-day transport health.
- reliability:
  - SLO/SLA and failure-risk monitoring.
- diagnostics:
  - Incident investigation and deep debugging.

## 6. Common Mistakes to Avoid

- Sending raw secrets in context or data.
  - Fix: enable redaction and define key/path matchers.
- Using custom provider payloads without validation.
  - Fix: add validatePayload in createProviderLogSink.
- Building large custom transport config manually in every service.
  - Fix: start with presets/templates and override minimally.
- Treating logging as critical-path logic.
  - Fix: keep sink callbacks safe and non-throwing.

## 7. Final Recommendation

For most teams, start with this baseline:

1. createLogger with minLevel info and redaction enabled.
2. createHttpLogSink using createProviderResilienceTemplate.
3. attach createObservabilityDashboardContractPreset for dashboard standardization.
4. normalizeError in catch blocks and logUnknownError for unknown exceptions.

This gives a practical default that is safe, observable, and production-ready.
