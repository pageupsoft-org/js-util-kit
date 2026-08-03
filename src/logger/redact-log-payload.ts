import type { RedactionOptions } from './logger-types.js';

const _defaultRedactionKeys = [
    'password',
    'token',
    'authorization',
    'secret',
    'apikey',
    'api_key',
    'cookie',
    'session',
    'access_token',
    'refresh_token',
] as const;

/**
 * Redacts sensitive values in nested payloads using key and path matching.
 *
 * @param payload - The value to redact.
 * @param options - Optional redaction behavior overrides.
 * @returns A redacted copy of the payload.
 *
 * @example
 * redactLogPayload({ password: '1234' }); // => { password: '[REDACTED]' }
 */
export function redactLogPayload(payload: unknown, options: RedactionOptions = {}): unknown {
    if (options.enabled === false) return payload;

    const replacement = options.replacement ?? '[REDACTED]';
    const configuredKeys = options.keys ?? _defaultRedactionKeys;
    const configuredPaths = options.paths ?? [];
    const keySet = new Set(configuredKeys.map((key) => key.toLowerCase()));
    const pathSet = new Set(configuredPaths.map((path) => path.toLowerCase()));

    const visited = new WeakMap<object, unknown>();

    return _redactRecursive(payload, {
        keySet,
        pathSet,
        replacement,
        currentPath: '',
        visited,
        ...(options.keyMatcher !== undefined ? { keyMatcher: options.keyMatcher } : {}),
        ...(options.pathMatcher !== undefined ? { pathMatcher: options.pathMatcher } : {}),
    });
}

interface RecursiveRedactionState {
    readonly keySet: ReadonlySet<string>;
    readonly pathSet: ReadonlySet<string>;
    readonly replacement: string;
    readonly keyMatcher?: (key: string, path: string) => boolean;
    readonly pathMatcher?: (path: string) => boolean;
    readonly currentPath: string;
    readonly visited: WeakMap<object, unknown>;
}

function _redactRecursive(value: unknown, state: RecursiveRedactionState): unknown {
    if (value == null) return value;

    if (Array.isArray(value)) {
        if (state.visited.has(value)) return state.visited.get(value);

        const output: unknown[] = [];
        state.visited.set(value, output);

        for (let i = 0; i < value.length; i += 1) {
            const childPath = _joinPath(state.currentPath, String(i));
            const shouldRedact =
                state.pathSet.has(childPath.toLowerCase()) || _matchesCustomPath(childPath, state.pathMatcher);
            output.push(
                shouldRedact
                    ? state.replacement
                    : _redactRecursive(value[i], {
                          ...state,
                          currentPath: childPath,
                      })
            );
        }

        return output;
    }

    if (typeof value !== 'object') return value;

    const objectValue = value as Record<string, unknown>;
    if (state.visited.has(objectValue)) return state.visited.get(objectValue);

    const output: Record<string, unknown> = {};
    state.visited.set(objectValue, output);

    for (const [key, childValue] of Object.entries(objectValue)) {
        const normalizedKey = key.toLowerCase();
        const childPath = _joinPath(state.currentPath, key);
        const shouldRedactByKey = state.keySet.has(normalizedKey);
        const shouldRedactByPath = state.pathSet.has(childPath.toLowerCase());
        const shouldRedactByCustomKey = _matchesCustomKey(key, childPath, state.keyMatcher);
        const shouldRedactByCustomPath = _matchesCustomPath(childPath, state.pathMatcher);

        if (shouldRedactByKey || shouldRedactByPath || shouldRedactByCustomKey || shouldRedactByCustomPath) {
            output[key] = state.replacement;
            continue;
        }

        output[key] = _redactRecursive(childValue, {
            ...state,
            currentPath: childPath,
        });
    }

    return output;
}

function _joinPath(prefix: string, segment: string): string {
    if (prefix.length === 0) return segment;
    return `${prefix}.${segment}`;
}

function _matchesCustomKey(
    key: string,
    path: string,
    keyMatcher: ((key: string, path: string) => boolean) | undefined
): boolean {
    if (typeof keyMatcher !== 'function') return false;

    try {
        return keyMatcher(key, path);
    } catch {
        return false;
    }
}

function _matchesCustomPath(path: string, pathMatcher: ((path: string) => boolean) | undefined): boolean {
    if (typeof pathMatcher !== 'function') return false;

    try {
        return pathMatcher(path);
    } catch {
        return false;
    }
}
