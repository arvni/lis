import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import { MenuItem, TextField } from '@mui/material';
import { usePage } from '@inertiajs/react';
import FilterTemplate from '@/Components/FilterWraper.jsx';
import SelectSearch from '@/Components/SelectSearch';

const FinanceFilter = ({ defaultFilter, onFilter }) => {
    const { statuses = [] } = usePage().props;
    const [filter, setFilter] = useState({ ...defaultFilter });
    const set = (name, value) => setFilter((prev) => ({ ...prev, [name]: value }));

    return (
        <FilterTemplate onFilter={() => onFilter(filter)()}>
            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                    fullWidth
                    label="Quotation, pre-order or patient"
                    value={filter.search || ''}
                    onChange={(e) => set('search', e.target.value)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                    select
                    fullWidth
                    label="Status"
                    value={filter.status || ''}
                    onChange={(e) => set('status', e.target.value)}
                >
                    <MenuItem value="">Any status</MenuItem>
                    {statuses.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                            {s.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
                <SelectSearch
                    fullWidth
                    label="Center"
                    url={route('api.referrers.list')}
                    value={filter.referrer ?? null}
                    name="referrer"
                    onChange={(e) => {
                        set('referrer', e.target.value);
                        set('referrer_id', e.target.value?.id ?? '');
                    }}
                />
            </Grid>
        </FilterTemplate>
    );
};

FinanceFilter.propTypes = {
    defaultFilter: PropTypes.object,
    onFilter: PropTypes.func.isRequired,
};

export default FinanceFilter;
