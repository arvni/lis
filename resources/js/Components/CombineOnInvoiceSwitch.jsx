import { FormControlLabel, FormHelperText, Box, Switch } from '@mui/material';

/**
 * Opt-in: every time this test or panel is added goes on one invoice line (qty 1) with its
 * parameters summed, e.g. 5 + 4 embryos → "No Embryos=9". Off keeps the ordinary invoice lines.
 */
const CombineOnInvoiceSwitch = ({ checked = false, onChange }) => (
    <Box sx={{ mt: 1 }}>
        <FormControlLabel
            control={
                <Switch
                    checked={Boolean(checked)}
                    onChange={(e) => onChange(e.target.checked)}
                    inputProps={{ 'aria-label': 'Combine on invoice' }}
                />
            }
            label="Combine on invoice"
        />
        <FormHelperText sx={{ mt: 0 }}>
            Adding this more than once makes one invoice line (qty 1) with the parameters added up,
            e.g. 5 + 4 embryos → No Embryos=9.
        </FormHelperText>
    </Box>
);

export default CombineOnInvoiceSwitch;
