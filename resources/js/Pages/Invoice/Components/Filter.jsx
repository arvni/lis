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
import PersonIcon from '@mui/icons-material/Person';
import SelectSearch from "@/Components/SelectSearch.jsx";

const Filter = ({onFilter, defaultFilter: defaultValues = {}}) => {
    const [filters, setFilters] = useState({
        search: defaultValues.search || '',
        owner_type: defaultValues.owner_type || '',
        owner_id: defaultValues.owner_id || null,
        owner_object: defaultValues.owner_object || null, // Store the full object for SelectSearch
        from_date: defaultValues.from_date || null,
        to_date: defaultValues.to_date || null,
    });
    const [dateError, setDateError] = useState("");
    const [activeFilters, setActiveFilters] = useState(0);
    const today = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    // Count active filters for better UX
    useEffect(() => {
        const filterValues = {
            search: filters.search,
            owner_type: filters.owner_type,
            owner_id: filters.owner_id,
            from_date: filters.from_date,
            to_date: filters.to_date,
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
        if (filters.from_date && filters.to_date) {
            const fromDate = new Date(filters.from_date);
            const toDate = new Date(filters.to_date);

            if (fromDate > toDate) {
                setDateError("Start date cannot be after end date");
            } else if (fromDate > new Date(today)) {
                setDateError("Start date cannot be in the future");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [filters.from_date, filters.to_date, today]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => {
            const newFilters = {
                ...prev,
                [field]: value
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
        setFilters(prev => ({
            ...prev,
            owner_object: ownerObject,
            owner_id: ownerObject?.id || null
        }));
    }, []);

    const handleSearchChange = useCallback((e) => {
        handleFilterChange('search', e.target.value);
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilters(prevState => ({...prevState, search: ""}));
    }, []);

    const formatDateForBackend = (date) => {
        if (!date) return null;
        // Format date as YYYY-MM-DD to avoid timezone issues
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleApplyFilters = useCallback(() => {
        if (dateError) {
            return;
        }

        // Clean up filters before sending
        const cleanedFilters = {
            search: filters.search,
            owner_type: filters.owner_type,
            owner_id: filters.owner_id,
            from_date: formatDateForBackend(filters.from_date),
            to_date: formatDateForBackend(filters.to_date),
        };

        // Remove null, undefined, and empty string values, but keep owner_object out of the API call
        Object.keys(cleanedFilters).forEach(key => {
            if (cleanedFilters[key] === null || cleanedFilters[key] === '' || cleanedFilters[key] === undefined) {
                delete cleanedFilters[key];
            }
        });

        onFilter(cleanedFilters)();
    }, [filters, dateError, onFilter]);

    const handleClearFilters = useCallback(() => {
        const clearedFilters = {
            search: '',
            owner_type: '',
            owner_id: null,
            owner_object: null,
            from_date: null,
            to_date: null,
        };
        setFilters(clearedFilters);
        setDateError("");
        onFilter({})();
    }, [onFilter]);

    const handleClearDate = useCallback((fieldName) => {
        setFilters(prevState => ({...prevState, [fieldName]: null}));
    }, []);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !dateError) {
            handleApplyFilters();
        }
    }, [handleApplyFilters, dateError]);

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
            from_date: fromDate,
            to_date: toDate
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
                        {/* Patient Search Field */}
                        <Grid size={{xs: 12}}>
                            <TextField
                                fullWidth
                                name="search"
                                label="Search Patient"
                                placeholder="Search by patient name or ID..."
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

                        {/* Owner Type Selector */}
                        <Grid size={{xs: 12, md: 6}}>
                            <FormControl fullWidth>
                                <InputLabel id="owner-type-label">Owner Type</InputLabel>
                                <Select
                                    labelId="owner-type-label"
                                    id="owner-type-select"
                                    value={filters.owner_type}
                                    label="Owner Type"
                                    onChange={handleOwnerTypeChange}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PersonIcon color="action"/>
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value="referrer">Referrer</MenuItem>
                                    <MenuItem value="patient">Patient</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Owner (Referrer/Patient) Filter */}
                        <Grid size={{xs: 12, md: 6}}>
                            {filters.owner_type ? (
                                <SelectSearch
                                    key={filters.owner_type}
                                    fullWidth
                                    label={
                                        filters.owner_type === 'referrer'
                                            ? "Select Referrer"
                                            : "Select Patient"
                                    }
                                    url={
                                        filters.owner_type === 'referrer'
                                            ? route("api.referrers.list")
                                            : route("api.patients.list")
                                    }
                                    value={filters.owner_object}
                                    name="owner_id"
                                    onChange={handleOwnerChange}
                                />
                            ) : (
                                <TextField
                                    fullWidth
                                    label="Select Owner"
                                    disabled
                                    placeholder="Select owner type first"
                                    helperText="Please select an owner type first"
                                />
                            )}
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
                                            value={filters.from_date}
                                            onChange={(value) => handleFilterChange('from_date', value)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!dateError,
                                                    InputProps: {
                                                        endAdornment: filters.from_date && (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleClearDate('from_date')}
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
                                            value={filters.to_date}
                                            onChange={(value) => handleFilterChange('to_date', value)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!dateError,
                                                    helperText: dateError,
                                                    InputProps: {
                                                        endAdornment: filters.to_date && (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleClearDate('to_date')}
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
}

export default Filter;
