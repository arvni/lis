import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { router } from '@inertiajs/react';
import EditItemPricesForm, { buildPriceRows } from './EditItemPricesForm.jsx';

vi.mock('@inertiajs/react', () => ({ router: { put: vi.fn() } }));

const method = (name, overrides = {}) => ({ name, price_type: 'Fix', ...overrides });

const test = (id, overrides = {}) => ({
    id,
    price: 100,
    discount: 0,
    customParameters: {},
    method_test: { test: { name: `Test ${id}` }, method: method(`Method ${id}`) },
    ...overrides,
});

const panel = (id, items, overrides = {}) => ({
    id,
    panel: { id: 7, name: 'Lipid Panel', price_type: 'Fix' },
    acceptanceItems: items,
    ...overrides,
});

const panelItem = (id, price, discount = 0, overrides = {}) => ({
    id,
    price,
    discount,
    customParameters: {},
    method_test: { test: { name: 'Lipid Panel' }, method: method(`Method ${id}`) },
    ...overrides,
});

describe('buildPriceRows', () => {
    it('keeps standalone items as one row each', () => {
        const rows = buildPriceRows({ tests: [test(1), test(2)], panels: [] });

        expect(rows).toHaveLength(2);
        expect(rows.map((r) => r.type)).toEqual(['item', 'item']);
        expect(rows[0]).toMatchObject({ id: 1, name: 'Test 1', price: 100, discount: 0 });
    });

    it('merges the items of a panel into a single row carrying the panel totals', () => {
        const rows = buildPriceRows({
            tests: [],
            panels: [
                panel('panel-uuid', [
                    panelItem(1, 47, 4),
                    panelItem(2, 47, 3),
                    panelItem(3, 46, 3),
                ]),
            ],
        });

        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            type: 'panel',
            panelId: 'panel-uuid',
            name: 'Lipid Panel',
            price: 140,
            discount: 10,
        });
        expect(rows[0].methods).toEqual(['Method 1', 'Method 2', 'Method 3']);
    });

    it('does not let float noise leak into a summed panel total', () => {
        const rows = buildPriceRows({
            tests: [],
            panels: [
                panel('p', [panelItem(1, 46.667), panelItem(2, 46.667), panelItem(3, 46.666)]),
            ],
        });

        expect(rows[0].price).toBe(140);
    });

    it('keeps separate panels apart', () => {
        const rows = buildPriceRows({
            tests: [test(2)],
            panels: [
                panel('panel-a', [panelItem(1, 50), panelItem(4, 50)]),
                panel('panel-b', [panelItem(3, 20)]),
            ],
        });

        expect(rows.map((r) => r.key)).toEqual(['item-2', 'panel-panel-a', 'panel-panel-b']);
        expect(rows[1].price).toBe(100);
        expect(rows[2].price).toBe(20);
    });

    it('falls back to a placeholder name when the test relation is missing', () => {
        const rows = buildPriceRows({ tests: [{ id: 9, price: 10, discount: 0 }] });

        expect(rows[0].name).toBe('Item #9');
    });

    it('flags a formula-priced test and carries its method and saved parameters', () => {
        const source = method('Formulated', {
            price_type: 'Formulate',
            extra: { formula: 'a * 2', parameters: [{ value: 'a', label: 'A' }] },
        });
        const rows = buildPriceRows({
            tests: [
                test(1, {
                    method_test: { test: { name: 'Karyotype' }, method: source },
                    customParameters: { price: { a: 3 }, discounts: [] },
                }),
            ],
        });

        expect(rows[0].dynamic).toBe(true);
        expect(rows[0].source).toBe(source);
        expect(rows[0].customParameters).toEqual({ price: { a: 3 }, discounts: [] });
    });

    it('flags a conditionally-priced panel from the panel itself', () => {
        const rows = buildPriceRows({
            tests: [],
            panels: [
                panel('p', [panelItem(1, 30, 0, { customParameters: { price: { n: 2 } } })], {
                    panel: {
                        id: 7,
                        name: 'Conditional Panel',
                        price_type: 'Conditional',
                        extra: {
                            conditions: [{ condition: 'n > 1', value: 30 }],
                            parameters: [{ value: 'n', label: 'N' }],
                        },
                    },
                }),
            ],
        });

        expect(rows[0].dynamic).toBe(true);
        expect(rows[0].customParameters).toEqual({ price: { n: 2 } });
    });

    it('does not flag a fixed price, nor a dynamic price type without parameters', () => {
        const rows = buildPriceRows({
            tests: [
                test(1),
                test(2, {
                    method_test: {
                        test: { name: 'No params' },
                        method: method('Formulated', {
                            price_type: 'Formulate',
                            extra: { formula: '10', parameters: [] },
                        }),
                    },
                }),
            ],
        });

        expect(rows.map((r) => r.dynamic)).toEqual([false, false]);
    });
});

const formulaMethod = {
    name: 'Sequencing',
    price_type: 'Formulate',
    extra: {
        formula: 'area * 10',
        parameters: [{ value: 'area', label: 'Area', required: true }],
    },
};

const dynamicItems = {
    tests: [
        {
            id: 11,
            price: 0,
            discount: 0,
            customParameters: { sampleType: 3, discounts: [] },
            method_test: { test: { name: 'Karyotype' }, method: formulaMethod },
        },
        test(12, { method_test: { test: { name: 'CBC' }, method: method('Manual') } }),
    ],
};

const renderForm = (groupedItems) =>
    render(
        <EditItemPricesForm
            open
            acceptance={{ id: 5 }}
            groupedItems={groupedItems}
            onClose={vi.fn()}
        />,
    );

describe('EditItemPricesForm', () => {
    beforeEach(() => vi.mocked(router.put).mockReset());

    it('prices a formula row from its parameters instead of a typed amount', () => {
        renderForm(dynamicItems);

        // The calculated row cannot be typed into; the fixed one still can.
        expect(screen.getByLabelText('Price for Karyotype')).toBeDisabled();
        expect(screen.getByLabelText('Price for CBC')).not.toBeDisabled();

        fireEvent.click(screen.getByLabelText('Toggle pricing parameters for Karyotype'));
        fireEvent.change(screen.getByLabelText(/Area/), { target: { value: '5' } });

        expect(screen.getByLabelText('Price for Karyotype').value).toBe('50');
    });

    it('lets a calculated row be saved at zero, parameters filled in or not', () => {
        renderForm(dynamicItems);

        // Karyotype has no stored parameters, so it prices at 0 — still saveable.
        expect(screen.getByText('Save Changes').closest('button').disabled).toBe(false);

        fireEvent.click(screen.getByText('Save Changes'));

        const [, payload] = vi.mocked(router.put).mock.calls[0];
        expect(payload.items[0]).toMatchObject({ id: 11, price: 0 });
    });

    it('submits the parameters a calculated price was built from', () => {
        renderForm(dynamicItems);

        fireEvent.click(screen.getByLabelText('Toggle pricing parameters for Karyotype'));
        fireEvent.change(screen.getByLabelText(/Area/), { target: { value: '5' } });
        fireEvent.click(screen.getByText('Save Changes'));

        const [, payload] = vi.mocked(router.put).mock.calls[0];
        expect(payload.items[0]).toMatchObject({
            id: 11,
            price: 50,
            custom_parameters: { price: { area: '5' } },
        });
        // A fixed row carries no parameters, so it cannot blank the stored ones.
        expect(payload.items[1].custom_parameters).toBeUndefined();
    });
});
