export interface ErrorContext {
    readonly [key: string]: unknown;
}

export interface ErrorEnvelope {
    readonly name: string;
    readonly message: string;
    readonly timestamp: string;
    readonly stack?: string;
    readonly code?: string;
    readonly cause?: ErrorEnvelope;
    readonly context?: ErrorContext;
}

export interface NormalizeErrorOptions {
    readonly defaultMessage?: string;
    readonly includeStack?: boolean;
    readonly context?: ErrorContext;
    readonly maxCauseDepth?: number;
}
