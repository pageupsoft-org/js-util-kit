import type { CreateDatadogProviderLogSinkOptions, LogSink } from './logger-types.js';
import { createProviderLogSink } from './create-provider-log-sink.js';
import { isDatadogLogPayload } from './is-datadog-log-payload.js';
import { toDatadogLogEvent } from './to-datadog-log-event.js';

/**
 * Creates a Datadog-oriented provider sink with default schema validation.
 *
 * @param options - Datadog mapping and emission options.
 * @returns A provider sink configured for Datadog payloads.
 *
 * @example
 * const sink = createDatadogProviderLogSink({
 *   emitPayload: (payload) => datadogClient.send(payload),
 * });
 */
export function createDatadogProviderLogSink(options: CreateDatadogProviderLogSinkOptions): LogSink {
    return createProviderLogSink({
        mapEvent: (event) => toDatadogLogEvent(event, options.mapper),
        emitPayload: options.emitPayload,
        validatePayload: options.validatePayload ?? isDatadogLogPayload,
        ...(options.onValidationError !== undefined ? { onValidationError: options.onValidationError } : {}),
        ...(options.onError !== undefined ? { onError: options.onError } : {}),
    });
}
