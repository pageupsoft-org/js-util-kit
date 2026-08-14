import type { LoggerEvent, OpenTelemetryLogMapperOptions } from './logger-types.js';

/**
 * Maps a logger event into an OpenTelemetry-friendly log record shape.
 *
 * @param event - The structured logger event.
 * @param options - Optional OpenTelemetry mapping metadata.
 * @returns An OpenTelemetry-style log record object.
 *
 * @example
 * toOpenTelemetryLogRecord(event, { scopeName: 'billing-api' });
 */
export function toOpenTelemetryLogRecord(
    event: LoggerEvent,
    options: OpenTelemetryLogMapperOptions = {}
): Record<string, unknown> {
    const attributes: Record<string, unknown> = {};

    if (event.context != null) {
        Object.assign(attributes, event.context);
    }

    if (event.data !== undefined) {
        attributes['log.data'] = event.data;
    }

    if (event.error != null) {
        attributes['error.name'] = event.error.name;
        attributes['error.message'] = event.error.message;
        if (event.error.code != null) {
            attributes['error.code'] = event.error.code;
        }
    }

    const payload: Record<string, unknown> = {
        timestamp: event.timestamp,
        severityText: event.level.toUpperCase(),
        severityNumber: _toSeverityNumber(event.level),
        body: event.message,
        attributes,
        scope: {
            name: options.scopeName ?? 'js-util-kit',
        },
    };

    if (options.resource != null) {
        payload.resource = options.resource;
    }

    return payload;
}

function _toSeverityNumber(level: LoggerEvent['level']): number {
    switch (level) {
        case 'trace':
            return 1;
        case 'debug':
            return 5;
        case 'info':
            return 9;
        case 'warn':
            return 13;
        case 'error':
            return 17;
        case 'fatal':
            return 21;
        default:
            return 9;
    }
}
