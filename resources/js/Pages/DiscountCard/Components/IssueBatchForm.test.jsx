import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import IssueBatchForm from '@/Pages/DiscountCard/Components/IssueBatchForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

const emptyBatch = {
    partner: null,
    discount_partner_id: '',
    quantity: 50,
    prefix: '',
    number_template: 'DDDD-DDDD-DDDD-DDDD',
    serial_from: 1,
    expires_at: '',
    usage_limit: '',
    notes: '',
    activate_immediately: false,
};

let form;

beforeEach(() => {
    vi.clearAllMocks();
    form = {
        data: emptyBatch,
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

describe('DiscountCard IssueBatchForm', () => {
    it('starts a new batch of 50 cards', () => {
        render(<IssueBatchForm open onClose={vi.fn()} />);

        expect(useForm).toHaveBeenCalledWith(emptyBatch);
        expect(screen.getByRole('heading', { name: 'Add New Card Batch' })).toBeInTheDocument();
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders', () => {
        const onClose = vi.fn();
        const { rerender } = render(<IssueBatchForm open onClose={onClose} />);
        form.setData.mockClear();

        rerender(<IssueBatchForm open onClose={onClose} />);

        expect(resets()).toEqual([]);
    });
});
