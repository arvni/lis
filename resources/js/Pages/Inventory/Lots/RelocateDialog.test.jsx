import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RelocateDialog from '@/Pages/Inventory/Lots/RelocateDialog';

const post = vi.fn();

vi.mock('@inertiajs/react', async () => {
    const { useState } = await vi.importActual('react');

    // A stand-in for Inertia's useForm that keeps data in real React state, so
    // the dialog re-renders on every edit the way it does in the app.
    return {
        useForm: (initial) => {
            const [data, setDataState] = useState(initial);

            return {
                data,
                setData: (keyOrObject, value) =>
                    setDataState((current) =>
                        typeof keyOrObject === 'function'
                            ? keyOrObject(current)
                            : typeof keyOrObject === 'object'
                              ? { ...keyOrObject }
                              : { ...current, [keyOrObject]: value },
                    ),
                post,
                processing: false,
                errors: {},
                reset: () => {},
                clearErrors: () => {},
            };
        },
    };
});

// LocationSelect loads the destination store's locations over the network;
// this dialog's own rules are what is under test, so stub it out.
vi.mock('@/Pages/Inventory/Components/LocationSelect', () => ({
    default: ({ label }) => <div>{label}</div>,
}));

const stores = [
    { id: 1, name: 'Main Store' },
    { id: 2, name: 'Annex Store' },
];

const lot = {
    id: 7,
    lot_number: 'LN-555',
    quantity_base_units: '10.000000',
    store_id: 1,
    store_location_id: 3,
    store: { name: 'Main Store' },
    location: { label: 'Shelf A1' },
    item: { default_unit: { name: 'Vial' } },
};

const renderDialog = (overrides = {}) =>
    render(
        <RelocateDialog open onClose={() => {}} lot={{ ...lot, ...overrides }} stores={stores} />,
    );

const quantityField = () => screen.getByLabelText(/Quantity to move/i);

describe('Inventory/Lots/RelocateDialog', () => {
    beforeEach(() => {
        post.mockClear();
    });

    it('starts with the full quantity on hand', () => {
        renderDialog();

        expect(quantityField()).toHaveValue(10);
        expect(screen.getByText('The whole lot moves.')).toBeInTheDocument();
    });

    it('says how much stays behind when only part of the lot moves', () => {
        renderDialog();

        fireEvent.change(quantityField(), { target: { value: '4' } });

        expect(screen.getByText('6.0000 stays behind at the current place.')).toBeInTheDocument();
    });

    it('blocks moving more than the lot holds', () => {
        renderDialog();

        fireEvent.change(quantityField(), { target: { value: '11' } });

        expect(screen.getByText('The lot only holds 10.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Move Stock/i })).toBeDisabled();
        expect(post).not.toHaveBeenCalled();
    });

    it('blocks a move that would leave the stock where it already is', () => {
        // Same store, and no destination location picked while the lot has none.
        renderDialog({ store_location_id: null, location: null });

        expect(screen.getByRole('button', { name: /Move Stock/i })).toBeDisabled();
    });

    it('warns that a cross-store move skips the transfer approval flow', () => {
        renderDialog();

        fireEvent.change(quantityField(), { target: { value: '10' } });
        fireEvent.mouseDown(screen.getByRole('combobox', { name: /Destination store/i }));
        fireEvent.click(screen.getByRole('option', { name: 'Annex Store' }));

        expect(screen.getByText(/skips|without the transfer approval/i)).toBeInTheDocument();
    });
});
