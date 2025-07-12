import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import React, {useEffect, useState, useCallback} from "react";
import Button from "@mui/material/Button";
import SelectSearch from "@/Components/SelectSearch.jsx";
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
    useTheme
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const statuses = [
    'pending',
    'waiting for payment',
    'sampling',
    'waiting for entering',
    'processing',
    'reported',
    'Canceled',
];

function getStyles(name, selectedStatuses = [], theme) {
    return {
        fontWeight: selectedStatuses.includes(name)
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
    };
}

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter || {});
    const [dateError, setDateError] = useState("");
    const [activeFilters, setActiveFilters] = useState(0);
    const theme = useTheme();
    const today = new Date().toISOString().split('T')[0];

    // Count active filters for better UX
    useEffect(() => {
        const count = Object.values(filter || {}).filter(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== "" && value !== null && value !== undefined;
        }).length;
        setActiveFilters(count);
    }, [filter]);

    useEffect(() => {
        // Enhanced date validation with more helpful messages
        if (filter?.from_date && filter?.to_date) {
            const fromDate = new Date(filter.from_date);
            const toDate = new Date(filter.to_date);

            if (fromDate > toDate) {
                setDateError("Start date cannot be after end date");
            } else if (fromDate > new Date(today)) {
                setDateError("Start date cannot be in the future");
            } else if (toDate > new Date(today)) {
                setDateError("End date cannot be in the future");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [filter?.from_date, filter?.to_date, today]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFilter(prevState => ({
            ...prevState,
            [name]: value
        }));
    }, []);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!dateError) {
            onFilter(filter)();
        }
    }, [filter, dateError, onFilter]);

    const handleClearDate = useCallback((fieldName) => {
        setFilter(prevState => ({...prevState, [fieldName]: ""}));
    }, []);

    const handleClearAll = useCallback(() => {
        setFilter({});
        setDateError("");
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilter(prevState => ({...prevState, search: ""}));
    }, []);

    const handleClearStatus = useCallback(() => {
        setFilter(prevState => ({...prevState, status: []}));
    }, []);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !dateError) {
            handleSubmit(e);
        }
    }, [handleSubmit, dateError]);

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
                setFilter(prevState => ({
                    ...prevState,
                    from_date: fromDate.toISOString().split('T')[0],
                    to_date: toDate.toISOString().split('T')[0]
                }));
                return;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                setFilter(prevState => ({
                    ...prevState,
                    from_date: fromDate.toISOString().split('T')[0],
                    to_date: lastDayLastMonth.toISOString().split('T')[0]
                }));
                return;
            default:
                return;
        }

        setFilter(prevState => ({
            ...prevState,
            from_date: fromDate.toISOString().split('T')[0],
            to_date: today.toISOString().split('T')[0]
        }));
    }, []);

    return (
        <Box sx={{mb: 2}}>
            {/* Active filters indicator */}
            {activeFilters > 0 && (
                <Box sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                    <FilterListIcon color="primary" fontSize="small"/>
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
                    {(filter?.from_date || filter?.to_date) && (
                        <Chip
                            label={`Date: ${filter.from_date || '...'} - ${filter.to_date || '...'}`}
                            size="small"
                            onDelete={() => {
                                handleClearDate('from_date');
                                handleClearDate('to_date');
                            }}
                            variant="outlined"
                        />
                    )}
                    <Button
                        size="small"
                        onClick={handleClearAll}
                        startIcon={<ClearIcon/>}
                        sx={{ml: 1}}
                    >
                        Clear All
                    </Button>
                </Box>
            )}

            <form action="#" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <TextField
                            sx={{width: "100%"}}
                            name="search"
                            value={filter?.search || ""}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            label="Search title"
                            placeholder="Enter title keywords..."
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action"/>
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
                                                    <ClearIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ) : null
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <SelectSearch
                            value={filter?.referrer}
                            onChange={handleChange}
                            label="Referrer"
                            fullWidth
                            name="referrer"
                            url={route("api.referrers.list")}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <FormControl fullWidth>
                            <InputLabel id="status-multiple-select-label">Status</InputLabel>
                            <Select
                                labelId="status-multiple-select-label"
                                id="status-multiple-select"
                                multiple
                                name="status"
                                value={filter?.status || []}
                                onChange={handleChange}
                                input={<OutlinedInput label="Status"/>}
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
                                    <MenuItem
                                        key={name}
                                        value={name}
                                        style={getStyles(name, filter?.status, theme)}
                                    >
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{xs: 12}}>
                        <Typography variant="subtitle2" sx={{mb: 1, display: 'flex', alignItems: 'center'}}>
                            <CalendarTodayIcon fontSize="small" sx={{mr: 1}}/>
                            Quick Date Presets
                        </Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'yesterday', label: 'Yesterday' },
                                { key: 'thisWeek', label: 'This Week' },
                                { key: 'lastWeek', label: 'Last Week' },
                                { key: 'thisMonth', label: 'This Month' },
                                { key: 'lastMonth', label: 'Last Month' }
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

                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            fullWidth
                            name="from_date"
                            value={filter?.from_date || ""}
                            onChange={handleChange}
                            label="From Date"
                            type="date"
                            error={Boolean(dateError)}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                                htmlInput: {
                                    max: today
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
                                                    <ClearIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ) : null
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            fullWidth
                            name="to_date"
                            value={filter?.to_date || ""}
                            onChange={handleChange}
                            label="To Date"
                            type="date"
                            error={Boolean(dateError)}
                            helperText={dateError}
                            slotProps={{
                                inputLabel: {shrink: true},
                                htmlInput: {max: today},
                                input: {
                                    endAdornment: filter?.to_date ? (
                                        <InputAdornment position="end">
                                            <Tooltip title="Clear date">
                                                <IconButton
                                                    onClick={() => handleClearDate('to_date')}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    <ClearIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ) : null
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 12, md: 12}}
                          sx={{display: "flex", gap: 2, justifyContent: {xs: "center", sm: "flex-start"}}}>
                        <Button
                            variant="contained"
                            type="submit"
                            disabled={Boolean(dateError)}
                            startIcon={<FilterListIcon/>}
                            sx={{minWidth: 120}}
                        >
                            Apply Filters
                        </Button>

                        {activeFilters > 0 && (
                            <Button
                                variant="outlined"
                                onClick={handleClearAll}
                                startIcon={<RefreshIcon/>}
                                sx={{minWidth: 100}}
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
