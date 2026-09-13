const round = (amount) => Math.round(amount * 1000) / 1000;

/**
 * Where an invoice stands on payment, from the sums the financial-check list
 * loads with it. Mirrors Invoice::isPaid() on the server — payments must cover
 * the invoice lines' price less their discount — which financial approval
 * requires.
 */
export const invoicePaymentStanding = (invoice) => {
    const total = round(
        Number(invoice?.invoice_items_sum_price || 0) -
            Number(invoice?.invoice_items_sum_discount || 0),
    );
    const paid = round(Number(invoice?.payments_sum_price || 0));

    return {
        total,
        paid,
        remaining: Math.max(0, round(total - paid)),
        fullyPaid: paid >= total,
    };
};
