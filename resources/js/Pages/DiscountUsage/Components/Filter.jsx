import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import SelectSearch from '@/Components/SelectSearch';

const Filter = ({ filters, partner, onPartnerChange }) => {
    const [values, setValues] = useState({
        from_date: filters.from_date ?? '',
        to_date: filters.to_date ?? '',
        discount_partner_id: filters.discount_partner_id ?? '',
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((previous) => ({ ...previous, [name]: value }));
    };

    const handlePartnerChange = (event) => {
        const selected = event.target.value;
        onPartnerChange(selected);
        setValues((previous) => ({ ...previous, discount_partner_id: selected?.id ?? '' }));
    };

    const submit = (event) => {
        event.preventDefault();
        router.get(route('discountUsage.index'), { filters: values }, { preserveState: true });
    };

    const reset = () => {
        onPartnerChange(null);
        router.get(route('discountUsage.index'));
    };

    return (
        <Paper
            elevation={0}
            sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Period</Typography>
            </Box>

            <form onSubmit={submit}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="From"
                            name="from_date"
                            type="date"
                            fullWidth
                            size="small"
                            value={values.from_date}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                            label="To"
                            name="to_date"
                            type="date"
                            fullWidth
                            size="small"
                            value={values.to_date}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <SelectSearch
                            value={partner}
                            onChange={handlePartnerChange}
                            name="partner"
                            fullWidth
                            size="small"
                            url={route('api.discountPartners.list')}
                            label="Partner"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                startIcon={<SearchIcon />}
                            >
                                Apply
                            </Button>
                            <Button
                                onClick={reset}
                                variant="outlined"
                                size="small"
                                startIcon={<RestartAltIcon />}
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
