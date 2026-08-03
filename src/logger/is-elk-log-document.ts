/**
 * Determines whether a payload matches the expected ELK log document essentials.
 *
 * @param payload - The candidate payload to validate.
 * @returns `true` when required ELK fields are present; otherwise `false`.
 *
 * @example
 * isElkLogDocument({ '@timestamp': '2026-01-01T00:00:00.000Z', message: 'hello', log: { level: 'info' } });
 */
export function isElkLogDocument(payload: Record<string, unknown>): boolean {
    if (typeof payload['@timestamp'] !== 'string') return false;
    if (typeof payload.message !== 'string') return false;

    const logValue = payload.log;
    if (typeof logValue !== 'object' || logValue == null) return false;

    const level = (logValue as Record<string, unknown>).level;
    return typeof level === 'string';
}
