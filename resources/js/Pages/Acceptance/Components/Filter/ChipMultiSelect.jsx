import React from 'react';
import {
    Box,
    Checkbox,
    Chip,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
} from '@mui/material';
import { MenuProps } from './constants';

/**
 * Multi-select with checkbox menu items and chip-rendered selection.
 * `options` is a list of { value, label }.
 */
const ChipMultiSelect = ({ labelId, label, name, value, onChange, options }) => (
    <FormControl fullWidth>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
            labelId={labelId}
            multiple
            name={name}
            value={value}
            onChange={onChange}
            input={<OutlinedInput label={label} />}
            MenuProps={MenuProps}
            renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((selectedValue) => {
                        const opt = options.find((o) => o.value === selectedValue);
                        return (
                            <Chip
                                key={selectedValue}
                                label={opt?.label ?? selectedValue}
                                size="small"
                            />
                        );
                    })}
                </Box>
            )}
        >
            {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                    <Checkbox checked={value.includes(opt.value)} size="small" />
                    <ListItemText primary={opt.label} />
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

export default ChipMultiSelect;
