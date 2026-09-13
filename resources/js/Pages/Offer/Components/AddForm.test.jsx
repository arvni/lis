import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import AddForm from '@/Pages/Offer/Components/AddForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

const emptyOffer = {
    title: '',
    description: '',
    type: 'PERCENTAGE',
    amount: '',
    tests: [],
    referrers: [],
    started_at: '',
    ended_at: '',
    active: true,
    contract_only: false,
};

let form;

const mockForm = (data) => {
    form = {
        data,
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
    };
    vi.mocked(useForm).mockReturnValue(form);
};

beforeEach(() => {
    vi.clearAllMocks();
    mockForm(emptyOffer);
});

// FormProvider resets the form by handing setData a whole object; field edits pass updaters.
const resets = () => form.setData.mock.calls.filter(([arg]) => typeof arg !== 'function');

describe('Offer AddForm', () => {
    it('titles a new offer "Add New Offer"', () => {
        render(<AddForm open onClose={vi.fn()} defaultValue={null} />);

        expect(useForm).toHaveBeenCalledWith(emptyOffer);
        expect(screen.getByRole('heading', { name: 'Add New Offer' })).toBeInTheDocument();
    });

    it('titles an existing offer "Edit Offer", not "Edit Edit Offer"', () => {
        const offer = { ...emptyOffer, id: 4, title: 'Staff 20%', _method: 'put' };
        mockForm(offer);
        render(<AddForm open onClose={vi.fn()} defaultValue={offer} />);

        expect(screen.getByRole('heading', { name: 'Edit Offer' })).toBeInTheDocument();
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same offer', () => {
        const onClose = vi.fn();
        const { rerender } = render(<AddForm open onClose={onClose} defaultValue={null} />);
        form.setData.mockClear();

        rerender(<AddForm open onClose={onClose} defaultValue={null} />);

        expect(resets()).toEqual([]);
    });
});
