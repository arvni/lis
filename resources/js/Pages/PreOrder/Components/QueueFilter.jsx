import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import { Checkbox, FormControlLabel, MenuItem, TextField } from '@mui/material';
import { usePage } from '@inertiajs/react';
import FilterTemplate from '@/Components/FilterWraper.jsx';

const QueueFilter = ({ defaultFilter, onFilter }) => {
    const { stages = [] } = usePage().props;
    const [filter, setFilter] = useState({ owner: 'bion', ...defaultFilter });
    const set = (name, value) => setFilter((prev) => ({ ...prev, [name]: value }));

    return (
        <FilterTemplate onFilter={() => onFilter(filter)()}>
            <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                    fullWidth
                    label="Code or patient"
                    value={filter.search || ''}
                    onChange={(e) => set('search', e.target.value)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                    select
                    fullWidth
                    label="Waiting on"
                    value={filter.owner || 'bion'}
                    onChange={(e) => set('owner', e.target.value)}
                >
                    <MenuItem value="bion">BION</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="all">Anyone</MenuItem>
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                    select
                    fullWidth
                    label="Stage"
                    value={filter.stage || ''}
                    onChange={(e) => set('stage', e.target.value)}
                >
                    <MenuItem value="">Any stage</MenuItem>
                    {stages.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                            {s.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={Boolean(filter.mine)}
                            onChange={(e) => set('mine', e.target.checked ? 1 : '')}
                        />
                    }
                    label="My cases"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={Boolean(filter.unassigned)}
                            onChange={(e) => set('unassigned', e.target.checked ? 1 : '')}
                        />
                    }
                    label="Unassigned"
                />
            </Grid>
        </FilterTemplate>
    );
};

QueueFilter.propTypes = {
    defaultFilter: PropTypes.object,
    onFilter: PropTypes.func.isRequired,
};

export default QueueFilter;
