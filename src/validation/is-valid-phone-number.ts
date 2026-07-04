/**
 * Returns `true` when the value matches the selected phone-number format.
 *
 * Supported formats:
 * - `international` (default): optional leading `+` with common separators.
 * - `e164`: strict E.164 format (`+` plus up to 15 digits).
 * - `national`: digits with common separators and no leading `+` requirement.
 *
 * @param value - The phone number to validate. Returns `false` for null or undefined.
 * @param format - The expected format. Defaults to `international`.
 * @returns `true` when the value matches the selected format; otherwise `false`.
 *
 * @example
 * isValidPhoneNumber('+1 (415) 555-2671'); // => true
 */
export function isValidPhoneNumber(
    value: string | null | undefined,
    format: 'international' | 'e164' | 'national' = 'international'
): boolean {
    if (value == null) return false;

    const phone = value.trim();
    if (phone.length === 0) return false;

    if (format === 'e164') {
        return /^\+[1-9]\d{1,14}$/.test(phone);
    }

    if (format === 'national') {
        const hasAllowedChars = /^[0-9().\s-]+$/.test(phone);
        const digitCount = phone.replace(/\D/g, '').length;
        return hasAllowedChars && digitCount >= 7 && digitCount <= 15;
    }

    const hasAllowedChars = /^\+?[0-9().\s-]+$/.test(phone);
    const digitCount = phone.replace(/\D/g, '').length;

    return hasAllowedChars && digitCount >= 7 && digitCount <= 15;
}