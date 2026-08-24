import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
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
    search: '',
    partner: null,
    discount_partner_id: '',
    status: '',
    series: '',
    redeemable: false,
};

const STATUSES = ['Inactive', 'Active', 'Suspended', 'Revoked'];

const Filter = ({ defaultValues, onFilter }) => {
    const [filters, setFilters] = useState(emptyFilters);

    useEffect(() => {
        if (defaultValues) {
            setFilters((prevState) => ({ ...prevState, ...defaultValues }));
        }
    }, [defaultValues]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters((prevState) => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // The picker hands back an object; the backend filters on the id.
    const handlePartnerChange = (e) => {
        const partner = e.target.value;
        setFilters((prevState) => ({
            ...prevState,
            partner,
            discount_partner_id: partner?.id ?? '',
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
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="Search"
                            name="search"
                            fullWidth
                            size="small"
                            value={filters.search ?? ''}
                            onChange={handleChange}
                            helperText="Card number or series"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <SelectSearch
                            value={filters.partner}
                            onChange={handlePartnerChange}
                            name="partner"
                            fullWidth
                            size="small"
                            url={route('api.discountPartners.list')}
                            label="Partner"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="card-status-label">Status</InputLabel>
                            <Select
                                labelId="card-status-label"
                                label="Status"
                                name="status"
                                value={filters.status ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                {STATUSES.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="redeemable"
                                    checked={!!filters.redeemable}
                                    onChange={handleChange}
                                />
                            }
                            label="Redeemable"
                        />
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
