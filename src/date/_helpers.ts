/** Coerces a Date | string | null | undefined to a Date.
 * Returns null for null, undefined, or any input whose parsed timestamp is NaN.
 */
export function _parseDate(value: Date | string | null | undefined): Date | null {
    if (value == null) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses a date string using a format pattern.
 * Supported tokens: YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, ss, s, A, a
 */
export function _parseDateString(dateStr: string, format: string): Date | null {
    if (!dateStr || !format) return null;

    const formatRegex = format
        .replace(/YYYY/g, '(\\d{4})')
        .replace(/YY/g, '(\\d{2})')
        .replace(/MM/g, '(\\d{2})')
        .replace(/M/g, '(\\d{1,2})')
        .replace(/DD/g, '(\\d{2})')
        .replace(/D/g, '(\\d{1,2})')
        .replace(/HH/g, '(\\d{2})')
        .replace(/H/g, '(\\d{1,2})')
        .replace(/hh/g, '(\\d{2})')
        .replace(/h/g, '(\\d{1,2})')
        .replace(/mm/g, '(\\d{2})')
        .replace(/m/g, '(\\d{1,2})')
        .replace(/ss/g, '(\\d{2})')
        .replace(/s/g, '(\\d{1,2})')
        .replace(/A/g, '(AM|PM)')
        .replace(/a/g, '(am|pm)');

    const regex = new RegExp(`^${formatRegex}$`, 'i');
    const match = dateStr.match(regex);
    if (!match) return null;

    // Extract values based on format tokens in order
    let year: number | undefined;
    let month: number | undefined;
    let day: number | undefined;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let isPM = false;

    const tokens = format.match(/YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g) || [];
    let matchIndex = 1;

    for (const token of tokens) {
        const value = parseInt(match[matchIndex++] || '0', 10);
        switch (token) {
            case 'YYYY': year = value; break;
            case 'YY': year = value + 2000; break; // Assume 2000s
            case 'MM':
            case 'M': month = value - 1; break; // 0-indexed
            case 'DD':
            case 'D': day = value; break;
            case 'HH':
            case 'H': hours = value; break;
            case 'hh':
            case 'h':
                hours = value % 12; // 12-hour format
                break;
            case 'mm':
            case 'm': minutes = value; break;
            case 'ss':
            case 's': seconds = value; break;
            case 'A':
            case 'a': isPM = (match[matchIndex - 1] || '').toUpperCase() === 'PM'; break;
        }
    }

    if (year === undefined || month === undefined || day === undefined) return null;

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    const date = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(date.getTime()) ? null : date;
}

/** Zero-pads a number to two digits. */
export function _pad(n: number): string {
    return String(n).padStart(2, '0');
}

/**
 * Replaces format tokens in a string with local-time values from a Date.
 * Supported tokens: `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A`, `a`
 */
export function _applyFormat(d: Date, fmt: string): string {
    const hours24 = d.getHours();
    const hours12 = hours24 % 12 || 12;
    const isPM = hours24 >= 12;

    return fmt.replace(/YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g, (token) => {
        switch (token) {
            case 'YYYY': return String(d.getFullYear());
            case 'YY': return String(d.getFullYear()).slice(-2);
            case 'MM': return _pad(d.getMonth() + 1);
            case 'M': return String(d.getMonth() + 1);
            case 'DD': return _pad(d.getDate());
            case 'D': return String(d.getDate());
            case 'HH': return _pad(hours24);
            case 'H': return String(hours24);
            case 'hh': return _pad(hours12);
            case 'h': return String(hours12);
            case 'mm': return _pad(d.getMinutes());
            case 'm': return String(d.getMinutes());
            case 'ss': return _pad(d.getSeconds());
            case 's': return String(d.getSeconds());
            case 'A': return isPM ? 'PM' : 'AM';
            case 'a': return isPM ? 'pm' : 'am';
            default: return token;
        }
    });
}
