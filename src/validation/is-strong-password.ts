const DEFAULT_MIN_PASSWORD_LENGTH = 8;

/**
 * Returns `true` when the value satisfies configured password-strength rules.
 *
 * Default rules are:
 * - `minLength`: 8
 * - `requireUppercase`: true
 * - `requireNumber`: true
 * - `requireSpecialChar`: true
 *
 * @param value - The password to validate. Returns `false` for null or undefined.
 * @param rules - Optional rule overrides.
 * @returns `true` when the password satisfies all active rules; otherwise `false`.
 *
 * @example
 * isStrongPassword('Abcdef1!'); // => true
 */
export function isStrongPassword(
    value: string | null | undefined,
    rules?: {
        minLength?: number;
        requireUppercase?: boolean;
        requireNumber?: boolean;
        requireSpecialChar?: boolean;
    }
): boolean {
    if (value == null) return false;

    const minLength =
        typeof rules?.minLength === 'number' && Number.isFinite(rules.minLength) && rules.minLength > 0
            ? Math.floor(rules.minLength)
            : DEFAULT_MIN_PASSWORD_LENGTH;
    const requireUppercase = rules?.requireUppercase ?? true;
    const requireNumber = rules?.requireNumber ?? true;
    const requireSpecialChar = rules?.requireSpecialChar ?? true;

    if (value.length < minLength) return false;
    if (requireUppercase && !/[A-Z]/.test(value)) return false;
    if (requireNumber && !/\d/.test(value)) return false;
    if (requireSpecialChar && !/[^A-Za-z0-9]/.test(value)) return false;

    return true;
}