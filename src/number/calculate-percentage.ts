/**
 * Calculates what percentage `part` is of `total` on a 0–100 scale.
 * Returns `0` when `total` is `0` to avoid division by zero.
 *
 * @param part - The partial value. Accepts `null`, `undefined`, or non-finite numbers.
 * @param total - The total value. Accepts `null`, `undefined`, or non-finite numbers.
 * @returns The percentage on a 0–100 scale, `0` when `total` is `0`, or `null` for
 *   null, undefined, or non-finite inputs.
 *
 * @example
 * calculatePercentage(25, 100);  // => 25
 *
 * @example
 * calculatePercentage(5, 0);     // => 0  (division-by-zero guard)
 *
 * @example
 * calculatePercentage(null, 100); // => null
 */
export function calculatePercentage(
    part: number | null | undefined,
    total: number | null | undefined
): number | null {
    if (part == null || !isFinite(part)) return null;
    if (total == null || !isFinite(total)) return null;
    if (total === 0) return 0;
    return (part / total) * 100;
}
