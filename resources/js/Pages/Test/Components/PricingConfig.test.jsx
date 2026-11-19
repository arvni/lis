import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PricingConfig from '@/Pages/Test/Components/PricingConfig';

const formulaExtra = (overrides = {}) => ({
    parameters: [{ id: 'a', value: 'noEmbryos' }],
    formula: '190*noEmbryos',
    ...overrides,
});

const renderConfig = (props = {}) => {
    const onExtraChange = vi.fn();
    render(
        <PricingConfig
            priceType="Formulate"
            extra={formulaExtra()}
            onPriceTypeChange={vi.fn()}
            onPriceChange={vi.fn()}
            onExtraChange={onExtraChange}
            {...props}
        />,
    );
    return onExtraChange;
};

describe('PricingConfig combine on invoice', () => {
    it('is hidden until the price has parameters', () => {
        renderConfig({ extra: { formula: '100' } });
        expect(screen.queryByLabelText('Combine on invoice')).not.toBeInTheDocument();
    });

    it('is off by default, so a test is not combined unless switched on', () => {
        renderConfig();
        expect(screen.getByLabelText('Combine on invoice')).not.toBeChecked();
    });

    it('saves the switch into the price settings', () => {
        const onExtraChange = renderConfig();

        fireEvent.click(screen.getByLabelText('Combine on invoice'));

        expect(onExtraChange).toHaveBeenCalledWith(
            expect.objectContaining({ combine_on_invoice: true, formula: '190*noEmbryos' }),
        );
    });

    it('shows a saved switch as on', () => {
        renderConfig({ extra: formulaExtra({ combine_on_invoice: true }) });
        expect(screen.getByLabelText('Combine on invoice')).toBeChecked();
    });
});
