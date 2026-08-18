import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { router } from '@inertiajs/react';
import FinancialCheck from '@/Pages/Acceptance/FinancialCheck';
import TableLayout from '@/Layouts/TableLayout';
import ApproveFinancialConfirm from '@/Pages/Acceptance/Components/ApproveFinancialConfirm';

let pageProps;

vi.mock('@inertiajs/react', () => ({
    router: { put: vi.fn(), visit: vi.fn() },
    Head: () => null,
    usePage: () => ({ props: pageProps }),
    useForm: () => ({ data: {}, setData: vi.fn(), reset: vi.fn() }),
}));

// The grid itself is noise here — capture the column definitions instead.
vi.mock('@/Layouts/TableLayout', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/Acceptance/Components/ApproveFinancialConfirm', () => ({
    default: vi.fn(() => null),
}));
vi.mock('@/Layouts/AuthenticatedLayout', () => ({ default: () => null }));
vi.mock('@/Components/PageHeader', () => ({ default: () => null }));
vi.mock('./Components/Filter', () => ({ default: () => null }));
vi.mock('@/Pages/Invoice/Components/InvoiceEditForm', () => ({ default: () => null }));
vi.mock('@/Pages/Acceptance/Components/CreateInvoiceForm', () => ({ default: () => null }));

const withInvoice = { id: 1, patient: { fullName: 'A' }, invoice: { id: 9, total: 30 } };
const withoutInvoice = { id: 2, patient: { fullName: 'B' }, invoice: null };

const renderPage = () => {
    pageProps = {
        acceptances: { data: [withInvoice, withoutInvoice] },
        status: null,
        errors: {},
        success: null,
        requestInputs: {},
    };
    render(<FinancialCheck />);
};

const approveButtonFor = (row) => {
    const { columns } = vi.mocked(TableLayout).mock.calls.at(-1)[0];
    const actions = columns.find((c) => c.field === 'actions').getActions({ row });

    return actions.find((action) => action.key === `approve-${row.id}`);
};

const confirmProps = () => vi.mocked(ApproveFinancialConfirm).mock.calls.at(-1)[0];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Acceptance/FinancialCheck approval', () => {
    it('offers approval on an uninvoiced acceptance instead of disabling it', () => {
        renderPage();

        expect(approveButtonFor(withoutInvoice).props.disabled).toBe(false);
    });

    it('opens the confirmation with the row before sending anything', () => {
        renderPage();

        act(() => approveButtonFor(withoutInvoice).props.onClick());

        expect(confirmProps().open).toBe(true);
        expect(confirmProps().acceptance).toBe(withoutInvoice);
        expect(router.put).not.toHaveBeenCalled();
    });

    // The endpoint refuses an uninvoiced acceptance unless the reviewer
    // acknowledged the missing invoice here.
    it('sends the acknowledgement when approving without an invoice', () => {
        renderPage();

        act(() => approveButtonFor(withoutInvoice).props.onClick());
        act(() => confirmProps().onConfirm());

        const [, data] = vi.mocked(router.put).mock.calls[0];
        expect(data).toEqual({ approve_without_invoice: true });
    });

    it('does not send the acknowledgement when an invoice exists', () => {
        renderPage();

        act(() => approveButtonFor(withInvoice).props.onClick());
        act(() => confirmProps().onConfirm());

        const [, data] = vi.mocked(router.put).mock.calls[0];
        expect(data).toEqual({ approve_without_invoice: false });
    });

    it('sends nothing when the confirmation is cancelled', () => {
        renderPage();

        act(() => approveButtonFor(withoutInvoice).props.onClick());
        act(() => confirmProps().onCancel());

        expect(confirmProps().open).toBe(false);
        expect(router.put).not.toHaveBeenCalled();
    });
});
