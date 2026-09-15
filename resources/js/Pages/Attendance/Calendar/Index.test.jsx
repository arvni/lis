import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import SelectSearch from '@/Components/SelectSearch';
import CalendarIndex, { dayHeadline, shiftMonth } from '@/Pages/Attendance/Calendar/Index';
import DayDialog from '@/Pages/Attendance/Calendar/Components/DayDialog';

let props;

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions ?? null }));
vi.mock('@/Components/SelectSearch', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/Attendance/Calendar/Components/DayDialog', () => ({ default: vi.fn(() => null) }));

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** September 2026 on a Sunday–Thursday 08:00–16:00 shift; the 1st is a Tuesday. */
const september = (overrides = {}) =>
    Array.from({ length: 30 }, (_, index) => {
        const day = index + 1;
        const weekday = WEEKDAYS[(2 + index) % 7];
        const working = !['Fri', 'Sat'].includes(weekday);

        return {
            date: `2026-09-${String(day).padStart(2, '0')}`,
            day,
            weekday,
            is_today: day === 17,
            is_future: day > 17,
            shift: working ? { id: 1, name: 'Morning' } : null,
            scheduled_start: working ? '08:00' : null,
            scheduled_end: working ? '16:00' : null,
            scheduled_minutes: working ? 480 : 0,
            holiday: null,
            leaves: [],
            attendance: null,
            changes: [],
            ...overrides[day],
        };
    });

const renderPage = ({
    canViewOthers = false,
    canCorrect = false,
    canExportAll = false,
    days = september(),
} = {}) => {
    props = {
        person: { id: 3, name: 'Sara Ahmed' },
        calendar: {
            month: '2026-09',
            label: 'September 2026',
            days,
            totals: {
                scheduled_minutes: 10080,
                worked_minutes: 456,
                overtime_minutes: 95,
                late_minutes: 11,
                early_leave_minutes: 12,
                leave_minutes: 0,
                present_days: 1,
                absent_days: 1,
                leave_days: 0,
                corrected_days: 0,
            },
        },
        canViewOthers,
        canCorrect,
        canExportAll,
    };

    return render(<CalendarIndex />);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('shiftMonth', () => {
    it('moves across year boundaries', () => {
        expect(shiftMonth('2026-09', 1)).toBe('2026-10');
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    });
});

describe('dayHeadline', () => {
    const [workingDay] = september();

    it('says what happened once the day is recorded', () => {
        expect(
            dayHeadline({ ...workingDay, attendance: { status: 'PRESENT', status_label: 'Present' } }),
        ).toEqual({ label: 'Present', color: 'success', variant: 'filled' });
    });

    it('otherwise shows the plan', () => {
        expect(dayHeadline({ ...workingDay, holiday: 'National Day' }).label).toBe('National Day');
        expect(
            dayHeadline({
                ...workingDay,
                leaves: [{ type: 'DAILY', status: 'APPROVED' }],
            }).label,
        ).toBe('On leave');
        expect(dayHeadline({ ...workingDay, is_future: true }).label).toBe('Scheduled');
        expect(dayHeadline({ ...workingDay, scheduled_start: null }).label).toBe('Day off');
    });
});

describe('Attendance/Calendar/Index', () => {
    it('lines the 1st up under its weekday', () => {
        renderPage();

        // Sunday and Monday come before Tuesday the 1st.
        expect(screen.getAllByTestId('blank-cell')).toHaveLength(2);
        expect(screen.getByTestId('day-1')).toHaveTextContent('08:00–16:00');
        expect(screen.getByTestId('day-4')).toHaveTextContent('Day off');
    });

    it('shows what the doors recorded and the leave on each day', () => {
        renderPage({
            days: september({
                14: {
                    attendance: {
                        status: 'PRESENT',
                        status_label: 'Present',
                        check_in: '08:11',
                        check_out: '15:47',
                        worked_minutes: 456,
                        overtime_minutes: 0,
                        late_minutes: 11,
                        early_leave_minutes: 12,
                    },
                },
                15: {
                    attendance: {
                        status: 'PRESENT',
                        status_label: 'Present',
                        check_in: '07:40',
                        check_out: '17:10',
                        worked_minutes: 570,
                        overtime_minutes: 90,
                        late_minutes: 0,
                        early_leave_minutes: 0,
                    },
                },
                24: {
                    leaves: [
                        {
                            id: 9,
                            kind: 'Annual',
                            type: 'HOURLY',
                            start_time: '10:00',
                            end_time: '12:00',
                            status: 'PENDING',
                        },
                    ],
                },
            }),
        });

        const monday = screen.getByTestId('day-14');
        expect(monday).toHaveTextContent('In 08:11 · Out 15:47');
        expect(monday).toHaveTextContent('Worked 7 h 36 m');
        expect(monday).toHaveTextContent('Late 11 m');
        expect(monday).not.toHaveTextContent('Overtime');
        expect(screen.getByTestId('day-15')).toHaveTextContent('Overtime 1 h 30 m');
        expect(screen.getByTestId('day-24')).toHaveTextContent('Annual 10:00–12:00 (pending)');
    });

    it("sums up the month's hours, overtime included", () => {
        renderPage();

        expect(screen.getByText('168 h')).toBeInTheDocument();
        expect(screen.getByText('7 h 36 m')).toBeInTheDocument();
        expect(screen.getByText('Overtime')).toBeInTheDocument();
        expect(screen.getByText('1 h 35 m')).toBeInTheDocument();
    });

    it('moves between months for the same person', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

        expect(router.visit).toHaveBeenCalledWith(
            expect.stringContaining('attendance.calendar.index'),
            expect.objectContaining({ data: { user_id: 3, month: '2026-10' } }),
        );
    });

    it('opens a recorded day, but not one without a record', () => {
        const recorded = {
            id: 40,
            status: 'PRESENT',
            status_label: 'Present',
            check_in: '08:11',
            check_out: '15:47',
            worked_minutes: 456,
        };
        renderPage({ canCorrect: true, days: september({ 14: { attendance: recorded } }) });

        fireEvent.click(screen.getByTestId('day-15'));
        expect(DayDialog).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Open 2026-09-14' }));
        expect(vi.mocked(DayDialog).mock.calls.at(-1)[0]).toEqual(
            expect.objectContaining({
                canCorrect: true,
                person: { id: 3, name: 'Sara Ahmed' },
                day: expect.objectContaining({ date: '2026-09-14', attendance: recorded }),
            }),
        );
    });

    it("exports the person's month, and all staff for attendance exporters", () => {
        renderPage();
        expect(screen.getByRole('link', { name: 'Export month' })).toHaveAttribute(
            'href',
            expect.stringContaining('attendance.calendar.export'),
        );
        expect(screen.queryByRole('link', { name: 'Export all staff' })).not.toBeInTheDocument();

        renderPage({ canExportAll: true });
        expect(screen.getByRole('link', { name: 'Export all staff' })).toBeInTheDocument();
    });

    it('lets only attendance viewers pick another person', () => {
        renderPage();
        expect(SelectSearch).not.toHaveBeenCalled();

        renderPage({ canViewOthers: true });
        expect(SelectSearch).toHaveBeenCalled();
    });
});
