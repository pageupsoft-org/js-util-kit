import { createRetryCircuitPolicyPreset } from './create-retry-circuit-policy-preset.js';
import type {
    HttpTransportResilienceProfilePreset,
    HttpTransportResilienceProfilePresetName,
} from './logger-types.js';

/**
 * Creates a predefined resilience profile for HTTP transport behavior.
 *
 * @param profile - Profile name to resolve (`availability-first`, `cost-efficient`, or `test-hardened`).
 * @returns A composable preset object for `createHttpLogSink` options.
 *
 * @example
 * createTransportResilienceProfilePreset('availability-first');
 * // => low sampling + strong retries/circuit controls
 *
 * @example
 * createTransportResilienceProfilePreset();
 * // => cost-efficient profile
 */
export function createTransportResilienceProfilePreset(
    profile: HttpTransportResilienceProfilePresetName = 'cost-efficient'
): HttpTransportResilienceProfilePreset {
    if (profile === 'availability-first') {
        return {
            ...createRetryCircuitPolicyPreset('aggressive'),
            requestSamplingPolicy: 'always',
            requestSampleRate: 1,
            timeoutMs: 5000,
            flushIntervalMs: 500,
            batchSize: 10,
            maxQueueSize: 5000,
            chaos: {
                enabled: false,
                probability: 0,
            },
        };
    }

    if (profile === 'test-hardened') {
        return {
            ...createRetryCircuitPolicyPreset('balanced'),
            requestSamplingPolicy: 'always',
            requestSampleRate: 1,
            timeoutMs: 2000,
            flushIntervalMs: 250,
            batchSize: 5,
            maxQueueSize: 1000,
            chaos: {
                enabled: true,
                probability: 0.15,
                forcedStatusCode: 503,
            },
        };
    }

    return {
        ...createRetryCircuitPolicyPreset('conservative'),
        requestSamplingPolicy: 'probabilistic',
        requestSampleRate: 0.5,
        timeoutMs: 3000,
        flushIntervalMs: 1000,
        batchSize: 20,
        maxQueueSize: 2000,
        chaos: {
            enabled: false,
            probability: 0,
        },
    };
}