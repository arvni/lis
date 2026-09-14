import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import CorrectionForm from '@/Pages/Attendance/Days/Components/CorrectionForm';
import DayDialog, { describeChange } from '@/Pages/Attendance/Calendar/Components/DayDialog';

vi.mock('@inertiajs/react', () => ({ router: { put: vi.fn() } }));
vi.mock('@/Pages/Attendance/Days/Components/CorrectionForm', () => ({ default: vi.fn(() => null) }));

const person = { id: 3, name: 'Sara Ahmed' };

const correction = {
    id: 7,
    action: 'CORRECTED',
    action_label: 'Times corrected',
    by: 'Admin',
    at: '2026-09-14 19:40',
    note: 'Forgot their card',
    before: { check_in: null, check_out: null, status_label: 'Absent' },
    after: { check_in: '08:20', check_out: '16:00', status_label: 'Present' },
};

const day = (attendance = {}, changes = []) => ({
    date: '2026-09-08',
    weekday: 'Tue',
    shift: { id: 1, name: 'Morning' },
    scheduled_start: '08:00',
    scheduled_end: '16:00',
    changes,
    attendance: {
        id: 40,
        status: 'PRESENT',
        status_label: 'Present',
        check_in: '08:20',
        check_out: '16:00',
        worked_minutes: 460,
        late_minutes: 20,
        early_leave_minutes: 0,
        is_manual: true,
        note: 'Forgot their card',
        ...attendance,
    },
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('describeChange', () => {
    it('names only what moved', () => {
        expect(describeChange(correction)).toBe('In — → 08:20 · Out — → 16:00 · Status Absent → Present');
        expect(
            describeChange({
                before: { check_in: '08:20', check_out: '16:00', status_label: 'Present' },
                after: { check_in: '08:00', check_out: '16:00', status_label: 'Present' },
            }),
        ).toBe('In 08:20 → 08:00');
    });

    it('says when recalculating removed the day', () => {
        expect(describeChange({ ...correction, after: null })).toBe(
            'Day removed: no shift or punches left for it',
        );
    });
});

describe('DayDialog', () => {
    it('shows who changed the day, when and why', () => {
        render(<DayDialog day={day({}, [correction])} person={person} onClose={vi.fn()} />);

        expect(screen.getByText('Times corrected by Admin · 2026-09-14 19:40')).toBeInTheDocument();
        expect(
            screen.getByText(
                'In — → 08:20 · Out — → 16:00 · Status Absent → Present — Forgot their card',
            ),
        ).toBeInTheDocument();
    });

    it('tells a day straight from the doors apart', () => {
        render(<DayDialog day={day({ is_manual: false })} person={person} onClose={vi.fn()} />);

        expect(
            screen.getByText('No changes: these are the times the doors recorded.'),
        ).toBeInTheDocument();
    });

    it('is read-only without the correct permission', () => {
        render(<DayDialog day={day()} person={person} onClose={vi.fn()} />);

        expect(screen.queryByRole('button', { name: 'Correct times' })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Recalculate from punches' }),
        ).not.toBeInTheDocument();
    });

    it('opens the correction form for the day', () => {
        render(<DayDialog day={day()} person={person} canCorrect onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Correct times' }));

        expect(vi.mocked(CorrectionForm).mock.calls.at(-1)[0].day).toEqual(
            expect.objectContaining({ id: 40, user: person, date: '2026-09-08', check_in: '08:20' }),
        );
    });

    it('hands a corrected day back to the punches', () => {
        render(<DayDialog day={day()} person={person} canCorrect onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Recalculate from punches' }));

        expect(router.put).toHaveBeenCalledWith(
            expect.stringContaining('attendance.days.reset'),
            {},
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
