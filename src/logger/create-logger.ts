import { normalizeError } from '../error/normalize-error.js';
import type { ErrorEnvelope } from '../error/error-envelope.js';
import { createNoopLogSink } from './create-noop-log-sink.js';
import type {
    CreateLoggerOptions,
    LogCallOptions,
    LogLevel,
    Logger,
    LoggerEvent,
    RedactionOptions,
} from './logger-types.js';
import { redactLogPayload } from './redact-log-payload.js';
import { shouldLogLevel } from './should-log-level.js';

/**
 * Creates a structured logger with level filtering, redaction, and no-op default sink.
 *
 * @param options - Optional logger configuration.
 * @returns A logger instance with standard level methods.
 *
 * @example
 * const logger = createLogger();
 * logger.info('App started');
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
    const minimumLevel = options.minLevel ?? 'trace';
    const sink = options.sink ?? createNoopLogSink();
    const baseContext = options.baseContext ?? {};
    const redaction = options.redaction ?? {};

    const logAtLevel = (level: LogLevel, message: string, callOptions: LogCallOptions = {}): void => {
        if (!shouldLogLevel(level, minimumLevel)) return;

        const context = _mergeContext(baseContext, callOptions.context);
        const normalizedError = _normalizeOptionalError(callOptions.error);
        const redactedContext = _redactOptionalContext(context, redaction);
        const redactedData = redactLogPayload(callOptions.data, redaction);
        const redactedError =
            normalizedError == null ? undefined : (redactLogPayload(normalizedError, redaction) as ErrorEnvelope);

        const event: LoggerEvent = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(redactedContext !== undefined ? { context: redactedContext } : {}),
            ...(redactedData !== undefined ? { data: redactedData } : {}),
            ...(redactedError !== undefined ? { error: redactedError } : {}),
        };

        try {
            sink.emit(event);
        } catch {
            // Logging should never crash application flows.
        }
    };

    return {
        trace(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('trace', message, callOptions);
        },
        debug(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('debug', message, callOptions);
        },
        info(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('info', message, callOptions);
        },
        warn(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('warn', message, callOptions);
        },
        error(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('error', message, callOptions);
        },
        fatal(message: string, callOptions?: LogCallOptions): void {
            logAtLevel('fatal', message, callOptions);
        },
    };
}

function _mergeContext(
    baseContext: Record<string, unknown>,
    callContext: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
    if (Object.keys(baseContext).length === 0 && callContext == null) return undefined;

    return {
        ...baseContext,
        ...(callContext ?? {}),
    };
}

function _normalizeOptionalError(value: unknown): ErrorEnvelope | undefined {
    if (value == null) return undefined;
    return normalizeError(value);
}

function _redactOptionalContext(
    context: Record<string, unknown> | undefined,
    redaction: RedactionOptions
): Record<string, unknown> | undefined {
    if (context == null) return undefined;
    return redactLogPayload(context, redaction) as Record<string, unknown>;
}
