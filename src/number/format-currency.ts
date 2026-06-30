/**
 * Formats a number as a currency string using the native `Intl.NumberFormat` API.
 *
 * @param value - The numeric value to format. Accepts `null`, `undefined`, or
 *   non-finite numbers.
 * @param currencyCode - An ISO 4217 currency code (e.g. `'USD'`, `'INR'`, `'EUR'`).
 * @param locale - A BCP 47 locale string. Defaults to `'en-US'`.
 * @returns A locale-formatted currency string, or `''` for null, undefined, non-finite
 *   values, or an invalid currency code.
 *
 * @example
 * formatCurrency(1234.56, 'USD');          // => '$1,234.56'
 *
 * @example
 * formatCurrency(null, 'USD');             // => ''
 */
export function formatCurrency(
    value: number | null | undefined,
    currencyCode: string,
    locale = 'en-US'
): string {
    if (value == null || !isFinite(value)) return '';
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
        }).format(value);
    } catch {
        return '';
    }
}
