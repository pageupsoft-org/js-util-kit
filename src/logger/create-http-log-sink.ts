import type {
    HttpBatchOutcome,
    HttpBatchSerializationContext,
    HttpCircuitState,
    HttpCircuitTransitionReason,
    HttpCircuitTuningContext,
    HttpCircuitTuningDecision,
    HttpCircuitTuningOutcome,
    HttpDeadLetterEvent,
    HttpDroppedLogEvent,
    HttpFetchLike,
    HttpFlushFailureContext,
    HttpFlushFailurePolicy,
    HttpFlushMetrics,
    HttpFlushOutcome,
    HttpLogSink,
    HttpLogSinkOptions,
    HttpRequestSamplingContext,
    HttpRequestSamplingDecision,
    HttpRequestSamplingPolicy,
    HttpRetryBudgetExhaustedContext,
    HttpRetryBudgetOptions,
    HttpRetryTuningContext,
    HttpRetryTuningDecision,
    HttpRetryTuningOutcome,
    HttpSinkMetricsSnapshot,
    HttpTransportAuditEvent,
    HttpTransportChaosContext,
    HttpTransportChaosDecision,
    HttpTransportChaosDecisionOutcome,
    HttpTransportChaosOptions,
    LoggerEvent,
} from './logger-types.js';

/**
 * Creates a sink that sends logger events to a remote HTTP endpoint.
 *
 * @param options - HTTP transport configuration.
 * @returns A log sink that emits events using fetch-compatible transport.
 * @throws {TypeError} When `options.url` is empty.
 * @throws {RangeError} When retry or timeout options are invalid.
 *
 * @example
 * const sink = createHttpLogSink({ url: 'https://logs.example.com/events' });
 */
export function createHttpLogSink(options: HttpLogSinkOptions): HttpLogSink {
    if (typeof options.url !== 'string' || options.url.trim().length === 0) {
        throw new TypeError('`options.url` must be a non-empty string.');
    }

    if (!Number.isFinite(options.timeoutMs) && options.timeoutMs !== undefined) {
        throw new RangeError('`options.timeoutMs` must be a finite number when provided.');
    }

    if (options.timeoutMs !== undefined && options.timeoutMs <= 0) {
        throw new RangeError('`options.timeoutMs` must be greater than 0 when provided.');
    }

    if (!Number.isFinite(options.maxRetries) && options.maxRetries !== undefined) {
        throw new RangeError('`options.maxRetries` must be a finite number when provided.');
    }

    if (options.maxRetries !== undefined && options.maxRetries < 0) {
        throw new RangeError('`options.maxRetries` must be 0 or greater when provided.');
    }

    if (!Number.isFinite(options.retryDelayMs) && options.retryDelayMs !== undefined) {
        throw new RangeError('`options.retryDelayMs` must be a finite number when provided.');
    }

    if (options.retryDelayMs !== undefined && options.retryDelayMs < 0) {
        throw new RangeError('`options.retryDelayMs` must be 0 or greater when provided.');
    }

    if (!Number.isFinite(options.retryBackoffMultiplier) && options.retryBackoffMultiplier !== undefined) {
        throw new RangeError('`options.retryBackoffMultiplier` must be a finite number when provided.');
    }

    if (options.retryBackoffMultiplier !== undefined && options.retryBackoffMultiplier < 1) {
        throw new RangeError('`options.retryBackoffMultiplier` must be 1 or greater when provided.');
    }

    if (!Number.isFinite(options.maxRetryDelayMs) && options.maxRetryDelayMs !== undefined) {
        throw new RangeError('`options.maxRetryDelayMs` must be a finite number when provided.');
    }

    if (options.maxRetryDelayMs !== undefined && options.maxRetryDelayMs < 0) {
        throw new RangeError('`options.maxRetryDelayMs` must be 0 or greater when provided.');
    }

    if (!Number.isFinite(options.retryJitterRatio) && options.retryJitterRatio !== undefined) {
        throw new RangeError('`options.retryJitterRatio` must be a finite number when provided.');
    }

    if (options.retryJitterRatio !== undefined && (options.retryJitterRatio < 0 || options.retryJitterRatio > 1)) {
        throw new RangeError('`options.retryJitterRatio` must be between 0 and 1 when provided.');
    }

    if (!Number.isFinite(options.requestSampleRate) && options.requestSampleRate !== undefined) {
        throw new RangeError('`options.requestSampleRate` must be a finite number when provided.');
    }

    if (options.requestSampleRate !== undefined && (options.requestSampleRate < 0 || options.requestSampleRate > 1)) {
        throw new RangeError('`options.requestSampleRate` must be between 0 and 1 when provided.');
    }

    if (!Number.isFinite(options.batchSize) && options.batchSize !== undefined) {
        throw new RangeError('`options.batchSize` must be a finite number when provided.');
    }

    if (options.batchSize !== undefined && options.batchSize < 1) {
        throw new RangeError('`options.batchSize` must be 1 or greater when provided.');
    }

    if (!Number.isFinite(options.flushIntervalMs) && options.flushIntervalMs !== undefined) {
        throw new RangeError('`options.flushIntervalMs` must be a finite number when provided.');
    }

    if (options.flushIntervalMs !== undefined && options.flushIntervalMs < 0) {
        throw new RangeError('`options.flushIntervalMs` must be 0 or greater when provided.');
    }

    if (!Number.isFinite(options.maxQueueSize) && options.maxQueueSize !== undefined) {
        throw new RangeError('`options.maxQueueSize` must be a finite number when provided.');
    }

    if (options.maxQueueSize !== undefined && options.maxQueueSize < 1) {
        throw new RangeError('`options.maxQueueSize` must be 1 or greater when provided.');
    }

    if (options.retryBudget?.maxRetriesPerBatch !== undefined && !Number.isFinite(options.retryBudget.maxRetriesPerBatch)) {
        throw new RangeError('`options.retryBudget.maxRetriesPerBatch` must be a finite number when provided.');
    }

    if (options.retryBudget?.maxRetriesPerBatch !== undefined && options.retryBudget.maxRetriesPerBatch < 0) {
        throw new RangeError('`options.retryBudget.maxRetriesPerBatch` must be 0 or greater when provided.');
    }

    if (options.retryBudget?.maxRetriesPerFlush !== undefined && !Number.isFinite(options.retryBudget.maxRetriesPerFlush)) {
        throw new RangeError('`options.retryBudget.maxRetriesPerFlush` must be a finite number when provided.');
    }

    if (options.retryBudget?.maxRetriesPerFlush !== undefined && options.retryBudget.maxRetriesPerFlush < 0) {
        throw new RangeError('`options.retryBudget.maxRetriesPerFlush` must be 0 or greater when provided.');
    }

    if (options.chaos?.probability !== undefined && !Number.isFinite(options.chaos.probability)) {
        throw new RangeError('`options.chaos.probability` must be a finite number when provided.');
    }

    if (options.chaos?.probability !== undefined && (options.chaos.probability < 0 || options.chaos.probability > 1)) {
        throw new RangeError('`options.chaos.probability` must be between 0 and 1 when provided.');
    }

    if (options.chaos?.fixedDelayMs !== undefined && !Number.isFinite(options.chaos.fixedDelayMs)) {
        throw new RangeError('`options.chaos.fixedDelayMs` must be a finite number when provided.');
    }

    if (options.chaos?.fixedDelayMs !== undefined && options.chaos.fixedDelayMs < 0) {
        throw new RangeError('`options.chaos.fixedDelayMs` must be 0 or greater when provided.');
    }

    if (options.chaos?.forcedStatusCode !== undefined && !Number.isFinite(options.chaos.forcedStatusCode)) {
        throw new RangeError('`options.chaos.forcedStatusCode` must be a finite number when provided.');
    }

    if (
        options.chaos?.forcedStatusCode !== undefined &&
        (options.chaos.forcedStatusCode < 100 || options.chaos.forcedStatusCode > 599)
    ) {
        throw new RangeError('`options.chaos.forcedStatusCode` must be between 100 and 599 when provided.');
    }

    if (
        options.circuitBreaker?.failureThreshold !== undefined &&
        !Number.isFinite(options.circuitBreaker.failureThreshold)
    ) {
        throw new RangeError('`options.circuitBreaker.failureThreshold` must be a finite number when provided.');
    }

    if (options.circuitBreaker?.failureThreshold !== undefined && options.circuitBreaker.failureThreshold < 1) {
        throw new RangeError('`options.circuitBreaker.failureThreshold` must be 1 or greater when provided.');
    }

    if (options.circuitBreaker?.cooldownMs !== undefined && !Number.isFinite(options.circuitBreaker.cooldownMs)) {
        throw new RangeError('`options.circuitBreaker.cooldownMs` must be a finite number when provided.');
    }

    if (options.circuitBreaker?.cooldownMs !== undefined && options.circuitBreaker.cooldownMs < 0) {
        throw new RangeError('`options.circuitBreaker.cooldownMs` must be 0 or greater when provided.');
    }

    if (
        options.circuitBreaker?.halfOpenMaxRequests !== undefined &&
        !Number.isFinite(options.circuitBreaker.halfOpenMaxRequests)
    ) {
        throw new RangeError('`options.circuitBreaker.halfOpenMaxRequests` must be a finite number when provided.');
    }

    if (
        options.circuitBreaker?.halfOpenMaxRequests !== undefined &&
        options.circuitBreaker.halfOpenMaxRequests < 1
    ) {
        throw new RangeError('`options.circuitBreaker.halfOpenMaxRequests` must be 1 or greater when provided.');
    }

    if (
        options.persistence?.saveDebounceMs !== undefined &&
        !Number.isFinite(options.persistence.saveDebounceMs)
    ) {
        throw new RangeError('`options.persistence.saveDebounceMs` must be a finite number when provided.');
    }

    if (options.persistence?.saveDebounceMs !== undefined && options.persistence.saveDebounceMs < 0) {
        throw new RangeError('`options.persistence.saveDebounceMs` must be 0 or greater when provided.');
    }

    if (!Number.isFinite(options.shutdownFlushTimeoutMs) && options.shutdownFlushTimeoutMs !== undefined) {
        throw new RangeError('`options.shutdownFlushTimeoutMs` must be a finite number when provided.');
    }

    if (options.shutdownFlushTimeoutMs !== undefined && options.shutdownFlushTimeoutMs < 0) {
        throw new RangeError('`options.shutdownFlushTimeoutMs` must be 0 or greater when provided.');
    }

    if (
        options.compressionEncoding !== undefined &&
        (typeof options.compressionEncoding !== 'string' || options.compressionEncoding.trim().length === 0)
    ) {
        throw new TypeError('`options.compressionEncoding` must be a non-empty string when provided.');
    }

    if (options.contentType !== undefined && (typeof options.contentType !== 'string' || options.contentType.length === 0)) {
        throw new TypeError('`options.contentType` must be a non-empty string when provided.');
    }

    if (
        options.correlationHeaderName !== undefined &&
        (typeof options.correlationHeaderName !== 'string' || options.correlationHeaderName.trim().length === 0)
    ) {
        throw new TypeError('`options.correlationHeaderName` must be a non-empty string when provided.');
    }

    if (
        options.correlationPayloadKey !== undefined &&
        (typeof options.correlationPayloadKey !== 'string' || options.correlationPayloadKey.trim().length === 0)
    ) {
        throw new TypeError('`options.correlationPayloadKey` must be a non-empty string when provided.');
    }

    if (
        options.traceMetadataPayloadKey !== undefined &&
        (typeof options.traceMetadataPayloadKey !== 'string' || options.traceMetadataPayloadKey.trim().length === 0)
    ) {
        throw new TypeError('`options.traceMetadataPayloadKey` must be a non-empty string when provided.');
    }

    const method = options.method ?? 'POST';
    const headers: Record<string, string> = {
        'content-type': options.contentType ?? 'application/json',
        ...(options.headers ?? {}),
    };
    if (typeof options.compressPayload === 'function') {
        headers['content-encoding'] = options.compressionEncoding ?? 'x-custom';
    }
    const timeoutMs = options.timeoutMs ?? 5000;
    const maxRetries = Math.trunc(options.maxRetries ?? 0);
    const retryDelayMs = Math.trunc(options.retryDelayMs ?? 0);
    const retryBackoffMultiplier = options.retryBackoffMultiplier ?? 2;
    const maxRetryDelayMs = Math.trunc(options.maxRetryDelayMs ?? 30000);
    const retryJitterRatio = options.retryJitterRatio ?? 0.2;
    const requestSamplingPolicy = options.requestSamplingPolicy ?? 'always';
    const requestSampleRate = options.requestSampleRate ?? 1;
    const batchSize = Math.trunc(options.batchSize ?? 1);
    const flushIntervalMs = Math.trunc(options.flushIntervalMs ?? 0);
    const maxQueueSize = Math.trunc(options.maxQueueSize ?? 1000);
    const retryBudgetEnabled = options.retryBudget?.enabled ?? options.retryBudget != null;
    const retryBudgetMaxPerBatch = Math.trunc(options.retryBudget?.maxRetriesPerBatch ?? maxRetries);
    const retryBudgetMaxPerFlush = Math.trunc(options.retryBudget?.maxRetriesPerFlush ?? Number.MAX_SAFE_INTEGER);
    const circuitBreakerEnabled = options.circuitBreaker?.enabled ?? options.circuitBreaker != null;
    let circuitFailureThreshold = Math.trunc(options.circuitBreaker?.failureThreshold ?? 5);
    let circuitCooldownMs = Math.trunc(options.circuitBreaker?.cooldownMs ?? 30000);
    let circuitHalfOpenMaxRequests = Math.trunc(options.circuitBreaker?.halfOpenMaxRequests ?? 1);
    const overflowStrategy = options.overflowStrategy ?? 'drop-oldest';
    const chaosEnabled = options.chaos?.enabled ?? options.chaos != null;
    const chaosProbability = options.chaos?.probability ?? 0;
    const chaosFixedDelayMs = Math.trunc(options.chaos?.fixedDelayMs ?? 0);
    const chaosForcedStatusCode =
        options.chaos?.forcedStatusCode !== undefined ? Math.trunc(options.chaos.forcedStatusCode) : undefined;
    const chaosForcedErrorMessage = options.chaos?.forcedErrorMessage;
    const random = options.random ?? Math.random;
    const shutdownFlushTimeoutMs = Math.trunc(options.shutdownFlushTimeoutMs ?? 10000);
    const persistenceSaveDebounceMs = Math.trunc(options.persistence?.saveDebounceMs ?? 100);
    const serializeBatch = options.serializeBatch ?? _defaultSerializeBatch;
    const compressPayload = options.compressPayload;
    const correlationIdFactory = options.correlationIdFactory ?? _defaultCorrelationIdFactory;
    const correlationHeaderName = options.correlationHeaderName ?? 'x-log-correlation-id';
    const includeCorrelationIdInPayload = options.includeCorrelationIdInPayload ?? false;
    const correlationPayloadKey = options.correlationPayloadKey ?? 'correlationId';
    const traceMetadataFactory = options.traceMetadataFactory;
    const includeTraceMetadataInPayload = options.includeTraceMetadataInPayload ?? false;
    const traceMetadataPayloadKey = options.traceMetadataPayloadKey ?? 'traceMetadata';

    const queue: LoggerEvent[] = [];
    let isShutdown = false;
    let activeFlushPromise: Promise<void> | undefined;
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    let persistTimer: ReturnType<typeof setTimeout> | undefined;
    let totalEventsEnqueued = 0;
    let totalEventsDropped = 0;
    let totalEventsSent = 0;
    let totalFlushes = 0;
    let totalFlushFailures = 0;
    let lastFlushDurationMs = 0;
    let flushSequence = 0;
    let circuitState: HttpCircuitState = 'closed';
    let circuitOpenedAt = 0;
    let consecutiveCircuitFailures = 0;
    let halfOpenRequestsInWindow = 0;

    const transitionCircuitState = (nextState: HttpCircuitState, reason: HttpCircuitTransitionReason): void => {
        if (circuitState === nextState) return;

        const previousState = circuitState;
        circuitState = nextState;

        if (typeof options.circuitBreaker?.onStateChange === 'function') {
            _safeInvoke(() => {
                options.circuitBreaker?.onStateChange?.({
                    previousState,
                    state: nextState,
                    reason,
                    timestamp: new Date().toISOString(),
                });
            });
        }
    };

    const applyCircuitTuning = (details: {
        readonly correlationId: string;
        readonly flushSequence: number;
        readonly batchIndex: number;
        readonly statusCode?: number;
        readonly retryCount: number;
    }): void => {
        if (!circuitBreakerEnabled || typeof options.circuitBreaker?.resolveTuning !== 'function') return;

        const contextBase = {
            state: circuitState,
            consecutiveFailures: consecutiveCircuitFailures,
            correlationId: details.correlationId,
            flushSequence: details.flushSequence,
            batchIndex: details.batchIndex,
            retryCount: details.retryCount,
            failureThreshold: circuitFailureThreshold,
            cooldownMs: circuitCooldownMs,
            halfOpenMaxRequests: circuitHalfOpenMaxRequests,
        };
        const context: HttpCircuitTuningContext =
            details.statusCode === undefined ? contextBase : { ...contextBase, statusCode: details.statusCode };

        let appliedFailureThreshold = circuitFailureThreshold;
        let appliedCooldownMs = circuitCooldownMs;
        let appliedHalfOpenMaxRequests = circuitHalfOpenMaxRequests;

        try {
            const decision = options.circuitBreaker.resolveTuning(context);

            if (
                typeof decision?.failureThreshold === 'number' &&
                Number.isFinite(decision.failureThreshold) &&
                decision.failureThreshold >= 1
            ) {
                appliedFailureThreshold = Math.trunc(decision.failureThreshold);
            }

            if (typeof decision?.cooldownMs === 'number' && Number.isFinite(decision.cooldownMs) && decision.cooldownMs >= 0) {
                appliedCooldownMs = Math.trunc(decision.cooldownMs);
            }

            if (
                typeof decision?.halfOpenMaxRequests === 'number' &&
                Number.isFinite(decision.halfOpenMaxRequests) &&
                decision.halfOpenMaxRequests >= 1
            ) {
                appliedHalfOpenMaxRequests = Math.trunc(decision.halfOpenMaxRequests);
            }
        } catch {
            // Ignore tuning callback failures and keep previous settings.
        }

        circuitFailureThreshold = appliedFailureThreshold;
        circuitCooldownMs = appliedCooldownMs;
        circuitHalfOpenMaxRequests = appliedHalfOpenMaxRequests;

        if (typeof options.circuitBreaker?.onTuningDecision === 'function') {
            const outcome: HttpCircuitTuningOutcome = {
                ...context,
                appliedFailureThreshold,
                appliedCooldownMs,
                appliedHalfOpenMaxRequests,
            };

            _safeInvoke(() => {
                options.circuitBreaker?.onTuningDecision?.(outcome);
            });
        }
    };

    const shouldAllowCircuitRequest = (): boolean => {
        if (!circuitBreakerEnabled) return true;

        if (circuitState === 'open') {
            if (Date.now() - circuitOpenedAt >= circuitCooldownMs) {
                halfOpenRequestsInWindow = 0;
                transitionCircuitState('half-open', 'cooldown-expired');
            } else {
                return false;
            }
        }

        if (circuitState === 'half-open') {
            if (halfOpenRequestsInWindow >= circuitHalfOpenMaxRequests) {
                return false;
            }

            halfOpenRequestsInWindow += 1;
        }

        return true;
    };

    const onCircuitBatchSuccess = (): void => {
        if (!circuitBreakerEnabled) return;

        consecutiveCircuitFailures = 0;
        if (circuitState === 'half-open') {
            halfOpenRequestsInWindow = 0;
            transitionCircuitState('closed', 'half-open-success');
        }
    };

    const onCircuitBatchFailure = (details: {
        readonly correlationId: string;
        readonly flushSequence: number;
        readonly batchIndex: number;
        readonly statusCode?: number;
        readonly retryCount: number;
    }): void => {
        if (!circuitBreakerEnabled) return;

        consecutiveCircuitFailures += 1;
        applyCircuitTuning(details);

        if (circuitState === 'half-open') {
            circuitOpenedAt = Date.now();
            halfOpenRequestsInWindow = 0;
            transitionCircuitState('open', 'half-open-failure');
            return;
        }

        if (consecutiveCircuitFailures >= circuitFailureThreshold) {
            circuitOpenedAt = Date.now();
            transitionCircuitState('open', 'failure-threshold-reached');
        }
    };

    const emitQueueDepthChange = (): void => {
        if (typeof options.metrics?.onQueueDepthChange !== 'function') return;
        _safeInvoke(() => {
            options.metrics?.onQueueDepthChange?.(queue.length);
        });
    };

    const emitDropCountChange = (): void => {
        if (typeof options.metrics?.onDropCountChange !== 'function') return;
        _safeInvoke(() => {
            options.metrics?.onDropCountChange?.(totalEventsDropped);
        });
    };

    const emitDeadLetterError = (error: unknown, entry: HttpDeadLetterEvent): void => {
        if (typeof options.deadLetter?.onEmitError !== 'function') return;

        _safeInvoke(() => {
            options.deadLetter?.onEmitError?.(error, entry);
        });
    };

    const emitDeadLetter = (entry: HttpDeadLetterEvent): void => {
        if (typeof options.deadLetter?.emit !== 'function') return;

        try {
            const pending = options.deadLetter.emit(entry);
            if (pending != null && typeof (pending as Promise<void>).then === 'function') {
                void (pending as Promise<void>).catch((error: unknown) => {
                    emitDeadLetterError(error, entry);
                });
            }
        } catch (error) {
            emitDeadLetterError(error, entry);
        }
    };

    const emitDrop = (
        event: LoggerEvent,
        reason: 'queue-overflow' | 'send-failure' | 'sampled-out' | 'circuit-open',
        details?: {
            readonly correlationId?: string;
            readonly statusCode?: number;
            readonly retryCount?: number;
            readonly flushSequence?: number;
            readonly batchIndex?: number;
        }
    ): void => {
        totalEventsDropped += 1;
        emitDropCountChange();

        if (typeof options.onDrop === 'function') {
            const drop: HttpDroppedLogEvent = {
                event,
                reason,
            };

            try {
                options.onDrop(drop);
            } catch {
                // Ignore callback failures to preserve logger safety guarantees.
            }
        }

        const deadLetterBase = {
            event,
            reason,
        };
        const deadLetter: HttpDeadLetterEvent = {
            ...deadLetterBase,
            ...(details?.correlationId !== undefined ? { correlationId: details.correlationId } : {}),
            ...(details?.statusCode !== undefined ? { statusCode: details.statusCode } : {}),
            ...(details?.retryCount !== undefined ? { retryCount: details.retryCount } : {}),
            ...(details?.flushSequence !== undefined ? { flushSequence: details.flushSequence } : {}),
            ...(details?.batchIndex !== undefined ? { batchIndex: details.batchIndex } : {}),
        };

        emitDeadLetter(deadLetter);
    };

    const scheduleFlush = (): void => {
        if (isShutdown) return;

        if (queue.length >= batchSize) {
            void flush();
            return;
        }

        if (flushTimer != null) return;

        const waitMs = flushIntervalMs === 0 ? 0 : flushIntervalMs;
        flushTimer = setTimeout(() => {
            flushTimer = undefined;
            void flush();
        }, waitMs);
    };

    const pushWithOverflowHandling = (event: LoggerEvent): boolean => {
        if (queue.length < maxQueueSize) {
            queue.push(event);
            totalEventsEnqueued += 1;
            emitQueueDepthChange();
            return true;
        }

        if (overflowStrategy === 'drop-newest') {
            emitDrop(event, 'queue-overflow');
            return false;
        }

        const dropped = queue.shift();
        if (dropped != null) {
            emitDrop(dropped, 'queue-overflow');
        }
        queue.push(event);
        totalEventsEnqueued += 1;
        emitQueueDepthChange();
        return true;
    };

    const persistQueue = async (): Promise<void> => {
        if (typeof options.persistence?.saveQueue !== 'function') return;

        const snapshot = [...queue];
        try {
            await options.persistence.saveQueue(snapshot);
        } catch {
            // Persistence failures should not affect logging.
        }
    };

    const schedulePersistence = (): void => {
        if (typeof options.persistence?.saveQueue !== 'function') return;
        // Once shutdown has begun, `shutdown()` owns the final persistence write;
        // arming a new timer here would outlive the resolved shutdown() promise.
        if (isShutdown) return;

        if (persistTimer != null) {
            clearTimeout(persistTimer);
            persistTimer = undefined;
        }

        persistTimer = setTimeout(() => {
            persistTimer = undefined;
            void persistQueue();
        }, persistenceSaveDebounceMs);
    };

    const flushQueue = async (): Promise<void> => {
        const flushStart = Date.now();
        flushSequence += 1;
        const currentFlushSequence = flushSequence;
        let batchesProcessed = 0;
        let eventsSentInFlush = 0;
        let failedEventsInFlush = 0;
        let deferredEventsInFlush = 0;
        let sampledOutEventsInFlush = 0;
        let retriesInFlush = 0;
        let abortedByPolicy = false;
        const flushCorrelationIds: string[] = [];

        if (flushTimer != null) {
            clearTimeout(flushTimer);
            flushTimer = undefined;
        }

        let canReschedule = true;

        try {
            const fetchLike = options.fetchLike ?? _getGlobalFetch();
            if (fetchLike == null) {
                canReschedule = false;
                return;
            }

            while (queue.length > 0) {
                const batch = queue.splice(0, Math.min(batchSize, queue.length));
                emitQueueDepthChange();
                const batchStart = Date.now();
                const correlationId = _safeCorrelationId(correlationIdFactory);
                flushCorrelationIds.push(correlationId);
                const baseSerializationContext: Omit<HttpBatchSerializationContext, 'traceMetadata'> = {
                    correlationId,
                    batchSize: batch.length,
                    batchIndex: batchesProcessed,
                    flushSequence: currentFlushSequence,
                };
                const traceMetadata = _getTraceMetadata(batch, baseSerializationContext, traceMetadataFactory);
                const serializationContext: HttpBatchSerializationContext =
                    traceMetadata === undefined
                        ? { ...baseSerializationContext }
                        : { ...baseSerializationContext, traceMetadata };

                const shouldSendBatch = _resolveRequestSamplingDecision(
                    {
                        policy: requestSamplingPolicy,
                        sampleRate: requestSampleRate,
                        ...(options.shouldSampleRequest !== undefined
                            ? { shouldSampleRequest: options.shouldSampleRequest }
                            : {}),
                        ...(options.onRequestSamplingDecision !== undefined
                            ? { onRequestSamplingDecision: options.onRequestSamplingDecision }
                            : {}),
                    },
                    {
                        correlationId,
                        batch,
                        batchIndex: batchesProcessed,
                        flushSequence: currentFlushSequence,
                        sampleRate: requestSampleRate,
                        randomValue: random(),
                    }
                );

                if (!shouldSendBatch) {
                    for (const sampledOutEvent of batch) {
                        emitDrop(sampledOutEvent, 'sampled-out', {
                            correlationId,
                            retryCount: 0,
                            flushSequence: currentFlushSequence,
                            batchIndex: batchesProcessed,
                        });
                    }

                    sampledOutEventsInFlush += batch.length;
                    const sampledBatchOutcome: HttpBatchOutcome = {
                        success: true,
                        correlationId,
                        batchSize: batch.length,
                        retryCount: 0,
                        durationMs: Date.now() - batchStart,
                        failedEvents: 0,
                        sampledOut: true,
                    };

                    if (typeof options.onBatchOutcome === 'function') {
                        _safeInvoke(() => {
                            options.onBatchOutcome?.(sampledBatchOutcome);
                        });
                    }

                    continue;
                }

                if (!shouldAllowCircuitRequest()) {
                    for (const circuitDroppedEvent of batch) {
                        emitDrop(circuitDroppedEvent, 'circuit-open', {
                            correlationId,
                            retryCount: 0,
                            flushSequence: currentFlushSequence,
                            batchIndex: batchesProcessed,
                        });
                    }

                    failedEventsInFlush += batch.length;
                    schedulePersistence();
                    totalFlushFailures += 1;

                    const circuitBatchOutcome: HttpBatchOutcome = {
                        success: false,
                        correlationId,
                        batchSize: batch.length,
                        retryCount: 0,
                        durationMs: Date.now() - batchStart,
                        failedEvents: batch.length,
                        sampledOut: false,
                    };

                    if (typeof options.onBatchOutcome === 'function') {
                        _safeInvoke(() => {
                            options.onBatchOutcome?.(circuitBatchOutcome);
                        });
                    }

                    continue;
                }

                const wasSuccessful = await _emitWithRetry(batch, {
                    url: options.url,
                    method,
                    headers,
                    correlationHeaderName,
                    correlationId,
                    timeoutMs,
                    maxRetries,
                    retryDelayMs,
                    retryBackoffMultiplier,
                    maxRetryDelayMs,
                    retryJitterRatio,
                    random,
                    serializeBatch,
                    includeCorrelationIdInPayload,
                    correlationPayloadKey,
                    includeTraceMetadataInPayload,
                    traceMetadataPayloadKey,
                    ...(traceMetadata !== undefined ? { traceMetadata } : {}),
                    serializationContext,
                    ...(compressPayload !== undefined ? { compressPayload } : {}),
                    ...(options.onRequestAudit !== undefined ? { onRequestAudit: options.onRequestAudit } : {}),
                    ...(options.metrics?.onRetryAttempt !== undefined
                        ? { onRetryAttempt: options.metrics.onRetryAttempt }
                        : {}),
                    ...(options.resolveRetryTuning !== undefined
                        ? { resolveRetryTuning: options.resolveRetryTuning }
                        : {}),
                    ...(options.onRetryTuningDecision !== undefined
                        ? { onRetryTuningDecision: options.onRetryTuningDecision }
                        : {}),
                    ...(retryBudgetEnabled
                        ? {
                              retryBudget: {
                                  maxRetriesPerBatch: retryBudgetMaxPerBatch,
                                  maxRetriesPerFlush: retryBudgetMaxPerFlush,
                                  retriesInFlush,
                                  flushSequence: currentFlushSequence,
                                  batchIndex: batchesProcessed,
                                  ...(options.retryBudget?.onExhausted !== undefined
                                      ? { onExhausted: options.retryBudget.onExhausted }
                                      : {}),
                              },
                          }
                        : {}),
                    ...(chaosEnabled
                        ? {
                              chaos: {
                                  probability: chaosProbability,
                                  fixedDelayMs: chaosFixedDelayMs,
                                  ...(chaosForcedStatusCode !== undefined
                                      ? { forcedStatusCode: chaosForcedStatusCode }
                                      : {}),
                                  ...(chaosForcedErrorMessage !== undefined
                                      ? { forcedErrorMessage: chaosForcedErrorMessage }
                                      : {}),
                                  ...(options.chaos?.decide !== undefined ? { decide: options.chaos.decide } : {}),
                                  ...(options.chaos?.onDecision !== undefined
                                      ? { onDecision: options.chaos.onDecision }
                                      : {}),
                              },
                          }
                        : {}),
                    fetchLike,
                });

                batchesProcessed += 1;
                retriesInFlush += wasSuccessful.retryCount;

                const batchOutcomeBase = {
                    success: wasSuccessful.success,
                    correlationId,
                    batchSize: batch.length,
                    retryCount: wasSuccessful.retryCount,
                    durationMs: Date.now() - batchStart,
                    failedEvents: wasSuccessful.success ? 0 : batch.length,
                    sampledOut: false,
                };
                const batchOutcome: HttpBatchOutcome =
                    wasSuccessful.statusCode === undefined
                        ? batchOutcomeBase
                        : { ...batchOutcomeBase, statusCode: wasSuccessful.statusCode };

                if (!wasSuccessful.success) {
                    onCircuitBatchFailure({
                        correlationId,
                        flushSequence: currentFlushSequence,
                        batchIndex: batchesProcessed - 1,
                        retryCount: wasSuccessful.retryCount,
                        ...(wasSuccessful.statusCode !== undefined ? { statusCode: wasSuccessful.statusCode } : {}),
                    });
                    const policy = _resolveFlushFailurePolicy(options.resolveFlushFailurePolicy, {
                        correlationId,
                        batch,
                        batchIndex: batchesProcessed - 1,
                        flushSequence: currentFlushSequence,
                        retryCount: wasSuccessful.retryCount,
                        remainingQueueSize: queue.length,
                        ...(wasSuccessful.statusCode !== undefined ? { statusCode: wasSuccessful.statusCode } : {}),
                    });

                    const batchOutcomeWithPolicy: HttpBatchOutcome = {
                        ...batchOutcome,
                        policyApplied: policy,
                    };
                    if (typeof options.onBatchOutcome === 'function') {
                        _safeInvoke(() => {
                            options.onBatchOutcome?.(batchOutcomeWithPolicy);
                        });
                    }

                    if (policy === 'requeue-and-stop') {
                        queue.unshift(...batch);
                        emitQueueDepthChange();
                        deferredEventsInFlush += batch.length;
                        abortedByPolicy = true;
                        schedulePersistence();
                        totalFlushFailures += 1;
                        break;
                    }

                    for (const failedEvent of batch) {
                        emitDrop(failedEvent, 'send-failure', {
                            correlationId,
                            retryCount: wasSuccessful.retryCount,
                            flushSequence: currentFlushSequence,
                            batchIndex: batchesProcessed - 1,
                            ...(wasSuccessful.statusCode !== undefined ? { statusCode: wasSuccessful.statusCode } : {}),
                        });
                    }
                    failedEventsInFlush += batch.length;
                    schedulePersistence();
                    totalFlushFailures += 1;

                    if (policy === 'stop-flush') {
                        abortedByPolicy = true;
                        break;
                    }
                } else {
                    onCircuitBatchSuccess();
                    if (typeof options.onBatchOutcome === 'function') {
                        _safeInvoke(() => {
                            options.onBatchOutcome?.(batchOutcome);
                        });
                    }
                    eventsSentInFlush += batch.length;
                    totalEventsSent += batch.length;
                }
            }
        } finally {
            totalFlushes += 1;
            lastFlushDurationMs = Date.now() - flushStart;
            const flushMetrics: HttpFlushMetrics = {
                durationMs: lastFlushDurationMs,
                batchesProcessed,
                eventsSent: eventsSentInFlush,
                failedEvents: failedEventsInFlush,
                deferredEvents: deferredEventsInFlush,
                sampledOutEvents: sampledOutEventsInFlush,
                retriesAttempted: retriesInFlush,
                abortedByPolicy,
            };
            if (typeof options.metrics?.onFlushComplete === 'function') {
                _safeInvoke(() => {
                    options.metrics?.onFlushComplete?.(flushMetrics);
                });
            }

            if (typeof options.onFlushOutcome === 'function') {
                const flushOutcome: HttpFlushOutcome = {
                    success: failedEventsInFlush === 0,
                    durationMs: lastFlushDurationMs,
                    batchesProcessed,
                    eventsSent: eventsSentInFlush,
                    failedEvents: failedEventsInFlush,
                    deferredEvents: deferredEventsInFlush,
                    sampledOutEvents: sampledOutEventsInFlush,
                    retriesAttempted: retriesInFlush,
                    correlationIds: flushCorrelationIds,
                    abortedByPolicy,
                };

                _safeInvoke(() => {
                    options.onFlushOutcome?.(flushOutcome);
                });
            }

            if (!isShutdown && canReschedule && queue.length > 0) {
                scheduleFlush();
            }
        }
    };

    const flush = async (): Promise<void> => {
        if (activeFlushPromise != null) {
            return activeFlushPromise;
        }

        activeFlushPromise = (async () => {
            await flushQueue();
            schedulePersistence();
        })();

        try {
            await activeFlushPromise;
        } finally {
            activeFlushPromise = undefined;
        }
    };

    const shutdown = async (): Promise<void> => {
        isShutdown = true;

        if (flushTimer != null) {
            clearTimeout(flushTimer);
            flushTimer = undefined;
        }

        if (persistTimer != null) {
            clearTimeout(persistTimer);
            persistTimer = undefined;
        }

        if (shutdownFlushTimeoutMs === 0) {
            void persistQueue();
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
            await Promise.race([
                flush(),
                new Promise<void>((resolve) => {
                    timeoutId = setTimeout(resolve, shutdownFlushTimeoutMs);
                }),
            ]);
        } finally {
            if (timeoutId != null) {
                clearTimeout(timeoutId);
            }
            await persistQueue();
        }
    };

    const hydrateQueueFromPersistence = async (): Promise<void> => {
        if (typeof options.persistence?.loadQueue !== 'function') return;

        try {
            const restored = await options.persistence.loadQueue();
            for (const event of restored) {
                pushWithOverflowHandling(event);
            }
            schedulePersistence();
            scheduleFlush();
        } catch {
            // Ignore restore errors to keep startup safe.
        }
    };

    void hydrateQueueFromPersistence();

    return {
        emit(event: LoggerEvent): void {
            if (isShutdown) return;
            if (!pushWithOverflowHandling(event)) return;
            schedulePersistence();
            scheduleFlush();
        },
        async flush(): Promise<void> {
            await flush();
        },
        async shutdown(): Promise<void> {
            await shutdown();
        },
        getQueueSize(): number {
            return queue.length;
        },
        getMetricsSnapshot(): HttpSinkMetricsSnapshot {
            return {
                queueDepth: queue.length,
                totalEventsEnqueued,
                totalEventsDropped,
                totalEventsSent,
                totalFlushes,
                totalFlushFailures,
                lastFlushDurationMs,
                circuitState,
            };
        },
    };
}

interface EmitOptions {
    readonly url: string;
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly correlationHeaderName: string;
    readonly correlationId: string;
    readonly timeoutMs: number;
    readonly maxRetries: number;
    readonly retryDelayMs: number;
    readonly retryBackoffMultiplier: number;
    readonly maxRetryDelayMs: number;
    readonly retryJitterRatio: number;
    readonly random: () => number;
    readonly includeCorrelationIdInPayload: boolean;
    readonly correlationPayloadKey: string;
    readonly includeTraceMetadataInPayload: boolean;
    readonly traceMetadataPayloadKey: string;
    readonly traceMetadata?: Record<string, unknown>;
    readonly onRequestAudit?: (event: HttpTransportAuditEvent) => void;
    readonly serializationContext: HttpBatchSerializationContext;
    readonly serializeBatch: (events: readonly LoggerEvent[], context: HttpBatchSerializationContext) => string;
    readonly compressPayload?: (payload: string) => string | Uint8Array | ArrayBuffer;
    readonly onRetryAttempt?: (attempt: number, maxRetries: number, batchSize: number) => void;
    readonly resolveRetryTuning?: (context: HttpRetryTuningContext) => Partial<HttpRetryTuningDecision> | undefined;
    readonly onRetryTuningDecision?: (decision: HttpRetryTuningOutcome) => void;
    readonly retryBudget?: {
        readonly maxRetriesPerBatch: number;
        readonly maxRetriesPerFlush: number;
        readonly retriesInFlush: number;
        readonly flushSequence: number;
        readonly batchIndex: number;
        readonly onExhausted?: (context: HttpRetryBudgetExhaustedContext) => void;
    };
    readonly chaos?: {
        readonly probability: number;
        readonly fixedDelayMs: number;
        readonly forcedStatusCode?: number;
        readonly forcedErrorMessage?: string;
        readonly decide?: (context: HttpTransportChaosContext) => HttpTransportChaosDecision | undefined;
        readonly onDecision?: (outcome: HttpTransportChaosDecisionOutcome) => void;
    };
    readonly fetchLike: HttpFetchLike;
}

interface EmitResult {
    readonly success: boolean;
    readonly retryCount: number;
    readonly statusCode?: number;
}

async function _emitWithRetry(events: readonly LoggerEvent[], options: EmitOptions): Promise<EmitResult> {
    let retryCount = 0;
    let statusCode: number | undefined;

    for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
        const attemptResult = await _emitOnce(events, options, attempt + 1);
        statusCode = attemptResult.statusCode;

        if (attemptResult.success) {
            return attemptResult.statusCode === undefined
                ? {
                      success: true,
                      retryCount,
                  }
                : {
                      success: true,
                      retryCount,
                      statusCode: attemptResult.statusCode,
                  };
        }

        if (attempt < options.maxRetries) {
            const baseDelayMs = _computeRetryDelay(attempt, options);
            const retryTuningContextBase = {
                correlationId: options.correlationId,
                failedAttempt: attempt + 1,
                retryCount,
                maxRetries: options.maxRetries,
                batchSize: events.length,
                baseDelayMs,
            };
            const tuning = _resolveRetryTuning(
                options,
                {
                    ...retryTuningContextBase,
                    ...(attemptResult.statusCode !== undefined ? { statusCode: attemptResult.statusCode } : {}),
                    ...(attemptResult.errorMessage !== undefined ? { errorMessage: attemptResult.errorMessage } : {}),
                }
            );

            if (!tuning.shouldRetry) {
                return statusCode === undefined
                    ? {
                          success: false,
                          retryCount,
                      }
                    : {
                          success: false,
                          retryCount,
                          statusCode,
                      };
            }

            if (!_canConsumeRetryBudget(options, {
                correlationId: options.correlationId,
                failedAttempt: attempt + 1,
                retryCount,
            })) {
                return statusCode === undefined
                    ? {
                          success: false,
                          retryCount,
                      }
                    : {
                          success: false,
                          retryCount,
                          statusCode,
                      };
            }

            retryCount += 1;
            if (typeof options.onRetryAttempt === 'function') {
                _safeInvoke(() => {
                    options.onRetryAttempt?.(attempt + 1, options.maxRetries, events.length);
                });
            }

            const delay = tuning.delayMs;
            if (delay > 0) {
                await _wait(delay);
            }
        }
    }

    return statusCode === undefined
        ? {
              success: false,
              retryCount,
          }
        : {
              success: false,
              retryCount,
              statusCode,
          };
}

interface EmitAttemptResult {
    readonly success: boolean;
    readonly statusCode?: number;
    readonly errorMessage?: string;
}

async function _emitOnce(
    events: readonly LoggerEvent[],
    options: EmitOptions,
    attempt: number
): Promise<EmitAttemptResult> {
    const controller = _createAbortController();
    const timeoutId = _setAbortTimeout(controller, options.timeoutMs);
    const requestStart = Date.now();
    let statusCode: number | undefined;
    let errorMessage: string | undefined;
    let body: string | Uint8Array | ArrayBuffer | undefined;

    try {
        const chaosContext: HttpTransportChaosContext = {
            correlationId: options.correlationId,
            attempt,
            batchSize: events.length,
            flushSequence: options.serializationContext.flushSequence,
            batchIndex: options.serializationContext.batchIndex,
        };
        const chaosDecision = _resolveChaosDecision(options.chaos, chaosContext, options.random);
        const hasChaos = chaosDecision != null;
        const chaosDelayMs = Math.trunc(chaosDecision?.delayMs ?? 0);
        const chaosStatusCode = chaosDecision?.statusCode;
        const chaosErrorMessage = chaosDecision?.errorMessage;

        _emitChaosDecision(options.chaos, {
            injected: hasChaos,
            correlationId: chaosContext.correlationId,
            attempt: chaosContext.attempt,
            batchSize: chaosContext.batchSize,
            flushSequence: chaosContext.flushSequence,
            batchIndex: chaosContext.batchIndex,
            ...(chaosDecision?.delayMs !== undefined ? { delayMs: chaosDecision.delayMs } : {}),
            ...(chaosStatusCode !== undefined ? { statusCode: chaosStatusCode } : {}),
            ...(chaosErrorMessage !== undefined ? { errorMessage: chaosErrorMessage } : {}),
        });

        if (chaosDelayMs > 0) {
            await _wait(chaosDelayMs);
        }

        if (chaosErrorMessage != null) {
            errorMessage = chaosErrorMessage;
            return { success: false, errorMessage };
        }

        if (chaosStatusCode !== undefined) {
            statusCode = chaosStatusCode;
            return {
                success: chaosStatusCode >= 200 && chaosStatusCode < 300,
                statusCode: chaosStatusCode,
            };
        }

        let serialized = options.serializeBatch(events, options.serializationContext);
        if (options.includeCorrelationIdInPayload) {
            serialized = _injectMetadataIntoPayload(serialized, options.correlationPayloadKey, options.correlationId);
        }

        if (options.includeTraceMetadataInPayload && options.traceMetadata !== undefined) {
            serialized = _injectMetadataIntoPayload(serialized, options.traceMetadataPayloadKey, options.traceMetadata);
        }

        body = typeof options.compressPayload === 'function' ? options.compressPayload(serialized) : serialized;
        if (!_isValidRequestBody(body)) {
            errorMessage = 'Invalid request body generated by serializer or compression hook.';
            return { success: false, errorMessage };
        }

        const response = await options.fetchLike(options.url, {
            method: options.method,
            headers: {
                ...options.headers,
                [options.correlationHeaderName]: options.correlationId,
            },
            body,
            signal: controller?.signal,
        });

        statusCode = response.status;

        return {
            success: response.ok,
            statusCode: response.status,
        };
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : undefined;
        return errorMessage === undefined ? { success: false } : { success: false, errorMessage };
    } finally {
        _emitRequestAudit(options, {
            attempt,
            batchSize: events.length,
            durationMs: Date.now() - requestStart,
            success: statusCode !== undefined && statusCode >= 200 && statusCode < 300,
            payloadSizeBytes: _getRequestBodySize(body),
            ...(statusCode !== undefined ? { statusCode } : {}),
            ...(errorMessage !== undefined ? { errorMessage } : {}),
        });

        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }
    }
}

interface RequestAuditRuntimeDetails {
    readonly attempt: number;
    readonly batchSize: number;
    readonly durationMs: number;
    readonly success: boolean;
    readonly statusCode?: number;
    readonly errorMessage?: string;
    readonly payloadSizeBytes: number;
}

function _emitRequestAudit(options: EmitOptions, details: RequestAuditRuntimeDetails): void {
    if (typeof options.onRequestAudit !== 'function') return;

    const auditEventBase = {
        url: options.url,
        method: options.method,
        correlationId: options.correlationId,
        batchSize: details.batchSize,
        attempt: details.attempt,
        maxRetries: options.maxRetries,
        headers: {
            ...options.headers,
            [options.correlationHeaderName]: options.correlationId,
        },
        payloadSizeBytes: details.payloadSizeBytes,
        success: details.success,
        durationMs: details.durationMs,
    };
    const auditEvent: HttpTransportAuditEvent = {
        ...auditEventBase,
        ...(details.statusCode !== undefined ? { statusCode: details.statusCode } : {}),
        ...(details.errorMessage !== undefined ? { errorMessage: details.errorMessage } : {}),
    };

    _safeInvoke(() => {
        options.onRequestAudit?.(auditEvent);
    });
}

function _getRequestBodySize(body: string | Uint8Array | ArrayBuffer | undefined): number {
    if (typeof body === 'string') {
        const TextEncoderCtor = (globalThis as { TextEncoder?: new () => { encode: (text: string) => Uint8Array } })
            .TextEncoder;
        if (typeof TextEncoderCtor === 'function') {
            return new TextEncoderCtor().encode(body).length;
        }

        return body.length;
    }

    if (body instanceof Uint8Array) {
        return body.byteLength;
    }

    if (body instanceof ArrayBuffer) {
        return body.byteLength;
    }

    return 0;
}

function _resolveFlushFailurePolicy(
    resolver:
        | ((context: HttpFlushFailureContext) => HttpFlushFailurePolicy | undefined)
        | undefined,
    context: HttpFlushFailureContext
): HttpFlushFailurePolicy {
    if (typeof resolver !== 'function') return 'continue';

    try {
        const resolved = resolver(context);
        if (resolved === 'stop-flush' || resolved === 'requeue-and-stop' || resolved === 'continue') {
            return resolved;
        }

        return 'continue';
    } catch {
        return 'continue';
    }
}

function _resolveRetryTuning(
    options: EmitOptions,
    context: HttpRetryTuningContext
): HttpRetryTuningDecision {
    let shouldRetry = true;
    let delayMs = context.baseDelayMs;

    if (typeof options.resolveRetryTuning === 'function') {
        try {
            const resolved = options.resolveRetryTuning(context);
            if (typeof resolved?.shouldRetry === 'boolean') {
                shouldRetry = resolved.shouldRetry;
            }
            if (typeof resolved?.delayMs === 'number' && Number.isFinite(resolved.delayMs) && resolved.delayMs >= 0) {
                delayMs = Math.trunc(resolved.delayMs);
            }
        } catch {
            // Ignore tuning hook failures and keep defaults.
        }
    }

    if (typeof options.onRetryTuningDecision === 'function') {
        const outcomeBase = {
            shouldRetry,
            delayMs,
            correlationId: context.correlationId,
            failedAttempt: context.failedAttempt,
            retryCount: context.retryCount,
            maxRetries: context.maxRetries,
            batchSize: context.batchSize,
            baseDelayMs: context.baseDelayMs,
        };
        const outcome: HttpRetryTuningOutcome = {
            ...outcomeBase,
            ...(context.statusCode !== undefined ? { statusCode: context.statusCode } : {}),
            ...(context.errorMessage !== undefined ? { errorMessage: context.errorMessage } : {}),
        };

        _safeInvoke(() => {
            options.onRetryTuningDecision?.(outcome);
        });
    }

    return {
        shouldRetry,
        delayMs,
    };
}

interface RetryBudgetCheckContext {
    readonly correlationId: string;
    readonly failedAttempt: number;
    readonly retryCount: number;
}

function _canConsumeRetryBudget(options: EmitOptions, context: RetryBudgetCheckContext): boolean {
    if (options.retryBudget == null) return true;

    const attemptedRetriesInBatch = context.retryCount;
    const attemptedRetriesInFlush = options.retryBudget.retriesInFlush + context.retryCount;

    if (attemptedRetriesInBatch >= options.retryBudget.maxRetriesPerBatch) {
        _emitRetryBudgetExhausted(options.retryBudget, {
            reason: 'batch-limit',
            correlationId: context.correlationId,
            flushSequence: options.retryBudget.flushSequence,
            batchIndex: options.retryBudget.batchIndex,
            failedAttempt: context.failedAttempt,
            attemptedRetriesInBatch,
            attemptedRetriesInFlush,
            maxRetriesPerBatch: options.retryBudget.maxRetriesPerBatch,
            maxRetriesPerFlush: options.retryBudget.maxRetriesPerFlush,
        });
        return false;
    }

    if (attemptedRetriesInFlush >= options.retryBudget.maxRetriesPerFlush) {
        _emitRetryBudgetExhausted(options.retryBudget, {
            reason: 'flush-limit',
            correlationId: context.correlationId,
            flushSequence: options.retryBudget.flushSequence,
            batchIndex: options.retryBudget.batchIndex,
            failedAttempt: context.failedAttempt,
            attemptedRetriesInBatch,
            attemptedRetriesInFlush,
            maxRetriesPerBatch: options.retryBudget.maxRetriesPerBatch,
            maxRetriesPerFlush: options.retryBudget.maxRetriesPerFlush,
        });
        return false;
    }

    return true;
}

function _emitRetryBudgetExhausted(
    budget: NonNullable<EmitOptions['retryBudget']>,
    context: HttpRetryBudgetExhaustedContext
): void {
    if (typeof budget.onExhausted !== 'function') return;

    _safeInvoke(() => {
        budget.onExhausted?.(context);
    });
}

function _resolveChaosDecision(
    chaos:
        | {
              readonly probability: number;
              readonly fixedDelayMs: number;
              readonly forcedStatusCode?: number;
              readonly forcedErrorMessage?: string;
              readonly decide?: (context: HttpTransportChaosContext) => HttpTransportChaosDecision | undefined;
          }
        | undefined,
    context: HttpTransportChaosContext,
    random: () => number
): HttpTransportChaosDecision | undefined {
    if (chaos == null) return undefined;

    let customDecision: HttpTransportChaosDecision | undefined;
    if (typeof chaos.decide === 'function') {
        try {
            customDecision = chaos.decide(context);
        } catch {
            customDecision = undefined;
        }
    }

    if (customDecision != null) {
        return customDecision;
    }

    if (chaos.probability <= 0 || random() >= chaos.probability) {
        return undefined;
    }

    const decision: HttpTransportChaosDecision = {
        delayMs: chaos.fixedDelayMs,
        ...(chaos.forcedStatusCode !== undefined ? { statusCode: chaos.forcedStatusCode } : {}),
        ...(chaos.forcedErrorMessage !== undefined ? { errorMessage: chaos.forcedErrorMessage } : {}),
    };

    if (decision.delayMs === 0 && decision.statusCode === undefined && decision.errorMessage === undefined) {
        return undefined;
    }

    return decision;
}

function _emitChaosDecision(
    chaos: { readonly onDecision?: (outcome: HttpTransportChaosDecisionOutcome) => void } | undefined,
    outcome: HttpTransportChaosDecisionOutcome
): void {
    if (typeof chaos?.onDecision !== 'function') return;

    _safeInvoke(() => {
        chaos.onDecision?.(outcome);
    });
}

interface RequestSamplingResolverOptions {
    readonly policy: HttpRequestSamplingPolicy;
    readonly sampleRate: number;
    readonly shouldSampleRequest?: (context: HttpRequestSamplingContext) => boolean | undefined;
    readonly onRequestSamplingDecision?: (decision: HttpRequestSamplingDecision) => void;
}

function _resolveRequestSamplingDecision(
    options: RequestSamplingResolverOptions,
    context: HttpRequestSamplingContext
): boolean {
    let sampled = true;

    if (options.policy === 'never') {
        sampled = false;
    } else if (options.policy === 'probabilistic') {
        sampled = context.randomValue < options.sampleRate;
    } else if (options.policy === 'custom') {
        sampled = _resolveCustomSamplingDecision(options.shouldSampleRequest, context);
    }

    if (typeof options.onRequestSamplingDecision === 'function') {
        const decision: HttpRequestSamplingDecision = {
            sampled,
            policy: options.policy,
            correlationId: context.correlationId,
            batchSize: context.batch.length,
            batchIndex: context.batchIndex,
            flushSequence: context.flushSequence,
            sampleRate: context.sampleRate,
        };

        _safeInvoke(() => {
            options.onRequestSamplingDecision?.(decision);
        });
    }

    return sampled;
}

function _resolveCustomSamplingDecision(
    shouldSampleRequest: ((context: HttpRequestSamplingContext) => boolean | undefined) | undefined,
    context: HttpRequestSamplingContext
): boolean {
    if (typeof shouldSampleRequest !== 'function') return true;

    try {
        return shouldSampleRequest(context) !== false;
    } catch {
        return true;
    }
}

function _computeRetryDelay(attempt: number, options: EmitOptions): number {
    if (options.retryDelayMs === 0) return 0;

    const exponential = options.retryDelayMs * Math.pow(options.retryBackoffMultiplier, attempt);
    const boundedBaseDelay = Math.min(exponential, options.maxRetryDelayMs);
    if (options.retryJitterRatio === 0) return Math.trunc(boundedBaseDelay);

    const jitterCap = boundedBaseDelay * options.retryJitterRatio;
    const jitter = jitterCap * options.random();
    return Math.trunc(Math.min(boundedBaseDelay + jitter, options.maxRetryDelayMs));
}

function _defaultSerializeBatch(events: readonly LoggerEvent[]): string {
    const payload = events.length === 1 ? events[0] : events;
    return JSON.stringify(payload);
}

function _injectMetadataIntoPayload(payload: string, key: string, metadata: unknown): string {
    try {
        const parsed = JSON.parse(payload) as unknown;

        if (Array.isArray(parsed)) {
            return JSON.stringify({
                [key]: metadata,
                events: parsed,
            });
        }

        if (typeof parsed === 'object' && parsed != null) {
            return JSON.stringify({
                ...parsed,
                [key]: metadata,
            });
        }

        return JSON.stringify({
            [key]: metadata,
            payload: parsed,
        });
    } catch {
        return JSON.stringify({
            [key]: metadata,
            payload,
        });
    }
}

function _getTraceMetadata(
    events: readonly LoggerEvent[],
    context: Omit<HttpBatchSerializationContext, 'traceMetadata'>,
    traceMetadataFactory:
        | ((
              events: readonly LoggerEvent[],
              context: Omit<HttpBatchSerializationContext, 'traceMetadata'>
          ) => Record<string, unknown> | undefined)
        | undefined
): Record<string, unknown> | undefined {
    if (typeof traceMetadataFactory !== 'function') return undefined;

    try {
        return traceMetadataFactory(events, context);
    } catch {
        return undefined;
    }
}

function _defaultCorrelationIdFactory(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// A throwing user-supplied `correlationIdFactory` must not break the flush loop.
function _safeCorrelationId(factory: () => string): string {
    try {
        return factory();
    } catch {
        return _defaultCorrelationIdFactory();
    }
}

function _isValidRequestBody(body: unknown): body is string | Uint8Array | ArrayBuffer {
    return typeof body === 'string' || body instanceof Uint8Array || body instanceof ArrayBuffer;
}

function _safeInvoke(action: () => void): void {
    try {
        action();
    } catch {
        // Metrics hooks must not break transport behavior.
    }
}

function _getGlobalFetch(): HttpFetchLike | undefined {
    const globalFetch = (globalThis as { fetch?: unknown }).fetch;
    if (typeof globalFetch !== 'function') return undefined;
    return globalFetch as HttpFetchLike;
}

interface AbortControllerLike {
    readonly signal: unknown;
    abort(): void;
}

function _createAbortController(): AbortControllerLike | undefined {
    const AbortControllerCtor = (globalThis as { AbortController?: unknown }).AbortController;
    if (typeof AbortControllerCtor !== 'function') return undefined;

    try {
        return new (AbortControllerCtor as new () => AbortControllerLike)();
    } catch {
        return undefined;
    }
}

function _setAbortTimeout(
    controller: AbortControllerLike | undefined,
    timeoutMs: number
): ReturnType<typeof setTimeout> | undefined {
    if (controller == null) return undefined;

    return setTimeout(() => {
        try {
            controller.abort();
        } catch {
            // Ignore abort failures to keep logging safe.
        }
    }, timeoutMs);
}

async function _wait(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}
