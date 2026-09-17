import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import SelectSearch from '@/Components/SelectSearch';

const emptyFilters = {
    user_id: '',
    status: '',
    month: '',
};

const Filter = ({ defaultValues, onFilter, statuses = [], canViewAll = false }) => {
    const [filters, setFilters] = useState(emptyFilters);
    const [person, setPerson] = useState(null);

    useEffect(() => {
        if (defaultValues) {
            setFilters((prevState) => ({ ...prevState, ...defaultValues }));
        }
    }, [defaultValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(filters)();
    };

    const handleReset = () => {
        setPerson(null);
        setFilters(emptyFilters);
        onFilter(emptyFilters)();
    };

    return (
        <Paper
            elevation={0}
            sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', borderRadius: '10px' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Filters</Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="center">
                    {/* Someone who only sees their own slips has nobody to choose between. */}
                    {canViewAll && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <SelectSearch
                                name="person"
                                label="Person"
                                size="small"
                                fullWidth
                                value={person}
                                url={route('api.payroll.people.list')}
                                onChange={(e) => {
                                    setPerson(e.target.value);
                                    setFilters((prevState) => ({
                                        ...prevState,
                                        user_id: e.target.value?.id ?? '',
                                    }));
                                }}
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="Month"
                            name="month"
                            type="month"
                            size="small"
                            fullWidth
                            value={filters.month ?? ''}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>
                    {canViewAll && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="slip-status-label">Status</InputLabel>
                                <Select
                                    labelId="slip-status-label"
                                    label="Status"
                                    name="status"
                                    value={filters.status ?? ''}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {statuses.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<SearchIcon />}
                                size="small"
                            >
                                Filter
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="outlined"
                                startIcon={<RestartAltIcon />}
                                size="small"
                            >
                                Reset
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default Filter;
