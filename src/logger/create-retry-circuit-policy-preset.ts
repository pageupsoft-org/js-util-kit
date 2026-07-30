import type {
    HttpRetryCircuitPolicyPreset,
    HttpRetryCircuitPolicyPresetName,
} from './logger-types.js';

/**
 * Creates a predefined retry/circuit policy preset for HTTP transport resilience.
 *
 * @param preset - Preset name to resolve (`conservative`, `balanced`, or `aggressive`).
 * @returns A reusable policy object that can be spread into `createHttpLogSink` options.
 *
 * @example
 * createRetryCircuitPolicyPreset('conservative');
 * // => { maxRetries: 1, retryDelayMs: 200, ... }
 *
 * @example
 * createRetryCircuitPolicyPreset();
 * // => balanced preset
 */
export function createRetryCircuitPolicyPreset(
    preset: HttpRetryCircuitPolicyPresetName = 'balanced'
): HttpRetryCircuitPolicyPreset {
    if (preset === 'conservative') {
        return {
            maxRetries: 1,
            retryDelayMs: 200,
            retryBackoffMultiplier: 2,
            maxRetryDelayMs: 2000,
            retryJitterRatio: 0.1,
            retryBudget: {
                enabled: true,
                maxRetriesPerBatch: 1,
                maxRetriesPerFlush: 3,
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 2,
                cooldownMs: 15000,
                halfOpenMaxRequests: 1,
            },
        };
    }

    if (preset === 'aggressive') {
        return {
            maxRetries: 4,
            retryDelayMs: 100,
            retryBackoffMultiplier: 1.8,
            maxRetryDelayMs: 10000,
            retryJitterRatio: 0.25,
            retryBudget: {
                enabled: true,
                maxRetriesPerBatch: 4,
                maxRetriesPerFlush: 12,
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                cooldownMs: 5000,
                halfOpenMaxRequests: 3,
            },
        };
    }

    return {
        maxRetries: 2,
        retryDelayMs: 150,
        retryBackoffMultiplier: 2,
        maxRetryDelayMs: 5000,
        retryJitterRatio: 0.2,
        retryBudget: {
            enabled: true,
            maxRetriesPerBatch: 2,
            maxRetriesPerFlush: 6,
        },
        circuitBreaker: {
            enabled: true,
            failureThreshold: 3,
            cooldownMs: 10000,
            halfOpenMaxRequests: 2,
        },
    };
}