import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LineItemField from '@/Pages/Inventory/PurchaseRequests/Components/LineItemField';

// ItemSelect searches the catalogue over the network; only the switch between
// picking an item and typing a name is under test here.
vi.mock('@/Pages/Inventory/Components/ItemSelect', () => ({
    default: ({ helperText }) => <div data-testid="item-select">{helperText}</div>,
}));

const renderField = (props = {}) => {
    const handlers = { onItemChange: vi.fn(), onNameChange: vi.fn(), onManualChange: vi.fn() };
    render(<LineItemField manual={false} item={null} itemName="" {...handlers} {...props} />);

    return handlers;
};

describe('LineItemField', () => {
    it('shows the catalogue picker by default and offers typing a name instead', () => {
        const { onManualChange } = renderField();

        expect(screen.getByTestId('item-select')).toBeInTheDocument();
        expect(screen.queryByLabelText(/item name/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /not in catalogue/i }));
        expect(onManualChange).toHaveBeenCalledWith(true);
    });

    it('takes a typed name on a manual line and can switch back to the catalogue', () => {
        const { onNameChange, onManualChange } = renderField({
            manual: true,
            itemName: 'Pipette tips',
        });

        expect(screen.queryByTestId('item-select')).not.toBeInTheDocument();
        const input = screen.getByLabelText(/item name/i);
        expect(input).toHaveValue('Pipette tips');

        fireEvent.change(input, { target: { value: 'Pipette tips 200 µl' } });
        expect(onNameChange).toHaveBeenCalledWith('Pipette tips 200 µl');

        fireEvent.click(screen.getByRole('button', { name: /pick from catalogue/i }));
        expect(onManualChange).toHaveBeenCalledWith(false);
    });

    it('shows the validation message in either mode', () => {
        const message = 'Type the item name or pick it from the catalogue.';

        renderField({ manual: true, error: message });

        expect(screen.getByText(message)).toBeInTheDocument();
    });
});
