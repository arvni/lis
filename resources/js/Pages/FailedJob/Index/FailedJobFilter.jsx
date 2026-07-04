import React from 'react';
import { Stack, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

export function FailedJobFilter({ filters, setFilters, queues }) {
    return (
        <Stack direction="row" spacing={2} sx={{ p: 2, flexWrap: 'wrap' }}>
            <TextField
                size="small"
                label="Search"
                value={filters.search ?? ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Queue</InputLabel>
                <Select
                    value={filters.queue ?? ''}
                    label="Queue"
                    onChange={(e) => setFilters({ ...filters, queue: e.target.value })}
                >
                    <MenuItem value="">All Queues</MenuItem>
                    {(queues || []).map((q) => (
                        <MenuItem key={q} value={q}>
                            {q}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    );
}

export default FailedJobFilter;
