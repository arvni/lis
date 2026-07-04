import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    Stack,
    Paper,
    Grid,
    IconButton,
    InputAdornment,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import AmountRange from './Filter/AmountRange.jsx';
import DateRangeSection from './Filter/DateRangeSection.jsx';
import { getPresetRange, formatDateForServer, parseDateFromServer } from './Filter/constants.js';

const Filter = ({ onFilter, defaultFilter: defaultValues = {} }) => {
    const [filters, setFilters] = useState({
        search: defaultValues.search || '',
        paymentMethod: defaultValues.paymentMethod || '',
        dateFrom: parseDateFromServer(defaultValues.dateFrom),
        dateTo: parseDateFromServer(defaultValues.dateTo),
        amountFrom: defaultValues.amountFrom || '',
        amountTo: defaultValues.amountTo || '',
    });
    const [dateError, setDateError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [activeFilters, setActiveFilters] = useState(0);

    // Count active filters for better UX
    useEffect(() => {
        const filterValues = {
            search: filters.search,
            paymentMethod: filters.paymentMethod,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            amountFrom: filters.amountFrom,
            amountTo: filters.amountTo,
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
        const today = new Date();
        if (filters.dateFrom && filters.dateTo) {
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);
            const todayDate = new Date(today);
            todayDate.setHours(23, 59, 59, 999); // End of today

            if (fromDate > toDate) {
                setDateError('Start date cannot be after end date');
            } else if (fromDate > todayDate) {
                setDateError('Start date cannot be in the future');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [filters.dateFrom, filters.dateTo]);

    // Amount validation
    useEffect(() => {
        if (filters.amountFrom && filters.amountTo) {
            const fromAmount = parseFloat(filters.amountFrom);
            const toAmount = parseFloat(filters.amountTo);

            if (fromAmount < 0 || toAmount < 0) {
                setAmountError('Amount cannot be negative');
            } else if (fromAmount > toAmount) {
                setAmountError('From amount cannot be greater than To amount');
            } else {
                setAmountError('');
            }
        } else if (filters.amountFrom && parseFloat(filters.amountFrom) < 0) {
            setAmountError('Amount cannot be negative');
        } else if (filters.amountTo && parseFloat(filters.amountTo) < 0) {
            setAmountError('Amount cannot be negative');
        } else {
            setAmountError('');
        }
    }, [filters.amountFrom, filters.amountTo]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSearchChange = useCallback((e) => {
        handleFilterChange('search', e.target.value);
    }, []);

    const handlePaymentMethodChange = useCallback((e) => {
        handleFilterChange('paymentMethod', e.target.value);
    }, []);

    const handleAmountChange = useCallback(
        (field) => (e) => {
            const value = e.target.value;
            // Allow only numbers and decimal point
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                handleFilterChange(field, value);
            }
        },
        [],
    );

    const handleClearSearch = useCallback(() => {
        setFilters((prevState) => ({ ...prevState, search: '' }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        if (dateError || amountError) {
            return;
        }

        // Clean up filters before sending
        const cleanedFilters = {
            search: filters.search,
            paymentMethod: filters.paymentMethod,
            dateFrom: formatDateForServer(filters.dateFrom),
            dateTo: formatDateForServer(filters.dateTo),
            amountFrom: filters.amountFrom,
            amountTo: filters.amountTo,
        };

        // Remove null, undefined, and empty string values
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
    }, [filters, dateError, amountError, onFilter]);

    const handleClearFilters = useCallback(() => {
        const clearedFilters = {
            search: '',
            paymentMethod: '',
            dateFrom: null,
            dateTo: null,
            amountFrom: '',
            amountTo: '',
        };
        setFilters(clearedFilters);
        setDateError('');
        setAmountError('');
        onFilter({})();
    }, [onFilter]);

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter' && !dateError && !amountError) {
                handleApplyFilters();
            }
        },
        [handleApplyFilters, dateError, amountError],
    );

    const handleQuickDatePreset = useCallback((preset) => {
        const range = getPresetRange(preset);
        if (!range) return;
        setFilters((prev) => ({
            ...prev,
            dateFrom: range.fromDate,
            dateTo: range.toDate,
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
                        {/* Search Field for Payer Name/ID */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                name="search"
                                label="Search Payer"
                                placeholder="Search by payer name or ID..."
                                value={filters.search}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyPress}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: filters.search && (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleClearSearch}
                                                    edge="end"
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        {/* Payment Method Selector */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    id="payment-method-select"
                                    value={filters.paymentMethod}
                                    label="Payment Method"
                                    onChange={handlePaymentMethodChange}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PaymentIcon color="action" />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>All Methods</em>
                                    </MenuItem>
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="card">Card</MenuItem>
                                    <MenuItem value="transfer">Transfer</MenuItem>
                                    <MenuItem value="credit">Credit</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <AmountRange
                            amountFrom={filters.amountFrom}
                            amountTo={filters.amountTo}
                            amountError={amountError}
                            onAmountChange={handleAmountChange}
                            onKeyDown={handleKeyPress}
                        />

                        <DateRangeSection
                            dateFrom={filters.dateFrom}
                            dateTo={filters.dateTo}
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
                                    disabled={!!dateError || !!amountError}
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
