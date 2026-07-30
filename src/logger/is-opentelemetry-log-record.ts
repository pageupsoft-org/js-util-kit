/**
 * Determines whether a payload matches the expected OpenTelemetry log record essentials.
 *
 * @param payload - The candidate payload to validate.
 * @returns `true` when required OpenTelemetry fields are present; otherwise `false`.
 *
 * @example
 * isOpenTelemetryLogRecord({ timestamp: '2026-01-01T00:00:00.000Z', severityText: 'INFO', body: 'hello' });
 */
export function isOpenTelemetryLogRecord(payload: Record<string, unknown>): boolean {
    return (
        typeof payload.timestamp === 'string' &&
        typeof payload.severityText === 'string' &&
        typeof payload.body === 'string'
    );
}
