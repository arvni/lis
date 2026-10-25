import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import NextStep from '@/Pages/PreOrder/Components/NextStep';

vi.mock('@inertiajs/react', () => ({ router: { post: vi.fn() } }));

const base = {
    can: {},
    stage: { code: 'UNDER_REVIEW', label: 'Under review', owner: 'bion', next_action: null },
    exception: null,
    closed_at: null,
    items: [],
    requests: [],
    quotations: [],
    finance_preview: [],
    referrer: { fullName: 'Muscat IVF' },
};

describe('NextStep', () => {
    it('lists what is missing before the tests can be confirmed', () => {
        const preOrder = {
            ...base,
            can: { confirm: true },
            items: [
                {
                    id: 1,
                    test_name: 'WES',
                    needs_method: true,
                    methods: [{ id: 3 }],
                    method_test_id: null,
                },
            ],
            requests: [{ number: 1, status: 'open' }],
        };
        render(<NextStep preOrder={preOrder} onTab={vi.fn()} />);

        expect(screen.getByText(/Choose the main test/)).toBeInTheDocument();
        expect(screen.getByText('Pick the method for WES')).toBeInTheDocument();
        expect(screen.getByText(/1 request\(s\) still waiting/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm tests & release' })).toBeDisabled();
    });

    it('sends BION to finance when the tests need a quotation', () => {
        const onTab = vi.fn();
        const preOrder = {
            ...base,
            can: { confirm: true },
            main_test: { id: 1, name: 'PGT-M' },
            assignee: { id: 1, name: 'Dr C' },
            finance_preview: ['bion_added'],
        };
        render(<NextStep preOrder={preOrder} onTab={onTab} />);

        fireEvent.click(screen.getByRole('button', { name: 'Prepare the quotation' }));
        expect(onTab).toHaveBeenCalledWith('finance');
    });

    it('says the center is deciding on an open quotation', () => {
        const preOrder = {
            ...base,
            can: { revise_quotation: true },
            stage: { ...base.stage, code: 'AWAITING_FINANCE', owner: 'center' },
            quotations: [{ number: 'Q-26-0001', status: 'awaiting_center' }],
        };
        render(<NextStep preOrder={preOrder} onTab={vi.fn()} />);

        expect(screen.getByText('Waiting on the center')).toBeInTheDocument();
        expect(screen.getByText('Waiting for the center to approve Q-26-0001')).toBeInTheDocument();
    });
});
