import type { ErrorContext } from './error-envelope.js';
import { AppError } from './app-error.js';

export interface NotFoundErrorOptions {
    readonly code?: string;
    readonly context?: ErrorContext;
    readonly cause?: unknown;
}

/**
 * Represents a resource-not-found application error.
 *
 * @param message - The missing resource message.
 * @param options - Optional code, context, and cause metadata.
 * @returns A configured `NotFoundError` instance.
 *
 * @example
 * new NotFoundError('User was not found', { code: 'USER_NOT_FOUND' });
 */
export class NotFoundError extends AppError {
    public constructor(message: string, options: NotFoundErrorOptions = {}) {
        super(message, {
            ...options,
            name: 'NotFoundError',
            code: options.code ?? 'NOT_FOUND',
        });
    }
}
