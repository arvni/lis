import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import LeaveRequestDetails from '@/Pages/Attendance/LeaveRequests/Components/LeaveRequestDetails';

vi.mock('@inertiajs/react', () => ({ router: { put: vi.fn() } }));

const leave = {
    id: 5,
    user: { id: 3, name: 'Sara Ahmed' },
    requested_by: { id: 3, name: 'Sara Ahmed' },
    kind: { id: 1, name: 'Annual' },
    type: 'DAILY',
    type_label: 'Full days',
    start_date: '2026-09-20',
    end_date: '2026-09-24',
    reason: 'Family visit',
    status: 'PENDING',
    status_label: 'Waiting for approval',
    created_at: '2026-09-17 10:00',
    approvals: [
        {
            id: 1,
            name: 'Supervisor review',
            approver: 'Lab Supervisor',
            status: 'PENDING',
            status_label: 'Waiting',
            due_at: '2026-09-19 10:00',
        },
        {
            id: 2,
            name: 'HR sign-off',
            approver: 'HR Officer',
            status: 'PENDING',
            status_label: 'Waiting',
            due_at: null,
        },
    ],
    can: { approve: false, cancel: false },
};

const renderDetails = (can = {}) =>
    render(<LeaveRequestDetails leave={{ ...leave, can: { ...leave.can, ...can } }} onClose={vi.fn()} />);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('LeaveRequestDetails', () => {
    it('lists the approval steps with who approves each', () => {
        renderDetails();

        expect(screen.getByText('Supervisor review · Lab Supervisor')).toBeInTheDocument();
        expect(screen.getByText('Due by 2026-09-19 10:00')).toBeInTheDocument();
        expect(screen.getByText('HR sign-off · HR Officer')).toBeInTheDocument();
    });

    it('offers nothing to do without a step waiting for the viewer', () => {
        renderDetails();

        expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel leave' })).not.toBeInTheDocument();
    });

    it('lets the approver approve with an optional note', () => {
        renderDetails({ approve: true });
        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        expect(router.put).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-requests.approve'),
            { notes: '' },
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('needs a reason to reject', () => {
        renderDetails({ approve: true });
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        const confirm = screen.getByRole('button', { name: 'Reject' });
        expect(confirm).toBeDisabled();

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Busy week' } });
        expect(confirm).toBeEnabled();
        fireEvent.click(confirm);

        expect(router.put).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-requests.reject'),
            { notes: 'Busy week' },
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('lets the person cancel their request', () => {
        renderDetails({ cancel: true });
        fireEvent.click(screen.getByRole('button', { name: 'Cancel leave' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel leave' }));

        expect(router.put).toHaveBeenCalledWith(
            expect.stringContaining('attendance.leave-requests.cancel'),
            { reason: '' },
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
