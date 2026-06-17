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
    Typography,
    Select,
    OutlinedInput,
    MenuItem,
    InputLabel,
    FormControl,
    FormControlLabel,
    Checkbox,
    ListItemText,
    useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    slotProps: {
        paper: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    },
};

const HOW_FOUND_OPTIONS = [
    { value: 'google', label: 'Google Search' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'friends', label: 'Friends / Family' },
    { value: 'doctor', label: "Doctor's Recommendation" },
    { value: 'website', label: 'Website / Online Ad' },
    { value: 'walk_in', label: 'Walk-in / Signboard' },
];

const statuses = [
    'pending',
    'waiting for payment',
    'sampling',
    'pooling',
    'waiting for entering',
    'processing',
    'waiting for publishing',
    'reported',
    'Canceled',
];

const Filter = ({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const [dateError, setDateError] = useState('');
    const [reportDateError, setReportDateError] = useState('');
    const [publishedAtError, setPublishedAtError] = useState('');
    const [activeFilters, setActiveFilters] = useState(0);
    const theme = useTheme();
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
        const today = new Date();
        let fromDate = new Date();

        switch (preset) {
            case 'today':
                fromDate = new Date(today);
                break;
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 1);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay());
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
                const toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                setFilter((prevState) => ({
                    ...prevState,
                    from_date: fromDate.toISOString().split('T')[0],
                    to_date: toDate.toISOString().split('T')[0],
                }));
                return;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                setFilter((prevState) => ({
                    ...prevState,
                    from_date: fromDate.toISOString().split('T')[0],
                    to_date: lastDayLastMonth.toISOString().split('T')[0],
                }));
                return;
            default:
                return;
        }

        setFilter((prevState) => ({
            ...prevState,
            from_date: fromDate.toISOString().split('T')[0],
            to_date: today.toISOString().split('T')[0],
        }));
    }, []);

    const handleQuickPublishedAtPreset = useCallback((preset) => {
        const today = new Date();
        let fromDate = new Date();

        switch (preset) {
            case 'today':
                fromDate = new Date(today);
                break;
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 1);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay());
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
                const toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                setFilter((prevState) => ({
                    ...prevState,
                    published_at_from: fromDate.toISOString().split('T')[0],
                    published_at_to: toDate.toISOString().split('T')[0],
                }));
                return;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                setFilter((prevState) => ({
                    ...prevState,
                    published_at_from: fromDate.toISOString().split('T')[0],
                    published_at_to: lastDayLastMonth.toISOString().split('T')[0],
                }));
                return;
            default:
                return;
        }

        setFilter((prevState) => ({
            ...prevState,
            published_at_from: fromDate.toISOString().split('T')[0],
            published_at_to: today.toISOString().split('T')[0],
        }));
    }, []);

    const handleQuickReportDatePreset = useCallback((preset) => {
        const today = new Date();
        let fromDate, toDate;

        switch (preset) {
            case 'today':
                fromDate = new Date(today);
                toDate = new Date(today);
                break;
            case 'tomorrow':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() + 1);
                toDate = new Date(fromDate);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() + 1);
                toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                break;
            case 'nextWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - fromDate.getDay() + 8);
                toDate = new Date(fromDate);
                toDate.setDate(toDate.getDate() + 6);
                break;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'nextMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                break;
            default:
                return;
        }

        setFilter((prevState) => ({
            ...prevState,
            report_date_from: fromDate.toISOString().split('T')[0],
            report_date_to: toDate.toISOString().split('T')[0],
        }));
    }, []);

    return (
        <Box sx={{ mb: 2 }}>
            {/* Active filters indicator */}
            {activeFilters > 0 && (
                <Box
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                >
                    <FilterListIcon color="primary" fontSize="small" />
                    <Chip
                        label={`${activeFilters} filter${activeFilters > 1 ? 's' : ''} active`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                    {/* Show active filter chips */}
                    {filter?.search && (
                        <Chip
                            label={`Search: ${filter.search}`}
                            size="small"
                            onDelete={handleClearSearch}
                            variant="outlined"
                        />
                    )}
                    {filter?.status && filter.status.length > 0 && (
                        <Chip
                            label={`Status: ${filter.status.length} selected`}
                            size="small"
                            onDelete={handleClearStatus}
                            variant="outlined"
                        />
                    )}
                    {filter?.priority && (
                        <Chip
                            label={`Priority: ${filter.priority}`}
                            size="small"
                            onDelete={handleClearPriority}
                            variant="outlined"
                        />
                    )}
                    {filter?.tags && filter.tags.length > 0 && (
                        <Chip
                            label={`Tags: ${filter.tags.length} selected`}
                            size="small"
                            onDelete={handleClearTags}
                            variant="outlined"
                        />
                    )}
                    {filter?.how_found_us && filter.how_found_us.length > 0 && (
                        <Chip
                            label={`How Found: ${filter.how_found_us.length} selected`}
                            size="small"
                            onDelete={handleClearHowFoundUs}
                            variant="outlined"
                        />
                    )}
                    {filter?.waiting_for_pooling && (
                        <Chip
                            label="Waiting for Pooling"
                            size="small"
                            onDelete={() =>
                                setFilter((p) => ({ ...p, waiting_for_pooling: false }))
                            }
                            variant="outlined"
                        />
                    )}
                    {filter?.out_patient !== undefined && filter?.out_patient !== '' && (
                        <Chip
                            label={filter.out_patient === '1' ? 'Out Patient' : 'In Patient'}
                            size="small"
                            onDelete={() => setFilter((p) => ({ ...p, out_patient: '' }))}
                            variant="outlined"
                        />
                    )}
                    {(filter?.from_date || filter?.to_date) && (
                        <Chip
                            label={`Registered: ${filter.from_date || '...'} - ${filter.to_date || '...'}`}
                            size="small"
                            onDelete={() => {
                                handleClearDate('from_date');
                                handleClearDate('to_date');
                            }}
                            variant="outlined"
                        />
                    )}
                    {(filter?.report_date_from || filter?.report_date_to) && (
                        <Chip
                            label={`Report Date: ${filter.report_date_from || '...'} - ${filter.report_date_to || '...'}`}
                            size="small"
                            onDelete={() => {
                                handleClearDate('report_date_from');
                                handleClearDate('report_date_to');
                            }}
                            variant="outlined"
                        />
                    )}
                    {(filter?.published_at_from || filter?.published_at_to) && (
                        <Chip
                            label={`Published: ${filter.published_at_from || '...'} - ${filter.published_at_to || '...'}`}
                            size="small"
                            onDelete={() => {
                                handleClearDate('published_at_from');
                                handleClearDate('published_at_to');
                            }}
                            variant="outlined"
                        />
                    )}
                    <Button
                        size="small"
                        onClick={handleClearAll}
                        startIcon={<ClearIcon />}
                        sx={{ ml: 1 }}
                    >
                        Clear All
                    </Button>
                </Box>
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
                                {statuses.map((name) => (
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

                    <Grid
                        size={{ xs: 12, sm: 6, md: 4 }}
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
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
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                        >
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                            Registered Date
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'yesterday', label: 'Yesterday' },
                                { key: 'thisWeek', label: 'This Week' },
                                { key: 'lastWeek', label: 'Last Week' },
                                { key: 'thisMonth', label: 'This Month' },
                                { key: 'lastMonth', label: 'Last Month' },
                            ].map((preset) => (
                                <Chip
                                    key={preset.key}
                                    label={preset.label}
                                    onClick={() => handleQuickDatePreset(preset.key)}
                                    size="small"
                                    clickable
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="from_date"
                            value={filter?.from_date || ''}
                            onChange={handleChange}
                            label="From Date"
                            type="date"
                            error={Boolean(dateError)}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                                htmlInput: {
                                    max: today,
                                },
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

                    <Grid size={{ xs: 12, sm: 6 }}>
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
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                        >
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                            Est. Report Date
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'tomorrow', label: 'Tomorrow' },
                                { key: 'thisWeek', label: 'This Week' },
                                { key: 'nextWeek', label: 'Next Week' },
                                { key: 'thisMonth', label: 'This Month' },
                                { key: 'nextMonth', label: 'Next Month' },
                            ].map((preset) => (
                                <Chip
                                    key={preset.key}
                                    label={preset.label}
                                    onClick={() => handleQuickReportDatePreset(preset.key)}
                                    size="small"
                                    clickable
                                    color="secondary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="report_date_from"
                            value={filter?.report_date_from || ''}
                            onChange={handleChange}
                            label="Report Date From"
                            type="date"
                            error={Boolean(reportDateError)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    endAdornment: filter?.report_date_from ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear date">
                                                <IconButton
                                                    onClick={() =>
                                                        handleClearDate('report_date_from')
                                                    }
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

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="report_date_to"
                            value={filter?.report_date_to || ''}
                            onChange={handleChange}
                            label="Report Date To"
                            type="date"
                            error={Boolean(reportDateError)}
                            helperText={reportDateError}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    endAdornment: filter?.report_date_to ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear date">
                                                <IconButton
                                                    onClick={() =>
                                                        handleClearDate('report_date_to')
                                                    }
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
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                        >
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                            Published At
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'yesterday', label: 'Yesterday' },
                                { key: 'thisWeek', label: 'This Week' },
                                { key: 'lastWeek', label: 'Last Week' },
                                { key: 'thisMonth', label: 'This Month' },
                                { key: 'lastMonth', label: 'Last Month' },
                            ].map((preset) => (
                                <Chip
                                    key={preset.key}
                                    label={preset.label}
                                    onClick={() => handleQuickPublishedAtPreset(preset.key)}
                                    size="small"
                                    clickable
                                    color="info"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="published_at_from"
                            value={filter?.published_at_from || ''}
                            onChange={handleChange}
                            label="Published From"
                            type="date"
                            error={Boolean(publishedAtError)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { max: today },
                                input: {
                                    endAdornment: filter?.published_at_from ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear date">
                                                <IconButton
                                                    onClick={() =>
                                                        handleClearDate('published_at_from')
                                                    }
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

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="published_at_to"
                            value={filter?.published_at_to || ''}
                            onChange={handleChange}
                            label="Published To"
                            type="date"
                            error={Boolean(publishedAtError)}
                            helperText={publishedAtError}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { max: today },
                                input: {
                                    endAdornment: filter?.published_at_to ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear date">
                                                <IconButton
                                                    onClick={() =>
                                                        handleClearDate('published_at_to')
                                                    }
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
                            disabled={
                                Boolean(dateError) ||
                                Boolean(reportDateError) ||
                                Boolean(publishedAtError)
                            }
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
