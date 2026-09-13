import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, within } from '@testing-library/react';
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

const withInvoice = {
    id: 1,
    patient: { fullName: 'A' },
    invoice: {
        id: 9,
        invoice_items_sum_price: '30.000',
        invoice_items_sum_discount: '0.000',
        payments_sum_price: '30.000',
    },
};
const withoutInvoice = { id: 2, patient: { fullName: 'B' }, invoice: null };
const partlyPaid = {
    id: 3,
    patient: { fullName: 'C' },
    invoice: {
        id: 10,
        invoice_items_sum_price: '50.000',
        invoice_items_sum_discount: '0.000',
        payments_sum_price: '20.000',
    },
};

const renderPage = () => {
    pageProps = {
        acceptances: { data: [withInvoice, withoutInvoice, partlyPaid] },
        status: null,
        errors: {},
        success: null,
        requestInputs: {},
    };
    render(<FinancialCheck />);
};

const column = (field) => {
    const { columns } = vi.mocked(TableLayout).mock.calls.at(-1)[0];

    return columns.find((c) => c.field === field);
};

const approveButtonFor = (row) =>
    column('actions')
        .getActions({ row })
        .find((action) => action.key === `approve-${row.id}`);

const invoiceCellFor = (row) => {
    const { container } = render(column('invoice_status').renderCell({ row }));

    return within(container);
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

    // The confirmation is where a not fully paid invoice is explained and
    // blocked, so the row still opens it rather than failing silently.
    it('opens the confirmation for a partly paid invoice', () => {
        renderPage();

        act(() => approveButtonFor(partlyPaid).props.onClick());

        expect(confirmProps().acceptance).toBe(partlyPaid);
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

describe('Acceptance/FinancialCheck invoice status', () => {
    it('marks an invoice with a balance owing as not fully paid, with what remains', () => {
        renderPage();

        const cell = invoiceCellFor(partlyPaid);

        expect(cell.getByText('Not Fully Paid')).toBeInTheDocument();
        expect(cell.getByText(/Remaining: .*30\.000 of .*50\.000/)).toBeInTheDocument();
    });

    it('marks a fully paid invoice with its total', () => {
        renderPage();

        const cell = invoiceCellFor(withInvoice);

        expect(cell.getByText('Fully Paid')).toBeInTheDocument();
        expect(cell.getByText(/Total: .*30\.000/)).toBeInTheDocument();
    });

    it('marks an acceptance without an invoice', () => {
        renderPage();

        expect(invoiceCellFor(withoutInvoice).getByText('No Invoice')).toBeInTheDocument();
    });
});
