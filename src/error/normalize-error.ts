import type { ErrorContext, ErrorEnvelope, NormalizeErrorOptions } from './error-envelope.js';
import { isErrorEnvelope } from './is-error-envelope.js';

interface ErrorLike {
    readonly name?: unknown;
    readonly message?: unknown;
    readonly stack?: unknown;
    readonly code?: unknown;
    readonly cause?: unknown;
    readonly context?: unknown;
}

/**
 * Normalizes unknown values into a stable `ErrorEnvelope` shape.
 *
 * @param value - The unknown error-like value to normalize.
 * @param options - Optional normalization settings.
 * @returns A normalized error envelope.
 *
 * @example
 * normalizeError(new Error('Something failed'));
 */
export function normalizeError(value: unknown, options: NormalizeErrorOptions = {}): ErrorEnvelope {
    const includeStack = options.includeStack ?? true;
    const maxCauseDepth = options.maxCauseDepth ?? 3;
    const seen = new WeakSet<object>();
    const timestamp = new Date().toISOString();

    const envelope = _normalizeErrorRecursive(value, {
        includeStack,
        maxCauseDepth,
        currentDepth: 0,
        defaultMessage: options.defaultMessage ?? 'Unknown error.',
        seen,
        timestamp,
    });

    if (options.context == null) return envelope;

    return {
        ...envelope,
        context: {
            ...(envelope.context ?? {}),
            ...options.context,
        },
    };
}

interface RecursiveNormalizeOptions {
    readonly includeStack: boolean;
    readonly maxCauseDepth: number;
    readonly currentDepth: number;
    readonly defaultMessage: string;
    readonly seen: WeakSet<object>;
    readonly timestamp: string;
}

function _normalizeErrorRecursive(value: unknown, options: RecursiveNormalizeOptions): ErrorEnvelope {
    if (isErrorEnvelope(value)) {
        if (options.seen.has(value)) {
            return {
                name: 'Error',
                message: 'Circular error reference.',
                timestamp: options.timestamp,
            };
        }
        options.seen.add(value);

        const normalizedCause =
            value.cause == null || options.currentDepth >= options.maxCauseDepth
                ? value.cause
                : _normalizeErrorRecursive(value.cause, {
                      ...options,
                      currentDepth: options.currentDepth + 1,
                  });

        return {
            ...value,
            ...(normalizedCause !== undefined ? { cause: normalizedCause } : {}),
        };
    }

    if (value instanceof Error) {
        return _fromErrorInstance(value, options);
    }

    if (typeof value === 'string') {
        return {
            name: 'Error',
            message: value,
            timestamp: options.timestamp,
        };
    }

    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return {
            name: 'Error',
            message: String(value),
            timestamp: options.timestamp,
        };
    }

    if (typeof value === 'object' && value != null) {
        if (options.seen.has(value)) {
            return {
                name: 'Error',
                message: 'Circular error reference.',
                timestamp: options.timestamp,
            };
        }
        options.seen.add(value);

        return _fromErrorLikeObject(value as ErrorLike, options);
    }

    return {
        name: 'Error',
        message: options.defaultMessage,
        timestamp: options.timestamp,
    };
}

function _fromErrorInstance(error: Error, options: RecursiveNormalizeOptions): ErrorEnvelope {
    const stack = options.includeStack && typeof error.stack === 'string' ? error.stack : undefined;
    const code = _normalizeCode((error as ErrorLike).code);
    const context = _normalizeContext((error as ErrorLike).context);
    const cause =
        (error as ErrorLike).cause == null || options.currentDepth >= options.maxCauseDepth
            ? undefined
            : _normalizeErrorRecursive((error as ErrorLike).cause, {
                  ...options,
                  currentDepth: options.currentDepth + 1,
              });

    return {
        name: error.name || 'Error',
        message: error.message || options.defaultMessage,
        timestamp: options.timestamp,
        ...(stack !== undefined ? { stack } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(cause !== undefined ? { cause } : {}),
        ...(context !== undefined ? { context } : {}),
    };
}

function _fromErrorLikeObject(errorLike: ErrorLike, options: RecursiveNormalizeOptions): ErrorEnvelope {
    const stack = options.includeStack && typeof errorLike.stack === 'string' ? errorLike.stack : undefined;
    const code = _normalizeCode(errorLike.code);
    const context = _normalizeContext(errorLike.context);
    const cause =
        errorLike.cause == null || options.currentDepth >= options.maxCauseDepth
            ? undefined
            : _normalizeErrorRecursive(errorLike.cause, {
                  ...options,
                  currentDepth: options.currentDepth + 1,
              });

    const message =
        typeof errorLike.message === 'string' && errorLike.message.length > 0
            ? errorLike.message
            : options.defaultMessage;

    return {
        name: typeof errorLike.name === 'string' && errorLike.name.length > 0 ? errorLike.name : 'Error',
        message,
        timestamp: options.timestamp,
        ...(stack !== undefined ? { stack } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(cause !== undefined ? { cause } : {}),
        ...(context !== undefined ? { context } : {}),
    };
}

function _normalizeCode(value: unknown): string | undefined {
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return undefined;
}

function _normalizeContext(value: unknown): ErrorContext | undefined {
    if (typeof value !== 'object' || value == null || Array.isArray(value)) return undefined;
    return { ...(value as Record<string, unknown>) };
}
