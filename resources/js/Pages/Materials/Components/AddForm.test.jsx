import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import AddForm from '@/Pages/Materials/Components/AddForm';
import { emptyTube } from '@/Pages/Materials/Components/AddForm/constants';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

let form;

beforeEach(() => {
    vi.clearAllMocks();
    form = {
        data: { sample_type: null, number_of_tubes: 1, tubes: [emptyTube()] },
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

describe('Materials AddForm', () => {
    it('titles the dialog "Add New Material" and starts with one tube', () => {
        render(<AddForm open onClose={vi.fn()} defaultValue={null} />);

        expect(useForm).toHaveBeenCalledWith(
            expect.objectContaining({ sample_type: null, number_of_tubes: 1 }),
        );
        expect(screen.getByRole('heading', { name: 'Add New Material' })).toBeInTheDocument();
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders', () => {
        const onClose = vi.fn();
        const { rerender } = render(<AddForm open onClose={onClose} defaultValue={null} />);
        form.setData.mockClear();

        rerender(<AddForm open onClose={onClose} defaultValue={null} />);

        expect(resets()).toEqual([]);
    });
});
