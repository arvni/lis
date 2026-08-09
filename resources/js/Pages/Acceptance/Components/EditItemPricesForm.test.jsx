import { describe, it, expect } from 'vitest';
import { buildPriceRows } from './EditItemPricesForm.jsx';

const item = (id, overrides = {}) => ({
    id,
    panel_id: null,
    price: 100,
    discount: 0,
    method_test: { test: { name: `Test ${id}` }, method: { name: `Method ${id}` } },
    ...overrides,
});

const panelItem = (id, panelId, price, discount = 0) =>
    item(id, {
        panel_id: panelId,
        price,
        discount,
        method_test: { test: { name: 'Lipid Panel' }, method: { name: `Method ${id}` } },
    });

describe('buildPriceRows', () => {
    it('keeps standalone items as one row each', () => {
        const rows = buildPriceRows([item(1), item(2)]);

        expect(rows).toHaveLength(2);
        expect(rows.map((r) => r.type)).toEqual(['item', 'item']);
        expect(rows[0]).toMatchObject({ id: 1, name: 'Test 1', price: 100, discount: 0 });
    });

    it('merges the items of a panel into a single row carrying the panel totals', () => {
        const rows = buildPriceRows([
            panelItem(1, 'panel-uuid', 47, 4),
            panelItem(2, 'panel-uuid', 47, 3),
            panelItem(3, 'panel-uuid', 46, 3),
        ]);

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
        const rows = buildPriceRows([
            panelItem(1, 'p', 46.667, 0),
            panelItem(2, 'p', 46.667, 0),
            panelItem(3, 'p', 46.666, 0),
        ]);

        expect(rows[0].price).toBe(140);
    });

    it('keeps separate panels apart and preserves the original ordering', () => {
        const rows = buildPriceRows([
            panelItem(1, 'panel-a', 50),
            item(2),
            panelItem(3, 'panel-b', 20),
            panelItem(4, 'panel-a', 50),
        ]);

        expect(rows.map((r) => r.key)).toEqual(['panel-panel-a', 'item-2', 'panel-panel-b']);
        expect(rows[0].price).toBe(100);
        expect(rows[2].price).toBe(20);
    });

    it('falls back to a placeholder name when the test relation is missing', () => {
        const rows = buildPriceRows([{ id: 9, price: 10, discount: 0 }]);

        expect(rows[0].name).toBe('Item #9');
    });
});
