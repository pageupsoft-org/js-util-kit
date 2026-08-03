import type { ElkLogMapperOptions, LoggerEvent } from './logger-types.js';

/**
 * Maps a logger event into an ELK-friendly document shape.
 *
 * @param event - The structured logger event.
 * @param options - Optional ELK document metadata.
 * @returns An ELK-style log document object.
 *
 * @example
 * toElkLogDocument(event, { index: 'app-logs-2026.07.29' });
 */
export function toElkLogDocument(
    event: LoggerEvent,
    options: ElkLogMapperOptions = {}
): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        '@timestamp': event.timestamp,
        message: event.message,
        log: {
            level: event.level,
        },
    };

    if (options.index != null) payload._index = options.index;
    if (event.context != null) payload.labels = event.context;
    if (event.data !== undefined) payload.data = event.data;
    if (event.error != null) payload.error = event.error;

    return payload;
}
