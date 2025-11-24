import React, {useEffect, useState, useCallback} from 'react';
import {
    Box,
    TextField,
    Button,
    Stack,
    Paper,
    Typography,
    Grid2 as Grid,
    IconButton,
    InputAdornment,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const Filter = ({onFilter, defaultFilter: defaultValues = {}}) => {
    // Helper to parse date string to Date object in local timezone
    const parseDateFromServer = (dateString) => {
        if (!dateString) return null;
        // Parse YYYY-MM-DD as local date, not UTC
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const [filters, setFilters] = useState({
        search: defaultValues.search || '',
        paymentMethod: defaultValues.paymentMethod || '',
        dateFrom: parseDateFromServer(defaultValues.dateFrom),
        dateTo: parseDateFromServer(defaultValues.dateTo),
        amountFrom: defaultValues.amountFrom || '',
        amountTo: defaultValues.amountTo || '',
    });
    const [dateError, setDateError] = useState("");
    const [amountError, setAmountError] = useState("");
    const [activeFilters, setActiveFilters] = useState(0);
    const today = new Date();

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
        const count = Object.values(filterValues).filter(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== "" && value !== null && value !== undefined;
        }).length;
        setActiveFilters(count);
    }, [filters]);

    // Enhanced date validation
    useEffect(() => {
        if (filters.dateFrom && filters.dateTo) {
            const fromDate = new Date(filters.dateFrom);
            const toDate = new Date(filters.dateTo);
            const todayDate = new Date(today);
            todayDate.setHours(23, 59, 59, 999); // End of today

            if (fromDate > toDate) {
                setDateError("Start date cannot be after end date");
            } else if (fromDate > todayDate) {
                setDateError("Start date cannot be in the future");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [filters.dateFrom, filters.dateTo, today]);

    // Amount validation
    useEffect(() => {
        if (filters.amountFrom && filters.amountTo) {
            const fromAmount = parseFloat(filters.amountFrom);
            const toAmount = parseFloat(filters.amountTo);

            if (fromAmount < 0 || toAmount < 0) {
                setAmountError("Amount cannot be negative");
            } else if (fromAmount > toAmount) {
                setAmountError("From amount cannot be greater than To amount");
            } else {
                setAmountError("");
            }
        } else if (filters.amountFrom && parseFloat(filters.amountFrom) < 0) {
            setAmountError("Amount cannot be negative");
        } else if (filters.amountTo && parseFloat(filters.amountTo) < 0) {
            setAmountError("Amount cannot be negative");
        } else {
            setAmountError("");
        }
    }, [filters.amountFrom, filters.amountTo]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearchChange = useCallback((e) => {
        handleFilterChange('search', e.target.value);
    }, []);

    const handlePaymentMethodChange = useCallback((e) => {
        handleFilterChange('paymentMethod', e.target.value);
    }, []);

    const handleAmountChange = useCallback((field) => (e) => {
        const value = e.target.value;
        // Allow only numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            handleFilterChange(field, value);
        }
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilters(prevState => ({...prevState, search: ""}));
    }, []);

    const formatDateForServer = (date) => {
        if (!date) return null;
        // Format date as YYYY-MM-DD in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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
        Object.keys(cleanedFilters).forEach(key => {
            if (cleanedFilters[key] === null || cleanedFilters[key] === '' || cleanedFilters[key] === undefined) {
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
        setDateError("");
        setAmountError("");
        onFilter({})();
    }, [onFilter]);

    const handleClearDate = useCallback((fieldName) => {
        setFilters(prevState => ({...prevState, [fieldName]: null}));
    }, []);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !dateError && !amountError) {
            handleApplyFilters();
        }
    }, [handleApplyFilters, dateError, amountError]);

    const handleQuickDatePreset = useCallback((preset) => {
        const today = new Date();
        let fromDate = new Date();
        let toDate = new Date();

        switch (preset) {
            case 'today':
                fromDate = new Date(today);
                toDate = new Date(today);
                break;
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 1);
                toDate = new Date(fromDate);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay());
                toDate = new Date(today);
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
                toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                break;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'thisYear':
                fromDate = new Date(today.getFullYear(), 0, 1);
                toDate = new Date(today);
                break;
            case 'lastYear':
                fromDate = new Date(today.getFullYear() - 1, 0, 1);
                toDate = new Date(today.getFullYear() - 1, 11, 31);
                break;
            default:
                return;
        }

        setFilters(prev => ({
            ...prev,
            dateFrom: fromDate,
            dateTo: toDate
        }));
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{p: 3, mb: 2, bgcolor: 'background.paper'}}>
                <Stack spacing={3}>
                    {/* Header with filter icon and active count */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
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
                        <Grid size={{xs: 12}}>
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
                                                <SearchIcon color="action"/>
                                            </InputAdornment>
                                        ),
                                        endAdornment: filters.search && (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleClearSearch}
                                                    edge="end"
                                                >
                                                    <ClearIcon fontSize="small"/>
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        </Grid>

                        {/* Payment Method Selector */}
                        <Grid size={{xs: 12, md: 6}}>
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
                                            <PaymentIcon color="action"/>
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

                        {/* Amount Range Section */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                                    <AttachMoneyIcon color="action" fontSize="small"/>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Amount Range
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        fullWidth
                                        label="From"
                                        placeholder="Min"
                                        value={filters.amountFrom}
                                        onChange={handleAmountChange('amountFrom')}
                                        onKeyDown={handleKeyPress}
                                        error={!!amountError && filters.amountFrom}
                                        type="text"
                                        inputProps={{
                                            inputMode: 'decimal',
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="To"
                                        placeholder="Max"
                                        value={filters.amountTo}
                                        onChange={handleAmountChange('amountTo')}
                                        onKeyDown={handleKeyPress}
                                        error={!!amountError}
                                        helperText={amountError}
                                        type="text"
                                        inputProps={{
                                            inputMode: 'decimal',
                                        }}
                                    />
                                </Stack>
                            </Box>
                        </Grid>

                        {/* Date Range Section */}
                        <Grid size={{xs: 12}}>
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
                                    <CalendarTodayIcon color="action" fontSize="small"/>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Date Range
                                    </Typography>
                                </Box>

                                {/* Quick Date Presets */}
                                <Stack direction="row" spacing={1} sx={{mb: 2, flexWrap: 'wrap', gap: 1}}>
                                    <Chip
                                        label="Today"
                                        onClick={() => handleQuickDatePreset('today')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="Yesterday"
                                        onClick={() => handleQuickDatePreset('yesterday')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="This Week"
                                        onClick={() => handleQuickDatePreset('thisWeek')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="Last Week"
                                        onClick={() => handleQuickDatePreset('lastWeek')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="This Month"
                                        onClick={() => handleQuickDatePreset('thisMonth')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="Last Month"
                                        onClick={() => handleQuickDatePreset('lastMonth')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="This Year"
                                        onClick={() => handleQuickDatePreset('thisYear')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                    <Chip
                                        label="Last Year"
                                        onClick={() => handleQuickDatePreset('lastYear')}
                                        size="small"
                                        variant="outlined"
                                        clickable
                                    />
                                </Stack>

                                {/* Date Pickers */}
                                <Grid container spacing={2}>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <DatePicker
                                            label="From Date"
                                            value={filters.dateFrom}
                                            onChange={(value) => handleFilterChange('dateFrom', value)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!dateError,
                                                    InputProps: {
                                                        endAdornment: filters.dateFrom && (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleClearDate('dateFrom')}
                                                                    edge="end"
                                                                >
                                                                    <ClearIcon fontSize="small"/>
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <DatePicker
                                            label="To Date"
                                            value={filters.dateTo}
                                            onChange={(value) => handleFilterChange('dateTo', value)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!dateError,
                                                    helperText: dateError,
                                                    InputProps: {
                                                        endAdornment: filters.dateTo && (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleClearDate('dateTo')}
                                                                    edge="end"
                                                                >
                                                                    <ClearIcon fontSize="small"/>
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        {/* Action Buttons */}
                        <Grid size={{xs: 12}}>
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    startIcon={<ClearIcon/>}
                                    onClick={handleClearFilters}
                                    disabled={activeFilters === 0}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FilterListIcon/>}
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
}

export default Filter;
