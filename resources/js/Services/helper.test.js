import { describe, it, expect } from 'vitest';
import { formatFileSize, makeId, sum } from '@/Services/helper';

describe('helper', () => {
    describe('formatFileSize', () => {
        it('formats byte counts into human-readable units', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(1048576)).toBe('1 MB');
        });

        it('returns a fallback for non-number / invalid input', () => {
            expect(formatFileSize(null)).toBe('Unknown size');
            expect(formatFileSize(undefined)).toBe('Unknown size');
            expect(formatFileSize('123')).toBe('Unknown size');
            expect(formatFileSize(NaN)).toBe('Unknown size');
            expect(formatFileSize(-1)).toBe('Unknown size');
        });

        it('formats a zero-byte file as "0 Bytes"', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
        });
    });

    describe('makeId', () => {
        it('returns a string of the requested length', () => {
            expect(makeId(8)).toHaveLength(8);
            expect(makeId(0)).toBe('');
        });
    });

    describe('sum', () => {
        it('sums a numeric field across a list', () => {
            const rows = [{ price: 10 }, { price: 5 }, { price: 2.5 }];
            expect(sum(rows, 'price')).toBe(17.5);
        });
    });
});
