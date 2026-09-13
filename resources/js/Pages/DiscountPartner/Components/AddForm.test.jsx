import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import AddForm from '@/Pages/DiscountPartner/Components/AddForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));

// The real picker fetches offers over axios; these tests are about the dialog around it.
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

const emptyPartner = {
    name: '',
    contract_no: '',
    contact: { person: '', phone: '', email: '', address: '' },
    starts_at: '',
    ends_at: '',
    active: true,
    notes: '',
    offers: [],
};

let form;

const mockForm = (overrides = {}) => {
    form = {
        data: emptyPartner,
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        setError: vi.fn(),
        ...overrides,
    };
    vi.mocked(useForm).mockReturnValue(form);
};

beforeEach(() => {
    vi.clearAllMocks();
    mockForm();
});

describe('DiscountPartner AddForm', () => {
    it('titles a new partner "Add New Discount Partner"', () => {
        render(<AddForm open onClose={vi.fn()} defaultValue={null} />);

        expect(
            screen.getByRole('heading', { name: 'Add New Discount Partner' }),
        ).toBeInTheDocument();
    });

    it('titles an existing partner "Edit Discount Partner" and posts to its update route', () => {
        const partner = { ...emptyPartner, id: 7, name: 'Acme Corp', _method: 'put' };
        mockForm({ data: partner });
        render(<AddForm open onClose={vi.fn()} defaultValue={partner} />);

        // FormProvider adds the "Edit" itself; the form must not say it twice.
        expect(screen.getByRole('heading', { name: 'Edit Discount Partner' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(form.post).toHaveBeenCalledWith('/discount-partners.update/7', expect.any(Object));
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same partner', () => {
        const onClose = vi.fn();
        const { rerender } = render(<AddForm open onClose={onClose} defaultValue={null} />);
        form.setData.mockClear();

        rerender(<AddForm open onClose={onClose} defaultValue={null} />);

        expect(form.setData).not.toHaveBeenCalled();
    });
});
