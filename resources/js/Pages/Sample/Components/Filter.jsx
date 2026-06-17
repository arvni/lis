import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import FilterTemplate from '@/Components/FilterWraper.jsx';

const Filter = ({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter ?? {});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <FilterTemplate onFilter={onFilter(filter)}>
            <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                    fullWidth
                    name="search"
                    label="Search (barcode, patient name, ID)"
                    value={filter?.search ?? ''}
                    onChange={handleChange}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>QC Status</InputLabel>
                    <Select
                        name="qc_status"
                        label="QC Status"
                        value={filter?.qc_status ?? ''}
                        onChange={handleChange}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </FilterTemplate>
    );
};

export default Filter;
