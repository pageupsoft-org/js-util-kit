/** @jest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
    getFileExtension,
    formatFileSize,
    convertFileToBase64,
    compressImageToWebp,
    type CompressImageResult,
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

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 240;
const SOURCE_SIZE = 1000;
const COMPRESSED_SIZE = 250;

// jsdom decodes neither images nor the canvas 2D API, so the browser APIs used
// by `compressImageToWebp` have to be faked.
class MockImage {
    static latest: MockImage | null = null;

    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = IMAGE_WIDTH;
    naturalHeight = IMAGE_HEIGHT;
    src = '';

    constructor() {
        MockImage.latest = this;
    }
}

const mockProperty = (target: object, key: string, value: unknown): void => {
    Object.defineProperty(target, key, { configurable: true, writable: true, value });
};

describe('compressImageToWebp', () => {
    let context: CanvasRenderingContext2D | null = null;
    let blob: Blob | null = null;
    let toBlobMock: jest.Mock<(callback: BlobCallback, type?: string, quality?: number) => void>;

    const createFile = (name = 'photo.png', size = SOURCE_SIZE): File =>
        new File([new Uint8Array(size)], name, { type: 'image/png' });

    // Starts the compression and resolves the image load, as a browser does once
    // the blob URL has been decoded.
    const compress = (file: File, quality?: number): Promise<CompressImageResult> => {
        const promise = compressImageToWebp(file, quality);
        MockImage.latest?.onload?.();
        return promise;
    };

    beforeEach(() => {
        jest.restoreAllMocks();

        MockImage.latest = null;
        context = { drawImage: jest.fn() } as unknown as CanvasRenderingContext2D;
        blob = new Blob([new Uint8Array(COMPRESSED_SIZE)], { type: 'image/webp' });
        toBlobMock = jest.fn((callback: BlobCallback) => callback(blob));

        globalThis.Image = MockImage as unknown as typeof Image;

        mockProperty(HTMLCanvasElement.prototype, 'getContext', jest.fn(() => context));
        mockProperty(HTMLCanvasElement.prototype, 'toBlob', toBlobMock);
        mockProperty(URL, 'createObjectURL', jest.fn().mockReturnValue('blob:test-url'));
        mockProperty(URL, 'revokeObjectURL', jest.fn());

        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    it('compresses an image into a WebP file', async () => {
        const result = await compress(createFile());

        expect(result.success).toBe(true);
        expect(result.error).toBe('');
        expect(result.file.name).toBe('photo.webp');
        expect(result.file.type).toBe('image/webp');
        expect(result.originalSizeInBytes).toBe(SOURCE_SIZE);
        expect(result.compressedSizeInBytes).toBe(COMPRESSED_SIZE);
        expect(result.width).toBe(IMAGE_WIDTH);
        expect(result.height).toBe(IMAGE_HEIGHT);
        expect(result.savingsPercentage).toBe(75);
    });

    it('encodes the canvas as WebP with the requested quality', async () => {
        await compress(createFile(), 0.8);

        expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.8);
    });

    it('uses a quality of 0.7 by default and for values outside the supported range', async () => {
        await compress(createFile());
        expect(toBlobMock).toHaveBeenLastCalledWith(expect.any(Function), 'image/webp', 0.7);

        for (const quality of [0.05, 1.5, Number.NaN]) {
            await compress(createFile(), quality);
            expect(toBlobMock).toHaveBeenLastCalledWith(expect.any(Function), 'image/webp', 0.7);
        }
    });

    it('keeps quality values inside the supported range', async () => {
        for (const quality of [0.1, 1]) {
            await compress(createFile(), quality);
            expect(toBlobMock).toHaveBeenLastCalledWith(expect.any(Function), 'image/webp', quality);
        }
    });

    it('creates an object URL for the source file and revokes it once loaded', async () => {
        const file = createFile();

        const promise = compressImageToWebp(file);
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);

        MockImage.latest?.onload?.();
        await promise;

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('logs the original and compressed file sizes', async () => {
        await compress(createFile());

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Savings: 75.0%'));
    });

    it('returns an error result for invalid input', async () => {
        const nonImage = new File(['text'], 'notes.txt', { type: 'text/plain' });

        const result = await compressImageToWebp(nonImage);
        expect(result).toEqual({
            success: false,
            file: nonImage,
            error: 'Invalid file type. Only images are supported.',
            originalSizeInBytes: 0,
            compressedSizeInBytes: 0,
            width: 0,
            height: 0,
            savingsPercentage: 0,
        });

        await expect(compressImageToWebp(null as unknown as File)).resolves.toMatchObject({
            success: false,
            error: 'Invalid file type. Only images are supported.',
        });
    });

    it('returns an error result when the image fails to load', async () => {
        const promise = compressImageToWebp(createFile('broken.png'));
        MockImage.latest?.onerror?.();

        await expect(promise).resolves.toMatchObject({
            success: false,
            error: 'Failed to load image: broken.png',
        });
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('returns an error result when the canvas context is unavailable', async () => {
        context = null;

        await expect(compress(createFile())).resolves.toMatchObject({
            success: false,
            error: 'Failed to get canvas context.',
        });
    });

    it('returns an error result when the canvas cannot produce a blob', async () => {
        blob = null;

        await expect(compress(createFile())).resolves.toMatchObject({
            success: false,
            error: 'Failed to compress image.',
        });
    });

    // The `This function can only be used in a browser environment.` branch cannot
    // be reached here: under jsdom `window` and `document` are non-configurable
    // accessors on the global object, so they can never be made `undefined`.
    it('does not report a missing browser environment when DOM APIs are available', async () => {
        const result = await compress(createFile());

        expect(result.error).not.toBe('This function can only be used in a browser environment.');
    });
});
