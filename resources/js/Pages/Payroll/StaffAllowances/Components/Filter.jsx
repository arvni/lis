import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import SelectSearch from '@/Components/SelectSearch';

const emptyFilters = {
    user_id: '',
    calculation: '',
    payroll_item_type_id: '',
};

const Filter = ({ defaultValues, onFilter, calculations = [], itemTypes = [] }) => {
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
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="item-label">Item</InputLabel>
                            <Select
                                labelId="item-label"
                                label="Item"
                                name="payroll_item_type_id"
                                value={filters.payroll_item_type_id ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                {itemTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="calculation-label">Worked out</InputLabel>
                            <Select
                                labelId="calculation-label"
                                label="Worked out"
                                name="calculation"
                                value={filters.calculation ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                {calculations.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
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
