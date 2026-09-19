/**
 * Performs a recursive deep equality check between two values.
 * Uses value semantics: two `Date` objects with the same timestamp are equal,
 * and two plain objects with the same keys and values are equal regardless of
 * reference identity. Circular references are handled safely (a cycle
 * encountered on both sides at the same position is treated as equal).
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
    return _isEqual(a, b, new WeakMap<object, WeakSet<object>>());
}

// `seen` tracks (a, b) object pairs already in progress on the current recursion
// path so a cycle resolves to `true` at the repeat point instead of recursing forever.
function _isEqual(a: unknown, b: unknown, seen: WeakMap<object, WeakSet<object>>): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;
    if (typeof a !== typeof b) return false;

    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // Map/Set/RegExp have no own enumerable keys, so the generic object
    // comparison below would silently treat any two instances as equal
    // regardless of content. Since structural comparison isn't implemented
    // for these types, only exact reference equality (checked above) counts.
    if (
        a instanceof Map || b instanceof Map ||
        a instanceof Set || b instanceof Set ||
        a instanceof RegExp || b instanceof RegExp
    ) {
        return false;
    }

    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;

    if (typeof a === 'object' && typeof b === 'object') {
        const aObj = a as object;
        const bObj = b as object;

        const seenForA = seen.get(aObj);
        if (seenForA?.has(bObj)) return true;
        if (seenForA == null) {
            seen.set(aObj, new WeakSet<object>([bObj]));
        } else {
            seenForA.add(bObj);
        }

        if (aIsArray && bIsArray) {
            const aArr = a as unknown[];
            const bArr = b as unknown[];
            if (aArr.length !== bArr.length) return false;
            for (let i = 0; i < aArr.length; i++) {
                if (!_isEqual(aArr[i], bArr[i], seen)) return false;
            }
            return true;
        }

        const aRec = a as Record<string, unknown>;
        const bRec = b as Record<string, unknown>;
        const keysA = Object.keys(aRec);
        const keysB = Object.keys(bRec);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(bRec, key)) return false;
            if (!_isEqual(aRec[key], bRec[key], seen)) return false;
        }
        return true;
    }

    return false;
}
