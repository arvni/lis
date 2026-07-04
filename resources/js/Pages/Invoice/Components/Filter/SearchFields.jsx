import React from 'react';
import { Grid, TextField, IconButton, InputAdornment } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

const searchAdornments = (value, onClear) => ({
    input: {
        startAdornment: (
            <InputAdornment position="start">
                <SearchIcon color="action" />
            </InputAdornment>
        ),
        endAdornment: value && (
            <InputAdornment position="end">
                <IconButton size="small" onClick={onClear} edge="end">
                    <ClearIcon fontSize="small" />
                </IconButton>
            </InputAdornment>
        ),
    },
});

const SearchFields = ({
    search,
    invoiceNo,
    onSearchChange,
    onClearSearch,
    onInvoiceNoChange,
    onClearInvoiceNo,
    onKeyDown,
}) => (
    <>
        {/* Patient Search Field */}
        <Grid size={{ xs: 12, md: 6 }}>
            <TextField
                fullWidth
                name="search"
                label="Search Patient"
                placeholder="Search by patient name or ID..."
                value={search}
                onChange={onSearchChange}
                onKeyDown={onKeyDown}
                slotProps={searchAdornments(search, onClearSearch)}
            />
        </Grid>

        {/* Invoice No Filter */}
        <Grid size={{ xs: 12, md: 6 }}>
            <TextField
                fullWidth
                name="invoice_no"
                label="Invoice No"
                placeholder="e.g. 2026-5/3"
                value={invoiceNo}
                onChange={onInvoiceNoChange}
                onKeyDown={onKeyDown}
                slotProps={searchAdornments(invoiceNo, onClearInvoiceNo)}
            />
        </Grid>
    </>
);

export default SearchFields;
