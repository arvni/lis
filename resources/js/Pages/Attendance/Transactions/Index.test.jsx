import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TransactionIndex from '@/Pages/Attendance/Transactions/Index';
import TableLayout from '@/Layouts/TableLayout';

const props = {
    transactions: {
        data: [
            {
                id: 1,
                attendance_id: '00123',
                access_date_and_time: '2026-09-14 08:11:04',
                user: { id: 3, name: 'Sara Ahmed' },
            },
        ],
        total: 1,
        current_page: 1,
    },
    requestInputs: {},
    status: null,
    success: false,
    errors: {},
};

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: () => null }));

const column = (field) =>
    vi.mocked(TableLayout).mock.calls.at(-1)[0].columns.find((col) => col.field === field);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Attendance/Transactions/Index', () => {
    it('names the user a punch belongs to', () => {
        render(<TransactionIndex />);
        render(column('user').renderCell({ value: { id: 3, name: 'Sara Ahmed' } }));

        expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });

    it('flags an Employee ID that matches no user', () => {
        render(<TransactionIndex />);
        render(column('user').renderCell({ value: null }));

        expect(screen.getByText('Unmatched')).toBeInTheDocument();
    });

    it('passes the punches to the grid as they came', () => {
        render(<TransactionIndex />);

        expect(vi.mocked(TableLayout).mock.calls.at(-1)[0].data).toBe(props.transactions);
    });
});
