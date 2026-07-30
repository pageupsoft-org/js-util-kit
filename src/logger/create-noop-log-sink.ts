import type { LogSink, LoggerEvent } from './logger-types.js';

/**
 * Creates a sink that intentionally discards all log events.
 *
 * @returns A log sink that performs no side effects.
 *
 * @example
 * const sink = createNoopLogSink();
 * sink.emit({ timestamp: '2026-01-01T00:00:00.000Z', level: 'info', message: 'hello' });
 */
export function createNoopLogSink(): LogSink {
    return {
        emit(_event: LoggerEvent): void {
            // Intentionally no-op to provide a side-effect free default sink.
        },
    };
}
