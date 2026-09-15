import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePage } from '@inertiajs/react';
import Print from '@/Pages/Inventory/PurchaseRequests/Print';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    Head: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

const request = (overrides = {}) => ({
    id: 42,
    po_number: 'PO-2026-0007',
    status: 'APPROVED',
    urgency: 'NORMAL',
    currency: null,
    notes: 'Deliver to the molecular lab',
    requested_by: { name: 'Sara Requester' },
    approved_by: { name: 'Omar Approver' },
    supplier: {
        name: 'Lab Supplies Co',
        city: 'Muscat',
        country: 'Oman',
        contacts: [
            { name: 'Backup', is_primary: false, email: 'backup@labsupplies.test' },
            { name: 'Ali', is_primary: true, email: 'ali@labsupplies.test' },
        ],
    },
    lines: [
        {
            id: 1,
            item: { name: 'Taq Polymerase', item_code: 'TAQ-500' },
            qty: '10.000000',
            estimated_unit_price: '45.0000',
            unit: { name: 'Vial' },
        },
        {
            id: 2,
            item: null,
            item_name: 'Filter tips 200µl',
            qty: '5.000000',
            estimated_unit_price: '12.5000',
            unit: { name: 'Box' },
        },
    ],
    ...overrides,
});

const renderPage = (props = {}) => {
    usePage.mockReturnValue({
        props: {
            purchaseRequest: request(),
            approvedAt: '2026-09-14T08:30:00+04:00',
            ...props,
        },
    });
    return render(<Print />);
};

describe('Inventory/PurchaseRequests/Print', () => {
    beforeEach(() => vi.clearAllMocks());

    it('prints the order number, supplier and priced lines with their total', () => {
        renderPage();

        expect(screen.getByText('PURCHASE ORDER')).toBeInTheDocument();
        expect(screen.getAllByText('PO-2026-0007').length).toBeGreaterThan(0);
        // ICU versions differ on "Sep" / "Sept".
        expect(screen.getAllByText(/14 Sept? 2026/).length).toBeGreaterThan(0);
        expect(screen.queryByText('PR #42')).not.toBeInTheDocument();
        expect(screen.queryByText('NORMAL')).not.toBeInTheDocument();
        expect(screen.getByText('Lab Supplies Co')).toBeInTheDocument();
        expect(screen.getByText('ali@labsupplies.test')).toBeInTheDocument();

        expect(screen.getByText('Taq Polymerase')).toBeInTheDocument();
        expect(screen.getByText('Filter tips 200µl')).toBeInTheDocument();
        // Internal identifiers stay off the supplier's copy.
        expect(screen.queryByText('TAQ-500')).not.toBeInTheDocument();
        expect(screen.queryByText('Not in catalogue')).not.toBeInTheDocument();
        expect(screen.getByText('450.000')).toBeInTheDocument();
        expect(screen.getByText('62.500')).toBeInTheDocument();
        expect(screen.getByText('Total (OMR)')).toBeInTheDocument();
        expect(screen.getByText('512.500')).toBeInTheDocument();
    });

    it('lists quantities only when the request carries no prices', () => {
        const lines = request().lines.map((line) => ({ ...line, estimated_unit_price: null }));
        renderPage({ purchaseRequest: request({ lines }) });

        expect(screen.queryByText('Unit Price')).not.toBeInTheDocument();
        expect(screen.queryByText(/^Total/)).not.toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it("signs with the chosen signer's signature and stamp, without an approval list", () => {
        renderPage({
            purchaseRequest: request({
                signer: {
                    name: 'Dr. Layla Signer',
                    title: 'Laboratory Director',
                    signature: '/documents/signature-doc/download',
                    stamp: '/documents/stamp-doc/download',
                },
            }),
        });

        expect(screen.getByText('Dr. Layla Signer')).toBeInTheDocument();
        expect(screen.getByText('Laboratory Director')).toBeInTheDocument();
        expect(screen.getByAltText('Signature of Dr. Layla Signer')).toHaveAttribute(
            'src',
            '/documents/signature-doc/download',
        );
        expect(screen.getByAltText('Stamp of Dr. Layla Signer')).toHaveAttribute(
            'src',
            '/documents/stamp-doc/download',
        );
        expect(screen.queryByText(/signatory/i)).not.toBeInTheDocument();
        expect(screen.queryByText('Approval')).not.toBeInTheDocument();
        expect(screen.queryByText(/Approved by/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Supplier acceptance/)).not.toBeInTheDocument();
    });

    it('leaves the signature space blank until a signer is chosen', () => {
        renderPage();

        expect(screen.queryByAltText(/^Signature of/)).not.toBeInTheDocument();
        expect(screen.queryByAltText(/^Stamp of/)).not.toBeInTheDocument();
    });

    it("prints the note to the supplier, never the request's own notes", () => {
        const lines = request().lines.map((line) => ({
            ...line,
            notes: 'Internal: check stock first',
        }));
        renderPage({
            purchaseRequest: request({ lines, po_notes: 'Deliver to the main store before 9 am.' }),
        });

        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Deliver to the main store before 9 am.')).toBeInTheDocument();
        expect(screen.queryByText('Deliver to the molecular lab')).not.toBeInTheDocument();
        expect(screen.queryByText('Internal: check stock first')).not.toBeInTheDocument();
    });

    it('has no Notes section without a note to the supplier', () => {
        renderPage();

        expect(screen.queryByText('Notes')).not.toBeInTheDocument();
        expect(screen.queryByText('Deliver to the molecular lab')).not.toBeInTheDocument();
    });

    it('marks a cancelled order', () => {
        renderPage({ purchaseRequest: request({ status: 'CANCELLED' }) });

        expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('has no supplier block until one is chosen', () => {
        renderPage({ purchaseRequest: request({ supplier: null }) });

        expect(screen.getByText('To be confirmed when the order is issued')).toBeInTheDocument();
    });
});
