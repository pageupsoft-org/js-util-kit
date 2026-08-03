import type {
    ConsoleLogSinkOptions,
    ConsoleLike,
    LogLevel,
    LogSink,
    LoggerEvent,
} from './logger-types.js';

/**
 * Creates a sink that emits logger events to a console-like target.
 *
 * @param options - Optional formatting and console target settings.
 * @returns A log sink that writes events to console methods with graceful fallbacks.
 *
 * @example
 * const sink = createConsoleLogSink({ pretty: true });
 */
export function createConsoleLogSink(options: ConsoleLogSinkOptions = {}): LogSink {
    const consoleTarget = options.consoleLike ?? _getDefaultConsole();
    const pretty = options.pretty ?? false;
    const includeTimestamp = options.includeTimestamp ?? true;

    return {
        emit(event: LoggerEvent): void {
            try {
                const method = _resolveConsoleMethod(event.level, consoleTarget);
                if (typeof method !== 'function') return;

                const args = pretty
                    ? _toPrettyArgs(event, includeTimestamp)
                    : _toStructuredArgs(event, includeTimestamp);
                method(...args);
            } catch {
                // Adapters must never break application execution paths.
            }
        },
    };
}

function _getDefaultConsole(): ConsoleLike {
    if (typeof console === 'undefined') return {};
    return console;
}

function _resolveConsoleMethod(level: LogLevel, target: ConsoleLike): ((...args: unknown[]) => void) | undefined {
    const preferredMethodName = _mapLevelToMethod(level);
    const preferred = target[preferredMethodName];
    if (typeof preferred === 'function') return preferred.bind(target);

    if (typeof target.log === 'function') return target.log.bind(target);
    return undefined;
}

function _mapLevelToMethod(level: LogLevel): keyof ConsoleLike {
    switch (level) {
        case 'fatal':
        case 'error':
            return 'error';
        case 'warn':
            return 'warn';
        case 'info':
            return 'info';
        case 'debug':
            return 'debug';
        case 'trace':
            return 'trace';
        default:
            return 'log';
    }
}

function _toPrettyArgs(event: LoggerEvent, includeTimestamp: boolean): unknown[] {
    const prefixParts = [event.level.toUpperCase()];
    if (includeTimestamp) {
        prefixParts.unshift(event.timestamp);
    }

    const line = `[${prefixParts.join('] [')}] ${event.message}`;
    const details = _buildEventDetails(event);
    return details == null ? [line] : [line, details];
}

function _toStructuredArgs(event: LoggerEvent, includeTimestamp: boolean): unknown[] {
    const details: Record<string, unknown> = {
        level: event.level,
    };

    if (includeTimestamp) {
        details.timestamp = event.timestamp;
    }

    const supplemental = _buildEventDetails(event);
    if (supplemental != null) {
        Object.assign(details, supplemental);
    }

    return [event.message, details];
}

function _buildEventDetails(event: LoggerEvent): Record<string, unknown> | undefined {
    const details: Record<string, unknown> = {};

    if (event.context != null) details.context = event.context;
    if (event.data !== undefined) details.data = event.data;
    if (event.error != null) details.error = event.error;

    return Object.keys(details).length === 0 ? undefined : details;
}
