import React from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

const SearchField = ({ value, onChange, onKeyPress, onClear }) => (
    <TextField
        sx={{ width: '100%' }}
        name="search"
        value={value || ''}
        onChange={onChange}
        onKeyPress={onKeyPress}
        label="Search title"
        placeholder="Enter title keywords..."
        slotProps={{
            input: {
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
                endAdornment: value ? (
                    <InputAdornment position="end">
                        <Tooltip title="Clear search">
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

export default SearchField;
