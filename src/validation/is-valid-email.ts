/**
 * Returns `true` when the value is a syntactically valid email address.
 *
 * This validator intentionally uses a practical regex and does not fully
 * implement RFC 5322. For example, quoted local parts and comments are not
 * supported.
 *
 * @param value - The email value to validate. Returns `false` for null or undefined.
 * @returns `true` when the value matches a common email format; otherwise `false`.
 *
 * @example
 * isValidEmail('user.name+tag@example.co.uk'); // => true
 */
export function isValidEmail(value: string | null | undefined): boolean {
    if (value == null) return false;

    const email = value.trim();
    if (email.length === 0) return false;

    const emailRegex =
        /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

    return emailRegex.test(email);
}