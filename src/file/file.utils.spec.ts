/** @jest-environment jsdom */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
    getFileExtension,
    formatFileSize,
    convertFileToBase64,
} from './index.js';
import { downloadBlob } from '../browser/index.js';

describe('downloadBlob', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';

        jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: jest.fn().mockReturnValue('blob:test-url'),
        });

        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: jest.fn(),
        });
    });

    it('triggers a download for valid input', () => {
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click');

        const result = downloadBlob(new Blob(['hello']), 'hello.txt');

        expect(result).toBe(true);
        expect(clickSpy).toHaveBeenCalled();
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('handles empty data blobs', () => {
        const result = downloadBlob(new Blob([]), 'empty.txt');
        expect(result).toBe(true);
    });

    it('returns false for invalid input', () => {
        expect(downloadBlob(null, 'x.txt')).toBe(false);
        expect(downloadBlob(undefined, 'x.txt')).toBe(false);
        expect(downloadBlob(new Blob(['x']), '')).toBe(false);
    });
});

describe('getFileExtension', () => {
    it('returns extension from a standard filename', () => {
        expect(getFileExtension('photo.png')).toBe('png');
    });

    it('returns empty string when no extension exists', () => {
        expect(getFileExtension('README')).toBe('');
    });

    it('returns last segment for multiple dots', () => {
        expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('returns empty string for invalid input', () => {
        expect(getFileExtension(null)).toBe('');
        expect(getFileExtension(undefined)).toBe('');
    });
});

describe('formatFileSize', () => {
    it('formats non-zero bytes in binary units', () => {
        expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('returns 0 B for zero bytes', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });

    it('returns 0 B for invalid input', () => {
        expect(formatFileSize(null)).toBe('0 B');
        expect(formatFileSize(undefined)).toBe('0 B');
        expect(formatFileSize(-1)).toBe('0 B');
    });
});

describe('convertFileToBase64', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('converts a valid file/blob to base64 data URL', async () => {
        const blob = new Blob(['hello'], { type: 'text/plain' });
        const result = await convertFileToBase64(blob);

        expect(result.startsWith('data:text/plain;base64,')).toBe(true);
    });

    it('handles empty data blobs', async () => {
        const blob = new Blob([], { type: 'text/plain' });
        const result = await convertFileToBase64(blob);

        expect(result).toBe('data:text/plain;base64,');
    });

    it('rejects for malformed file object', async () => {
        await expect(convertFileToBase64(null)).rejects.toThrow('`file` must be a Blob or File instance.');
        await expect(convertFileToBase64(undefined)).rejects.toThrow('`file` must be a Blob or File instance.');
        await expect(convertFileToBase64({} as Blob)).rejects.toThrow('`file` must be a Blob or File instance.');
    });
});