import type { CreateOpenTelemetryProviderLogSinkOptions, LogSink } from './logger-types.js';
import { createProviderLogSink } from './create-provider-log-sink.js';
import { isOpenTelemetryLogRecord } from './is-opentelemetry-log-record.js';
import { toOpenTelemetryLogRecord } from './to-opentelemetry-log-record.js';

/**
 * Creates an OpenTelemetry-oriented provider sink with default schema validation.
 *
 * @param options - OpenTelemetry mapping and emission options.
 * @returns A provider sink configured for OpenTelemetry-style records.
 *
 * @example
 * const sink = createOpenTelemetryProviderLogSink({
 *   emitPayload: (payload) => otelLogger.emit(payload),
 * });
 */
export function createOpenTelemetryProviderLogSink(
    options: CreateOpenTelemetryProviderLogSinkOptions
): LogSink {
    return createProviderLogSink({
        mapEvent: (event) => toOpenTelemetryLogRecord(event, options.mapper),
        emitPayload: options.emitPayload,
        validatePayload: options.validatePayload ?? isOpenTelemetryLogRecord,
        ...(options.onValidationError !== undefined ? { onValidationError: options.onValidationError } : {}),
        ...(options.onError !== undefined ? { onError: options.onError } : {}),
    });
}
