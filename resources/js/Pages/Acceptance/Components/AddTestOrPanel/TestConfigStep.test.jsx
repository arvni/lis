import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TestConfigStep from './TestConfigStep.jsx';

/**
 * Picking a method used to reset customParameters wholesale, which threw away the
 * discount lines the offer lookup had just filled in — so an offer never reached
 * the invoice. What belongs to the method goes; what belongs to the item stays.
 */

const method = (overrides = {}) => ({
    id: 4,
    name: 'Manual',
    price_type: 'Fix',
    price: 100,
    no_patient: 1,
    no_sample: 1,
    ...overrides,
});

const baseData = (overrides = {}) => ({
    method_test: {
        id: null,
        method: null,
        test: {
            id: 9,
            name: 'CBC',
            type: 'TEST',
            method_tests: [
                { id: 1, status: true, method: method() },
                { id: 2, status: true, method: method({ id: 5, name: 'Auto', price: 200 }) },
            ],
        },
    },
    price: 0,
    discount: 0,
    samples: [],
    customParameters: { sampleType: '', discounts: [] },
    ...overrides,
});

const renderStep = (data, onChange, maxDiscount = 100) =>
    render(
        <TestConfigStep
            type="TEST"
            data={data}
            errors={{}}
            maxDiscount={maxDiscount}
            patient={{ id: 1, fullName: 'Demo Patient' }}
            onChange={onChange}
        />,
    );

// Where a method is already picked, DiscountManager is mounted and has pushed its
// own total up on mount. Clearing first keeps the assertion on what the click did.
const selectMethod = (name) => {
    onChange.mockClear();
    fireEvent.click(screen.getByText(name));
};

let onChange;

beforeEach(() => {
    onChange = vi.fn();
});

describe('Acceptance/TestConfigStep method selection', () => {
    it('keeps the offer discount the test carries', () => {
        const offer = { id: 'o1', type: 'PERCENTAGE', value: 10, reason: 'Ramadan 10%' };
        renderStep(baseData({ customParameters: { sampleType: '', discounts: [offer] } }), onChange);

        selectMethod('Manual');

        const [update] = onChange.mock.calls[0];
        expect(update.customParameters.discounts).toEqual([offer]);
        expect(update.discount).toBe(10); // 10% of the method's 100
    });

    it('restates the discount against the newly picked method price', () => {
        const offer = { id: 'o1', type: 'PERCENTAGE', value: 10, reason: 'Ramadan 10%' };
        const data = baseData({ customParameters: { sampleType: '', discounts: [offer] } });
        renderStep({ ...data, method_test: { ...data.method_test, id: 1, method: method() } }, onChange);

        selectMethod('Auto');

        const [update] = onChange.mock.calls[0];
        expect(update.price).toBe(200);
        expect(update.discount).toBe(20); // follows the new price, not the old
    });

    it('keeps a card line at the amount the backend decided', () => {
        const card = {
            id: 'card-1-offer-2',
            type: 'PERCENTAGE',
            value: 40,
            amount: 33,
            source: 'CARD',
        };
        renderStep(baseData({ customParameters: { sampleType: '', discounts: [card] } }), onChange);

        selectMethod('Manual');

        const [update] = onChange.mock.calls[0];
        expect(update.customParameters.discounts).toEqual([card]);
        expect(update.discount).toBe(33); // not recomputed as 40% of 100
    });

    it('keeps the manual lines a card is holding aside', () => {
        const suppressed = [{ id: 'm1', type: 'FIXED', value: 5, reason: 'Staff' }];
        renderStep(
            baseData({
                customParameters: {
                    sampleType: '',
                    discounts: [],
                    discounts_suppressed_by_card: suppressed,
                },
            }),
            onChange,
        );

        selectMethod('Manual');

        const [update] = onChange.mock.calls[0];
        expect(update.customParameters.discounts_suppressed_by_card).toEqual(suppressed);
    });

    it('drops the sample type and formula parameters of the method being replaced', () => {
        renderStep(
            baseData({
                customParameters: { sampleType: 'EDTA', price: { weight: 12 }, discounts: [] },
            }),
            onChange,
        );

        selectMethod('Manual');

        const [update] = onChange.mock.calls[0];
        expect(update.customParameters.sampleType).toBe('');
        expect(update.customParameters.price).toBeUndefined();
    });

    it('caps the manual discount at the operator ceiling', () => {
        const steep = { id: 'm1', type: 'PERCENTAGE', value: 80, reason: 'Too much' };
        renderStep(
            baseData({ customParameters: { sampleType: '', discounts: [steep] } }),
            onChange,
            25,
        );

        selectMethod('Manual');

        const [update] = onChange.mock.calls[0];
        expect(update.discount).toBe(25); // 25% ceiling, not the 80 asked for
    });
});
