import { describe, it, expect } from 'vitest';
import { countActiveFilters, dateRangeError } from './validation';

describe('dateRangeError', () => {
    it('returns no error when either bound is missing', () => {
        expect(dateRangeError('', '2026-01-01')).toBe('');
        expect(dateRangeError('2026-01-01', '')).toBe('');
        expect(dateRangeError(undefined, undefined)).toBe('');
    });

    it('rejects an inverted range', () => {
        expect(dateRangeError('2026-02-01', '2026-01-01')).toBe(
            'Start date cannot be after end date',
        );
    });

    it('accepts a valid range', () => {
        expect(dateRangeError('2026-01-01', '2026-02-01')).toBe('');
    });

    it('rejects future dates only when today is given', () => {
        expect(dateRangeError('2099-01-01', '2099-02-01')).toBe('');
        expect(dateRangeError('2099-01-01', '2099-02-01', '2026-07-10')).toBe(
            'Start date cannot be in the future',
        );
        expect(dateRangeError('2026-01-01', '2099-02-01', '2026-07-10')).toBe(
            'End date cannot be in the future',
        );
    });

    it('reports inversion before future violations', () => {
        expect(dateRangeError('2099-02-01', '2099-01-01', '2026-07-10')).toBe(
            'Start date cannot be after end date',
        );
    });
});

describe('countActiveFilters', () => {
    it('counts filled values and skips empty ones', () => {
        expect(
            countActiveFilters({
                search: 'abc',
                status: ['pending'],
                tags: [],
                waiting_for_pooling: true,
                out_patient: '',
                priority: null,
                from_date: undefined,
            }),
        ).toBe(3);
    });

    it('ignores false booleans and handles empty/missing filters', () => {
        expect(countActiveFilters({ waiting_for_pooling: false })).toBe(0);
        expect(countActiveFilters({})).toBe(0);
        expect(countActiveFilters(null)).toBe(0);
    });
});
