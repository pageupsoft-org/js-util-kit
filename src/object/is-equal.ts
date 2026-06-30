/**
 * Performs a recursive deep equality check between two values.
 * Uses value semantics: two `Date` objects with the same timestamp are equal,
 * and two plain objects with the same keys and values are equal regardless of
 * reference identity.
 *
 * Supports: primitives, `null`, `undefined`, `Date`, `Array`, and plain objects.
 * Does not support `Map`, `Set`, `RegExp`, or class instances with custom equality.
 *
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns `true` when `a` and `b` are deeply equal; `false` otherwise.
 *
 * @example
 * isEqual({ x: 1, y: { z: 2 } }, { x: 1, y: { z: 2 } }); // => true
 *
 * @example
 * isEqual([1, 2, 3], [1, 2, 4]); // => false
 */
export function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;
    if (typeof a !== typeof b) return false;

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;

    if (aIsArray && bIsArray) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const aRec = a as Record<string, unknown>;
        const bRec = b as Record<string, unknown>;
        const keysA = Object.keys(aRec);
        const keysB = Object.keys(bRec);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(bRec, key)) return false;
            if (!isEqual(aRec[key], bRec[key])) return false;
        }
        return true;
    }

    return false;
}
