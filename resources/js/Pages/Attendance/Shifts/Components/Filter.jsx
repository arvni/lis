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

const emptyFilters = {
    search: '',
    is_active: '',
};

const Filter = ({ defaultValues, onFilter }) => {
    const [filters, setFilters] = useState(emptyFilters);

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
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                            label="Search"
                            name="search"
                            fullWidth
                            size="small"
                            value={filters.search ?? ''}
                            onChange={handleChange}
                            helperText="Shift name"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="shift-active-label">Status</InputLabel>
                            <Select
                                labelId="shift-active-label"
                                label="Status"
                                name="is_active"
                                value={filters.is_active ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="1">Active</MenuItem>
                                <MenuItem value="0">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
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
