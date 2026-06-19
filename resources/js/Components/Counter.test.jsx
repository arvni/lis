import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Counter from '@/Components/Counter';

describe('Counter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T01:02:03Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the elapsed h:m:s from the date on mount', () => {
        render(<Counter date="2026-01-01T00:00:00Z" />); // 1h 2m 3s ago
        expect(screen.getByText('01')).toBeInTheDocument(); // hours
        expect(screen.getByText('02')).toBeInTheDocument(); // minutes
        expect(screen.getByText('03')).toBeInTheDocument(); // seconds
    });

    it('advances on the 1s interval tick', () => {
        render(<Counter date="2026-01-01T00:00:00Z" />);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByText('04')).toBeInTheDocument(); // seconds -> 04
    });

    it('recomputes when the date prop changes', () => {
        const { rerender } = render(<Counter date="2026-01-01T00:00:00Z" />);
        rerender(<Counter date="2026-01-01T01:00:00Z" />); // now only 2m 3s ago
        expect(screen.getByText('00')).toBeInTheDocument(); // hours -> 00
    });
});
