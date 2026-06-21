import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import SelectSearch from '@/Components/SelectSearch.jsx';
import {
    IconButton,
    InputAdornment,
    Tooltip,
    Chip,
    Box,
    Select,
    OutlinedInput,
    MenuItem,
    InputLabel,
    FormControl,
    FormControlLabel,
    Checkbox,
    ListItemText,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    MenuProps,
    HOW_FOUND_OPTIONS,
    STATUSES,
    REGISTERED_PRESETS,
    REPORT_DATE_PRESETS,
    rangePreset,
    reportRangePreset,
} from './Filter/constants';
import ActiveFilterChips from './Filter/ActiveFilterChips';
import ClearableDateField from './Filter/ClearableDateField';
import PresetChipRow from './Filter/PresetChipRow';

const Filter = ({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const [dateError, setDateError] = useState('');
    const [reportDateError, setReportDateError] = useState('');
    const [publishedAtError, setPublishedAtError] = useState('');
    const [activeFilters, setActiveFilters] = useState(0);
    const today = new Date().toISOString().split('T')[0];

    // Count active filters for better UX
    useEffect(() => {
        const count = Object.values(filter || {}).filter((value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return value === true;
            return value !== '' && value !== null && value !== undefined;
        }).length;
        setActiveFilters(count);
    }, [filter]);

    useEffect(() => {
        if (filter?.from_date && filter?.to_date) {
            const fromDate = new Date(filter.from_date);
            const toDate = new Date(filter.to_date);

            if (fromDate > toDate) {
                setDateError('Start date cannot be after end date');
            } else if (fromDate > new Date(today)) {
                setDateError('Start date cannot be in the future');
            } else if (toDate > new Date(today)) {
                setDateError('End date cannot be in the future');
            } else {
                setDateError('');
            }
        } else {
            setDateError('');
        }
    }, [filter?.from_date, filter?.to_date, today]);

    useEffect(() => {
        if (filter?.report_date_from && filter?.report_date_to) {
            const from = new Date(filter.report_date_from);
            const to = new Date(filter.report_date_to);
            setReportDateError(from > to ? 'Start date cannot be after end date' : '');
        } else {
            setReportDateError('');
        }
    }, [filter?.report_date_from, filter?.report_date_to]);

    useEffect(() => {
        if (filter?.published_at_from && filter?.published_at_to) {
            const from = new Date(filter.published_at_from);
            const to = new Date(filter.published_at_to);
            if (from > to) {
                setPublishedAtError('Start date cannot be after end date');
            } else if (from > new Date(today)) {
                setPublishedAtError('Start date cannot be in the future');
            } else if (to > new Date(today)) {
                setPublishedAtError('End date cannot be in the future');
            } else {
                setPublishedAtError('');
            }
        } else {
            setPublishedAtError('');
        }
    }, [filter?.published_at_from, filter?.published_at_to, today]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFilter((prevState) => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            if (!dateError && !reportDateError && !publishedAtError) {
                onFilter(filter)();
            }
        },
        [filter, dateError, reportDateError, publishedAtError, onFilter],
    );

    const handleClearDate = useCallback((fieldName) => {
        setFilter((prevState) => ({ ...prevState, [fieldName]: '' }));
    }, []);

    const handleClearAll = useCallback(() => {
        setFilter({});
        setDateError('');
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilter((prevState) => ({ ...prevState, search: '' }));
    }, []);

    const handleClearStatus = useCallback(() => {
        setFilter((prevState) => ({ ...prevState, status: [] }));
    }, []);

    const handleClearPriority = useCallback(() => {
        setFilter((prevState) => ({ ...prevState, priority: '' }));
    }, []);

    const handleClearTags = useCallback(() => {
        setFilter((prevState) => ({ ...prevState, tags: [] }));
    }, []);

    const handleClearHowFoundUs = useCallback(() => {
        setFilter((prevState) => ({ ...prevState, how_found_us: [] }));
    }, []);

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter' && !dateError && !reportDateError && !publishedAtError) {
                handleSubmit(e);
            }
        },
        [handleSubmit, dateError, reportDateError, publishedAtError],
    );

    const handleQuickDatePreset = useCallback((preset) => {
        const range = rangePreset(preset);
        if (range) {
            setFilter((prevState) => ({
                ...prevState,
                from_date: range.from,
                to_date: range.to,
            }));
        }
    }, []);

    const handleQuickPublishedAtPreset = useCallback((preset) => {
        const range = rangePreset(preset);
        if (range) {
            setFilter((prevState) => ({
                ...prevState,
                published_at_from: range.from,
                published_at_to: range.to,
            }));
        }
    }, []);

    const handleQuickReportDatePreset = useCallback((preset) => {
        const range = reportRangePreset(preset);
        if (range) {
            setFilter((prevState) => ({
                ...prevState,
                report_date_from: range.from,
                report_date_to: range.to,
            }));
        }
    }, []);

    const hasErrors = Boolean(dateError) || Boolean(reportDateError) || Boolean(publishedAtError);

    return (
        <Box sx={{ mb: 2 }}>
            {/* Active filters indicator */}
            {activeFilters > 0 && (
                <ActiveFilterChips
                    filter={filter}
                    activeFilters={activeFilters}
                    onClearSearch={handleClearSearch}
                    onClearStatus={handleClearStatus}
                    onClearPriority={handleClearPriority}
                    onClearTags={handleClearTags}
                    onClearHowFoundUs={handleClearHowFoundUs}
                    onClearWaitingPooling={() =>
                        setFilter((p) => ({ ...p, waiting_for_pooling: false }))
                    }
                    onClearOutPatient={() => setFilter((p) => ({ ...p, out_patient: '' }))}
                    onClearRegistered={() => {
                        handleClearDate('from_date');
                        handleClearDate('to_date');
                    }}
                    onClearReportDate={() => {
                        handleClearDate('report_date_from');
                        handleClearDate('report_date_to');
                    }}
                    onClearPublished={() => {
                        handleClearDate('published_at_from');
                        handleClearDate('published_at_to');
                    }}
                    onClearAll={handleClearAll}
                />
            )}

            <form action="#" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            sx={{ width: '100%' }}
                            name="search"
                            value={filter?.search || ''}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            label="Search title"
                            placeholder="Enter title keywords..."
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: filter?.search ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear search">
                                                <IconButton
                                                    onClick={handleClearSearch}
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

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <SelectSearch
                            value={filter?.referrer}
                            onChange={handleChange}
                            label="Referrer"
                            fullWidth
                            name="referrer"
                            url={route('api.referrers.list')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel id="status-multiple-select-label">Status</InputLabel>
                            <Select
                                labelId="status-multiple-select-label"
                                id="status-multiple-select"
                                multiple
                                name="status"
                                value={filter?.status || []}
                                onChange={handleChange}
                                input={<OutlinedInput label="Status" />}
                                MenuProps={MenuProps}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {STATUSES.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Checkbox
                                            checked={(filter?.status || []).includes(name)}
                                            size="small"
                                        />
                                        <ListItemText primary={name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel id="priority-select-label">Priority</InputLabel>
                            <Select
                                labelId="priority-select-label"
                                name="priority"
                                label="Priority"
                                value={filter?.priority || ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="stat">STAT</MenuItem>
                                <MenuItem value="urgent">Urgent</MenuItem>
                                <MenuItem value="routine">Routine</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel id="out-patient-select-label">Patient Type</InputLabel>
                            <Select
                                labelId="out-patient-select-label"
                                name="out_patient"
                                label="Patient Type"
                                value={filter?.out_patient ?? ''}
                                onChange={handleChange}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="1">Out Patient</MenuItem>
                                <MenuItem value="0">In Patient</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="waiting_for_pooling"
                                    checked={Boolean(filter?.waiting_for_pooling)}
                                    onChange={handleChange}
                                />
                            }
                            label="Waiting for Pooling"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel id="how-found-us-filter-label">How Found Us</InputLabel>
                            <Select
                                labelId="how-found-us-filter-label"
                                multiple
                                name="how_found_us"
                                value={filter?.how_found_us || []}
                                onChange={handleChange}
                                input={<OutlinedInput label="How Found Us" />}
                                MenuProps={MenuProps}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const opt = HOW_FOUND_OPTIONS.find(
                                                (o) => o.value === value,
                                            );
                                            return (
                                                <Chip
                                                    key={value}
                                                    label={opt?.label ?? value}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {HOW_FOUND_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Checkbox
                                            checked={(filter?.how_found_us || []).includes(
                                                opt.value,
                                            )}
                                            size="small"
                                        />
                                        <ListItemText primary={opt.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <PresetChipRow
                            title="Registered Date"
                            presets={REGISTERED_PRESETS}
                            color="primary"
                            onSelect={handleQuickDatePreset}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="from_date"
                            value={filter?.from_date}
                            label="From Date"
                            onChange={handleChange}
                            onClear={() => handleClearDate('from_date')}
                            error={dateError}
                            max={today}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="to_date"
                            value={filter?.to_date}
                            label="To Date"
                            onChange={handleChange}
                            onClear={() => handleClearDate('to_date')}
                            error={dateError}
                            helperText={dateError}
                            max={today}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <PresetChipRow
                            title="Est. Report Date"
                            presets={REPORT_DATE_PRESETS}
                            color="secondary"
                            onSelect={handleQuickReportDatePreset}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="report_date_from"
                            value={filter?.report_date_from}
                            label="Report Date From"
                            onChange={handleChange}
                            onClear={() => handleClearDate('report_date_from')}
                            error={reportDateError}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="report_date_to"
                            value={filter?.report_date_to}
                            label="Report Date To"
                            onChange={handleChange}
                            onClear={() => handleClearDate('report_date_to')}
                            error={reportDateError}
                            helperText={reportDateError}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <PresetChipRow
                            title="Published At"
                            presets={REGISTERED_PRESETS}
                            color="info"
                            onSelect={handleQuickPublishedAtPreset}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="published_at_from"
                            value={filter?.published_at_from}
                            label="Published From"
                            onChange={handleChange}
                            onClear={() => handleClearDate('published_at_from')}
                            error={publishedAtError}
                            max={today}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ClearableDateField
                            name="published_at_to"
                            value={filter?.published_at_to}
                            label="Published To"
                            onChange={handleChange}
                            onClear={() => handleClearDate('published_at_to')}
                            error={publishedAtError}
                            helperText={publishedAtError}
                            max={today}
                        />
                    </Grid>

                    <Grid
                        size={{ xs: 12, sm: 12, md: 12 }}
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: { xs: 'center', sm: 'flex-start' },
                        }}
                    >
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={hasErrors}
                            startIcon={<FilterListIcon />}
                            sx={{ minWidth: 120 }}
                        >
                            Apply Filters
                        </Button>

                        {activeFilters > 0 && (
                            <Button
                                variant="outlined"
                                onClick={handleClearAll}
                                startIcon={<RefreshIcon />}
                                sx={{ minWidth: 100 }}
                            >
                                Reset
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default Filter;
