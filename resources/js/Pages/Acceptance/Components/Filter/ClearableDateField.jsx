import React from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

/**
 * A `type="date"` text field with a clear button shown when a value is set.
 * `max` is optional — only some date filters cap at today.
 */
const ClearableDateField = ({ name, value, label, onChange, onClear, error, helperText, max }) => (
    <TextField
        fullWidth
        name={name}
        value={value || ''}
        onChange={onChange}
        label={label}
        type="date"
        error={Boolean(error)}
        helperText={helperText}
        slotProps={{
            inputLabel: { shrink: true },
            ...(max ? { htmlInput: { max } } : {}),
            input: {
                endAdornment: value ? (
                    <InputAdornment position="end">
                        <Tooltip title="Clear date">
                            <IconButton onClick={onClear} edge="end" size="small">
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </InputAdornment>
                ) : null,
            },
        }}
    />
);

export default ClearableDateField;
