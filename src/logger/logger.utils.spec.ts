import { describe, expect, it } from '@jest/globals';
import { AppError } from '../error/app-error.js';
import {
    createObservabilityDashboardContractPreset,
    createRetryCircuitPolicyPreset,
    createProviderResilienceTemplate,
    createTransportResilienceProfilePreset,
    createDatadogProviderLogSink,
    createElkProviderLogSink,
    createOpenTelemetryProviderLogSink,
    createConsoleLogSink,
    createHttpLogSink,
    createLogger,
    createNoopLogSink,
    createProviderLogSink,
    isDatadogLogPayload,
    isElkLogDocument,
    isOpenTelemetryLogRecord,
    logUnknownError,
    redactLogPayload,
    shouldLogLevel,
    toDatadogLogEvent,
    toElkLogDocument,
    toOpenTelemetryLogRecord,
    type LoggerEvent,
    type LogSink,
} from './index.js';

describe('shouldLogLevel', () => {
    it('returns true when candidate level is above minimum', () => {
        expect(shouldLogLevel('error', 'info')).toBe(true);
    });

    it('returns false when candidate level is below minimum', () => {
        expect(shouldLogLevel('debug', 'warn')).toBe(false);
    });
});

describe('createConsoleLogSink', () => {
    it('maps levels to console methods', () => {
        const calls = {
            error: [] as unknown[][],
            warn: [] as unknown[][],
            info: [] as unknown[][],
            debug: [] as unknown[][],
            trace: [] as unknown[][],
            log: [] as unknown[][],
        };

        const consoleLike = {
            error: (...args: unknown[]): void => {
                calls.error.push(args);
            },
            warn: (...args: unknown[]): void => {
                calls.warn.push(args);
            },
            info: (...args: unknown[]): void => {
                calls.info.push(args);
            },
            debug: (...args: unknown[]): void => {
                calls.debug.push(args);
            },
            trace: (...args: unknown[]): void => {
                calls.trace.push(args);
            },
            log: (...args: unknown[]): void => {
                calls.log.push(args);
            },
        };

        const sink = createConsoleLogSink({
            consoleLike,
            includeTimestamp: false,
        });

        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'error', message: 'err' });
        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'warn', message: 'warn' });
        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'info', message: 'info' });
        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'debug', message: 'debug' });
        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'trace', message: 'trace' });
        sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'fatal', message: 'fatal' });

        expect(calls.error).toHaveLength(2);
        expect(calls.warn).toHaveLength(1);
        expect(calls.info).toHaveLength(1);
        expect(calls.debug).toHaveLength(1);
        expect(calls.trace).toHaveLength(1);
        expect(calls.log).toHaveLength(0);
    });

    it('falls back to log when a preferred method is unavailable', () => {
        const logCalls: unknown[][] = [];
        const sink = createConsoleLogSink({
            consoleLike: {
                log: (...args: unknown[]): void => {
                    logCalls.push(args);
                },
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'warn',
            message: 'fallback',
        });

        expect(logCalls).toHaveLength(1);
        expect(logCalls[0]?.[0]).toBe('fallback');
    });

    it('formats pretty output when enabled', () => {
        const infoCalls: unknown[][] = [];
        const sink = createConsoleLogSink({
            pretty: true,
            consoleLike: {
                info: (...args: unknown[]): void => {
                    infoCalls.push(args);
                },
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'app started',
            context: { service: 'api' },
        });

        expect(infoCalls).toHaveLength(1);
        expect(infoCalls[0]?.[0]).toContain('[2026-01-01T00:00:00.000Z] [INFO] app started');
        expect(infoCalls[0]?.[1]).toEqual({
            context: { service: 'api' },
        });
    });

    it('swallows adapter method errors', () => {
        const sink = createConsoleLogSink({
            consoleLike: {
                error: (): void => {
                    throw new Error('console failed');
                },
            },
        });

        expect(() =>
            sink.emit({
                timestamp: '2026-01-01T00:00:00.000Z',
                level: 'error',
                message: 'safe call',
            })
        ).not.toThrow();
    });
});

describe('createHttpLogSink', () => {
    it('creates observability dashboard contract presets', () => {
        const operations = createObservabilityDashboardContractPreset();
        const reliability = createObservabilityDashboardContractPreset('reliability');
        const diagnostics = createObservabilityDashboardContractPreset('diagnostics');

        expect(operations.preset).toBe('operations');
        expect(operations.metrics.length).toBeGreaterThan(0);
        expect(operations.events.length).toBeGreaterThan(0);
        expect(operations.recommendedPanels).toContain('Request audit stream');

        expect(reliability.preset).toBe('reliability');
        expect(reliability.metrics.some((metric) => metric.name === 'log_transport_drop_rate')).toBe(true);
        expect(
            reliability.events.some((event) => event.name === 'log_transport_retry_budget_exhausted')
        ).toBe(true);

        expect(diagnostics.preset).toBe('diagnostics');
        expect(
            diagnostics.events.some((event) => event.name === 'log_transport_circuit_tuning_decision')
        ).toBe(true);
    });

    it('creates retry/circuit presets for conservative, balanced, and aggressive policies', () => {
        const conservative = createRetryCircuitPolicyPreset('conservative');
        const balanced = createRetryCircuitPolicyPreset();
        const aggressive = createRetryCircuitPolicyPreset('aggressive');

        expect(conservative).toMatchObject({
            maxRetries: 1,
            retryDelayMs: 200,
            retryBudget: {
                maxRetriesPerBatch: 1,
            },
            circuitBreaker: {
                failureThreshold: 2,
            },
        });

        expect(balanced).toMatchObject({
            maxRetries: 2,
            retryDelayMs: 150,
            retryBudget: {
                maxRetriesPerBatch: 2,
            },
            circuitBreaker: {
                failureThreshold: 3,
            },
        });

        expect(aggressive).toMatchObject({
            maxRetries: 4,
            retryDelayMs: 100,
            retryBudget: {
                maxRetriesPerBatch: 4,
            },
            circuitBreaker: {
                failureThreshold: 5,
            },
        });
    });

    it('allows spreading a retry/circuit preset into createHttpLogSink options', async () => {
        const policy = createRetryCircuitPolicyPreset('balanced');
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            ...policy,
            fetchLike: async () => ({
                ok: true,
                status: 200,
            }),
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'preset integration',
        });

        await _flushAsyncWork();
        await sink.shutdown();
    });

    it('creates transport resilience profile presets', () => {
        const availabilityFirst = createTransportResilienceProfilePreset('availability-first');
        const costEfficient = createTransportResilienceProfilePreset();
        const testHardened = createTransportResilienceProfilePreset('test-hardened');

        expect(availabilityFirst).toMatchObject({
            requestSamplingPolicy: 'always',
            requestSampleRate: 1,
            maxRetries: 4,
            batchSize: 10,
        });

        expect(costEfficient).toMatchObject({
            requestSamplingPolicy: 'probabilistic',
            requestSampleRate: 0.5,
            maxRetries: 1,
            batchSize: 20,
        });

        expect(testHardened).toMatchObject({
            requestSamplingPolicy: 'always',
            requestSampleRate: 1,
            maxRetries: 2,
            chaos: {
                enabled: true,
                probability: 0.15,
            },
        });
    });

    it('allows spreading a resilience profile preset into createHttpLogSink options', async () => {
        const profile = createTransportResilienceProfilePreset('availability-first');
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            ...profile,
            fetchLike: async () => {
                requestCount += 1;
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'profile integration',
        });

        await _flushAsyncWork();
        await sink.flush();

        expect(requestCount).toBe(1);
        await sink.shutdown();
    });

    it('creates provider resilience templates for Datadog, ELK, and OpenTelemetry', () => {
        const datadog = createProviderResilienceTemplate('datadog-http');
        const elk = createProviderResilienceTemplate('elk-http');
        const otel = createProviderResilienceTemplate('opentelemetry-http');

        expect(datadog).toMatchObject({
            method: 'POST',
            contentType: 'application/json',
            requestSamplingPolicy: 'always',
        });

        expect(elk).toMatchObject({
            method: 'POST',
            contentType: 'application/x-ndjson',
            requestSamplingPolicy: 'probabilistic',
        });

        expect(otel).toMatchObject({
            method: 'POST',
            contentType: 'application/json',
            requestSamplingPolicy: 'probabilistic',
        });
    });

    it('serializes Datadog template payload and preserves trace metadata envelope by default', async () => {
        const bodies: unknown[] = [];
        const datadogTemplate = createProviderResilienceTemplate('datadog-http');

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            ...datadogTemplate,
            batchSize: 2,
            traceMetadataFactory: () => ({ traceId: 'trace-1' }),
            includeTraceMetadataInPayload: true,
            fetchLike: async (_url, init) => {
                bodies.push(_parseRequestBody(init.body, null));
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'dd one',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'warn',
            message: 'dd two',
        });

        await _flushAsyncWork();

        expect(bodies).toHaveLength(1);
        expect((bodies[0] as { logs?: unknown[] }).logs).toHaveLength(2);
        expect((bodies[0] as { traceMetadata?: { traceId?: string } }).traceMetadata?.traceId).toBe('trace-1');
        await sink.shutdown();
    });

    it('serializes ELK template as newline-delimited bulk payload', async () => {
        const bodies: string[] = [];
        const elkTemplate = createProviderResilienceTemplate('elk-http', {
            profile: 'availability-first',
            elkMapper: { index: 'app-logs-2026.07.29' },
        });

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/_bulk',
            ...elkTemplate,
            batchSize: 2,
            fetchLike: async (_url, init) => {
                bodies.push(_decodeRequestBody(init.body));
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'elk one',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'elk two',
        });

        await _flushAsyncWork();

        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toContain('"index":{"_index":"app-logs-2026.07.29"}');
        expect(bodies[0]).toContain('"message":"elk one"');
        expect(bodies[0]).toContain('"message":"elk two"');
        expect(bodies[0]?.endsWith('\n')).toBe(true);
        await sink.shutdown();
    });

    it('serializes OpenTelemetry template as resourceLogs payload', async () => {
        const bodies: unknown[] = [];
        const otelTemplate = createProviderResilienceTemplate('opentelemetry-http', {
            profile: 'availability-first',
            openTelemetryMapper: {
                scopeName: 'checkout-service',
            },
        });

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/otlp/v1/logs',
            ...otelTemplate,
            fetchLike: async (_url, init) => {
                bodies.push(_parseRequestBody(init.body, null));
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'otel one',
        });

        await _flushAsyncWork();
        await sink.flush();

        expect(bodies).toHaveLength(1);
        const payload = bodies[0] as {
            resourceLogs?: Array<{ scopeLogs?: Array<{ logRecords?: Array<{ body?: string }> }> }>;
        };
        expect(payload.resourceLogs?.[0]?.scopeLogs?.[0]?.logRecords?.[0]?.body).toBe('otel one');
        await sink.shutdown();
    });

    it('emits structured payload using provided fetchLike', async () => {
        const calls: Array<{ url: string; method?: string; body?: string | Uint8Array | ArrayBuffer }> = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            fetchLike: async (url, init) => {
                calls.push({
                    url,
                    ...(init.method !== undefined ? { method: init.method } : {}),
                    ...(init.body !== undefined ? { body: init.body } : {}),
                });
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'remote event',
            context: { app: 'web' },
        });

        await _flushAsyncWork();

        expect(calls).toHaveLength(1);
        expect(calls[0]?.url).toBe('https://logs.example.com/events');
        expect(calls[0]?.method).toBe('POST');
        expect(_decodeRequestBody(calls[0]?.body)).toContain('"message":"remote event"');
        await sink.shutdown();
    });

    it('retries when initial attempt fails', async () => {
        let count = 0;
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 0,
            fetchLike: async () => {
                count += 1;
                if (count === 1) {
                    return {
                        ok: false,
                        status: 500,
                    };
                }

                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'retry test',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(count).toBe(2);
        await sink.shutdown();
    });

    it('validates required and numeric options', () => {
        expect(() => createHttpLogSink({ url: '' })).toThrow(TypeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', timeoutMs: 0 })).toThrow(RangeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', maxRetries: -1 })).toThrow(RangeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', retryDelayMs: -1 })).toThrow(RangeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', requestSampleRate: 1.1 })).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                circuitBreaker: {
                    failureThreshold: 0,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                circuitBreaker: {
                    cooldownMs: -1,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                circuitBreaker: {
                    halfOpenMaxRequests: 0,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                retryBudget: {
                    maxRetriesPerBatch: -1,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                retryBudget: {
                    maxRetriesPerFlush: -1,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                chaos: {
                    probability: 2,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                chaos: {
                    fixedDelayMs: -1,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                chaos: {
                    forcedStatusCode: 700,
                },
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                traceMetadataPayloadKey: ' ',
            })
        ).toThrow(TypeError);
    });

    it('swallows transport failures and never throws from emit', async () => {
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            fetchLike: async () => {
                throw new Error('network down');
            },
        });

        expect(() =>
            sink.emit({
                timestamp: '2026-01-01T00:00:00.000Z',
                level: 'error',
                message: 'safe emit',
            })
        ).not.toThrow();
        await sink.shutdown();
    });

    it('sends a batched payload when batchSize is reached', async () => {
        const payloads: unknown[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 2,
            fetchLike: async (_url, init) => {
                payloads.push(_parseRequestBody(init.body, null));
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'one',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'two',
        });

        await _flushAsyncWork();

        expect(payloads).toHaveLength(1);
        expect(Array.isArray(payloads[0])).toBe(true);
        expect((payloads[0] as Array<{ message: string }>).map((item) => item.message)).toEqual(['one', 'two']);
        await sink.shutdown();
    });

    it('uses custom serializer for batched payloads', async () => {
        const bodies: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 2,
            contentType: 'application/x-ndjson',
            serializeBatch: (events) => events.map((event) => JSON.stringify(event)).join('\n'),
            fetchLike: async (_url, init) => {
                bodies.push(_decodeRequestBody(init.body));
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'ndjson-one',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'ndjson-two',
        });

        await _flushAsyncWork();

        expect(bodies).toHaveLength(1);
        expect(bodies[0]).toContain('ndjson-one');
        expect(bodies[0]).toContain('ndjson-two');
        expect(bodies[0]).toContain('\n');
        await sink.shutdown();
    });

    it('uses compression hook and sets content-encoding header', async () => {
        const headers: Array<Record<string, string> | undefined> = [];
        const bodies: Array<string | Uint8Array | ArrayBuffer | undefined> = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            compressionEncoding: 'gzip',
            compressPayload: (payload) => new TextEncoder().encode(payload),
            fetchLike: async (_url, init) => {
                headers.push(init.headers);
                bodies.push(init.body);
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'compressed payload',
        });

        await _flushAsyncWork();

        expect(headers[0]?.['content-encoding']).toBe('gzip');
        expect(bodies[0] instanceof Uint8Array).toBe(true);
        await sink.shutdown();
    });

    it('drops newest events when queue is full and strategy is drop-newest', async () => {
        const droppedMessages: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 10,
            flushIntervalMs: 50,
            maxQueueSize: 2,
            overflowStrategy: 'drop-newest',
            onDrop: (drop) => {
                droppedMessages.push(drop.event.message);
            },
            fetchLike: async () => ({
                ok: true,
                status: 200,
            }),
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'm1',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'm2',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'm3',
        });

        await _waitMs(60);

        expect(droppedMessages).toEqual(['m3']);
        await sink.shutdown();
    });

    it('reports dropped events after final send failure', async () => {
        const droppedReasons: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 0,
            onDrop: (drop) => {
                droppedReasons.push(drop.reason);
            },
            fetchLike: async () => ({
                ok: false,
                status: 500,
            }),
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'permanent failure',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(droppedReasons).toEqual(['send-failure']);
        await sink.shutdown();
    });

    it('validates queue and retry tuning options', () => {
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', batchSize: 0 })).toThrow(RangeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', maxQueueSize: 0 })).toThrow(RangeError);
        expect(() => createHttpLogSink({ url: 'https://logs.example.com', flushIntervalMs: -1 })).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                retryBackoffMultiplier: 0.5,
            })
        ).toThrow(RangeError);
        expect(() =>
            createHttpLogSink({
                url: 'https://logs.example.com',
                retryJitterRatio: 2,
            })
        ).toThrow(RangeError);
    });

    it('flushes explicitly and exposes queue size', async () => {
        const sent: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 10,
            flushIntervalMs: 100,
            fetchLike: async (_url, init) => {
                const payload = _parseRequestBody<{ message?: string }>(init.body, {});
                if (payload.message != null) {
                    sent.push(payload.message);
                }
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'manual flush',
        });

        expect(sink.getQueueSize()).toBe(1);
        await sink.flush();
        await _flushAsyncWork();
        await sink.flush();
        expect(sink.getQueueSize()).toBe(0);
        expect(sent).toEqual(['manual flush']);
        await sink.shutdown();
    });

    it('restores persisted queue and persists updates', async () => {
        const persistedSnapshots: number[] = [];
        const sentMessages: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 10,
            flushIntervalMs: 0,
            persistence: {
                loadQueue: async () => [
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'warn',
                        message: 'restored event',
                    },
                ],
                saveQueue: (events) => {
                    persistedSnapshots.push(events.length);
                },
                saveDebounceMs: 0,
            },
            fetchLike: async (_url, init) => {
                const payload = _parseRequestBody<{ message?: string }>(init.body, {});
                if (payload.message != null) {
                    sentMessages.push(payload.message);
                }

                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'new event',
        });

        await _flushAsyncWork();
        expect(sentMessages).toContain('restored event');
        expect(sentMessages).toContain('new event');
        expect(persistedSnapshots.length).toBeGreaterThan(0);
        await sink.shutdown();
    });

    it('does not leave a dangling persistence timer after shutdown() resolves', async () => {
        const saveCalls: number[] = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 10,
            persistence: {
                saveQueue: (events) => {
                    saveCalls.push(events.length);
                },
                saveDebounceMs: 20,
            },
            fetchLike: async () => ({ ok: true, status: 200 }),
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'persisted event',
        });

        await sink.shutdown();
        const callsRightAfterShutdown = saveCalls.length;
        expect(callsRightAfterShutdown).toBeGreaterThan(0);

        // Wait well past the debounce window; before the fix, flush()'s internal
        // schedulePersistence() call re-armed a timer during shutdown() that fired
        // after shutdown() had already resolved, causing an extra save here.
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(saveCalls.length).toBe(callsRightAfterShutdown);
    });

    it('stops accepting emits after shutdown', async () => {
        const sent: string[] = [];
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            fetchLike: async (_url, init) => {
                const payload = _parseRequestBody<{ message?: string }>(init.body, {});
                if (payload.message != null) {
                    sent.push(payload.message);
                }
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'before shutdown',
        });

        await sink.shutdown();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'after shutdown',
        });

        await _flushAsyncWork();
        expect(sent).toContain('before shutdown');
        expect(sent).not.toContain('after shutdown');
    });

    it('emits runtime health metrics hooks and exposes snapshot', async () => {
        const queueDepths: number[] = [];
        const flushes: Array<{ eventsSent: number; failedEvents: number; retriesAttempted: number }> = [];
        const dropTotals: number[] = [];
        const retryAttempts: Array<{ attempt: number; maxRetries: number; batchSize: number }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 0,
            batchSize: 10,
            flushIntervalMs: 50,
            maxQueueSize: 1,
            overflowStrategy: 'drop-newest',
            metrics: {
                onQueueDepthChange: (depth) => {
                    queueDepths.push(depth);
                },
                onFlushComplete: (metrics) => {
                    flushes.push({
                        eventsSent: metrics.eventsSent,
                        failedEvents: metrics.failedEvents,
                        retriesAttempted: metrics.retriesAttempted,
                    });
                },
                onDropCountChange: (totalDropped) => {
                    dropTotals.push(totalDropped);
                },
                onRetryAttempt: (attempt, maxRetries, batchSize) => {
                    retryAttempts.push({ attempt, maxRetries, batchSize });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'm1',
        });

        // Force queue-overflow drop event while maxQueueSize is 1.
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'm2',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();
        await _waitMs(60);
        await _flushAsyncWork();

        const snapshot = sink.getMetricsSnapshot();

        expect(queueDepths.length).toBeGreaterThan(0);
        expect(retryAttempts).toEqual([
            {
                attempt: 1,
                maxRetries: 1,
                batchSize: 1,
            },
        ]);
        expect(dropTotals).toContain(1);
        expect(flushes.length).toBeGreaterThan(0);
        expect(snapshot.totalEventsEnqueued).toBeGreaterThanOrEqual(1);
        expect(snapshot.totalEventsDropped).toBeGreaterThanOrEqual(1);
        expect(snapshot.totalEventsSent).toBeGreaterThanOrEqual(1);
        expect(snapshot.totalFlushes).toBeGreaterThanOrEqual(1);
        expect(snapshot.lastFlushDurationMs).toBeGreaterThanOrEqual(0);

        await sink.shutdown();
    });

    it('emits batch and flush outcomes for observability hooks', async () => {
        const batchOutcomes: Array<{
            success: boolean;
            batchSize: number;
            retryCount: number;
            statusCode: number | undefined;
            failedEvents: number;
        }> = [];
        const flushOutcomes: Array<{
            success: boolean;
            batchesProcessed: number;
            eventsSent: number;
            failedEvents: number;
            retriesAttempted: number;
        }> = [];

        let requestIndex = 0;
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            maxRetries: 1,
            retryDelayMs: 0,
            onBatchOutcome: (outcome) => {
                batchOutcomes.push({
                    success: outcome.success,
                    batchSize: outcome.batchSize,
                    retryCount: outcome.retryCount,
                    statusCode: outcome.statusCode,
                    failedEvents: outcome.failedEvents,
                });
            },
            onFlushOutcome: (outcome) => {
                flushOutcomes.push({
                    success: outcome.success,
                    batchesProcessed: outcome.batchesProcessed,
                    eventsSent: outcome.eventsSent,
                    failedEvents: outcome.failedEvents,
                    retriesAttempted: outcome.retriesAttempted,
                });
            },
            fetchLike: async () => {
                requestIndex += 1;
                if (requestIndex === 1) return { ok: false, status: 500 };
                if (requestIndex === 2) return { ok: true, status: 200 };
                return { ok: false, status: 503 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'first',
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'second',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(batchOutcomes.length).toBeGreaterThanOrEqual(2);
        expect(batchOutcomes[0]).toMatchObject({
            success: true,
            batchSize: 1,
            retryCount: 1,
            statusCode: 200,
            failedEvents: 0,
        });
        expect(batchOutcomes[1]).toMatchObject({
            success: false,
            batchSize: 1,
            retryCount: 1,
            statusCode: 503,
            failedEvents: 1,
        });

        expect(flushOutcomes.length).toBeGreaterThan(0);
        const latestFlush = flushOutcomes[flushOutcomes.length - 1];
        expect(latestFlush).toMatchObject({
            success: false,
            eventsSent: 1,
            failedEvents: 1,
            retriesAttempted: 2,
        });

        await sink.shutdown();
    });

    it('adds per-batch correlation IDs to transport and outcomes', async () => {
        const requestHeaders: Array<Record<string, string> | undefined> = [];
        const requestBodies: unknown[] = [];
        const batchCorrelationIds: string[] = [];
        const flushCorrelationGroups: string[][] = [];

        const ids = ['cid-1', 'cid-2'];
        let idIndex = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            correlationIdFactory: () => ids[idIndex++] ?? 'cid-fallback',
            includeCorrelationIdInPayload: true,
            correlationPayloadKey: 'traceId',
            onBatchOutcome: (outcome) => {
                batchCorrelationIds.push(outcome.correlationId);
            },
            onFlushOutcome: (outcome) => {
                flushCorrelationGroups.push([...outcome.correlationIds]);
            },
            fetchLike: async (_url, init) => {
                requestHeaders.push(init.headers);
                requestBodies.push(_parseRequestBody(init.body, {} as Record<string, unknown>));
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'trace one',
        });
        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'trace two',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestHeaders[0]?.['x-log-correlation-id']).toBe('cid-1');
        expect(requestHeaders[1]?.['x-log-correlation-id']).toBe('cid-2');

        expect((requestBodies[0] as Record<string, unknown>).traceId).toBe('cid-1');
        expect((requestBodies[1] as Record<string, unknown>).traceId).toBe('cid-2');

        expect(batchCorrelationIds).toEqual(['cid-1', 'cid-2']);
        expect(flushCorrelationGroups.length).toBeGreaterThan(0);
        const flattened = flushCorrelationGroups.flat();
        expect(flattened).toContain('cid-1');
        expect(flattened).toContain('cid-2');

        await sink.shutdown();
    });

    it('falls back to a default correlation id instead of rejecting flush() when correlationIdFactory throws', async () => {
        const requestHeaders: Array<Record<string, string> | undefined> = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 10,
            correlationIdFactory: () => {
                throw new Error('factory exploded');
            },
            fetchLike: async (_url, init) => {
                requestHeaders.push(init.headers);
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'still logs',
        });

        await expect(sink.flush()).resolves.toBeUndefined();

        expect(requestHeaders).toHaveLength(1);
        expect(requestHeaders[0]?.['x-log-correlation-id']).toEqual(
            expect.stringMatching(/^[0-9a-z]+-[0-9a-z]+$/)
        );

        await expect(sink.shutdown()).resolves.toBeUndefined();
    });

    it('supports pluggable trace metadata in serialization context and payload', async () => {
        const seenContexts: Array<{ correlationId: string; traceMetadata: Record<string, unknown> | undefined }> = [];
        const bodies: Array<Record<string, unknown>> = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            correlationIdFactory: () => 'cid-trace',
            traceMetadataFactory: (events, context) => ({
                strategy: 'redaction-v2',
                eventCount: events.length,
                flushSequence: context.flushSequence,
            }),
            includeTraceMetadataInPayload: true,
            traceMetadataPayloadKey: 'trace',
            serializeBatch: (events, context) => {
                seenContexts.push({
                    correlationId: context.correlationId,
                    traceMetadata: context.traceMetadata,
                });

                return JSON.stringify({
                    event: events[0],
                });
            },
            fetchLike: async (_url, init) => {
                bodies.push(_parseRequestBody(init.body, {} as Record<string, unknown>));
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'trace metadata event',
        });

        await _flushAsyncWork();

        expect(seenContexts).toHaveLength(1);
        expect(seenContexts[0]).toMatchObject({
            correlationId: 'cid-trace',
            traceMetadata: {
                strategy: 'redaction-v2',
                eventCount: 1,
            },
        });

        expect(bodies).toHaveLength(1);
        expect(bodies[0]?.trace).toMatchObject({
            strategy: 'redaction-v2',
            eventCount: 1,
        });

        await sink.shutdown();
    });

    it('ignores trace metadata factory errors to keep transport safe', async () => {
        const payloads: Array<Record<string, unknown>> = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            traceMetadataFactory: () => {
                throw new Error('trace metadata failure');
            },
            includeTraceMetadataInPayload: true,
            traceMetadataPayloadKey: 'trace',
            fetchLike: async (_url, init) => {
                payloads.push(_parseRequestBody(init.body, {} as Record<string, unknown>));
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'still sends',
        });

        await _flushAsyncWork();

        expect(payloads).toHaveLength(1);
        expect(payloads[0]?.message).toBe('still sends');
        expect(payloads[0]?.trace).toBeUndefined();

        await sink.shutdown();
    });

    it('emits request audit events for retries and failures', async () => {
        const audits: Array<{
            attempt: number;
            maxRetries: number;
            batchSize: number;
            success: boolean;
            statusCode: number | undefined;
            correlationId: string;
            payloadSizeBytes: number;
            durationMs: number;
        }> = [];

        let requestCount = 0;
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 0,
            correlationIdFactory: () => 'cid-audit',
            onRequestAudit: (event) => {
                audits.push({
                    attempt: event.attempt,
                    maxRetries: event.maxRetries,
                    batchSize: event.batchSize,
                    success: event.success,
                    statusCode: event.statusCode,
                    correlationId: event.correlationId,
                    payloadSizeBytes: event.payloadSizeBytes,
                    durationMs: event.durationMs,
                });
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }

                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'audit me',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(audits).toHaveLength(2);
        expect(audits[0]).toMatchObject({
            attempt: 1,
            maxRetries: 1,
            batchSize: 1,
            success: false,
            statusCode: 500,
            correlationId: 'cid-audit',
        });
        expect(audits[1]).toMatchObject({
            attempt: 2,
            maxRetries: 1,
            batchSize: 1,
            success: true,
            statusCode: 200,
            correlationId: 'cid-audit',
        });
        expect(audits[0]?.payloadSizeBytes).toBeGreaterThan(0);
        expect(audits[1]?.durationMs).toBeGreaterThanOrEqual(0);

        await sink.shutdown();
    });

    it('keeps transport safe when request audit callback throws', async () => {
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            onRequestAudit: () => {
                throw new Error('audit callback failed');
            },
            fetchLike: async () => ({
                ok: true,
                status: 200,
            }),
        });

        expect(() =>
            sink.emit({
                timestamp: '2026-01-01T00:00:00.000Z',
                level: 'info',
                message: 'safe audit callback',
            })
        ).not.toThrow();

        await _flushAsyncWork();
        await sink.shutdown();
    });

    it('samples out transport requests with probabilistic policy', async () => {
        const droppedReasons: string[] = [];
        const batchOutcomes: Array<{ sampledOut: boolean; batchSize: number }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            requestSamplingPolicy: 'probabilistic',
            requestSampleRate: 0.5,
            random: () => 0.9,
            onDrop: (drop) => {
                droppedReasons.push(drop.reason);
            },
            onBatchOutcome: (outcome) => {
                batchOutcomes.push({
                    sampledOut: outcome.sampledOut,
                    batchSize: outcome.batchSize,
                });
            },
            fetchLike: async () => {
                requestCount += 1;
                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'sample me out',
        });

        await _flushAsyncWork();

        expect(requestCount).toBe(0);
        expect(droppedReasons).toEqual(['sampled-out']);
        expect(batchOutcomes).toEqual([
            {
                sampledOut: true,
                batchSize: 1,
            },
        ]);

        await sink.shutdown();
    });

    it('supports custom sampling policy and emits sampling decisions', async () => {
        const decisions: Array<{ sampled: boolean; policy: string; batchSize: number }> = [];
        const sentMessages: string[] = [];
        const droppedReasons: string[] = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            flushIntervalMs: 1000,
            requestSamplingPolicy: 'custom',
            shouldSampleRequest: (context) => context.batch[0]?.level === 'error',
            onRequestSamplingDecision: (decision) => {
                decisions.push({
                    sampled: decision.sampled,
                    policy: decision.policy,
                    batchSize: decision.batchSize,
                });
            },
            onDrop: (drop) => {
                droppedReasons.push(drop.reason);
            },
            fetchLike: async (_url, init) => {
                const payload = _parseRequestBody<{ message?: string }>(init.body, {});
                if (payload.message != null) {
                    sentMessages.push(payload.message);
                }

                return {
                    ok: true,
                    status: 200,
                };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'info-sampled-out',
        });

        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'error-sent',
        });

        await sink.flush();
        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(decisions).toHaveLength(2);
        expect(decisions[0]).toMatchObject({ sampled: false, policy: 'custom', batchSize: 1 });
        expect(decisions[1]).toMatchObject({ sampled: true, policy: 'custom', batchSize: 1 });
        expect(droppedReasons).toContain('sampled-out');
        expect(sentMessages).toContain('error-sent');
        expect(sentMessages).not.toContain('info-sampled-out');

        await sink.shutdown();
    });

    it('emits dead-letter entries for sampled-out and send-failure drops', async () => {
        const deadLetters: Array<{
            reason: string;
            message: string;
            correlationId: string | undefined;
            statusCode: number | undefined;
            retryCount: number | undefined;
        }> = [];

        let requestCount = 0;
        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            flushIntervalMs: 1000,
            requestSamplingPolicy: 'custom',
            shouldSampleRequest: (context) => context.batch[0]?.message !== 'sample-me-out',
            maxRetries: 1,
            retryDelayMs: 0,
            correlationIdFactory: () => 'cid-dead-letter',
            deadLetter: {
                emit: (entry) => {
                    deadLetters.push({
                        reason: entry.reason,
                        message: entry.event.message,
                        correlationId: entry.correlationId,
                        statusCode: entry.statusCode,
                        retryCount: entry.retryCount,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount <= 2) {
                    return { ok: false, status: 500 };
                }

                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'sample-me-out',
        });

        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'fail-to-send',
        });

        await sink.flush();
        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(deadLetters).toHaveLength(2);
        expect(deadLetters[0]).toMatchObject({
            reason: 'sampled-out',
            message: 'sample-me-out',
            correlationId: 'cid-dead-letter',
            retryCount: 0,
        });
        expect(deadLetters[1]).toMatchObject({
            reason: 'send-failure',
            message: 'fail-to-send',
            correlationId: 'cid-dead-letter',
            statusCode: 500,
            retryCount: 1,
        });

        await sink.shutdown();
    });

    it('keeps transport safe when dead-letter emit throws or rejects', async () => {
        const deadLetterErrors: unknown[] = [];
        let emitCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            flushIntervalMs: 1000,
            requestSamplingPolicy: 'never',
            deadLetter: {
                emit: () => {
                    emitCount += 1;
                    if (emitCount === 1) {
                        throw new Error('dead-letter sync failure');
                    }

                    return Promise.reject(new Error('dead-letter async failure'));
                },
                onEmitError: (error) => {
                    deadLetterErrors.push(error);
                },
            },
            fetchLike: async () => ({
                ok: true,
                status: 200,
            }),
        });

        expect(() =>
            sink.emit({
                timestamp: '2026-01-01T00:00:00.000Z',
                level: 'info',
                message: 'dead-letter-safe-1',
            })
        ).not.toThrow();

        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'dead-letter-safe-2',
        });

        await sink.flush();
        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(deadLetterErrors).toHaveLength(2);
        await sink.shutdown();
    });

    it('supports adaptive retry tuning with delay override', async () => {
        const tuningDecisions: Array<{ baseDelayMs: number; delayMs: number; shouldRetry: boolean }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 100,
            retryBackoffMultiplier: 1,
            retryJitterRatio: 0,
            resolveRetryTuning: () => ({
                shouldRetry: true,
                delayMs: 0,
            }),
            onRetryTuningDecision: (decision) => {
                tuningDecisions.push({
                    baseDelayMs: decision.baseDelayMs,
                    delayMs: decision.delayMs,
                    shouldRetry: decision.shouldRetry,
                });
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }

                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'adaptive retry',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(2);
        expect(tuningDecisions).toEqual([
            {
                baseDelayMs: 100,
                delayMs: 0,
                shouldRetry: true,
            },
        ]);

        await sink.shutdown();
    });

    it('supports adaptive retry tuning to stop retries early', async () => {
        const tuningDecisions: Array<{ shouldRetry: boolean; failedAttempt: number }> = [];
        const retryAttempts: number[] = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 3,
            retryDelayMs: 0,
            metrics: {
                onRetryAttempt: (attempt) => {
                    retryAttempts.push(attempt);
                },
            },
            resolveRetryTuning: (context) => ({
                shouldRetry: context.failedAttempt < 1,
            }),
            onRetryTuningDecision: (decision) => {
                tuningDecisions.push({
                    shouldRetry: decision.shouldRetry,
                    failedAttempt: decision.failedAttempt,
                });
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: false, status: 500 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'stop retries',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(1);
        expect(retryAttempts).toEqual([]);
        expect(tuningDecisions).toEqual([
            {
                shouldRetry: false,
                failedAttempt: 1,
            },
        ]);

        await sink.shutdown();
    });

    it('enforces retry budget per batch and emits exhaustion callback', async () => {
        const exhausted: Array<{ reason: string; attemptedRetriesInBatch: number }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 3,
            retryDelayMs: 0,
            retryBudget: {
                maxRetriesPerBatch: 1,
                onExhausted: (context) => {
                    exhausted.push({
                        reason: context.reason,
                        attemptedRetriesInBatch: context.attemptedRetriesInBatch,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: false, status: 500 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'batch budget',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(2);
        expect(exhausted).toEqual([
            {
                reason: 'batch-limit',
                attemptedRetriesInBatch: 1,
            },
        ]);

        await sink.shutdown();
    });

    it('enforces retry budget per flush across batches', async () => {
        const exhaustedReasons: string[] = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 1,
            maxRetries: 1,
            retryDelayMs: 0,
            retryBudget: {
                maxRetriesPerFlush: 1,
                onExhausted: (context) => {
                    exhaustedReasons.push(context.reason);
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: false, status: 500 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'first in flush',
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'second in flush',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(3);
        expect(exhaustedReasons).toContain('flush-limit');

        await sink.shutdown();
    });

    it('supports chaos status-code injection without performing transport request', async () => {
        const decisions: Array<{ injected: boolean; statusCode: number | undefined }> = [];
        const droppedReasons: string[] = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 0,
            chaos: {
                enabled: true,
                probability: 1,
                forcedStatusCode: 503,
                onDecision: (outcome) => {
                    decisions.push({
                        injected: outcome.injected,
                        statusCode: outcome.statusCode,
                    });
                },
            },
            onDrop: (drop) => {
                droppedReasons.push(drop.reason);
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'chaos status',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(0);
        expect(decisions).toEqual([
            {
                injected: true,
                statusCode: 503,
            },
        ]);
        expect(droppedReasons).toContain('send-failure');

        await sink.shutdown();
    });

    it('supports custom chaos decisions per attempt and can recover on retry', async () => {
        const decisions: Array<{ injected: boolean; attempt: number; statusCode: number | undefined }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 1,
            retryDelayMs: 0,
            chaos: {
                decide: (context) => {
                    if (context.attempt === 1) {
                        return {
                            statusCode: 500,
                        };
                    }

                    return undefined;
                },
                onDecision: (outcome) => {
                    decisions.push({
                        injected: outcome.injected,
                        attempt: outcome.attempt,
                        statusCode: outcome.statusCode,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'chaos custom',
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(requestCount).toBe(1);
        expect(decisions).toEqual([
            {
                injected: true,
                attempt: 1,
                statusCode: 500,
            },
            {
                injected: false,
                attempt: 2,
                statusCode: undefined,
            },
        ]);

        await sink.shutdown();
    });

    it('opens circuit and drops subsequent batches while open', async () => {
        const droppedReasons: string[] = [];
        const stateChanges: Array<{ previousState: string; state: string; reason: string }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 0,
            batchSize: 1,
            circuitBreaker: {
                failureThreshold: 1,
                cooldownMs: 60_000,
                onStateChange: (change) => {
                    stateChanges.push({
                        previousState: change.previousState,
                        state: change.state,
                        reason: change.reason,
                    });
                },
            },
            onDrop: (drop) => {
                droppedReasons.push(drop.reason);
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: false, status: 500 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'trip breaker',
        });
        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'blocked by open circuit',
        });
        await sink.flush();
        await _flushAsyncWork();

        expect(requestCount).toBe(1);
        expect(droppedReasons).toEqual(['send-failure', 'circuit-open']);
        expect(stateChanges).toEqual([
            {
                previousState: 'closed',
                state: 'open',
                reason: 'failure-threshold-reached',
            },
        ]);
        expect(sink.getMetricsSnapshot().circuitState).toBe('open');

        await sink.shutdown();
    });

    it('supports half-open recovery and returns to closed after successful probe', async () => {
        const stateChanges: Array<{ previousState: string; state: string; reason: string }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 0,
            batchSize: 1,
            circuitBreaker: {
                failureThreshold: 1,
                cooldownMs: 0,
                halfOpenMaxRequests: 1,
                onStateChange: (change) => {
                    stateChanges.push({
                        previousState: change.previousState,
                        state: change.state,
                        reason: change.reason,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }

                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'first failure',
        });
        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'half-open probe success',
        });
        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'closed state send',
        });
        await sink.flush();
        await _flushAsyncWork();

        expect(requestCount).toBe(3);
        expect(stateChanges).toEqual([
            {
                previousState: 'closed',
                state: 'open',
                reason: 'failure-threshold-reached',
            },
            {
                previousState: 'open',
                state: 'half-open',
                reason: 'cooldown-expired',
            },
            {
                previousState: 'half-open',
                state: 'closed',
                reason: 'half-open-success',
            },
        ]);
        expect(sink.getMetricsSnapshot().circuitState).toBe('closed');

        await sink.shutdown();
    });

    it('supports dynamic circuit tuning for failure threshold', async () => {
        const tuningOutcomes: Array<{ appliedFailureThreshold: number; consecutiveFailures: number }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 0,
            batchSize: 1,
            circuitBreaker: {
                failureThreshold: 5,
                resolveTuning: () => ({
                    failureThreshold: 1,
                }),
                onTuningDecision: (outcome) => {
                    tuningOutcomes.push({
                        appliedFailureThreshold: outcome.appliedFailureThreshold,
                        consecutiveFailures: outcome.consecutiveFailures,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                return { ok: false, status: 500 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'dynamic threshold',
        });

        await sink.flush();
        await _flushAsyncWork();

        expect(requestCount).toBe(1);
        expect(tuningOutcomes).toEqual([
            {
                appliedFailureThreshold: 1,
                consecutiveFailures: 1,
            },
        ]);
        expect(sink.getMetricsSnapshot().circuitState).toBe('open');

        await sink.shutdown();
    });

    it('supports dynamic circuit tuning for cooldown and allows immediate half-open probe', async () => {
        const stateChanges: Array<{ previousState: string; state: string; reason: string }> = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            maxRetries: 0,
            batchSize: 1,
            circuitBreaker: {
                failureThreshold: 1,
                cooldownMs: 60_000,
                resolveTuning: () => ({
                    cooldownMs: 0,
                }),
                onStateChange: (change) => {
                    stateChanges.push({
                        previousState: change.previousState,
                        state: change.state,
                        reason: change.reason,
                    });
                },
            },
            fetchLike: async () => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }

                return { ok: true, status: 200 };
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'trip circuit',
        });
        await sink.flush();
        await _flushAsyncWork();

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'probe after tuned cooldown',
        });
        await sink.flush();
        await _flushAsyncWork();

        expect(requestCount).toBe(2);
        expect(stateChanges).toEqual([
            {
                previousState: 'closed',
                state: 'open',
                reason: 'failure-threshold-reached',
            },
            {
                previousState: 'open',
                state: 'half-open',
                reason: 'cooldown-expired',
            },
            {
                previousState: 'half-open',
                state: 'closed',
                reason: 'half-open-success',
            },
        ]);
        expect(sink.getMetricsSnapshot().circuitState).toBe('closed');

        await sink.shutdown();
    });

    it('supports stop-flush policy and keeps remaining queued events for next flush', async () => {
        const droppedMessages: string[] = [];
        const sentMessages: string[] = [];
        let requestCount = 0;

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 2,
            flushIntervalMs: 1000,
            persistence: {
                loadQueue: () => [
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'error',
                        message: 'q1',
                    },
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'error',
                        message: 'q2',
                    },
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'info',
                        message: 'q3',
                    },
                ],
            },
            resolveFlushFailurePolicy: () => 'stop-flush',
            onDrop: (drop) => {
                droppedMessages.push(drop.event.message);
            },
            fetchLike: async (_url, init) => {
                requestCount += 1;
                if (requestCount === 1) {
                    return { ok: false, status: 500 };
                }

                const payload = _parseRequestBody<Array<{ message: string }> | { message?: string }>(init.body, []);
                if (Array.isArray(payload)) {
                    for (const item of payload) {
                        sentMessages.push(item.message);
                    }
                } else if (payload.message != null) {
                    sentMessages.push(payload.message);
                }

                return { ok: true, status: 200 };
            },
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(droppedMessages).toEqual(['q1', 'q2']);
        expect(sink.getQueueSize()).toBe(1);

        await sink.flush();
        await _flushAsyncWork();

        expect(sentMessages).toContain('q3');
        await sink.shutdown();
    });

    it('supports requeue-and-stop policy without dropping failed batch events', async () => {
        const droppedMessages: string[] = [];
        const flushOutcomes: Array<{ failedEvents: number; deferredEvents: number; abortedByPolicy: boolean }> = [];

        const sink = createHttpLogSink({
            url: 'https://logs.example.com/events',
            batchSize: 2,
            flushIntervalMs: 1000,
            persistence: {
                loadQueue: () => [
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'error',
                        message: 'r1',
                    },
                    {
                        timestamp: '2026-01-01T00:00:00.000Z',
                        level: 'error',
                        message: 'r2',
                    },
                ],
            },
            resolveFlushFailurePolicy: () => 'requeue-and-stop',
            onDrop: (drop) => {
                droppedMessages.push(drop.event.message);
            },
            onFlushOutcome: (outcome) => {
                flushOutcomes.push({
                    failedEvents: outcome.failedEvents,
                    deferredEvents: outcome.deferredEvents,
                    abortedByPolicy: outcome.abortedByPolicy,
                });
            },
            fetchLike: async () => ({
                ok: false,
                status: 500,
            }),
        });

        await _flushAsyncWork();
        await _flushAsyncWork();

        expect(droppedMessages).toEqual([]);
        expect(sink.getQueueSize()).toBe(2);
        expect(flushOutcomes.length).toBeGreaterThan(0);
        expect(flushOutcomes[0]).toMatchObject({
            failedEvents: 0,
            deferredEvents: 2,
            abortedByPolicy: true,
        });

        await sink.shutdown();
    });
});

describe('createNoopLogSink', () => {
    it('does not throw while emitting', () => {
        const sink = createNoopLogSink();

        expect(() =>
            sink.emit({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'hello',
            })
        ).not.toThrow();
    });
});

describe('createProviderLogSink', () => {
    it('maps and emits provider payloads', () => {
        const payloads: Array<Record<string, unknown>> = [];
        const sink = createProviderLogSink({
            mapEvent: (event) => ({
                text: event.message,
                level: event.level,
            }),
            emitPayload: (payload) => {
                payloads.push(payload);
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'info',
            message: 'provider event',
        });

        expect(payloads).toEqual([
            {
                text: 'provider event',
                level: 'info',
            },
        ]);
    });

    it('captures sync mapper errors via onError', () => {
        const errors: unknown[] = [];
        const sink = createProviderLogSink({
            mapEvent: () => {
                throw new Error('map failed');
            },
            emitPayload: () => {
                // not called
            },
            onError: (error) => {
                errors.push(error);
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'map issue',
        });

        expect(errors).toHaveLength(1);
    });

    it('captures async emit errors via onError', async () => {
        const errors: unknown[] = [];
        const sink = createProviderLogSink({
            mapEvent: (event) => ({ message: event.message }),
            emitPayload: async () => {
                throw new Error('emit failed');
            },
            onError: (error) => {
                errors.push(error);
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'error',
            message: 'emit issue',
        });

        await _flushAsyncWork();
        expect(errors).toHaveLength(1);
    });

    it('skips emit when payload validation fails', () => {
        let emitCalls = 0;
        let validationCalls = 0;

        const sink = createProviderLogSink({
            mapEvent: (event) => ({ message: event.message }),
            validatePayload: () => false,
            onValidationError: () => {
                validationCalls += 1;
            },
            emitPayload: () => {
                emitCalls += 1;
            },
        });

        sink.emit({
            timestamp: '2026-01-01T00:00:00.000Z',
            level: 'warn',
            message: 'invalid provider payload',
        });

        expect(validationCalls).toBe(1);
        expect(emitCalls).toBe(0);
    });
});

describe('provider mappers', () => {
    const baseEvent: LoggerEvent = {
        timestamp: '2026-01-01T00:00:00.000Z',
        level: 'error',
        message: 'failed request',
        context: { requestId: 'req-1' },
        data: { endpoint: '/checkout' },
        error: {
            name: 'AppError',
            message: 'Boom',
            timestamp: '2026-01-01T00:00:00.000Z',
            code: 'E_APP',
        },
    };

    it('maps to Datadog shape', () => {
        const payload = toDatadogLogEvent(baseEvent, {
            service: 'billing-api',
            env: 'prod',
            source: 'node',
            version: '1.0.0',
        });

        expect(payload).toMatchObject({
            message: 'failed request',
            status: 'error',
            service: 'billing-api',
            env: 'prod',
            ddsource: 'node',
            version: '1.0.0',
        });
    });

    it('maps to ELK document shape', () => {
        const payload = toElkLogDocument(baseEvent, {
            index: 'app-logs-2026.01.01',
        });

        expect(payload).toMatchObject({
            '@timestamp': '2026-01-01T00:00:00.000Z',
            message: 'failed request',
            _index: 'app-logs-2026.01.01',
            log: {
                level: 'error',
            },
        });
    });

    it('maps to OpenTelemetry-style log record shape', () => {
        const payload = toOpenTelemetryLogRecord(baseEvent, {
            scopeName: 'billing-api',
            resource: { 'service.name': 'billing-api' },
        });

        expect(payload).toMatchObject({
            severityText: 'ERROR',
            severityNumber: 17,
            body: 'failed request',
            scope: {
                name: 'billing-api',
            },
            resource: {
                'service.name': 'billing-api',
            },
        });
    });

    it('validates Datadog payload essentials', () => {
        const payload = toDatadogLogEvent(baseEvent);
        expect(isDatadogLogPayload(payload)).toBe(true);
        expect(isDatadogLogPayload({ message: 'x' })).toBe(false);
    });

    it('validates ELK document essentials', () => {
        const payload = toElkLogDocument(baseEvent);
        expect(isElkLogDocument(payload)).toBe(true);
        expect(isElkLogDocument({ message: 'x' })).toBe(false);
    });

    it('validates OpenTelemetry log record essentials', () => {
        const payload = toOpenTelemetryLogRecord(baseEvent);
        expect(isOpenTelemetryLogRecord(payload)).toBe(true);
        expect(isOpenTelemetryLogRecord({ body: 'x' })).toBe(false);
    });
});

describe('provider sink presets', () => {
    const sampleEvent: LoggerEvent = {
        timestamp: '2026-01-01T00:00:00.000Z',
        level: 'info',
        message: 'preset event',
    };

    it('creates Datadog preset sink with default validation', () => {
        const payloads: Array<Record<string, unknown>> = [];
        const sink = createDatadogProviderLogSink({
            emitPayload: (payload) => {
                payloads.push(payload);
            },
        });

        sink.emit(sampleEvent);
        expect(payloads).toHaveLength(1);
        expect(payloads[0]?.status).toBe('info');
    });

    it('creates ELK preset sink with default validation', () => {
        const payloads: Array<Record<string, unknown>> = [];
        const sink = createElkProviderLogSink({
            emitPayload: (payload) => {
                payloads.push(payload);
            },
        });

        sink.emit(sampleEvent);
        expect(payloads).toHaveLength(1);
        expect(payloads[0]?.['@timestamp']).toBe('2026-01-01T00:00:00.000Z');
    });

    it('creates OpenTelemetry preset sink with default validation', () => {
        const payloads: Array<Record<string, unknown>> = [];
        const sink = createOpenTelemetryProviderLogSink({
            emitPayload: (payload) => {
                payloads.push(payload);
            },
        });

        sink.emit(sampleEvent);
        expect(payloads).toHaveLength(1);
        expect(payloads[0]?.severityText).toBe('INFO');
    });
});

describe('redactLogPayload', () => {
    it('redacts sensitive keys by default', () => {
        const redacted = redactLogPayload({
            password: '1234',
            nested: {
                token: 'secret-token',
                safe: 'ok',
            },
        });

        expect(redacted).toEqual({
            password: '[REDACTED]',
            nested: {
                token: '[REDACTED]',
                safe: 'ok',
            },
        });
    });

    it('redacts configured paths', () => {
        const redacted = redactLogPayload(
            {
                auth: {
                    headers: {
                        authorization: 'Bearer abc',
                    },
                },
            },
            { paths: ['auth.headers.authorization'] }
        );

        expect(redacted).toEqual({
            auth: {
                headers: {
                    authorization: '[REDACTED]',
                },
            },
        });
    });

    it('supports custom key matcher', () => {
        const redacted = redactLogPayload(
            {
                credentials: {
                    passcode: '1111',
                    pin: '2222',
                },
            },
            {
                keyMatcher: (key) => key === 'passcode' || key === 'pin',
            }
        );

        expect(redacted).toEqual({
            credentials: {
                passcode: '[REDACTED]',
                pin: '[REDACTED]',
            },
        });
    });

    it('returns original payload when redaction is disabled', () => {
        const payload = {
            password: '1234',
            nested: { token: 'abc' },
        };

        expect(redactLogPayload(payload, { enabled: false })).toBe(payload);
    });
});

describe('createLogger', () => {
    it('does not throw with default no-op sink', () => {
        const logger = createLogger();

        expect(() => logger.info('started')).not.toThrow();
    });

    it('respects minimum log level filtering', () => {
        const events: LoggerEvent[] = [];
        const sink: LogSink = {
            emit(event: LoggerEvent): void {
                events.push(event);
            },
        };

        const logger = createLogger({
            minLevel: 'warn',
            sink,
        });

        logger.info('ignored');
        logger.warn('kept');

        expect(events).toHaveLength(1);
        expect(events[0]?.level).toBe('warn');
        expect(events[0]?.message).toBe('kept');
    });

    it('normalizes unknown errors and redacts sensitive fields', () => {
        const events: LoggerEvent[] = [];
        const sink: LogSink = {
            emit(event: LoggerEvent): void {
                events.push(event);
            },
        };

        const logger = createLogger({
            sink,
            redaction: {
                keys: ['password'],
            },
        });

        logger.error('request failed', {
            error: new AppError('Boom', {
                context: {
                    password: 'my-secret',
                },
            }),
            context: {
                operation: 'sign-in',
            },
        });

        expect(events).toHaveLength(1);
        expect(events[0]?.error?.message).toBe('Boom');
        expect(events[0]?.error?.context).toEqual({
            password: '[REDACTED]',
        });
        expect(events[0]?.context).toEqual({
            operation: 'sign-in',
        });
    });

    it('swallows sink errors to keep app flows safe', () => {
        const logger = createLogger({
            sink: {
                emit(): void {
                    throw new Error('sink failure');
                },
            },
        });

        expect(() => logger.error('still safe')).not.toThrow();
    });
});

describe('logUnknownError', () => {
    it('logs unknown errors through logger.error', () => {
        const events: LoggerEvent[] = [];
        const sink: LogSink = {
            emit(event: LoggerEvent): void {
                events.push(event);
            },
        };

        const logger = createLogger({ sink });
        logUnknownError(logger, 'raw failure', 'Unhandled API error', {
            requestId: 'req-99',
        });

        expect(events).toHaveLength(1);
        expect(events[0]?.level).toBe('error');
        expect(events[0]?.message).toBe('Unhandled API error');
        expect(events[0]?.error?.message).toBe('raw failure');
        expect(events[0]?.context).toEqual({ requestId: 'req-99' });
    });
});

async function _flushAsyncWork(): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
}

async function _waitMs(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

function _parseRequestBody<T>(body: string | Uint8Array | ArrayBuffer | undefined, fallback: T): T {
    try {
        const text = _decodeRequestBody(body);
        if (text.length === 0) return fallback;
        return JSON.parse(text) as T;
    } catch {
        return fallback;
    }
}

function _decodeRequestBody(body: string | Uint8Array | ArrayBuffer | undefined): string {
    if (typeof body === 'string') return body;
    if (body instanceof Uint8Array) {
        return new TextDecoder().decode(body);
    }
    if (body instanceof ArrayBuffer) {
        return new TextDecoder().decode(new Uint8Array(body));
    }
    return '';
}
