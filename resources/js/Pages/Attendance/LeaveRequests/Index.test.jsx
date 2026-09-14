import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeaveRequestIndex from '@/Pages/Attendance/LeaveRequests/Index';
import { currentStepLabel, formatLeavePeriod } from '@/Pages/Attendance/LeaveRequests/leaveFormat';

let props;

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn(), put: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/TableLayout', () => ({ default: () => null }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions }));
vi.mock('@/Pages/Attendance/LeaveRequests/Components/LeaveRequestForm', () => ({
    default: () => null,
}));
vi.mock('@/Pages/Attendance/LeaveRequests/Components/LeaveRequestDetails', () => ({
    default: () => null,
}));

const pending = {
    id: 5,
    type: 'DAILY',
    start_date: '2026-09-20',
    end_date: '2026-09-24',
    status: 'PENDING',
    status_label: 'Waiting for approval',
    approvals: [
        { id: 1, status: 'APPROVED', approver: 'Lab Supervisor' },
        { id: 2, status: 'PENDING', approver: 'HR Officer' },
    ],
};

const renderPage = (canManage = false, scope = 'mine') => {
    props = {
        requests: { data: [pending], total: 1, current_page: 1 },
        kinds: [],
        statuses: [],
        canManage,
        requestInputs: { filters: { scope } },
        status: null,
        success: false,
        errors: {},
    };

    return render(<LeaveRequestIndex />);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('leave formatting', () => {
    it('reads the dates of full-day and hourly leave', () => {
        expect(formatLeavePeriod(pending)).toBe('2026-09-20 → 2026-09-24');
        expect(formatLeavePeriod({ ...pending, end_date: '2026-09-20' })).toBe('2026-09-20');
        expect(
            formatLeavePeriod({
                type: 'HOURLY',
                start_date: '2026-09-16',
                end_date: '2026-09-16',
                start_time: '08:00',
                end_time: '10:00',
            }),
        ).toBe('2026-09-16 · 08:00–10:00');
    });

    it('names who a pending request is waiting for', () => {
        expect(currentStepLabel(pending)).toBe('Waiting for HR Officer');
        expect(currentStepLabel({ ...pending, status: 'APPROVED', status_label: 'Approved' })).toBe(
            'Approved',
        );
    });
});

describe('Attendance/LeaveRequests/Index', () => {
    it('shows everyone their requests and those waiting for them', () => {
        renderPage();

        expect(screen.getByRole('tab', { name: 'My requests' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Awaiting my approval' })).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'All requests' })).not.toBeInTheDocument();
        expect(screen.getByText('Request leave')).toBeInTheDocument();
    });

    it('shows all requests to leave managers only', () => {
        renderPage(true, 'all');

        expect(screen.getByRole('tab', { name: 'All requests' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });
});
