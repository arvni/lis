import Grid from '@mui/material/Grid';
import React, { useMemo, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import SelectSearch from '@/Components/SelectSearch.jsx';
import {
    Box,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    HOW_FOUND_OPTIONS,
    STATUS_OPTIONS,
    REGISTERED_PRESETS,
    REPORT_DATE_PRESETS,
    rangePreset,
    reportRangePreset,
} from './Filter/constants';
import { countActiveFilters, dateRangeError } from './Filter/validation';
import ActiveFilterChips from './Filter/ActiveFilterChips';
import ChipMultiSelect from './Filter/ChipMultiSelect';
import DateRangeSection from './Filter/DateRangeSection';
import SearchField from './Filter/SearchField';

const Filter = ({ defaultFilter, onFilter }) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const today = new Date().toISOString().split('T')[0];

    const activeFilters = useMemo(() => countActiveFilters(filter), [filter]);
    const dateError = dateRangeError(filter?.from_date, filter?.to_date, today);
    const reportDateError = dateRangeError(filter?.report_date_from, filter?.report_date_to);
    const publishedAtError = dateRangeError(
        filter?.published_at_from,
        filter?.published_at_to,
        today,
    );
    const hasErrors = Boolean(dateError) || Boolean(reportDateError) || Boolean(publishedAtError);

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
            if (!hasErrors) {
                onFilter(filter)();
            }
        },
        [filter, hasErrors, onFilter],
    );

    const handleClearDate = useCallback((fieldName) => {
        setFilter((prevState) => ({ ...prevState, [fieldName]: '' }));
    }, []);

    const handleClearAll = useCallback(() => {
        setFilter({});
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
            if (e.key === 'Enter' && !hasErrors) {
                handleSubmit(e);
            }
        },
        [handleSubmit, hasErrors],
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
                        <SearchField
                            value={filter?.search}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            onClear={handleClearSearch}
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
                        <ChipMultiSelect
                            labelId="status-multiple-select-label"
                            label="Status"
                            name="status"
                            value={filter?.status || []}
                            onChange={handleChange}
                            options={STATUS_OPTIONS}
                        />
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
                        <ChipMultiSelect
                            labelId="how-found-us-filter-label"
                            label="How Found Us"
                            name="how_found_us"
                            value={filter?.how_found_us || []}
                            onChange={handleChange}
                            options={HOW_FOUND_OPTIONS}
                        />
                    </Grid>

                    <DateRangeSection
                        title="Registered Date"
                        presets={REGISTERED_PRESETS}
                        color="primary"
                        onPreset={handleQuickDatePreset}
                        fromField={{
                            name: 'from_date',
                            label: 'From Date',
                            value: filter?.from_date,
                        }}
                        toField={{ name: 'to_date', label: 'To Date', value: filter?.to_date }}
                        error={dateError}
                        onChange={handleChange}
                        onClearDate={handleClearDate}
                        max={today}
                    />

                    <DateRangeSection
                        title="Est. Report Date"
                        presets={REPORT_DATE_PRESETS}
                        color="secondary"
                        onPreset={handleQuickReportDatePreset}
                        fromField={{
                            name: 'report_date_from',
                            label: 'Report Date From',
                            value: filter?.report_date_from,
                        }}
                        toField={{
                            name: 'report_date_to',
                            label: 'Report Date To',
                            value: filter?.report_date_to,
                        }}
                        error={reportDateError}
                        onChange={handleChange}
                        onClearDate={handleClearDate}
                    />

                    <DateRangeSection
                        title="Published At"
                        presets={REGISTERED_PRESETS}
                        color="info"
                        onPreset={handleQuickPublishedAtPreset}
                        fromField={{
                            name: 'published_at_from',
                            label: 'Published From',
                            value: filter?.published_at_from,
                        }}
                        toField={{
                            name: 'published_at_to',
                            label: 'Published To',
                            value: filter?.published_at_to,
                        }}
                        error={publishedAtError}
                        onChange={handleChange}
                        onClearDate={handleClearDate}
                        max={today}
                    />

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
