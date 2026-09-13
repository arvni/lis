import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PurchaseRequestLinesEditor from '@/Pages/Inventory/PurchaseRequests/Components/PurchaseRequestLinesEditor';
import {
    emptyLine,
    lineFromSource,
    toPayload,
} from '@/Pages/Inventory/PurchaseRequests/Components/lineState';

// The pickers search the server; only the editor's own behaviour is under test,
// so each is replaced by a stand-in that shows its value.
vi.mock('@/Pages/Inventory/Components/ItemSelect', () => ({
    default: ({ value, onChange, helperText }) => (
        <div>
            <span data-testid="item-value">{value?.name ?? ''}</span>
            <button
                type="button"
                onClick={() =>
                    onChange({
                        id: 4,
                        item_code: 'I-DEMO-001',
                        name: 'Demo Reagent',
                        default_unit: { id: 2, name: 'Vial', abbreviation: 'vial' },
                    })
                }
            >
                pick Demo Reagent
            </button>
            {helperText && <span>{helperText}</span>}
        </div>
    ),
}));
vi.mock('@/Pages/Inventory/Components/UnitSelect', () => ({
    default: ({ value, helperText }) => (
        <div>
            <span data-testid="unit-value">{value?.name ?? ''}</span>
            {helperText && <span>{helperText}</span>}
        </div>
    ),
}));
vi.mock('@/Pages/Inventory/Components/SupplierSelect', () => ({
    default: ({ label, helperText }) => (
        <div>
            {label}
            {helperText && <span>{helperText}</span>}
        </div>
    ),
}));
vi.mock('@/Pages/Inventory/Components/BrandInput', () => ({
    default: () => <div>Brand</div>,
}));
vi.mock('@/Pages/Inventory/Components/PriceHint', () => ({ default: () => null }));

/** Holds the lines in state the way the Add/Edit pages do. */
const renderEditor = ({ lines = [], errors = {} } = {}) => {
    const changes = vi.fn();
    const Harness = () => {
        const [current, setCurrent] = useState(lines);
        return (
            <PurchaseRequestLinesEditor
                lines={current}
                onChange={(next) => {
                    setCurrent(next);
                    changes(next);
                }}
                errors={errors}
                units={[]}
            />
        );
    };
    render(<Harness />);

    return { lastLines: () => changes.mock.calls.at(-1)[0] };
};

const manualLine = (name) => ({ ...emptyLine(), _manual: true, item_name: name });

describe('PurchaseRequestLinesEditor', () => {
    it('starts empty and adds a focused line with a quantity of 1', () => {
        const { lastLines } = renderEditor();

        expect(screen.getByText('No items yet')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add the first item/i }));

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
        expect(lastLines()).toHaveLength(1);
        expect(screen.getByRole('button', { name: /add another item/i })).toBeInTheDocument();
    });

    it('pre-fills the unit with the picked catalogue item’s default unit', () => {
        const { lastLines } = renderEditor({ lines: [emptyLine()] });

        fireEvent.click(screen.getByRole('button', { name: 'pick Demo Reagent' }));

        expect(screen.getByTestId('unit-value')).toHaveTextContent('Vial');
        expect(lastLines()[0]).toMatchObject({ item_id: 4, unit_id: 2 });
    });

    it('switching to "Not in catalogue" clears the item and focuses the name field', () => {
        const { lastLines } = renderEditor({ lines: [emptyLine()] });
        fireEvent.click(screen.getByRole('button', { name: 'pick Demo Reagent' }));

        fireEvent.click(screen.getByRole('button', { name: 'Not in catalogue' }));

        const name = screen.getByLabelText(/item name/i);
        expect(name).toHaveFocus();
        expect(screen.getByTestId('unit-value')).toHaveTextContent('');
        expect(lastLines()[0]).toMatchObject({
            _manual: true,
            item_id: null,
            unit_id: null,
            item_name: '',
        });
    });

    it('shows each line’s estimate and the estimated total', () => {
        renderEditor({
            lines: [
                { ...manualLine('Tips'), qty: '2', estimated_unit_price: '12.5' },
                { ...manualLine('Gloves'), qty: '3', estimated_unit_price: '' },
            ],
        });

        // Once on the priced line, once in the total.
        expect(screen.getAllByText('25.00')).toHaveLength(2);
        expect(screen.getByText(/some items have no price/i)).toBeInTheDocument();
        expect(screen.getByText(/2 items/)).toBeInTheDocument();
    });

    it('duplicating and removing lines leaves the other lines intact', () => {
        renderEditor({ lines: [manualLine('Tips'), manualLine('Gloves')] });
        const names = () => screen.getAllByLabelText(/item name/i).map((input) => input.value);

        fireEvent.click(screen.getByRole('button', { name: 'Duplicate item 1' }));
        expect(names()).toEqual(['Tips', 'Tips', 'Gloves']);

        fireEvent.click(screen.getByRole('button', { name: 'Remove item 1' }));
        expect(names()).toEqual(['Tips', 'Gloves']);
    });

    it('shows server errors on their line and opens details that contain one', () => {
        renderEditor({
            lines: [manualLine('Tips'), manualLine('Gloves')],
            errors: {
                'lines.1.qty': 'The quantity is required.',
                'lines.1.notes': 'Notes are too long.',
            },
        });

        expect(screen.getByText('The quantity is required.')).toBeInTheDocument();
        expect(screen.getByText('Notes are too long.')).toBeInTheDocument();
        // Notes are a roomy multi-line field, not a one-line input.
        expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
        // Line 1 keeps its details collapsed; line 2 is forced open by its error.
        expect(screen.getAllByRole('button', { name: /supplier, brand & notes/i })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: /hide details/i })).toHaveLength(1);
    });

    it('summarises collapsed details on the line', () => {
        renderEditor({ lines: [{ ...manualLine('Tips'), brand: 'Eppendorf', cat_no: '0030' }] });

        // Saved details open the section, so collapse it to see the summary.
        fireEvent.click(screen.getByRole('button', { name: /hide details/i }));

        expect(screen.getByText('Brand: Eppendorf · Cat. no. 0030')).toBeInTheDocument();
    });
});

describe('lineState', () => {
    it('sends only the fields the server knows about', () => {
        const payload = toPayload({ ...emptyLine(), item_name: 'Tips' });

        expect(Object.keys(payload).some((field) => field.startsWith('_'))).toBe(false);
        expect(payload).toMatchObject({ item_name: 'Tips', qty: '1' });
    });

    it('treats a saved line without an item as not in the catalogue and tidies its numbers', () => {
        const line = lineFromSource({
            item_id: null,
            item_name: 'Tips',
            unit_id: 3,
            qty: '5.000000',
            estimated_unit_price: '12.5000',
        });

        expect(line).toMatchObject({ _manual: true, qty: '5', estimated_unit_price: '12.5' });
    });
});
