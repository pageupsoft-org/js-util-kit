import type { Logger } from './logger-types.js';

/**
 * Logs an unknown error value through the provided logger with optional context.
 *
 * @param logger - The logger instance.
 * @param error - The unknown error value.
 * @param message - The log message to emit.
 * @param context - Optional contextual metadata.
 * @returns Nothing.
 *
 * @example
 * logUnknownError(logger, error, 'Unhandled API error', { requestId: 'req-1' });
 */
export function logUnknownError(
    logger: Logger,
    error: unknown,
    message = 'Unhandled error.',
    context?: Record<string, unknown>
): void {
    logger.error(message, {
        error,
        ...(context !== undefined ? { context } : {}),
    });
}
