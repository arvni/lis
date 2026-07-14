import React, { memo, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import SelectSearch from '@/Components/SelectSearch.jsx';

const AcceptanceItemsFilter = memo(({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const [dateError, setDateError] = useState('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (filter?.from_date && filter?.to_date && filter.from_date > filter.to_date) {
            setDateError('Start date cannot be after end date');
        } else {
            setDateError('');
        }
    }, [filter?.from_date, filter?.to_date]);

    const handleChange = (event) => {
        setFilter((prevState) => ({
            ...prevState,
            [event.target.name]: event.target.value,
        }));
    };

    const handleClearDate = (fieldName) => {
        setFilter((prevState) => ({ ...prevState, [fieldName]: '' }));
    };

    const handleQuickDatePreset = (preset) => {
        const currentDate = new Date();
        let fromDate = new Date(currentDate);
        let toDate = new Date(currentDate);

        switch (preset) {
            case 'today':
                break;
            case 'yesterday':
                fromDate.setDate(fromDate.getDate() - 1);
                toDate = new Date(fromDate);
                break;
            case 'thisWeek':
                fromDate.setDate(fromDate.getDate() - fromDate.getDay());
                break;
            case 'lastWeek':
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
                toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                break;
            case 'thisMonth':
                fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                break;
            case 'lastMonth':
                fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
                break;
            default:
                return;
        }

        setFilter((prevState) => ({
            ...prevState,
            from_date: fromDate.toISOString().split('T')[0],
            to_date: toDate.toISOString().split('T')[0],
        }));
    };

    const clearAllFilters = () => {
        setFilter({
            search: '',
            status: '',
            tags: [],
            tests: [],
            from_date: '',
            to_date: '',
        });
    };

    const applyFilter = () => {
        if (!dateError) {
            onFilter(filter)();
        }
    };

    const hasActiveFilters =
        filter?.search ||
        filter?.status ||
        (Array.isArray(filter?.tags) && filter.tags.length > 0) ||
        (Array.isArray(filter?.tests) && filter.tests.length > 0) ||
        filter?.from_date ||
        filter?.to_date;

    return (
        <Box>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        fullWidth
                        name="search"
                        value={filter?.search || ''}
                        onChange={handleChange}
                        label="Search"
                        placeholder="Acceptance, patient, test, method, barcode"
                        slotProps={{
                            input: {
                                endAdornment: filter?.search ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                handleChange({
                                                    target: { name: 'search', value: '' },
                                                })
                                            }
                                            edge="end"
                                            size="small"
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <SelectSearch
                        multiple
                        value={filter?.tags || []}
                        onChange={handleChange}
                        label="Tags"
                        fullWidth
                        name="tags"
                        url={route('api.tags.list')}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <SelectSearch
                        multiple
                        value={filter?.tests || []}
                        onChange={handleChange}
                        label="Tests"
                        fullWidth
                        name="tests"
                        url={route('api.tests.list')}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel id="section-group-acceptance-status-label">Status</InputLabel>
                        <Select
                            fullWidth
                            name="status"
                            value={filter?.status || ''}
                            onChange={handleChange}
                            labelId="section-group-acceptance-status-label"
                            label="Status"
                        >
                            <MenuItem value="">Any</MenuItem>
                            <MenuItem value="waiting">Waiting</MenuItem>
                            <MenuItem value="processing">Processing</MenuItem>
                            <MenuItem value="finished">Finished</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {filter?.tags && filter.tags.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Chip
                            label={`Tags: ${filter.tags.length} selected`}
                            onDelete={() => setFilter((prevState) => ({ ...prevState, tags: [] }))}
                            size="small"
                            variant="outlined"
                        />
                    </Grid>
                )}

                {filter?.tests && filter.tests.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Chip
                            label={`Tests: ${filter.tests.length} selected`}
                            onDelete={() => setFilter((prevState) => ({ ...prevState, tests: [] }))}
                            size="small"
                            variant="outlined"
                        />
                    </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                        Date Range Presets
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {[
                            'today',
                            'yesterday',
                            'thisWeek',
                            'lastWeek',
                            'thisMonth',
                            'lastMonth',
                        ].map((preset) => (
                            <Chip
                                key={preset}
                                label={
                                    {
                                        today: 'Today',
                                        yesterday: 'Yesterday',
                                        thisWeek: 'This Week',
                                        lastWeek: 'Last Week',
                                        thisMonth: 'This Month',
                                        lastMonth: 'Last Month',
                                    }[preset]
                                }
                                onClick={() => handleQuickDatePreset(preset)}
                                size="small"
                                clickable
                            />
                        ))}
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        name="from_date"
                        value={filter?.from_date || ''}
                        onChange={handleChange}
                        label="From Date"
                        type="date"
                        error={Boolean(dateError)}
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { max: today },
                            input: {
                                endAdornment: filter?.from_date ? (
                                    <InputAdornment position="end">
                                        <Tooltip title="Clear date">
                                            <IconButton
                                                onClick={() => handleClearDate('from_date')}
                                                edge="end"
                                                size="small"
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        name="to_date"
                        value={filter?.to_date || ''}
                        onChange={handleChange}
                        label="To Date"
                        type="date"
                        error={Boolean(dateError)}
                        helperText={dateError}
                        slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { max: today },
                            input: {
                                endAdornment: filter?.to_date ? (
                                    <InputAdornment position="end">
                                        <Tooltip title="Clear date">
                                            <IconButton
                                                onClick={() => handleClearDate('to_date')}
                                                edge="end"
                                                size="small"
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {hasActiveFilters && (
                            <Button variant="outlined" color="secondary" onClick={clearAllFilters}>
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={applyFilter}
                            disabled={Boolean(dateError)}
                        >
                            Apply Filters
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
});
AcceptanceItemsFilter.displayName = 'AcceptanceItemsFilter';

export default AcceptanceItemsFilter;
