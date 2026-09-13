import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import TatAlertRuleIndex from '@/Pages/TatAlertRule/Index';
import TableLayout from '@/Layouts/TableLayout';
import DeleteForm from '@/Components/DeleteForm';
import AddForm from '@/Pages/TatAlertRule/Components/AddForm';

const rule = {
    id: 7,
    name: 'Cultures due soon',
    days_left: 2,
    active: true,
    last_run_on: null,
    tests: [{ id: 1, name: 'Urine Culture' }],
    users: [{ id: 3, name: 'Sara Ahmed' }],
    roles: [{ id: 2, name: 'Lab Supervisor' }],
};

const props = {
    rules: { data: [rule], total: 1, current_page: 1 },
    requestInputs: {},
    status: null,
    success: false,
    errors: {},
};

vi.mock('@inertiajs/react', () => ({
    router: { post: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props }),
    Head: () => null,
}));

// Capture what the grid, dialogs and header receive; they are exercised on their own.
vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader.jsx', () => ({ default: ({ actions }) => actions }));
vi.mock('@/Components/DeleteForm', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/TatAlertRule/Components/AddForm', () => ({ default: vi.fn(() => null) }));

const tableProps = () => vi.mocked(TableLayout).mock.calls.at(-1)[0];
const column = (field) => tableProps().columns.find((col) => col.field === field);
const rowAction = (label) =>
    column('id')
        .getActions({ row: rule })
        .find((item) => item.props.label === label);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('TatAlertRule/Index', () => {
    it('describes the threshold in working days', () => {
        render(<TatAlertRuleIndex />);
        const { renderCell } = column('days_left');

        expect(renderCell({ value: 2 })).toBe('≤ 2 working days left');
        expect(renderCell({ value: 1 })).toBe('≤ 1 working day left');
        expect(renderCell({ value: 0 })).toBe('Due today or overdue');
    });

    it('lists roles and users together as recipients', () => {
        render(<TatAlertRuleIndex />);
        render(column('recipients').renderCell({ row: rule }));

        expect(screen.getByText('Lab Supervisor')).toBeInTheDocument();
        expect(screen.getByText('Sara Ahmed')).toBeInTheDocument();
    });

    it('collapses a long test list into a +N chip', () => {
        render(<TatAlertRuleIndex />);
        const tests = ['CBC', 'TSH', 'FBS', 'HbA1c', 'Lipid Profile'].map((name, id) => ({
            id,
            name,
        }));
        render(column('tests').renderCell({ row: { ...rule, tests } }));

        expect(screen.getByText('CBC')).toBeInTheDocument();
        expect(screen.queryByText('HbA1c')).not.toBeInTheDocument();
        expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('shows Never until the daily job has run the rule', () => {
        render(<TatAlertRuleIndex />);
        const { renderCell } = column('last_run_on');

        expect(renderCell({ value: null })).toBe('Never');
        expect(renderCell({ value: '2026-09-13' })).toBe('2026-09-13');
    });

    it('opens an empty form from the Add Alert button', () => {
        render(<TatAlertRuleIndex />);
        fireEvent.click(screen.getByRole('button', { name: /add alert/i }));

        const formProps = vi.mocked(AddForm).mock.calls.at(-1)[0];
        expect(formProps.open).toBe(true);
        expect(formProps.defaultValue).toBeNull();
    });

    it('opens the form with the row and a PUT override when editing', () => {
        render(<TatAlertRuleIndex />);
        act(() => rowAction('Edit').props.onClick());

        expect(vi.mocked(AddForm).mock.calls.at(-1)[0].defaultValue).toEqual({
            ...rule,
            _method: 'put',
        });
    });

    it('deletes the confirmed rule through a DELETE override', () => {
        render(<TatAlertRuleIndex />);
        act(() => rowAction('Delete').props.onClick());
        act(() => vi.mocked(DeleteForm).mock.calls.at(-1)[0].agreeCB());

        expect(router.post).toHaveBeenCalledWith(
            '/tat-alert-rules.destroy/7',
            { _method: 'delete' },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('reloads only the rule list when the grid pages, sorts or filters', () => {
        render(<TatAlertRuleIndex />);
        tableProps().reload(2, { search: 'cult' }, { field: 'id', sort: 'desc' }, 20);

        expect(router.visit).toHaveBeenCalledWith('/tat-alert-rules.index', {
            data: {
                page: 2,
                filters: { search: 'cult' },
                sort: { field: 'id', sort: 'desc' },
                pageSize: 20,
            },
            only: ['rules', 'status', 'success', 'requestInputs'],
        });
    });
});
