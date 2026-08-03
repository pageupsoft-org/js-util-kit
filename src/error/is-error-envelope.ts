import type { ErrorEnvelope } from './error-envelope.js';

/**
 * Determines whether a value conforms to the `ErrorEnvelope` shape.
 *
 * @param value - The value to validate.
 * @returns `true` when the value looks like an error envelope; otherwise `false`.
 *
 * @example
 * isErrorEnvelope({ name: 'AppError', message: 'Failed', timestamp: '2026-01-01T00:00:00.000Z' }); // => true
 */
export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
    if (typeof value !== 'object' || value == null) return false;

    const envelope = value as Partial<ErrorEnvelope>;
    return (
        typeof envelope.name === 'string' &&
        typeof envelope.message === 'string' &&
        typeof envelope.timestamp === 'string'
    );
}
