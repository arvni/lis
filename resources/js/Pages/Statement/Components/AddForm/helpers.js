// Build initial selectedInvoiceDetails from defaultValue.invoices (edit mode)
export function buildInitialDetails(invoices) {
    if (!invoices?.length) return {};
    return Object.fromEntries(invoices.map((inv) => [inv.id, inv]));
}
