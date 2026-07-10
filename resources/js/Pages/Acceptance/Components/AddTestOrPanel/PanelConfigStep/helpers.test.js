import { describe, it, expect } from 'vitest';
import {
    addSampleToItem,
    applyReportless,
    applySampleless,
    computePanelTotals,
    removeSampleFromItem,
    spreadPanelDiscount,
    spreadPanelPrice,
    updateItemSample,
} from './helpers';

const patient = { id: 7, fullName: 'Jane Doe' };

const item = (id, overrides = {}) => ({
    id,
    method_test: { method: { no_sample: 2, no_patient: 1 } },
    samples: [{ patients: [{ id: 7, name: 'Jane Doe' }], sampleType: 'blood' }],
    customParameters: {},
    ...overrides,
});

describe('applySampleless', () => {
    it('enabling with a patient seeds one default sample per item and forces reportless', () => {
        const updates = applySampleless([item(1), item(2)], true, patient);
        expect(updates.sampleless).toBe(true);
        expect(updates.reportless).toBe(true);
        expect(updates.acceptanceItems).toHaveLength(2);
        updates.acceptanceItems.forEach((i) => {
            expect(i.sampleless).toBe(true);
            expect(i.samples).toEqual([
                { patients: [{ id: 7, name: 'Jane Doe' }], sampleType: '' },
            ]);
        });
    });

    it('enabling without a patient only flips the flag', () => {
        expect(applySampleless([item(1)], true, null)).toEqual({ sampleless: true });
    });

    it('disabling clears the per-item flag and keeps samples', () => {
        const updates = applySampleless([item(1)], false, patient);
        expect(updates.sampleless).toBe(false);
        expect(updates.reportless).toBeUndefined();
        expect(updates.acceptanceItems[0].sampleless).toBe(false);
        expect(updates.acceptanceItems[0].samples[0].sampleType).toBe('blood');
    });
});

describe('applyReportless', () => {
    it('mirrors the flag onto every item', () => {
        const updates = applyReportless([item(1), item(2)], true);
        expect(updates.reportless).toBe(true);
        expect(updates.acceptanceItems.every((i) => i.reportless)).toBe(true);
    });
});

describe('updateItemSample', () => {
    it('updates the sampleType of one sample on one item only', () => {
        const items = [item(1), item(2)];
        const { acceptanceItems } = updateItemSample(items, 2, 0, 'sampleType', 'saliva');
        expect(acceptanceItems[1].samples[0].sampleType).toBe('saliva');
        expect(acceptanceItems[0].samples[0].sampleType).toBe('blood');
    });

    it('replaces the patient at the given index', () => {
        const { acceptanceItems } = updateItemSample(
            [item(1)],
            1,
            0,
            'patient',
            { id: 9, name: 'Bob' },
            0,
        );
        expect(acceptanceItems[0].samples[0].patients[0]).toEqual({ id: 9, name: 'Bob' });
    });
});

describe('addSampleToItem', () => {
    it('appends a sample seeded with the patient and bumps no_sample', () => {
        const { acceptanceItems } = addSampleToItem([item(1)], 1, patient);
        expect(acceptanceItems[0].samples).toHaveLength(2);
        expect(acceptanceItems[0].samples[1]).toEqual({
            patients: [{ id: 7, name: 'Jane Doe' }],
            sampleType: '',
        });
        expect(acceptanceItems[0].no_sample).toBe(2);
    });

    it('respects the method no_sample cap', () => {
        const capped = item(1, {
            samples: [{ sampleType: 'a' }, { sampleType: 'b' }],
        });
        const { acceptanceItems } = addSampleToItem([capped], 1, patient);
        expect(acceptanceItems[0].samples).toHaveLength(2);
    });

    it('seeds an empty patients list when there is no patient', () => {
        const { acceptanceItems } = addSampleToItem([item(1)], 1, null);
        expect(acceptanceItems[0].samples[1].patients).toEqual([]);
    });
});

describe('removeSampleFromItem', () => {
    it('removes the sample at the index and decrements no_sample', () => {
        const twoSamples = item(1, {
            samples: [{ sampleType: 'a' }, { sampleType: 'b' }],
        });
        const { acceptanceItems } = removeSampleFromItem([twoSamples], 1, 0);
        expect(acceptanceItems[0].samples).toEqual([{ sampleType: 'b' }]);
        expect(acceptanceItems[0].no_sample).toBe(1);
    });

    it('never removes the last sample', () => {
        const { acceptanceItems } = removeSampleFromItem([item(1)], 1, 0);
        expect(acceptanceItems[0].samples).toHaveLength(1);
    });
});

describe('spreadPanelPrice / spreadPanelDiscount', () => {
    it('splits the panel price evenly and merges customParameters', () => {
        const updates = spreadPanelPrice([item(1), item(2)], {
            price: 30,
            customParameters: { formula: 'x' },
        });
        expect(updates.price).toBe(30);
        expect(updates.acceptanceItems.map((i) => i.price)).toEqual([15, 15]);
        expect(updates.acceptanceItems[0].customParameters.formula).toBe('x');
    });

    it('splits the discount evenly and defaults a missing discount to 0', () => {
        const updates = spreadPanelDiscount([item(1), item(2)], { customParameters: {} });
        expect(updates.discount).toBe(0);
        expect(updates.acceptanceItems.map((i) => i.discount)).toEqual([0, 0]);
    });
});

describe('computePanelTotals', () => {
    it('sums prices and discounts, treating non-numerics as 0', () => {
        expect(
            computePanelTotals([
                { price: '10.5', discount: 2 },
                { price: null, discount: 'abc' },
            ]),
        ).toEqual({ totalPrice: 10.5, totalDiscount: 2 });
    });
});
