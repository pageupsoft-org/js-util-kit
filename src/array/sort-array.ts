type SortableValue = string | number | bigint | boolean | Date | null | undefined;

export interface SortRule<T> {
    property: keyof T | ((item: T) => SortableValue);
    direction?: 'asc' | 'desc';
}

export interface SortArrayOptions {
    nulls?: 'first' | 'last';
    locales?: string | string[];
    localeCompareOptions?: Intl.CollatorOptions;
}

function normalizeValue(value: SortableValue): string | number | bigint | boolean | null | undefined {
    if (value instanceof Date) return value.getTime();
    return value;
}

function compareValues(
    aValue: SortableValue,
    bValue: SortableValue,
    direction: 1 | -1,
    options: SortArrayOptions
): number {
    const aNormalized = normalizeValue(aValue);
    const bNormalized = normalizeValue(bValue);

    const isANullish = aNormalized == null;
    const isBNullish = bNormalized == null;
    if (isANullish || isBNullish) {
        if (isANullish && isBNullish) return 0;
        const nullDirection = options.nulls === 'first' ? -1 : 1;
        return (isANullish ? nullDirection : -nullDirection) * direction;
    }

    if (typeof aNormalized === 'string' && typeof bNormalized === 'string') {
        const result = aNormalized.localeCompare(
            bNormalized,
            options.locales,
            options.localeCompareOptions
        );
        return result * direction;
    }

    if (aNormalized < bNormalized) return -1 * direction;
    if (aNormalized > bNormalized) return 1 * direction;
    return 0;
}

/**
 * Creates a comparator function for `Array.prototype.sort` that applies one or
 * more sort rules in sequence.
 *
 * Each rule can target either an object property name or a selector function.
 * When compared values are dates, they are normalized to Unix timestamps before
 * comparison.
 *
 * @param rules - Ordered sort rules to apply. Later rules are used as
 *   tie-breakers when earlier comparisons are equal.
 * @param options - Optional behavior configuration.
 *   - `nulls`: Places `null`/`undefined` values `'last'` (default) or `'first'`.
 *   - `locales`/`localeCompareOptions`: Passed to `String.prototype.localeCompare`.
 * @returns A comparator function suitable for `array.sort(...)`.
 *
 * @example
 * const users = [
 *   { firstName: 'Ava', lastName: 'Stone', age: 30 },
 *   { firstName: 'Ben', lastName: 'Stone', age: 22 },
 *   { firstName: 'Cara', lastName: 'Adams', age: 40 }
 * ];
 *
 * users.sort(sortArray([
 *   { property: 'lastName', direction: 'asc' },
 *   { property: 'age', direction: 'desc' }
 * ]));
 *
 * @example
 * const products = [
 *   { name: 'Mouse', price: 19.99 },
 *   { name: 'Keyboard', price: 49.99 },
 *   { name: 'Cable', price: 9.99 }
 * ];
 *
 * products.sort(sortArray([
 *   { property: (item) => item.price, direction: 'asc' }
 * ]));
 *
 * @example
 * const rows = [
 *   { label: 'B', score: null },
 *   { label: 'A', score: 10 },
 *   { label: 'C', score: undefined }
 * ];
 *
 * rows.sort(sortArray([{ property: 'score', direction: 'asc' }], { nulls: 'last' }));
 */
export function sortArray<T>(
    rules: readonly SortRule<T>[],
    options: SortArrayOptions = {}
): (a: T, b: T) => number {
    return (a, b) => {
        for (const rule of rules) {
            const aValue = typeof rule.property === 'function' ? rule.property(a) : (a[rule.property] as SortableValue);
            const bValue = typeof rule.property === 'function' ? rule.property(b) : (b[rule.property] as SortableValue);
            const direction: 1 | -1 = rule.direction === 'desc' ? -1 : 1;
            const result = compareValues(aValue, bValue, direction, options);
            if (result !== 0) return result;
        }
        return 0;
    };
}