import type { CreateProviderLogSinkOptions, LogSink, LoggerEvent } from './logger-types.js';

/**
 * Creates a provider adapter sink from mapping and emission callbacks.
 *
 * @param options - Provider mapping and emission callbacks.
 * @returns A log sink that safely adapts logger events to provider payloads.
 *
 * @example
 * const sink = createProviderLogSink({
 *   mapEvent: (event) => ({ message: event.message }),
 *   emitPayload: (payload) => provider.send(payload),
 * });
 */
export function createProviderLogSink<TPayload>(options: CreateProviderLogSinkOptions<TPayload>): LogSink {
    return {
        emit(event: LoggerEvent): void {
            try {
                const payload = options.mapEvent(event);

                if (typeof options.validatePayload === 'function') {
                    const isValid = _safeValidatePayload(options.validatePayload, payload);
                    if (!isValid) {
                        _invokeValidationErrorHandler(options.onValidationError, payload, event);
                        return;
                    }
                }

                const result = options.emitPayload(payload);

                if (_isPromiseLike(result)) {
                    void result.catch((error) => {
                        _invokeErrorHandler(options.onError, error, event);
                    });
                }
            } catch (error) {
                _invokeErrorHandler(options.onError, error, event);
            }
        },
    };
}

function _safeValidatePayload<TPayload>(validator: (payload: TPayload) => boolean, payload: TPayload): boolean {
    try {
        return validator(payload);
    } catch {
        return false;
    }
}

function _isPromiseLike(value: unknown): value is Promise<void> {
    return typeof value === 'object' && value != null && 'then' in value;
}

function _invokeErrorHandler(
    onError: ((error: unknown, event: LoggerEvent) => void) | undefined,
    error: unknown,
    event: LoggerEvent
): void {
    if (typeof onError !== 'function') return;

    try {
        onError(error, event);
    } catch {
        // Provider adapters must never throw to callers.
    }
}

function _invokeValidationErrorHandler<TPayload>(
    onValidationError: ((payload: TPayload, event: LoggerEvent) => void) | undefined,
    payload: TPayload,
    event: LoggerEvent
): void {
    if (typeof onValidationError !== 'function') return;

    try {
        onValidationError(payload, event);
    } catch {
        // Validation callbacks must not break caller flows.
    }
}
