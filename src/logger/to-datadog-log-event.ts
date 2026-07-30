import type { DatadogLogMapperOptions, LoggerEvent } from './logger-types.js';

/**
 * Maps a logger event into a Datadog-friendly log payload shape.
 *
 * @param event - The structured logger event.
 * @param options - Optional Datadog metadata fields.
 * @returns A Datadog-style log payload object.
 *
 * @example
 * toDatadogLogEvent(event, { service: 'billing-api', env: 'prod' });
 */
export function toDatadogLogEvent(
    event: LoggerEvent,
    options: DatadogLogMapperOptions = {}
): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        message: event.message,
        status: _mapLevelToDatadogStatus(event.level),
        timestamp: event.timestamp,
    };

    if (options.service != null) payload.service = options.service;
    if (options.env != null) payload.env = options.env;
    if (options.version != null) payload.version = options.version;
    if (options.source != null) payload.ddsource = options.source;
    if (event.context != null) payload.context = event.context;
    if (event.data !== undefined) payload.data = event.data;
    if (event.error != null) payload.error = event.error;

    return payload;
}

function _mapLevelToDatadogStatus(level: LoggerEvent['level']): string {
    switch (level) {
        case 'trace':
        case 'debug':
            return 'debug';
        case 'info':
            return 'info';
        case 'warn':
            return 'warn';
        case 'fatal':
            return 'critical';
        case 'error':
            return 'error';
        default:
            return 'info';
    }
}
