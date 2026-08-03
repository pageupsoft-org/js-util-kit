import type { ErrorContext, ErrorEnvelope } from './error-envelope.js';

/**
 * Returns a new envelope by merging additional structured context.
 *
 * @param envelope - The base error envelope.
 * @param context - Additional context values to merge.
 * @returns A new envelope with merged context.
 *
 * @example
 * enrichErrorEnvelope(envelope, { requestId: 'req-1' });
 */
export function enrichErrorEnvelope(envelope: ErrorEnvelope, context: ErrorContext): ErrorEnvelope {
    return {
        ...envelope,
        context: {
            ...(envelope.context ?? {}),
            ...context,
        },
    };
}
