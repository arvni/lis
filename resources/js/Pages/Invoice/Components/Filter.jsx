import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Stack, Paper, Grid, Chip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchFields from './Filter/SearchFields.jsx';
import OwnerFilter from './Filter/OwnerFilter.jsx';
import DateRangeSection from './Filter/DateRangeSection.jsx';
import { getPresetRange, formatDateForBackend } from './Filter/constants.js';

const Filter = ({ onFilter, defaultFilter: defaultValues = {} }) => {
    const [filters, setFilters] = useState({
        search: defaultValues.search || '',
        invoice_no: defaultValues.invoice_no || '',
        owner_type: defaultValues.owner_type || '',
        owner_id: defaultValues.owner_id || null,
        owner_object: defaultValues.owner_object || null, // Store the full object for SelectSearch
        from_date: defaultValues.from_date || null,
        to_date: defaultValues.to_date || null,
    });
    const [dateError, setDateError] = useState('');
    const [activeFilters, setActiveFilters] = useState(0);
    const today = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Count active filters for better UX
    useEffect(() => {
        const filterValues = {
            search: filters.search,
            invoice_no: filters.invoice_no,
            owner_type: filters.owner_type,
            owner_id: filters.owner_id,
            from_date: filters.from_date,
            to_date: filters.to_date,
        };
        const count = Object.values(filterValues).filter((value) => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== '' && value !== null && value !== undefined;
        }).length;
        setActiveFilters(count);
    }, [filters]);

    // Enhanced date validation
    useEffect(() => {
        if (filters.from_date && filters.to_date) {
            const fromDate = new Date(filters.from_date);
            const toDate = new Date(filters.to_date);

            if (fromDate > toDate) {
                setDateError('Start date cannot be after end date');
            } else if (fromDate > new Date(today)) {
                setDateError('Start date cannot be in the future');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [filters.from_date, filters.to_date, today]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => {
            const newFilters = {
                ...prev,
                [field]: value,
            };

            // Reset owner_id and owner_object when owner_type changes
            if (field === 'owner_type') {
                newFilters.owner_id = null;
                newFilters.owner_object = null;
            }

            return newFilters;
        });
    };

    const handleOwnerTypeChange = useCallback((e) => {
        handleFilterChange('owner_type', e.target.value);
    }, []);

    const handleOwnerChange = useCallback((e) => {
        const ownerObject = e.target.value;
        setFilters((prev) => ({
            ...prev,
            owner_object: ownerObject,
            owner_id: ownerObject?.id || null,
        }));
    }, []);

    const handleSearchChange = useCallback((e) => {
        handleFilterChange('search', e.target.value);
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilters((prevState) => ({ ...prevState, search: '' }));
    }, []);

    const handleInvoiceNoChange = useCallback((e) => {
        handleFilterChange('invoice_no', e.target.value);
    }, []);

    const handleClearInvoiceNo = useCallback(() => {
        setFilters((prevState) => ({ ...prevState, invoice_no: '' }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        if (dateError) {
            return;
        }

        // Clean up filters before sending
        const cleanedFilters = {
            search: filters.search,
            invoice_no: filters.invoice_no,
            owner_type: filters.owner_type,
            owner_id: filters.owner_id,
            from_date: formatDateForBackend(filters.from_date),
            to_date: formatDateForBackend(filters.to_date),
        };

        // Remove null, undefined, and empty string values, but keep owner_object out of the API call
        Object.keys(cleanedFilters).forEach((key) => {
            if (
                cleanedFilters[key] === null ||
                cleanedFilters[key] === '' ||
                cleanedFilters[key] === undefined
            ) {
                delete cleanedFilters[key];
            }
        });

        onFilter(cleanedFilters)();
    }, [filters, dateError, onFilter]);

    const handleClearFilters = useCallback(() => {
        const clearedFilters = {
            search: '',
            invoice_no: '',
            owner_type: '',
            owner_id: null,
            owner_object: null,
            from_date: null,
            to_date: null,
        };
        setFilters(clearedFilters);
        setDateError('');
        onFilter({})();
    }, [onFilter]);

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter' && !dateError) {
                handleApplyFilters();
            }
        },
        [handleApplyFilters, dateError],
    );

    const handleQuickDatePreset = useCallback((preset) => {
        const range = getPresetRange(preset);
        if (!range) return;
        setFilters((prev) => ({
            ...prev,
            from_date: range.fromDate,
            to_date: range.toDate,
        }));
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'background.paper' }}>
                <Stack spacing={3}>
                    {/* Header with filter icon and active count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {activeFilters > 0 && (
                            <Chip
                                label={`${activeFilters} active`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    <Grid container spacing={2}>
                        <SearchFields
                            search={filters.search}
                            invoiceNo={filters.invoice_no}
                            onSearchChange={handleSearchChange}
                            onClearSearch={handleClearSearch}
                            onInvoiceNoChange={handleInvoiceNoChange}
                            onClearInvoiceNo={handleClearInvoiceNo}
                            onKeyDown={handleKeyPress}
                        />

                        <OwnerFilter
                            ownerType={filters.owner_type}
                            ownerObject={filters.owner_object}
                            onOwnerTypeChange={handleOwnerTypeChange}
                            onOwnerChange={handleOwnerChange}
                        />

                        <DateRangeSection
                            fromDate={filters.from_date}
                            toDate={filters.to_date}
                            dateError={dateError}
                            onPreset={handleQuickDatePreset}
                            onChange={handleFilterChange}
                        />

                        {/* Action Buttons */}
                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClearFilters}
                                    disabled={activeFilters === 0}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FilterListIcon />}
                                    onClick={handleApplyFilters}
                                    disabled={!!dateError}
                                >
                                    Apply Filters
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Paper>
        </LocalizationProvider>
    );
};

export default Filter;
