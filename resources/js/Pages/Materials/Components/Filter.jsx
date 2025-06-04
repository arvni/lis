import React, {useEffect, useState} from 'react';
import {
    Box,
    TextField,
    Button,
    Stack,
    Paper,
    Typography,
    Grid2 as Grid,
} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import SelectSearch from "@/Components/SelectSearch.jsx";

const Filter = ({onFilter, defaultFilter: defaultValues = {}}) => {
    console.log(defaultValues);
    const [filters, setFilters] = useState({
        search: defaultValues.search || '',
        sampleType: defaultValues.sampleType || null,
        referrer: defaultValues.referrer || null,
        expire_date: {
            from: defaultValues.expire_date?.from || null,
            to: defaultValues.expire_date?.to || null,
        },
        assigned_at: {
            from: defaultValues.assigned_at?.from || null,
            to: defaultValues.assigned_at?.to || null,
        },
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDateRangeChange = (field, type, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [type]: value
            }
        }));
    };

    const handleApplyFilters = () => {
        // Clean up filters before sending
        const cleanedFilters = {
            ...filters,
            expire_date: (filters.expire_date.from || filters.expire_date.to) ? filters.expire_date : null,
            assigned_at: (filters.assigned_at.from || filters.assigned_at.to) ? filters.assigned_at : null,
        };

        // Remove null values
        Object.keys(cleanedFilters).forEach(key => {
            if (cleanedFilters[key] === null || cleanedFilters[key] === '') {
                delete cleanedFilters[key];
            }
        });

        onFilter(cleanedFilters)();
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            search: '',
            sampleType: null,
            referrer: null,
            expire_date: {from: null, to: null},
            assigned_at: {from: null, to: null},
        };
        setFilters(clearedFilters);
        onFilter({})();
    };

    const hasActiveFilters = () => {
        return filters.search ||
            filters.sampleType ||
            filters.referrer ||
            filters.expire_date.from ||
            filters.expire_date.to ||
            filters.assigned_at.from ||
            filters.assigned_at.to;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={1} sx={{p: 2, mb: 2}}>
                <Box
                    sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <FilterListIcon color="action"/>
                        <Typography variant="h6">Filters</Typography>
                        {hasActiveFilters() && (
                            <Typography variant="caption" color="primary" sx={{ml: 1}}>
                                ({Object.keys(filters).filter(key => {
                                if (key === 'expire_date' || key === 'assigned_at') {
                                    return filters[key].from || filters[key].to;
                                }
                                return filters[key];
                            }).length} active)
                            </Typography>
                        )}
                    </Box>
                    <Box>

                    </Box>
                </Box>


                <Grid container spacing={2}>
                    {/* Search Field */}
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search"
                            placeholder="Search by barcode, tube barcode..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            slotProps={{
                                input: {startAdornment: <SearchIcon color="action" sx={{mr: 1}}/>,},
                            }}
                        />
                    </Grid>

                    {/* Sample Type Filter */}
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <SelectSearch
                            size="small"
                            value={filters.sampleType}
                            onChange={(e) => handleFilterChange('sampleType', e.target.value)}
                            label="Sample Type"
                            fullWidth
                            url={route("api.sampleTypes.list")}
                            name="sampleType"
                        />
                    </Grid>

                    {/* Referrer Filter */}
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <SelectSearch
                            size="small"
                            value={filters.referrer}
                            onChange={(e) => handleFilterChange('referrer', e.target.value)}
                            label="Assigned To"
                            fullWidth
                            url={route("api.referrers.list")}
                            name="referrer"
                        />
                    </Grid>

                    {/* Expire Date Range */}
                    <Grid size={{xs: 12, md: 6,}}>
                        <Typography variant="caption" color="textSecondary" sx={{mb: 1, display: 'block'}}>
                            Tube Expire Date Range
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <DatePicker
                                label="From"
                                value={filters.expire_date.from}
                                onChange={(value) => handleDateRangeChange('expire_date', 'from', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true
                                    }
                                }}
                            />
                            <DatePicker
                                label="To"
                                value={filters.expire_date.to}
                                onChange={(value) => handleDateRangeChange('expire_date', 'to', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true
                                    }
                                }}
                            />
                        </Stack>
                    </Grid>

                    {/* Assigned Date Range */}
                    <Grid size={{xs: 12, md: 6}}>
                        <Typography variant="caption" color="textSecondary" sx={{mb: 1, display: 'block'}}>
                            Assigned Date Range
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <DatePicker
                                label="From"
                                value={filters.assigned_at.from}
                                onChange={(value) => handleDateRangeChange('assigned_at', 'from', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true
                                    }
                                }}
                            />
                            <DatePicker
                                label="To"
                                value={filters.assigned_at.to}
                                onChange={(value) => handleDateRangeChange('assigned_at', 'to', value)}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true
                                    }
                                }}
                            />
                        </Stack>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<ClearIcon/>}
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters()}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApplyFilters}
                            >
                                Apply Filters
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
        </LocalizationProvider>
    );
};

export default Filter;
