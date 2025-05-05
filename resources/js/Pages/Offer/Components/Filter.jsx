import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    FormControl,
    Grid,
    MenuItem,
    Select,
    TextField,
    InputLabel,
    Typography,
    Divider,
    Paper,
    IconButton,
    Tooltip,
    Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PercentIcon from '@mui/icons-material/Percent';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import SelectSearch from '@/Components/SelectSearch';

const Filter = ({ defaultValues, onFilter }) => {
    const [expanded, setExpanded] = useState(false);
    const [filters, setFilters] = useState({
        title: '',
        type: '',
        active: '',
        amount_min: '',
        amount_max: '',
        date_start: '',
        date_end: '',
        tests: [],
        referrers: []
    });

    // Count active filters
    const activeFilterCount = Object.keys(filters).reduce((count, key) => {
        if (key === 'tests' || key === 'referrers') {
            return count + (filters[key]?.length > 0 ? 1 : 0);
        }
        return count + (filters[key] && filters[key] !== '' ? 1 : 0);
    }, 0);

    useEffect(() => {
        if (defaultValues) {
            setFilters(prevState => ({
                ...prevState,
                ...defaultValues
            }));
        }
    }, [defaultValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSearchChange = (name) => (value) => {
        setFilters(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(filters)();
    };

    const handleReset = () => {
        const resetFilters = {
            title: '',
            type: '',
            active: '',
            amount_min: '',
            amount_max: '',
            date_start: '',
            date_end: '',
            tests: [],
            referrers: []
        };
        setFilters(resetFilters);
        onFilter(resetFilters)();
    };

    const toggleExpanded = () => {
        setExpanded(prev => !prev);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 3,
                border: '1px solid #e0e0e0',
                borderRadius: '10px'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Filters</Typography>
                    {activeFilterCount > 0 && (
                        <Chip
                            label={activeFilterCount}
                            color="primary"
                            size="small"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
                <Box>
                    <Tooltip title={expanded ? "Collapse filters" : "Expand filters"}>
                        <Button
                            size="small"
                            onClick={toggleExpanded}
                            startIcon={expanded ? <ClearIcon /> : <FilterListIcon />}
                        >
                            {expanded ? "Collapse" : "Expand"}
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            {/* Basic search - always visible */}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={expanded ? 12 : 4}>
                        <TextField
                            name="name"
                            label="Search by title"
                            variant="outlined"
                            fullWidth
                            value={filters.name}
                            onChange={handleChange}
                            placeholder="Search offers..."
                            slotProps={{
                                input: {
                                    startAdornment: <SearchIcon sx={{color: 'action.active', mr: 1}}/>,
                                    endAdornment: filters.name ? (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setFilters(prev => ({...prev, name: ''}));
                                            }}
                                        >
                                            <ClearIcon fontSize="small"/>
                                        </IconButton>
                                    ) : null
                                }
                            }}
                        />
                    </Grid>

                    {!expanded && (
                        <>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="active-label">Status</InputLabel>
                                    <Select
                                        labelId="active-label"
                                        name="active"
                                        value={filters.active}
                                        onChange={handleSelectChange}
                                        label="Status"
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="true">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                                Active
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="false">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CancelIcon fontSize="small" color="disabled" sx={{ mr: 1 }} />
                                                Inactive
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="type-label">Offer Type</InputLabel>
                                    <Select
                                        labelId="type-label"
                                        name="type"
                                        value={filters.type}
                                        onChange={handleSelectChange}
                                        label="Offer Type"
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        <MenuItem value="PERCENTAGE">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PercentIcon fontSize="small" sx={{ mr: 1 }} />
                                                Percentage
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="FIXED">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} />
                                                Fixed Amount
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                    )}

                    {expanded && (
                        <>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>Advanced Filters</Typography>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="active-label">Status</InputLabel>
                                    <Select
                                        labelId="active-label"
                                        name="active"
                                        value={filters.active}
                                        onChange={handleSelectChange}
                                        label="Status"
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="true">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                                Active
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="false">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CancelIcon fontSize="small" color="disabled" sx={{ mr: 1 }} />
                                                Inactive
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="type-label">Offer Type</InputLabel>
                                    <Select
                                        labelId="type-label"
                                        name="type"
                                        value={filters.type}
                                        onChange={handleSelectChange}
                                        label="Offer Type"
                                    >
                                        <MenuItem value="">All Types</MenuItem>
                                        <MenuItem value="PERCENTAGE">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PercentIcon fontSize="small" sx={{ mr: 1 }} />
                                                Percentage
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="FIXED">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} />
                                                Fixed Amount
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    name="amount_min"
                                    label="Min Amount"
                                    variant="outlined"
                                    fullWidth
                                    type="number"
                                    value={filters.amount_min}
                                    onChange={handleChange}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <TextField
                                    name="amount_max"
                                    label="Max Amount"
                                    variant="outlined"
                                    fullWidth
                                    type="number"
                                    value={filters.amount_max}
                                    onChange={handleChange}
                                    slotProps={{ htmlInput:{ min: 0 }}}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Start Date From"
                                    name="date_start"
                                    type="date"
                                    fullWidth
                                    variant="outlined"
                                    value={filters.date_start}
                                    onChange={handleChange}
                                    slotProps={{
                                        inputLabel:{shrink: true,}
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="End Date To"
                                    name="date_end"
                                    type="date"
                                    fullWidth
                                    variant="outlined"
                                    value={filters.date_end}
                                    onChange={handleChange}
                                    slotProps={{
                                        inputLabel:{shrink: true,}
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <SelectSearch
                                    filterSelectedOptions
                                    value={filters.tests}
                                    label="Filter by Tests"
                                    fullWidth
                                    multiple
                                    onChange={handleSearchChange('tests')}
                                    name="tests"
                                    url={route("api.tests.list")}
                                    variant="outlined"
                                    placeholder="Search for tests..."
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <SelectSearch
                                    filterSelectedOptions
                                    value={filters.referrers}
                                    label="Filter by Referrers"
                                    fullWidth
                                    multiple
                                    onChange={handleSearchChange('referrers')}
                                    name="referrers"
                                    url={route("api.referrers.list")}
                                    variant="outlined"
                                    placeholder="Search for referrers..."
                                />
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleReset}
                                startIcon={<RestartAltIcon />}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                startIcon={<SearchIcon />}
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default Filter;
