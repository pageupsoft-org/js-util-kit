import type { ErrorContext, ErrorEnvelope } from './error-envelope.js';

export interface AppErrorOptions {
    readonly name?: string;
    readonly code?: string;
    readonly context?: ErrorContext;
    readonly cause?: unknown;
}

/**
 * Represents an application-level error with optional code and structured context.
 *
 * @param message - The human-readable error message.
 * @param options - Optional metadata such as name, code, context, and cause.
 * @returns A configured `AppError` instance.
 *
 * @example
 * new AppError('Payment failed', { code: 'PAYMENT_FAILED' });
 */
export class AppError extends Error {
    public readonly code?: string;
    public readonly context?: ErrorContext;

    public constructor(message: string, options: AppErrorOptions = {}) {
        super(message, options.cause == null ? undefined : { cause: options.cause });
        this.name = options.name ?? 'AppError';
        if (options.code !== undefined) {
            this.code = options.code;
        }
        if (options.context !== undefined) {
            this.context = options.context;
        }
    }

    public toEnvelope(timestamp: string): ErrorEnvelope {
        return {
            name: this.name,
            message: this.message,
            timestamp,
            ...(this.stack !== undefined ? { stack: this.stack } : {}),
            ...(this.code !== undefined ? { code: this.code } : {}),
            ...(this.context !== undefined ? { context: this.context } : {}),
        };
    }
}
