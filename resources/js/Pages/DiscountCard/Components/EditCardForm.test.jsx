import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import EditCardForm from '@/Pages/DiscountCard/Components/EditCardForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

const card = {
    id: 7,
    number: 'ACME-0001',
    status: 'Active',
    expires_at: '2026-12-31',
    usage_limit: 3,
};
const statuses = ['Active', 'Inactive'];

let form;

beforeEach(() => {
    vi.clearAllMocks();
    form = {
        data: { id: 7, _method: 'put', status: 'Active', expires_at: '2026-12-31', usage_limit: 3 },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
    };
    vi.mocked(useForm).mockReturnValue(form);
});

// FormProvider resets the form by handing setData a whole object; field edits pass updaters.
const resets = () => form.setData.mock.calls.filter(([arg]) => typeof arg !== 'function');

describe('DiscountCard EditCardForm', () => {
    it('titles the dialog as an edit of the card rather than "Add New"', () => {
        render(<EditCardForm open onClose={vi.fn()} card={card} statuses={statuses} />);

        expect(useForm).toHaveBeenCalledWith(expect.objectContaining({ id: 7, _method: 'put' }));
        expect(screen.getByRole('heading', { name: 'Edit Card ACME-0001' })).toBeInTheDocument();
    });

    it('posts to the card update route', () => {
        render(<EditCardForm open onClose={vi.fn()} card={card} statuses={statuses} />);
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(form.post).toHaveBeenCalledWith('/discount-cards.update/7', expect.any(Object));
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same card', () => {
        const onClose = vi.fn();
        const { rerender } = render(
            <EditCardForm open onClose={onClose} card={card} statuses={statuses} />,
        );
        form.setData.mockClear();

        rerender(<EditCardForm open onClose={onClose} card={card} statuses={statuses} />);

        expect(resets()).toEqual([]);
    });
});
