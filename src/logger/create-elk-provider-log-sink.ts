import type { CreateElkProviderLogSinkOptions, LogSink } from './logger-types.js';
import { createProviderLogSink } from './create-provider-log-sink.js';
import { isElkLogDocument } from './is-elk-log-document.js';
import { toElkLogDocument } from './to-elk-log-document.js';

/**
 * Creates an ELK-oriented provider sink with default schema validation.
 *
 * @param options - ELK mapping and emission options.
 * @returns A provider sink configured for ELK documents.
 *
 * @example
 * const sink = createElkProviderLogSink({
 *   emitPayload: (payload) => elkClient.index(payload),
 * });
 */
export function createElkProviderLogSink(options: CreateElkProviderLogSinkOptions): LogSink {
    return createProviderLogSink({
        mapEvent: (event) => toElkLogDocument(event, options.mapper),
        emitPayload: options.emitPayload,
        validatePayload: options.validatePayload ?? isElkLogDocument,
        ...(options.onValidationError !== undefined ? { onValidationError: options.onValidationError } : {}),
        ...(options.onError !== undefined ? { onError: options.onError } : {}),
    });
}
