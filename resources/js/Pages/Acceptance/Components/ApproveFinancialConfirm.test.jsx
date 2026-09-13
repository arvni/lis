import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApproveFinancialConfirm from '@/Pages/Acceptance/Components/ApproveFinancialConfirm';

const formatCurrency = (amount) => Number(amount).toFixed(3);

const renderDialog = (invoice) =>
    render(
        <ApproveFinancialConfirm
            open
            acceptance={{ id: 7, patient: { fullName: 'A' }, invoice }}
            formatCurrency={formatCurrency}
            onCancel={vi.fn()}
            onConfirm={vi.fn()}
        />,
    );

const approveButton = () => screen.getByRole('button', { name: /approve/i });

describe('Acceptance/ApproveFinancialConfirm', () => {
    // The endpoint refuses it as well; the dialog says why up front.
    it('shows an error and blocks approval when the invoice is not fully paid', () => {
        renderDialog({
            id: 9,
            invoice_items_sum_price: '50.000',
            invoice_items_sum_discount: '0.000',
            payments_sum_price: '20.000',
        });

        expect(screen.getByText(/needs to be fully paid/i)).toBeInTheDocument();
        expect(screen.getByText(/Remaining: 30\.000/)).toBeInTheDocument();
        expect(approveButton()).toBeDisabled();
    });

    it('allows approval once payments cover the total less discount', () => {
        renderDialog({
            id: 9,
            invoice_items_sum_price: '50.000',
            invoice_items_sum_discount: '10.000',
            payments_sum_price: '40.000',
        });

        expect(screen.queryByText(/needs to be fully paid/i)).not.toBeInTheDocument();
        expect(approveButton()).toBeEnabled();
    });

    it('still allows a deliberate approval without an invoice', () => {
        renderDialog(null);

        expect(screen.getByRole('button', { name: 'Approve Without Invoice' })).toBeEnabled();
    });
});
