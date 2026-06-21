import { Alert, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import ParametersField from '@/Components/ParametersField';
import ConditionsField from '@/Components/ConditionsField';

// Shared advanced (Formulate / Conditional) pricing configuration block
const AdvancedPricingFields = ({
    priceType,
    parameters,
    formula,
    conditions,
    formulaError,
    onParametersChange,
    onFormulaChange,
    onConditionsChange,
}) => {
    return (
        <>
            <Grid size={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Advanced Pricing Configuration</strong>
                    <br />
                    Configure parameters and{' '}
                    {priceType === 'Formulate' ? 'formula' : 'conditions'} for dynamic pricing.
                </Alert>
            </Grid>
            <Grid size={12}>
                <ParametersField
                    defaultValue={parameters}
                    onChange={onParametersChange}
                    name="parameters"
                />
            </Grid>

            {priceType === 'Formulate' ? (
                <Grid size={12}>
                    <TextField
                        name="formula"
                        label="Formula"
                        onChange={onFormulaChange}
                        value={formula || ''}
                        helperText={
                            formulaError ||
                            'Enter a mathematical formula using the defined parameters'
                        }
                        error={Boolean(formulaError)}
                        fullWidth
                        multiline
                        rows={2}
                    />
                </Grid>
            ) : (
                <Grid size={12}>
                    <ConditionsField
                        defaultValue={conditions}
                        onChange={onConditionsChange}
                        name="conditions"
                    />
                </Grid>
            )}
        </>
    );
};

export default AdvancedPricingFields;
