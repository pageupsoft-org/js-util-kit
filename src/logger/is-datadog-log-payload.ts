/**
 * Determines whether a payload matches the expected Datadog log event essentials.
 *
 * @param payload - The candidate payload to validate.
 * @returns `true` when required Datadog fields are present; otherwise `false`.
 *
 * @example
 * isDatadogLogPayload({ message: 'hello', status: 'info', timestamp: '2026-01-01T00:00:00.000Z' });
 */
export function isDatadogLogPayload(payload: Record<string, unknown>): boolean {
    return (
        typeof payload.message === 'string' &&
        typeof payload.status === 'string' &&
        typeof payload.timestamp === 'string'
    );
}
