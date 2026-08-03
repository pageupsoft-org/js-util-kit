import type { ErrorContext } from './error-envelope.js';
import { AppError } from './app-error.js';

export interface ValidationErrorOptions {
    readonly code?: string;
    readonly context?: ErrorContext;
    readonly cause?: unknown;
}

/**
 * Represents a validation-specific application error.
 *
 * @param message - The validation failure message.
 * @param options - Optional code, context, and cause metadata.
 * @returns A configured `ValidationError` instance.
 *
 * @example
 * new ValidationError('Email is invalid', { code: 'VALIDATION_EMAIL' });
 */
export class ValidationError extends AppError {
    public constructor(message: string, options: ValidationErrorOptions = {}) {
        super(message, {
            ...options,
            name: 'ValidationError',
            code: options.code ?? 'VALIDATION_ERROR',
        });
    }
}
