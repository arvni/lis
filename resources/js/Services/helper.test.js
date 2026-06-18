import { describe, it, expect } from 'vitest';
import { formatFileSize, makeId, sum } from '@/Services/helper';

describe('helper', () => {
    describe('formatFileSize', () => {
        it('formats byte counts into human-readable units', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
            expect(formatFileSize(1048576)).toBe('1 MB');
        });

        it('returns a fallback for falsy / non-number input', () => {
            expect(formatFileSize(null)).toBe('Unknown size');
            expect(formatFileSize(undefined)).toBe('Unknown size');
            expect(formatFileSize('123')).toBe('Unknown size');
            // NB: 0 is falsy, so the `bytes === 0 -> '0 Bytes'` branch is
            // unreachable; 0 falls through to the fallback.
            expect(formatFileSize(0)).toBe('Unknown size');
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
