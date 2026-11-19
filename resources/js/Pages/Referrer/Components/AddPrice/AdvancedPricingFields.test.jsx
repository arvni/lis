import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdvancedPricingFields from '@/Pages/Referrer/Components/AddPrice/AdvancedPricingFields';

const renderFields = (props = {}) => {
    const onCombineOnInvoiceChange = vi.fn();
    render(
        <AdvancedPricingFields
            priceType="Formulate"
            parameters={[{ id: 'a', value: 'cells' }]}
            formula="150*cells"
            onParametersChange={vi.fn()}
            onFormulaChange={vi.fn()}
            onConditionsChange={vi.fn()}
            onCombineOnInvoiceChange={onCombineOnInvoiceChange}
            {...props}
        />,
    );
    return onCombineOnInvoiceChange;
};

describe('AdvancedPricingFields combine on invoice (referrer price list)', () => {
    it('lets a referrer price list switch combining on', () => {
        const onChange = renderFields();

        fireEvent.click(screen.getByLabelText('Combine on invoice'));

        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('shows the saved switch', () => {
        renderFields({ combineOnInvoice: true });
        expect(screen.getByLabelText('Combine on invoice')).toBeChecked();
    });

    it('is hidden when the price has no parameters', () => {
        renderFields({ parameters: [] });
        expect(screen.queryByLabelText('Combine on invoice')).not.toBeInTheDocument();
    });
});
