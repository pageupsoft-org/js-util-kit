import { describe, expect, it } from '@jest/globals';
import {
    AppError,
    NotFoundError,
    ValidationError,
    enrichErrorEnvelope,
    isErrorEnvelope,
    normalizeError,
    toAppError,
} from './index.js';

describe('normalizeError', () => {
    it('normalizes native Error instances', () => {
        const error = new Error('Something failed');
        const normalized = normalizeError(error);

        expect(normalized.name).toBe('Error');
        expect(normalized.message).toBe('Something failed');
        expect(typeof normalized.timestamp).toBe('string');
        expect(normalized.stack).toEqual(expect.any(String));
    });

    it('normalizes string values', () => {
        const normalized = normalizeError('Network timeout');

        expect(normalized).toMatchObject({
            name: 'Error',
            message: 'Network timeout',
        });
    });

    it('normalizes error-like objects with cause', () => {
        const normalized = normalizeError({
            name: 'RemoteError',
            message: 'Request failed',
            code: 503,
            cause: {
                message: 'Gateway timeout',
            },
        });

        expect(normalized.name).toBe('RemoteError');
        expect(normalized.message).toBe('Request failed');
        expect(normalized.code).toBe('503');
        expect(normalized.cause?.message).toBe('Gateway timeout');
    });

    it('merges provided context into the envelope', () => {
        const normalized = normalizeError(new Error('Oops'), {
            context: { requestId: 'req-1' },
        });

        expect(normalized.context).toEqual({ requestId: 'req-1' });
    });

    it('does not throw for a self-referential native Error cause', () => {
        const error: Error & { cause?: unknown } = new Error('Outer');
        error.cause = error;

        expect(() => normalizeError(error)).not.toThrow();
        const normalized = normalizeError(error);
        expect(() => JSON.stringify(normalized)).not.toThrow();
    });

    it('does not throw and produces a JSON-safe result for a self-referential envelope-shaped cause', () => {
        const envelopeLike: Record<string, unknown> = {
            name: 'RemoteError',
            message: 'Request failed',
            timestamp: '2026-01-01T00:00:00.000Z',
        };
        envelopeLike.cause = envelopeLike;

        expect(() => normalizeError(envelopeLike)).not.toThrow();
        const normalized = normalizeError(envelopeLike);
        expect(() => JSON.stringify(normalized)).not.toThrow();
    });

    it('does not throw for two mutually circular envelope-shaped causes', () => {
        const envelopeA: Record<string, unknown> = {
            name: 'ErrorA',
            message: 'A failed',
            timestamp: '2026-01-01T00:00:00.000Z',
        };
        const envelopeB: Record<string, unknown> = {
            name: 'ErrorB',
            message: 'B failed',
            timestamp: '2026-01-01T00:00:00.000Z',
        };
        envelopeA.cause = envelopeB;
        envelopeB.cause = envelopeA;

        expect(() => normalizeError(envelopeA)).not.toThrow();
        const normalized = normalizeError(envelopeA);
        expect(() => JSON.stringify(normalized)).not.toThrow();
    });
});

describe('isErrorEnvelope', () => {
    it('returns true for valid envelopes', () => {
        expect(
            isErrorEnvelope({
                name: 'AppError',
                message: 'Boom',
                timestamp: new Date().toISOString(),
            })
        ).toBe(true);
    });

    it('returns false for invalid values', () => {
        expect(isErrorEnvelope(null)).toBe(false);
        expect(isErrorEnvelope({ message: 'Boom' })).toBe(false);
    });
});

describe('enrichErrorEnvelope', () => {
    it('adds or overwrites context keys immutably', () => {
        const base = normalizeError('Base error', { context: { requestId: 'req-1' } });
        const enriched = enrichErrorEnvelope(base, { userId: 'u-10', requestId: 'req-2' });

        expect(base.context).toEqual({ requestId: 'req-1' });
        expect(enriched.context).toEqual({ requestId: 'req-2', userId: 'u-10' });
    });
});

describe('custom error classes', () => {
    it('creates AppError with optional metadata', () => {
        const error = new AppError('Failure', {
            code: 'GENERIC',
            context: { module: 'billing' },
        });

        expect(error.name).toBe('AppError');
        expect(error.code).toBe('GENERIC');
        expect(error.context).toEqual({ module: 'billing' });
    });

    it('creates ValidationError and NotFoundError with defaults', () => {
        const validation = new ValidationError('Bad email');
        const notFound = new NotFoundError('User missing');

        expect(validation.name).toBe('ValidationError');
        expect(validation.code).toBe('VALIDATION_ERROR');
        expect(notFound.name).toBe('NotFoundError');
        expect(notFound.code).toBe('NOT_FOUND');
    });
});

describe('toAppError', () => {
    it('returns AppError unchanged when already AppError', () => {
        const original = new AppError('Original');
        expect(toAppError(original)).toBe(original);
    });

    it('converts unknown values into AppError', () => {
        const converted = toAppError({ name: 'RemoteError', message: 'Failed call', code: 'E_REMOTE' });

        expect(converted).toBeInstanceOf(AppError);
        expect(converted.name).toBe('RemoteError');
        expect(converted.message).toBe('Failed call');
        expect(converted.code).toBe('E_REMOTE');
    });
});
