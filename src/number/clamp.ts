/**
 * Clamps a number within a `[min, max]` range.
 * If `min` is greater than `max`, the two are silently swapped before clamping.
 *
 * @param value - The number to clamp. Accepts `null`, `undefined`, or non-finite numbers.
 * @param min - The lower bound.
 * @param max - The upper bound.
 * @returns The clamped value, or `null` for null, undefined, NaN, or non-finite `value`.
 *
 * @example
 * clamp(15, 0, 10);  // => 10
 *
 * @example
 * clamp(5, 10, 0);   // => 5  (min and max are swapped to [0, 10])
 *
 * @example
 * clamp(null, 0, 10); // => null
 */
export function clamp(
    value: number | null | undefined,
    min: number,
    max: number
): number | null {
    if (value == null || !isFinite(value)) return null;
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.min(Math.max(value, lo), hi);
}
