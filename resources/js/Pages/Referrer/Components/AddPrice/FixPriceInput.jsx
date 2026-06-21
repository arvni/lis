import { Chip, FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';

// Shared Fix-price input with OMR adornment
const FixPriceInput = ({ value, error, onChange, labelId, name }) => {
    return (
        <FormControl fullWidth>
            <InputLabel error={!!error} id={labelId} required>
                Price
            </InputLabel>
            <OutlinedInput
                fullWidth
                type="number"
                label="Price"
                value={value || ''}
                error={!!error}
                required
                name={name}
                slotProps={{ htmlInput: { min: 0 } }}
                onChange={onChange}
                endAdornment={<Chip label="OMR" size="small" color="primary" />}
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
        </FormControl>
    );
};

export default FixPriceInput;
