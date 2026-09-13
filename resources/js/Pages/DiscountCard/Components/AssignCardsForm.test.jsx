import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from '@inertiajs/react';
import AssignCardsForm from '@/Pages/DiscountCard/Components/AssignCardsForm';

vi.mock('@inertiajs/react', () => ({ useForm: vi.fn() }));
vi.mock('@/Components/SelectSearch', () => ({ default: () => null }));

const selectedCards = [
    { id: 1, number: 'ACME-0001' },
    { id: 2, number: 'ACME-0002' },
];

let form;

beforeEach(() => {
    vi.clearAllMocks();
    form = {
        data: {
            partner: null,
            discount_partner_id: '',
            card_ids: [1, 2],
            discount_card_batch_id: '',
            serial_from: '',
            serial_to: '',
        },
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

describe('DiscountCard AssignCardsForm', () => {
    it('seeds the form with the ticked cards', () => {
        render(<AssignCardsForm open onClose={vi.fn()} selectedCards={selectedCards} />);

        expect(useForm).toHaveBeenCalledWith(expect.objectContaining({ card_ids: [1, 2] }));
    });

    // A validation error re-renders the page; that must not reset what the user entered.
    it('keeps the entered values when the page re-renders with the same selection', () => {
        const onClose = vi.fn();
        const { rerender } = render(
            <AssignCardsForm open onClose={onClose} selectedCards={selectedCards} />,
        );
        form.setData.mockClear();

        rerender(<AssignCardsForm open onClose={onClose} selectedCards={selectedCards} />);

        expect(resets()).toEqual([]);
    });
});
