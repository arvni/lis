import { Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
import PriceTypeSelect from './PriceTypeSelect.jsx';
import FixPriceInput from './FixPriceInput.jsx';
import AdvancedPricingFields from './AdvancedPricingFields.jsx';

// Panel-level pricing configuration card
const PanelPricingSection = ({ data, errors, onChange, onExtraChange }) => {
    return (
        <Paper elevation={1} sx={{ p: 3 }}>
            <Typography
                variant="h6"
                sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <MoneyIcon color="primary" />
                Panel Pricing Configuration
            </Typography>
            <Grid container spacing={3}>
                <Grid size={6}>
                    <PriceTypeSelect
                        value={data.price_type}
                        onChange={onChange}
                        labelId="price-type-select-label"
                        id="price-type-select"
                        name="price_type"
                    />
                </Grid>

                {data.price_type === 'Fix' ? (
                    <Grid size={6}>
                        <FixPriceInput
                            value={data.price}
                            error={errors.price}
                            onChange={onChange}
                            labelId="price-label"
                            name="price"
                        />
                    </Grid>
                ) : (
                    <AdvancedPricingFields
                        priceType={data.price_type}
                        parameters={data.extra?.parameters}
                        formula={data.extra?.formula}
                        conditions={data.extra?.conditions}
                        formulaError={errors['extra.formula']}
                        onParametersChange={onExtraChange}
                        onFormulaChange={onExtraChange}
                        onConditionsChange={onExtraChange}
                    />
                )}
            </Grid>
        </Paper>
    );
};

export default PanelPricingSection;
