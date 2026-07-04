import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceEditForm from '@/Pages/Invoice/Components/InvoiceEditForm';
import InvoicePaymentManager from '@/Pages/Invoice/Components/InvoicePaymentManager.jsx';

vi.mock('@inertiajs/react', () => ({ router: { put: vi.fn() } }));

// The line-item grid and payment manager are heavy composites with their own tests; stub them
// so we exercise the container's save/validation + payment-mutation logic in isolation.
vi.mock('@/Pages/Invoice/Components/InvoiceItemsField.jsx', () => ({ default: vi.fn(() => null) }));
vi.mock('@/Pages/Invoice/Components/InvoicePaymentManager.jsx', () => ({
    default: vi.fn(() => null),
}));

const baseInvoice = {
    id: 7,
    invoiceNo: 'INV-7',
    status: 'Paid',
    owner_type: 'patient',
    patient: { id: 2, fullName: 'Jane Roe', idNo: 'A1', phone: '555' },
    invoice_items: [],
    payments: [],
};

const renderForm = (invoice, props = {}) =>
    render(<InvoiceEditForm invoice={invoice} open onClose={vi.fn()} {...props} />);

describe('Invoice/InvoiceEditForm — save + payment editing', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls onSubmit with the form data when status and owner are set', async () => {
        const onSubmit = vi.fn();
        renderForm(baseInvoice, { onSubmit });
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: 'Paid' }));
    });

    it('blocks submit when the owner type is missing', async () => {
        const onSubmit = vi.fn();
        renderForm({ ...baseInvoice, owner_type: undefined }, { onSubmit });
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows the create label and empty invoice number for a brand-new invoice', () => {
        renderForm({ status: 'Waiting', owner_type: 'patient', patient: { id: 1 } });
        expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
    });

    it('appends a new payment through the payment manager callback', () => {
        renderForm(baseInvoice, { onSubmit: vi.fn() });
        const { onPaymentChange } = InvoicePaymentManager.mock.calls.at(-1)[0];
        act(() => onPaymentChange({ price: 50, paymentMethod: 'Cash' }));

        const latest = InvoicePaymentManager.mock.calls.at(-1)[0];
        expect(latest.invoice.payments).toEqual([{ price: 50, paymentMethod: 'Cash' }]);
    });

    it('removes a payment when the callback signals a delete', () => {
        renderForm({ ...baseInvoice, payments: [{ id: 11, price: 30 }, { id: 12, price: 20 }] }, {
            onSubmit: vi.fn(),
        });
        const { onPaymentChange } = InvoicePaymentManager.mock.calls.at(-1)[0];
        act(() => onPaymentChange({ _method: 'delete', id: 11 }));

        const latest = InvoicePaymentManager.mock.calls.at(-1)[0];
        expect(latest.invoice.payments).toEqual([{ id: 12, price: 20 }]);
    });
});
