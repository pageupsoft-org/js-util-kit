import { describe, expect, it } from '@jest/globals';
import { downloadFile } from './index.js';

// This file intentionally omits the `@jest-environment jsdom` pragma so it runs
// under the project's default `node` test environment, where `window` and
// `document` are genuinely undefined (unlike jsdom, where they are non-configurable
// globals that cannot be deleted or reassigned to simulate their absence).
describe('downloadFile (outside a browser environment)', () => {
    it('throws a clear error instead of crashing when window/document are unavailable', async () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');

        await expect(downloadFile('/api/file.pdf')).rejects.toThrow(
            'downloadFile is only available in a browser environment.'
        );
    });
});
