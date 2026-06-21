import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    Science as ScienceIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';

// Shared Price Type selector (Fix / Formulate / Conditional)
const PriceTypeSelect = ({ value, onChange, labelId, id, name }) => {
    return (
        <FormControl fullWidth>
            <InputLabel id={labelId}>Price Type</InputLabel>
            <Select
                labelId={labelId}
                id={id}
                value={value || 'Fix'}
                label="Price Type"
                name={name}
                onChange={onChange}
            >
                <MenuItem value="Fix">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon fontSize="small" />
                        Fix
                    </Box>
                </MenuItem>
                <MenuItem value="Formulate">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon fontSize="small" />
                        Formulate
                    </Box>
                </MenuItem>
                <MenuItem value="Conditional">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" />
                        Conditional
                    </Box>
                </MenuItem>
            </Select>
        </FormControl>
    );
};

export default PriceTypeSelect;
