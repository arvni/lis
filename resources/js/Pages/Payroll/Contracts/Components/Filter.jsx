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
    employment_type: '',
    current: '',
};

const Filter = ({ defaultValues, onFilter, employmentTypes = [] }) => {
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

    const handlePerson = (e) => {
        const picked = e.target.value;
        setPerson(picked);
        setFilters((prevState) => ({ ...prevState, user_id: picked?.id ?? '' }));
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
                            onChange={handlePerson}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="contract-type-label">Employment</InputLabel>
                            <Select
                                labelId="contract-type-label"
                                label="Employment"
                                name="employment_type"
                                value={filters.employment_type ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                {employmentTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="contract-current-label">Status</InputLabel>
                            <Select
                                labelId="contract-current-label"
                                label="Status"
                                name="current"
                                value={filters.current ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="1">Running</MenuItem>
                                <MenuItem value="0">Finished or not started</MenuItem>
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
