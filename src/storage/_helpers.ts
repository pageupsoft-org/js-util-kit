export function _getLocalStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function _shouldClearAll(prefix: string | null | undefined): boolean {
    return typeof prefix !== 'string' || prefix.length === 0;
}