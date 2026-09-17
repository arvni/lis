import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { router } from '@inertiajs/react';
import SelectSearch from '@/Components/SelectSearch';
import LeaveUsageIndex, { formatLeaveAmount } from '@/Pages/Attendance/LeaveUsage/Index';

let props;

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions ?? null }));
vi.mock('@/Components/SelectSearch', () => ({ default: vi.fn(() => null) }));

const line = (kind, amounts = {}) => ({
    kind,
    taken_days: 0,
    taken_minutes: 0,
    booked_days: 0,
    booked_minutes: 0,
    pending_days: 0,
    pending_minutes: 0,
    ...amounts,
});

const usage = {
    from: '2026-01-01',
    to: '2026-12-31',
    total: line('Total', { taken_days: 5, taken_minutes: 120, booked_days: 1, pending_days: 5 }),
    kinds: [
        line('Annual', { taken_days: 5, taken_minutes: 120, booked_days: 1 }),
        line('Sick', { pending_days: 5 }),
    ],
    requests: [
        {
            id: 1,
            kind: 'Annual',
            type: 'HOURLY',
            start_date: '2026-09-08',
            end_date: '2026-09-08',
            start_time: '07:00',
            end_time: '10:00',
            status: 'APPROVED',
            status_label: 'Approved',
            days: 0,
            minutes: 120,
        },
        {
            id: 2,
            kind: 'Sick',
            type: 'DAILY',
            start_date: '2026-12-27',
            end_date: '2027-01-02',
            start_time: null,
            end_time: null,
            status: 'PENDING',
            status_label: 'Waiting for approval',
            days: 5,
            minutes: 0,
        },
    ],
};

const renderPage = (overrides = {}) => {
    props = {
        view: 'person',
        year: 2026,
        person: { id: 3, name: 'Sara Ahmed' },
        usage,
        staff: null,
        canViewOthers: false,
        ...overrides,
    };

    return render(<LeaveUsageIndex />);
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-17T12:00:00'));
});

describe('formatLeaveAmount', () => {
    it('reads as working days and hours', () => {
        expect(formatLeaveAmount(5, 120)).toBe('5 days · 2 h');
        expect(formatLeaveAmount(1, 0)).toBe('1 day');
        expect(formatLeaveAmount(0, 90)).toBe('1 h 30 m');
        expect(formatLeaveAmount(0, 0)).toBe('—');
    });
});

describe('Attendance/LeaveUsage/Index', () => {
    it("shows the person's leave taken, booked and waiting, by kind and request", () => {
        renderPage();

        expect(screen.getByTestId('total-taken')).toHaveTextContent('5 days · 2 h');
        expect(screen.getByTestId('total-booked')).toHaveTextContent('1 day');
        expect(screen.getByTestId('total-pending')).toHaveTextContent('5 days');

        const sick = screen.getByRole('row', { name: /^Sick/ });
        expect(
            within(sick)
                .getAllByRole('cell')
                .map((cell) => cell.textContent),
        ).toEqual(['Sick', '—', '—', '5 days']);
        expect(screen.getByText('2026-12-27 → 2027-01-02')).toBeInTheDocument();
        expect(
            screen.getByText('Waiting for approval', { selector: '.MuiChip-label' }),
        ).toBeInTheDocument();
    });

    it('says so when there is no leave in the year', () => {
        renderPage({ usage: { ...usage, total: line('Total'), kinds: [], requests: [] } });

        expect(screen.getAllByText('No approved or pending leave in 2026.')).toHaveLength(2);
    });

    it('moves between years for the same person', () => {
        renderPage({ canViewOthers: true });
        fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));

        expect(router.visit).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-usage.index'),
            expect.objectContaining({ data: { user_id: 3, year: 2025 } }),
        );
        expect(screen.getByRole('button', { name: 'This year' })).toBeDisabled();
    });

    it('offers other people and all staff only to leave managers', () => {
        renderPage();
        expect(screen.queryByRole('tab', { name: 'All staff' })).not.toBeInTheDocument();
        expect(SelectSearch).not.toHaveBeenCalled();

        renderPage({ canViewOthers: true });
        expect(SelectSearch).toHaveBeenCalled();
        fireEvent.click(screen.getByRole('tab', { name: 'All staff' }));
        expect(router.visit).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-usage.index'),
            expect.objectContaining({ data: { view: 'staff', year: 2026 } }),
        );
    });

    it('lists all staff and opens a person from the list', () => {
        renderPage({
            view: 'staff',
            person: null,
            usage: null,
            canViewOthers: true,
            staff: [
                {
                    user: { id: 8, name: 'Omar Said' },
                    ...line('Total', { taken_days: 2, pending_minutes: 120 }),
                    kinds: [
                        line('Annual', { taken_days: 2 }),
                        line('Sick', { pending_minutes: 120 }),
                    ],
                },
            ],
        });

        const omar = screen.getByRole('row', { name: /^Omar Said/ });
        expect(
            within(omar)
                .getAllByRole('cell')
                .map((cell) => cell.textContent),
        ).toEqual(['Omar Said', '2 days', '—', '2 h', 'Annual 2 days']);
        expect(SelectSearch).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Omar Said' }));
        expect(router.visit).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-usage.index'),
            expect.objectContaining({ data: { user_id: 8, year: 2026 } }),
        );
    });
});
