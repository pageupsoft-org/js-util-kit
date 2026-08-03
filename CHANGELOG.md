# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-08-01

### Added

#### Structured Logging & Error Handling
- Structured logger with level filtering: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Normalized error envelopes with optional stack, code, cause, and context fields
- Error classes: `AppError`, `ValidationError`, `NotFoundError`
- Error utilities: `normalizeError`, `toAppError`, `enrichErrorEnvelope`, `isErrorEnvelope`

#### Sink Adapters
- `createNoopLogSink()` - No-op sink for testing and feature toggles
- `createConsoleLogSink(options)` - Human-readable console output with pretty formatting
- `createHttpLogSink(options)` - Production-grade HTTP transport with:
  - Automatic retry with jittered exponential backoff
  - Queue-based batching with backpressure controls
  - Circuit breaker for endpoint failures
  - Request sampling for high-volume scenarios
  - Safe failure behavior (never throws into app)

#### Provider Integrations
- **Datadog**: `createDatadogProviderLogSink()`, `toDatadogLogEvent()`
- **ELK/Elasticsearch**: `createElkProviderLogSink()`, `toElkLogDocument()`
- **OpenTelemetry**: `createOpenTelemetryProviderLogSink()`, `toOpenTelemetryLogRecord()`
- Generic adapter: `createProviderLogSink()` for custom providers

#### Resilience Presets
- `createRetryCircuitPolicyPreset(name)` with `'conservative'`, `'balanced'`, and `'aggressive'` policies
- `createTransportResilienceProfilePreset(name)` with `'availability-first'`, `'cost-efficient'`, and `'test-hardened'` profiles
- `createProviderResilienceTemplate(name)` for Datadog, ELK, and OpenTelemetry with environment-safe defaults

#### Observability
- `createObservabilityDashboardContractPreset(name)` with standardized metrics for `'operations'`, `'reliability'`, and `'diagnostics'`
- Runtime metrics: queue depth, flush latency, drop counters, retry attempts
- Outcome callbacks: `onBatchOutcome()`, `onFlushOutcome()`
- Correlation IDs for request tracing
- Dead-letter hooks for dropped events
- Audit hooks for security/compliance
- Chaos testing support for resilience validation

#### Utility Helpers
- `shouldLogLevel(candidate, minLevel)` - Log level comparison
- `redactLogPayload(payload, options)` - Sensitive data masking

### Quality
- ✅ 475 tests passing across 13 test suites
- ✅ ESM/CJS bundles with TypeScript definitions
- ✅ Zero runtime dependencies
- ✅ Environment-safe (browser, Node.js, SSR)

### Documentation
- [Logger & Error Usage Guide](docs/LOGGER_ERROR_USAGE_GUIDE.md) - Complete feature walkthrough
- [Style Guide](docs/STYLE_GUIDE.md) - Contributor guidelines

### Notes
- Scope locked. Only bug fixes and documentation updates accepted from this point.
