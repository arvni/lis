import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import DayIndex, { formatMinutes } from '@/Pages/Attendance/Days/Index';
import TableLayout from '@/Layouts/TableLayout';

const day = {
    id: 12,
    date: '2026-09-14',
    weekday: 'Mon',
    user: { id: 3, name: 'Sara Ahmed' },
    shift: { id: 1, name: 'Morning' },
    scheduled_start: '08:00',
    scheduled_end: '16:00',
    check_in: '08:11',
    check_out: '15:47',
    status: 'PRESENT',
    status_label: 'Present',
    late_minutes: 11,
    early_leave_minutes: 12,
    worked_minutes: 456,
    is_manual: false,
    note: null,
    corrected_by: null,
    corrected_at: null,
};

let props;

vi.mock('@inertiajs/react', () => ({
    router: { put: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions || null }));
vi.mock('@/Pages/Attendance/Days/Components/CorrectionForm', () => ({ default: () => null }));

const column = (field) =>
    vi.mocked(TableLayout).mock.calls.at(-1)[0].columns.find((col) => col.field === field);

const renderPage = (permissions = []) => {
    props = {
        days: { data: [day], total: 1, current_page: 1 },
        statuses: [],
        requestInputs: {},
        status: null,
        success: false,
        errors: {},
        auth: { permissions },
    };

    return render(<DayIndex />);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('formatMinutes', () => {
    it('reads as hours and minutes', () => {
        expect(formatMinutes(456)).toBe('7 h 36 m');
        expect(formatMinutes(480)).toBe('8 h');
        expect(formatMinutes(11)).toBe('11 m');
        expect(formatMinutes(0)).toBe('—');
    });
});

describe('Attendance/Days/Index', () => {
    it('shows a corrected day as corrected', () => {
        renderPage();
        render(column('status').renderCell({ row: { ...day, is_manual: true, note: 'Forgot card' } }));

        expect(screen.getByText('Present')).toBeInTheDocument();
        expect(screen.getByText('Corrected')).toBeInTheDocument();
    });

    it('offers no corrections or export without permission', () => {
        renderPage();

        expect(
            column('id')
                .getActions({ row: day })
                .map((action) => action.props.label),
        ).toEqual(['Open month']);
        expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });

    it("opens the person's month on the calendar", () => {
        renderPage();
        column('id').getActions({ row: day })[0].props.onClick();

        expect(router.visit).toHaveBeenCalledWith(
            expect.stringContaining('attendance.calendar.index'),
        );
    });

    it('lets a permitted user correct a day, and recalculate it once corrected', () => {
        renderPage(['Attendance.Daily Attendance.Correct Attendance']);
        const labels = (row) =>
            column('id')
                .getActions({ row })
                .map((action) => action.props.label);

        expect(labels(day)).toEqual(['Open month', 'Correct']);
        expect(labels({ ...day, is_manual: true })).toEqual([
            'Open month',
            'Correct',
            'Recalculate from punches',
        ]);

        column('id')
            .getActions({ row: { ...day, is_manual: true } })[2]
            .props.onClick();
        expect(router.put).toHaveBeenCalledWith(
            expect.stringContaining('attendance.days.reset'),
            {},
            { preserveScroll: true },
        );
    });

    it('shows the overtime next to the worked time', () => {
        renderPage();
        const fields = vi.mocked(TableLayout).mock.calls.at(-1)[0].columns.map((col) => col.field);
        render(column('overtime_minutes').renderCell({ value: 70 }));

        expect(fields.indexOf('overtime_minutes')).toBe(fields.indexOf('worked_minutes') + 1);
        expect(screen.getByText('1 h 10 m')).toBeInTheDocument();
    });

    it('exports the rows being looked at', () => {
        renderPage(['Attendance.Daily Attendance.Export Attendance']);

        expect(screen.getByText('Export')).toBeInTheDocument();
    });
});
