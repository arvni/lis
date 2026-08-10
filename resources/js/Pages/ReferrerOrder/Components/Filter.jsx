import React, { useCallback, useState } from 'react';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {
    Box,
    Checkbox,
    Chip,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PropTypes from 'prop-types';
import { MenuProps, REFERRER_ORDER_STATUSES } from './Filter/constants';

const Filter = ({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const selectedStatuses = filter?.status || [];

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilter((prevState) => ({ ...prevState, [name]: value }));
    }, []);

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            onFilter(filter)();
        },
        [filter, onFilter],
    );

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter') {
                handleSubmit(e);
            }
        },
        [handleSubmit],
    );

    const handleClearAll = useCallback(() => setFilter({}), []);

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                        sx={{ width: '100%' }}
                        name="search"
                        value={filter?.search || ''}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        label="Search"
                        placeholder="Order ID, patient or barcode..."
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <FormControl fullWidth>
                        <InputLabel id="referrer-order-status-label">Status</InputLabel>
                        <Select
                            labelId="referrer-order-status-label"
                            multiple
                            name="status"
                            value={selectedStatuses}
                            onChange={handleChange}
                            input={<OutlinedInput label="Status" />}
                            MenuProps={MenuProps}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip
                                            key={value}
                                            size="small"
                                            label={
                                                REFERRER_ORDER_STATUSES.find(
                                                    (option) => option.value === value,
                                                )?.label ?? value
                                            }
                                        />
                                    ))}
                                </Box>
                            )}
                        >
                            {REFERRER_ORDER_STATUSES.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox
                                        checked={selectedStatuses.includes(option.value)}
                                        size="small"
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                    <Stack direction="row" spacing={1}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<FilterListIcon />}
                            fullWidth
                        >
                            Filter
                        </Button>
                        <Button variant="outlined" onClick={handleClearAll} title="Clear filters">
                            <RefreshIcon />
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

Filter.propTypes = {
    defaultFilter: PropTypes.object,
    onFilter: PropTypes.func.isRequired,
};

export default Filter;
