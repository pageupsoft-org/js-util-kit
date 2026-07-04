/** @jest-environment jsdom */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
    copyToClipboard,
    openInNewTab,
    downloadBlob,
    isMobileDevice,
    isTouchDevice,
    scrollToElement,
} from './index.js';

beforeEach(() => {
    jest.restoreAllMocks();

    Object.defineProperty(document, 'execCommand', {
        configurable: true,
        writable: true,
        value: jest.fn().mockReturnValue(true),
    });

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

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: jest.fn(),
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
        configurable: true,
        value: 0,
    });

    Object.defineProperty(window, 'ontouchstart', {
        configurable: true,
        value: undefined,
    });

    document.body.innerHTML = '';
});

describe('copyToClipboard', () => {
    beforeEach(() => {
        const writeTextMock = jest
            .fn<(text: string) => Promise<void>>()
            .mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: writeTextMock,
            },
        });
    });

    it('returns true when Clipboard API writeText succeeds', async () => {
        await expect(copyToClipboard('hello')).resolves.toBe(true);
    });

    it('falls back to execCommand when Clipboard API is unavailable', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined,
        });

        const execSpy = jest.spyOn(document, 'execCommand');
        await expect(copyToClipboard('fallback')).resolves.toBe(true);
        expect(execSpy).toHaveBeenCalledWith('copy');
    });

    it('returns false for invalid input', async () => {
        await expect(copyToClipboard('')).resolves.toBe(false);
        await expect(copyToClipboard(null)).resolves.toBe(false);
        await expect(copyToClipboard(undefined)).resolves.toBe(false);
    });
});

describe('openInNewTab', () => {
    it('opens a valid URL with noopener and noreferrer', () => {
        const openSpy = jest.spyOn(window, 'open').mockReturnValue(window);

        expect(openInNewTab('https://example.com')).toBe(true);
        expect(openSpy).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');
    });

    it('returns false when URL is invalid', () => {
        const openSpy = jest.spyOn(window, 'open').mockReturnValue(window);

        expect(openInNewTab('not-a-url')).toBe(false);
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('returns false for invalid input', () => {
        expect(openInNewTab('')).toBe(false);
        expect(openInNewTab(null)).toBe(false);
        expect(openInNewTab(undefined)).toBe(false);
    });
});

describe('downloadBlob', () => {
    it('creates a download link and triggers click', () => {
        const blob = new Blob(['content'], { type: 'text/plain' });
        const createObjectUrlSpy = jest.spyOn(URL, 'createObjectURL');
        const revokeObjectUrlSpy = jest.spyOn(URL, 'revokeObjectURL');
        const appendSpy = jest.spyOn(document.body, 'appendChild');
        const removeSpy = jest.spyOn(document.body, 'removeChild');
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

        expect(downloadBlob(blob, 'file.txt')).toBe(true);
        expect(createObjectUrlSpy).toHaveBeenCalledWith(blob);
        expect(clickSpy).toHaveBeenCalled();
        expect(appendSpy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
        expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('returns false when filename is blank', () => {
        const blob = new Blob(['content']);
        expect(downloadBlob(blob, '   ')).toBe(false);
    });

    it('returns false for invalid input', () => {
        expect(downloadBlob(null, 'file.txt')).toBe(false);
        expect(downloadBlob(undefined, 'file.txt')).toBe(false);
        expect(downloadBlob(new Blob(['ok']), '')).toBe(false);
    });
});

describe('isMobileDevice', () => {
    it('returns true for a mobile user agent', () => {
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        });

        expect(isMobileDevice()).toBe(true);
    });

    it('returns false for a desktop user agent', () => {
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        });

        expect(isMobileDevice()).toBe(false);
    });

    it('returns false when userAgent is empty', () => {
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: '',
        });

        expect(isMobileDevice()).toBe(false);
    });
});

describe('isTouchDevice', () => {
    it('returns true when maxTouchPoints is greater than zero', () => {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            value: 2,
        });

        expect(isTouchDevice()).toBe(true);
    });

    it('returns true when ontouchstart is supported', () => {
        Object.defineProperty(window, 'ontouchstart', {
            configurable: true,
            value: jest.fn(),
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            value: 0,
        });

        expect(isTouchDevice()).toBe(true);
    });

    it('returns false when no touch feature is available', () => {
        Object.defineProperty(window, 'ontouchstart', {
            configurable: true,
            value: undefined,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            configurable: true,
            value: 0,
        });

        expect(isTouchDevice()).toBe(false);
    });
});

describe('scrollToElement', () => {
    it('scrolls to an existing element with provided options', () => {
        const element = document.createElement('div');
        element.id = 'target';
        document.body.appendChild(element);

        const scrollSpy = jest.spyOn(HTMLElement.prototype, 'scrollIntoView');

        expect(scrollToElement('target', { behavior: 'smooth' })).toBe(true);
        expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('returns false when element is not found', () => {
        expect(scrollToElement('missing')).toBe(false);
    });

    it('returns false for invalid input', () => {
        expect(scrollToElement('')).toBe(false);
        expect(scrollToElement(null)).toBe(false);
        expect(scrollToElement(undefined)).toBe(false);
    });
});