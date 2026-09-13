import { describe, it, expect } from 'vitest';
import { invoicePaymentStanding } from '@/Pages/Acceptance/Components/invoicePayment';

// The list sends the sums as decimal strings.
const invoice = (price, discount, paid) => ({
    invoice_items_sum_price: price,
    invoice_items_sum_discount: discount,
    payments_sum_price: paid,
});

describe('invoicePaymentStanding', () => {
    it('reports the balance owing on a partly paid invoice', () => {
        expect(invoicePaymentStanding(invoice('50.000', '0.000', '20.000'))).toEqual({
            total: 50,
            paid: 20,
            remaining: 30,
            fullyPaid: false,
        });
    });

    it('takes line discounts off the total', () => {
        const standing = invoicePaymentStanding(invoice('50.000', '10.000', '40.000'));

        expect(standing.total).toBe(40);
        expect(standing.remaining).toBe(0);
        expect(standing.fullyPaid).toBe(true);
    });

    it('never reports a negative remaining when overpaid', () => {
        const standing = invoicePaymentStanding(invoice('50.000', '0.000', '60.000'));

        expect(standing.remaining).toBe(0);
        expect(standing.fullyPaid).toBe(true);
    });

    it('is not thrown by floating-point drift in the sums', () => {
        const standing = invoicePaymentStanding(invoice(0.3, 0, 0.1 + 0.2));

        expect(standing.fullyPaid).toBe(true);
        expect(standing.remaining).toBe(0);
    });

    // Matches the server: nothing owed means nothing to wait for.
    it('treats an invoice with no lines or payments as fully paid', () => {
        expect(invoicePaymentStanding({ id: 1 })).toEqual({
            total: 0,
            paid: 0,
            remaining: 0,
            fullyPaid: true,
        });
    });
});
