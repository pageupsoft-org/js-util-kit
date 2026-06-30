/** Coerces a Date | string | null | undefined to a Date.
 * Returns null for null, undefined, or any input whose parsed timestamp is NaN.
 */
export function _parseDate(value: Date | string | null | undefined): Date | null {
    if (value == null) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/** Zero-pads a number to two digits. */
export function _pad(n: number): string {
    return String(n).padStart(2, '0');
}

/**
 * Replaces format tokens in a string with local-time values from a Date.
 * Supported tokens: `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`.
 */
export function _applyFormat(d: Date, fmt: string): string {
    return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => {
        switch (token) {
            case 'YYYY': return String(d.getFullYear());
            case 'MM':   return _pad(d.getMonth() + 1);
            case 'DD':   return _pad(d.getDate());
            case 'HH':   return _pad(d.getHours());
            case 'mm':   return _pad(d.getMinutes());
            case 'ss':   return _pad(d.getSeconds());
            default:     return token;
        }
    });
}
