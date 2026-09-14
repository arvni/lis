import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import dayjs from 'dayjs';

const emptyFilters = {
    search: '',
    from_date: '',
    to_date: '',
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

    const handleDateChange = (name) => (value) => {
        setFilters((prevState) => ({
            ...prevState,
            [name]: value?.isValid() ? value.format('YYYY-MM-DD') : '',
        }));
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                label="Search"
                                name="search"
                                fullWidth
                                size="small"
                                value={filters.search ?? ''}
                                onChange={handleChange}
                                helperText="Holiday title"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <DatePicker
                                label="From"
                                value={filters.from_date ? dayjs(filters.from_date) : null}
                                onChange={handleDateChange('from_date')}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <DatePicker
                                label="To"
                                value={filters.to_date ? dayjs(filters.to_date) : null}
                                onChange={handleDateChange('to_date')}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
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
                </LocalizationProvider>
            </form>
        </Paper>
    );
};

export default Filter;
