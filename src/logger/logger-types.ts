import type { ErrorEnvelope } from '../error/error-envelope.js';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface RedactionOptions {
    readonly enabled?: boolean;
    readonly keys?: readonly string[];
    readonly paths?: readonly string[];
    readonly replacement?: string;
    readonly keyMatcher?: (key: string, path: string) => boolean;
    readonly pathMatcher?: (path: string) => boolean;
}

export interface LoggerEvent {
    readonly timestamp: string;
    readonly level: LogLevel;
    readonly message: string;
    readonly context?: Record<string, unknown>;
    readonly data?: unknown;
    readonly error?: ErrorEnvelope;
}

export interface LogSink {
    emit(event: LoggerEvent): void;
}

export interface ConsoleLike {
    log?: (...args: unknown[]) => void;
    info?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
    trace?: (...args: unknown[]) => void;
}

export interface ConsoleLogSinkOptions {
    readonly consoleLike?: ConsoleLike;
    readonly pretty?: boolean;
    readonly includeTimestamp?: boolean;
}

export interface HttpFetchRequestInit {
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly body?: string | Uint8Array | ArrayBuffer;
    readonly signal?: unknown;
}

export interface HttpFetchResponseLike {
    readonly ok: boolean;
    readonly status: number;
}

export type HttpFetchLike = (
    url: string,
    init: HttpFetchRequestInit
) => Promise<HttpFetchResponseLike>;

export type HttpQueueOverflowStrategy = 'drop-oldest' | 'drop-newest';

export interface HttpDroppedLogEvent {
    readonly event: LoggerEvent;
    readonly reason: 'queue-overflow' | 'send-failure' | 'sampled-out' | 'circuit-open';
}

export interface HttpDeadLetterEvent {
    readonly event: LoggerEvent;
    readonly reason: HttpDroppedLogEvent['reason'];
    readonly correlationId?: string;
    readonly statusCode?: number;
    readonly retryCount?: number;
    readonly flushSequence?: number;
    readonly batchIndex?: number;
}

export interface HttpDeadLetterHooks {
    readonly emit?: (entry: HttpDeadLetterEvent) => void | Promise<void>;
    readonly onEmitError?: (error: unknown, entry: HttpDeadLetterEvent) => void;
}

export type HttpCircuitState = 'closed' | 'open' | 'half-open';

export type HttpCircuitTransitionReason =
    | 'failure-threshold-reached'
    | 'cooldown-expired'
    | 'half-open-success'
    | 'half-open-failure';

export interface HttpCircuitStateChange {
    readonly previousState: HttpCircuitState;
    readonly state: HttpCircuitState;
    readonly reason: HttpCircuitTransitionReason;
    readonly timestamp: string;
}

export interface HttpCircuitTuningContext {
    readonly state: HttpCircuitState;
    readonly consecutiveFailures: number;
    readonly correlationId: string;
    readonly flushSequence: number;
    readonly batchIndex: number;
    readonly statusCode?: number;
    readonly retryCount: number;
    readonly failureThreshold: number;
    readonly cooldownMs: number;
    readonly halfOpenMaxRequests: number;
}

export interface HttpCircuitTuningDecision {
    readonly failureThreshold?: number;
    readonly cooldownMs?: number;
    readonly halfOpenMaxRequests?: number;
}

export interface HttpCircuitTuningOutcome extends HttpCircuitTuningContext {
    readonly appliedFailureThreshold: number;
    readonly appliedCooldownMs: number;
    readonly appliedHalfOpenMaxRequests: number;
}

export interface HttpCircuitBreakerOptions {
    readonly enabled?: boolean;
    readonly failureThreshold?: number;
    readonly cooldownMs?: number;
    readonly halfOpenMaxRequests?: number;
    readonly onStateChange?: (change: HttpCircuitStateChange) => void;
    readonly resolveTuning?: (context: HttpCircuitTuningContext) => Partial<HttpCircuitTuningDecision> | undefined;
    readonly onTuningDecision?: (outcome: HttpCircuitTuningOutcome) => void;
}

export interface HttpQueuePersistenceOptions {
    readonly loadQueue?: () => readonly LoggerEvent[] | Promise<readonly LoggerEvent[]>;
    readonly saveQueue?: (events: readonly LoggerEvent[]) => void | Promise<void>;
    readonly saveDebounceMs?: number;
}

export interface HttpFlushMetrics {
    readonly durationMs: number;
    readonly batchesProcessed: number;
    readonly eventsSent: number;
    readonly failedEvents: number;
    readonly deferredEvents: number;
    readonly sampledOutEvents: number;
    readonly retriesAttempted: number;
    readonly abortedByPolicy: boolean;
}

export interface HttpSinkMetricsSnapshot {
    readonly queueDepth: number;
    readonly totalEventsEnqueued: number;
    readonly totalEventsDropped: number;
    readonly totalEventsSent: number;
    readonly totalFlushes: number;
    readonly totalFlushFailures: number;
    readonly lastFlushDurationMs: number;
    readonly circuitState: HttpCircuitState;
}

export interface HttpMetricsHooks {
    readonly onQueueDepthChange?: (queueDepth: number) => void;
    readonly onFlushComplete?: (metrics: HttpFlushMetrics) => void;
    readonly onDropCountChange?: (totalDropped: number) => void;
    readonly onRetryAttempt?: (attempt: number, maxRetries: number, batchSize: number) => void;
}

export interface HttpRetryTuningContext {
    readonly correlationId: string;
    readonly failedAttempt: number;
    readonly retryCount: number;
    readonly maxRetries: number;
    readonly batchSize: number;
    readonly statusCode?: number;
    readonly errorMessage?: string;
    readonly baseDelayMs: number;
}

export interface HttpRetryTuningDecision {
    readonly shouldRetry: boolean;
    readonly delayMs: number;
}

export interface HttpRetryTuningOutcome extends HttpRetryTuningDecision {
    readonly correlationId: string;
    readonly failedAttempt: number;
    readonly retryCount: number;
    readonly maxRetries: number;
    readonly batchSize: number;
    readonly statusCode?: number;
    readonly errorMessage?: string;
    readonly baseDelayMs: number;
}

export type HttpRetryBudgetExhaustionReason = 'flush-limit' | 'batch-limit';

export interface HttpRetryBudgetExhaustedContext {
    readonly reason: HttpRetryBudgetExhaustionReason;
    readonly correlationId: string;
    readonly flushSequence: number;
    readonly batchIndex: number;
    readonly failedAttempt: number;
    readonly attemptedRetriesInBatch: number;
    readonly attemptedRetriesInFlush: number;
    readonly maxRetriesPerBatch: number;
    readonly maxRetriesPerFlush: number;
}

export interface HttpRetryBudgetOptions {
    readonly enabled?: boolean;
    readonly maxRetriesPerBatch?: number;
    readonly maxRetriesPerFlush?: number;
    readonly onExhausted?: (context: HttpRetryBudgetExhaustedContext) => void;
}

export type HttpRetryCircuitPolicyPresetName = 'conservative' | 'balanced' | 'aggressive';

export interface HttpRetryCircuitPolicyPreset {
    readonly maxRetries: number;
    readonly retryDelayMs: number;
    readonly retryBackoffMultiplier: number;
    readonly maxRetryDelayMs: number;
    readonly retryJitterRatio: number;
    readonly retryBudget: HttpRetryBudgetOptions;
    readonly circuitBreaker: HttpCircuitBreakerOptions;
}

export type HttpTransportResilienceProfilePresetName =
    | 'availability-first'
    | 'cost-efficient'
    | 'test-hardened';

export interface HttpTransportResilienceProfilePreset extends HttpRetryCircuitPolicyPreset {
    readonly requestSamplingPolicy: HttpRequestSamplingPolicy;
    readonly requestSampleRate: number;
    readonly timeoutMs: number;
    readonly flushIntervalMs: number;
    readonly batchSize: number;
    readonly maxQueueSize: number;
    readonly chaos: HttpTransportChaosOptions;
}

export type HttpProviderResilienceTemplateName = 'datadog-http' | 'elk-http' | 'opentelemetry-http';

export interface HttpProviderResilienceTemplateOptions {
    readonly profile?: HttpTransportResilienceProfilePresetName;
    readonly datadogMapper?: DatadogLogMapperOptions;
    readonly elkMapper?: ElkLogMapperOptions;
    readonly openTelemetryMapper?: OpenTelemetryLogMapperOptions;
    readonly includeTraceMetadataEnvelope?: boolean;
}

export interface HttpProviderResilienceTemplate extends HttpTransportResilienceProfilePreset {
    readonly method: 'POST';
    readonly headers: Record<string, string>;
    readonly contentType: string;
    readonly serializeBatch: (events: readonly LoggerEvent[], context: HttpBatchSerializationContext) => string;
}

export type HttpObservabilityDashboardPresetName = 'operations' | 'reliability' | 'diagnostics';

export interface HttpObservabilityMetricContract {
    readonly name: string;
    readonly unit: 'count' | 'ms' | 'ratio' | 'state';
    readonly source:
        | 'metrics.onQueueDepthChange'
        | 'metrics.onFlushComplete'
        | 'metrics.onDropCountChange'
        | 'metrics.onRetryAttempt'
        | 'onBatchOutcome'
        | 'onFlushOutcome'
        | 'onRequestSamplingDecision'
        | 'onRequestAudit';
    readonly description: string;
}

export interface HttpObservabilityEventContract {
    readonly name: string;
    readonly source:
        | 'onRequestAudit'
        | 'onRetryTuningDecision'
        | 'circuitBreaker.onStateChange'
        | 'circuitBreaker.onTuningDecision'
        | 'retryBudget.onExhausted'
        | 'chaos.onDecision';
    readonly description: string;
}

export interface HttpObservabilityDashboardContractPreset {
    readonly preset: HttpObservabilityDashboardPresetName;
    readonly metrics: readonly HttpObservabilityMetricContract[];
    readonly events: readonly HttpObservabilityEventContract[];
    readonly recommendedPanels: readonly string[];
}

export interface HttpTransportChaosContext {
    readonly correlationId: string;
    readonly attempt: number;
    readonly batchSize: number;
    readonly flushSequence: number;
    readonly batchIndex: number;
}

export interface HttpTransportChaosDecision {
    readonly delayMs?: number;
    readonly statusCode?: number;
    readonly errorMessage?: string;
}

export interface HttpTransportChaosDecisionOutcome {
    readonly injected: boolean;
    readonly correlationId: string;
    readonly attempt: number;
    readonly batchSize: number;
    readonly flushSequence: number;
    readonly batchIndex: number;
    readonly delayMs?: number;
    readonly statusCode?: number;
    readonly errorMessage?: string;
}

export interface HttpTransportChaosOptions {
    readonly enabled?: boolean;
    readonly probability?: number;
    readonly fixedDelayMs?: number;
    readonly forcedStatusCode?: number;
    readonly forcedErrorMessage?: string;
    readonly decide?: (context: HttpTransportChaosContext) => HttpTransportChaosDecision | undefined;
    readonly onDecision?: (outcome: HttpTransportChaosDecisionOutcome) => void;
}

export type HttpRequestSamplingPolicy = 'always' | 'never' | 'probabilistic' | 'custom';

export interface HttpRequestSamplingContext {
    readonly correlationId: string;
    readonly batch: readonly LoggerEvent[];
    readonly batchIndex: number;
    readonly flushSequence: number;
    readonly sampleRate: number;
    readonly randomValue: number;
}

export interface HttpRequestSamplingDecision {
    readonly sampled: boolean;
    readonly policy: HttpRequestSamplingPolicy;
    readonly correlationId: string;
    readonly batchSize: number;
    readonly batchIndex: number;
    readonly flushSequence: number;
    readonly sampleRate: number;
}

export type HttpFlushFailurePolicy = 'continue' | 'stop-flush' | 'requeue-and-stop';

export interface HttpFlushFailureContext {
    readonly correlationId: string;
    readonly batch: readonly LoggerEvent[];
    readonly batchIndex: number;
    readonly flushSequence: number;
    readonly retryCount: number;
    readonly statusCode?: number;
    readonly remainingQueueSize: number;
}

export interface HttpBatchSerializationContext {
    readonly correlationId: string;
    readonly batchSize: number;
    readonly batchIndex: number;
    readonly flushSequence: number;
    readonly traceMetadata?: Record<string, unknown>;
}

export interface HttpBatchOutcome {
    readonly success: boolean;
    readonly correlationId: string;
    readonly batchSize: number;
    readonly retryCount: number;
    readonly durationMs: number;
    readonly statusCode?: number;
    readonly failedEvents: number;
    readonly sampledOut: boolean;
    readonly policyApplied?: HttpFlushFailurePolicy;
}

export interface HttpTransportAuditEvent {
    readonly url: string;
    readonly method: string;
    readonly correlationId: string;
    readonly batchSize: number;
    readonly attempt: number;
    readonly maxRetries: number;
    readonly headers: Readonly<Record<string, string>>;
    readonly payloadSizeBytes: number;
    readonly success: boolean;
    readonly statusCode?: number;
    readonly errorMessage?: string;
    readonly durationMs: number;
}

export interface HttpFlushOutcome {
    readonly success: boolean;
    readonly durationMs: number;
    readonly batchesProcessed: number;
    readonly eventsSent: number;
    readonly failedEvents: number;
    readonly deferredEvents: number;
    readonly sampledOutEvents: number;
    readonly retriesAttempted: number;
    readonly correlationIds: readonly string[];
    readonly abortedByPolicy: boolean;
}

export interface HttpLogSink extends LogSink {
    flush(): Promise<void>;
    shutdown(): Promise<void>;
    getQueueSize(): number;
    getMetricsSnapshot(): HttpSinkMetricsSnapshot;
}

export interface HttpLogSinkOptions {
    readonly url: string;
    readonly method?: 'POST' | 'PUT' | 'PATCH';
    readonly headers?: Record<string, string>;
    readonly contentType?: string;
    readonly timeoutMs?: number;
    readonly maxRetries?: number;
    readonly retryDelayMs?: number;
    readonly retryBackoffMultiplier?: number;
    readonly maxRetryDelayMs?: number;
    readonly retryJitterRatio?: number;
    readonly batchSize?: number;
    readonly flushIntervalMs?: number;
    readonly maxQueueSize?: number;
    readonly overflowStrategy?: HttpQueueOverflowStrategy;
    readonly onDrop?: (drop: HttpDroppedLogEvent) => void;
    readonly deadLetter?: HttpDeadLetterHooks;
    readonly circuitBreaker?: HttpCircuitBreakerOptions;
    readonly retryBudget?: HttpRetryBudgetOptions;
    readonly chaos?: HttpTransportChaosOptions;
    readonly persistence?: HttpQueuePersistenceOptions;
    readonly shutdownFlushTimeoutMs?: number;
    readonly metrics?: HttpMetricsHooks;
    readonly onBatchOutcome?: (outcome: HttpBatchOutcome) => void;
    readonly onFlushOutcome?: (outcome: HttpFlushOutcome) => void;
    readonly resolveFlushFailurePolicy?: (
        context: HttpFlushFailureContext
    ) => HttpFlushFailurePolicy | undefined;
    readonly resolveRetryTuning?: (context: HttpRetryTuningContext) => Partial<HttpRetryTuningDecision> | undefined;
    readonly onRetryTuningDecision?: (decision: HttpRetryTuningOutcome) => void;
    readonly requestSamplingPolicy?: HttpRequestSamplingPolicy;
    readonly requestSampleRate?: number;
    readonly shouldSampleRequest?: (context: HttpRequestSamplingContext) => boolean | undefined;
    readonly onRequestSamplingDecision?: (decision: HttpRequestSamplingDecision) => void;
    readonly onRequestAudit?: (event: HttpTransportAuditEvent) => void;
    readonly correlationIdFactory?: () => string;
    readonly correlationHeaderName?: string;
    readonly includeCorrelationIdInPayload?: boolean;
    readonly correlationPayloadKey?: string;
    readonly traceMetadataFactory?: (
        events: readonly LoggerEvent[],
        context: Omit<HttpBatchSerializationContext, 'traceMetadata'>
    ) => Record<string, unknown> | undefined;
    readonly includeTraceMetadataInPayload?: boolean;
    readonly traceMetadataPayloadKey?: string;
    readonly serializeBatch?: (events: readonly LoggerEvent[], context: HttpBatchSerializationContext) => string;
    readonly compressPayload?: (payload: string) => string | Uint8Array | ArrayBuffer;
    readonly compressionEncoding?: string;
    readonly fetchLike?: HttpFetchLike;
    readonly random?: () => number;
}

export interface CreateProviderLogSinkOptions<TPayload> {
    readonly mapEvent: (event: LoggerEvent) => TPayload;
    readonly emitPayload: (payload: TPayload) => void | Promise<void>;
    readonly validatePayload?: (payload: TPayload) => boolean;
    readonly onError?: (error: unknown, event: LoggerEvent) => void;
    readonly onValidationError?: (payload: TPayload, event: LoggerEvent) => void;
}

export interface DatadogLogMapperOptions {
    readonly service?: string;
    readonly env?: string;
    readonly version?: string;
    readonly source?: string;
}

export interface ElkLogMapperOptions {
    readonly index?: string;
}

export interface OpenTelemetryLogMapperOptions {
    readonly scopeName?: string;
    readonly resource?: Record<string, unknown>;
}

export interface CreateDatadogProviderLogSinkOptions {
    readonly mapper?: DatadogLogMapperOptions;
    readonly emitPayload: (payload: Record<string, unknown>) => void | Promise<void>;
    readonly validatePayload?: (payload: Record<string, unknown>) => boolean;
    readonly onValidationError?: (payload: Record<string, unknown>, event: LoggerEvent) => void;
    readonly onError?: (error: unknown, event: LoggerEvent) => void;
}

export interface CreateElkProviderLogSinkOptions {
    readonly mapper?: ElkLogMapperOptions;
    readonly emitPayload: (payload: Record<string, unknown>) => void | Promise<void>;
    readonly validatePayload?: (payload: Record<string, unknown>) => boolean;
    readonly onValidationError?: (payload: Record<string, unknown>, event: LoggerEvent) => void;
    readonly onError?: (error: unknown, event: LoggerEvent) => void;
}

export interface CreateOpenTelemetryProviderLogSinkOptions {
    readonly mapper?: OpenTelemetryLogMapperOptions;
    readonly emitPayload: (payload: Record<string, unknown>) => void | Promise<void>;
    readonly validatePayload?: (payload: Record<string, unknown>) => boolean;
    readonly onValidationError?: (payload: Record<string, unknown>, event: LoggerEvent) => void;
    readonly onError?: (error: unknown, event: LoggerEvent) => void;
}

export interface LogCallOptions {
    readonly context?: Record<string, unknown>;
    readonly data?: unknown;
    readonly error?: unknown;
}

export interface Logger {
    trace(message: string, options?: LogCallOptions): void;
    debug(message: string, options?: LogCallOptions): void;
    info(message: string, options?: LogCallOptions): void;
    warn(message: string, options?: LogCallOptions): void;
    error(message: string, options?: LogCallOptions): void;
    fatal(message: string, options?: LogCallOptions): void;
}

export interface CreateLoggerOptions {
    readonly minLevel?: LogLevel;
    readonly sink?: LogSink;
    readonly redaction?: RedactionOptions;
    readonly baseContext?: Record<string, unknown>;
}
