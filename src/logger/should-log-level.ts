import type { LogLevel } from './logger-types.js';

const _levelPriority: Readonly<Record<LogLevel, number>> = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};

/**
 * Determines whether a log level should be emitted for the configured minimum level.
 *
 * @param level - The candidate log level to evaluate.
 * @param minimumLevel - The minimum configured log level.
 * @returns `true` when the candidate level is high enough; otherwise `false`.
 *
 * @example
 * shouldLogLevel('warn', 'info'); // => true
 */
export function shouldLogLevel(level: LogLevel, minimumLevel: LogLevel): boolean {
    return _levelPriority[level] >= _levelPriority[minimumLevel];
}
