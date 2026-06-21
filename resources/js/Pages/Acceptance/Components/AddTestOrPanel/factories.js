import { makeId } from '@/Services/helper';

// ─── Data Factories ────────────────────────────────────────────────────────────
export const makeTestData = (init = {}) => ({
    ic: makeId(6),
    method_test: { test: { type: '' }, id: null, method: null },
    price: 0,
    discount: 0,
    details: '',
    sampleless: false,
    samples: [],
    customParameters: { sampleType: '', discounts: [] },
    ...init,
});

export const makePanelData = (init = {}) => ({
    id: makeId(6),
    panel: null,
    acceptanceItems: [],
    price: 0,
    discount: 0,
    sampleless: false,
    reportless: false,
    ...init,
});
