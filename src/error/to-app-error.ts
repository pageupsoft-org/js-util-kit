import { AppError } from './app-error.js';
import { normalizeError } from './normalize-error.js';

/**
 * Converts an unknown value into an `AppError` instance.
 *
 * @param value - The unknown value to convert.
 * @returns An `AppError` carrying normalized details.
 *
 * @example
 * toAppError('Something failed');
 */
export function toAppError(value: unknown): AppError {
    if (value instanceof AppError) return value;

    const normalized = normalizeError(value);
    const options = {
        name: normalized.name,
        ...(normalized.code !== undefined ? { code: normalized.code } : {}),
        ...(normalized.context !== undefined ? { context: normalized.context } : {}),
        ...(normalized.cause !== undefined ? { cause: normalized.cause } : {}),
    };

    return new AppError(normalized.message, options);
}
