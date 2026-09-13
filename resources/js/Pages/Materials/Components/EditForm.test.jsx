import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import EditForm from '@/Pages/Materials/Components/EditForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

const material = {
    id: 9,
    sample_type_id: 2,
    sample_type_name: 'Blood',
    packing_series: 'P-1',
    tube_series: 'T-1',
    barcode: 'B-1',
    tube_barcode: 'TB-1',
    manufactured_date: '2026-01-01T00:00:00',
    expire_date: '2027-01-01',
    assigned_at: null,
    referrer: { id: 3, fullName: 'Dr Salim' },
};

const formData = {
    id: 9,
    _method: 'put',
    sample_type: { id: 2, name: 'Blood' },
    packing_series: 'P-1',
    tube_series: 'T-1',
    barcode: 'B-1',
    tube_barcode: 'TB-1',
    manufactured_date: '2026-01-01',
    expire_date: '2027-01-01',
    assigned_at: '',
    referrer: { id: 3, name: 'Dr Salim' },
};

let form;

beforeEach(() => {
    vi.clearAllMocks();
    form = {
        data: formData,
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

describe('Materials EditForm', () => {
    it('prefills the material and titles the dialog "Edit Material"', () => {
        render(<EditForm open onClose={vi.fn()} defaultValue={material} />);

        expect(useForm).toHaveBeenCalledWith(formData);
        expect(screen.getByRole('heading', { name: 'Edit Material' })).toBeInTheDocument();
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same material', () => {
        const onClose = vi.fn();
        const { rerender } = render(<EditForm open onClose={onClose} defaultValue={material} />);
        form.setData.mockClear();

        rerender(<EditForm open onClose={onClose} defaultValue={material} />);

        expect(resets()).toEqual([]);
    });
});
