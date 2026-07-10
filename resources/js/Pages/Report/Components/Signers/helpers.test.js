import { describe, it, expect } from 'vitest';
import {
    moveSignerDown,
    moveSignerUp,
    removeSigner,
    rowCompare,
    updateSignerTitle,
} from './helpers';

const signers = () => [
    { id: 'a', row: 1, title: 'Chief' },
    { id: 'b', row: 2, title: 'Deputy' },
    { id: 'c', row: 3, title: 'Analyst' },
];

describe('rowCompare', () => {
    it('sorts by row ascending', () => {
        expect([{ row: 3 }, { row: 1 }, { row: 2 }].sort(rowCompare).map((s) => s.row)).toEqual([
            1, 2, 3,
        ]);
    });
});

describe('moveSignerUp', () => {
    it('swaps with the previous signer and adjusts both rows', () => {
        const next = moveSignerUp(signers(), 'b');
        expect(next.map((s) => s.id)).toEqual(['b', 'a', 'c']);
        expect(next.map((s) => s.row)).toEqual([1, 2, 3]);
    });

    it('is a no-op for the first signer or an unknown id', () => {
        expect(moveSignerUp(signers(), 'a')).toBeNull();
        expect(moveSignerUp(signers(), 'zz')).toBeNull();
    });

    it('does not mutate the input', () => {
        const input = signers();
        moveSignerUp(input, 'b');
        expect(input.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('moveSignerDown', () => {
    it('swaps with the next signer and adjusts both rows', () => {
        const next = moveSignerDown(signers(), 'b');
        expect(next.map((s) => s.id)).toEqual(['a', 'c', 'b']);
        expect(next.map((s) => s.row)).toEqual([1, 2, 3]);
    });

    it('is a no-op for the last signer or an unknown id', () => {
        expect(moveSignerDown(signers(), 'c')).toBeNull();
        expect(moveSignerDown(signers(), 'zz')).toBeNull();
    });
});

describe('removeSigner', () => {
    it('removes the signer and renumbers rows 1..n', () => {
        const next = removeSigner(signers(), 'b');
        expect(next.map((s) => s.id)).toEqual(['a', 'c']);
        expect(next.map((s) => s.row)).toEqual([1, 2]);
    });

    it('is a no-op for an unknown id', () => {
        expect(removeSigner(signers(), 'zz')).toBeNull();
    });
});

describe('updateSignerTitle', () => {
    it('replaces only the target title', () => {
        const next = updateSignerTitle(signers(), 'b', 'Director');
        expect(next[1].title).toBe('Director');
        expect(next[0].title).toBe('Chief');
        expect(next[2].title).toBe('Analyst');
    });

    it('is a no-op for an unknown id', () => {
        expect(updateSignerTitle(signers(), 'zz', 'X')).toBeNull();
    });
});
