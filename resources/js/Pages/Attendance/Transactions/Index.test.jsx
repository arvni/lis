import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionIndex from '@/Pages/Attendance/Transactions/Index';
import TableLayout from '@/Layouts/TableLayout';
import ImportForm from '@/Pages/Attendance/Transactions/Components/ImportForm';

const IMPORT = 'Attendance.Transactions.Import Transactions';

let props;

vi.mock('@inertiajs/react', () => ({
    router: { visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions || null }));
vi.mock('@/Pages/Attendance/Transactions/Components/ImportForm', () => ({
    default: vi.fn(() => null),
}));

const column = (field) =>
    vi.mocked(TableLayout).mock.calls.at(-1)[0].columns.find((col) => col.field === field);

const renderPage = ({ permissions = [], importErrors = [] } = {}) => {
    props = {
        transactions: {
            data: [
                {
                    id: 1,
                    attendance_id: '00123',
                    access_date_and_time: '2026-09-14 08:11:04',
                    user: { id: 3, name: 'Sara Ahmed' },
                    imported_by: null,
                    imported_at: null,
                },
            ],
            total: 1,
            current_page: 1,
        },
        requestInputs: {},
        status: null,
        success: false,
        errors: {},
        auth: { permissions },
        import_errors: importErrors,
    };

    return render(<TransactionIndex />);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Attendance/Transactions/Index', () => {
    it('names the user a punch belongs to', () => {
        renderPage();
        render(column('user').renderCell({ value: { id: 3, name: 'Sara Ahmed' } }));

        expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });

    it('flags an Employee ID that matches no user', () => {
        renderPage();
        render(column('user').renderCell({ value: null }));

        expect(screen.getByText('Unmatched')).toBeInTheDocument();
    });

    it('passes the punches to the grid as they came', () => {
        renderPage();

        expect(vi.mocked(TableLayout).mock.calls.at(-1)[0].data).toBe(props.transactions);
    });

    it('marks punches imported from Excel apart from HikCentral ones', () => {
        renderPage();
        render(
            column('imported_by').renderCell({
                row: { imported_by: 'Omar Said', imported_at: '2026-09-17 18:00' },
            }),
        );
        render(column('imported_by').renderCell({ row: { imported_by: null } }));

        expect(screen.getByText('Imported')).toBeInTheDocument();
        expect(screen.getByText('HikCentral')).toBeInTheDocument();
    });

    it('offers the import only to people allowed to import', () => {
        renderPage();
        expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
        expect(ImportForm).not.toHaveBeenCalled();
    });

    it('opens the import form from the header', () => {
        renderPage({ permissions: [IMPORT] });
        expect(vi.mocked(ImportForm).mock.calls.at(-1)[0].open).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: 'Import' }));

        expect(vi.mocked(ImportForm).mock.calls.at(-1)[0].open).toBe(true);
    });

    it('lists the rows the last import skipped until dismissed', () => {
        renderPage({ importErrors: ['Row 3: no Employee ID.', 'Row 5: no date.'] });

        expect(screen.getByText('Row 3: no Employee ID.')).toBeInTheDocument();
        expect(screen.getByText('Row 5: no date.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByText('Row 3: no Employee ID.')).not.toBeInTheDocument();
    });
});
