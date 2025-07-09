import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React, {memo, useEffect, useState} from "react";
import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from "@mui/material/Button";
import {Box, Chip, IconButton, InputAdornment, Paper, Tooltip, Typography} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

const Filter = memo(({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const [dateError, setDateError] = useState("");
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    useEffect(() => {
        // Validate dates when they change
        if (filter?.from_date && filter?.to_date && filter.from_date > filter.to_date) {
            setDateError("Start date cannot be after end date");
        } else {
            setDateError("");
        }
    }, [filter?.from_date, filter?.to_date]);

    const handleChange = (e) => setFilter(prevState => ({...prevState, [e.target.name]: e.target.value}));

    const handleClearDate = (fieldName) => setFilter(prevState => ({...prevState, [fieldName]: ""}));

    const handleQuickDatePreset = (preset) => {
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
    };

    const applyFilter = () => {
        if (dateError) return;
        onFilter(filter)();
    };

    const clearAllFilters = () => setFilter({
        search: "",
        status: null,
        from_date: "",
        to_date: ""
    });

    // Check if any filters are applied
    const hasActiveFilters =
        filter?.search ||
        filter?.from_date ||
        filter?.to_date;

    return (
        <Paper sx={{p:4}}>
            <Grid container spacing={2}>
                <Grid size={{xs: 12, sm: 6}}>
                    <TextField
                        fullWidth
                        name="search"
                        value={filter?.search || ""}
                        onChange={handleChange}
                        label="Search "
                        slotProps={{
                            input: {
                                endAdornment: filter?.search ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => handleChange({target: {name: 'search', value: ''}})}
                                            edge="end"
                                            size="small"
                                        >
                                            <ClearIcon fontSize="small"/>
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                            }
                        }}
                    />
                </Grid>
                <Grid size={{xs: 12, sm: 6}}>
                </Grid>

                <Grid size={{xs: 12}}>
                    <Typography variant="subtitle2" sx={{mb: 1, display: 'flex', alignItems: 'center'}}>
                        <CalendarTodayIcon fontSize="small" sx={{mr: 1}}/>
                        Date Range Presets:
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                        <Chip
                            label="Today"
                            onClick={() => handleQuickDatePreset('today')}
                            size="small"
                            clickable
                        />
                        <Chip
                            label="Yesterday"
                            onClick={() => handleQuickDatePreset('yesterday')}
                            size="small"
                            clickable
                        />
                        <Chip
                            label="This Week"
                            onClick={() => handleQuickDatePreset('thisWeek')}
                            size="small"
                            clickable
                        />
                        <Chip
                            label="Last Week"
                            onClick={() => handleQuickDatePreset('lastWeek')}
                            size="small"
                            clickable
                        />
                        <Chip
                            label="This Month"
                            onClick={() => handleQuickDatePreset('thisMonth')}
                            size="small"
                            clickable
                        />
                        <Chip
                            label="Last Month"
                            onClick={() => handleQuickDatePreset('lastMonth')}
                            size="small"
                            clickable
                        />
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

                <Grid item container size={{xs: 12}} spacing={1} sx={{mt: 1}}>
                    <Grid item>
                        <Button
                            variant="contained"
                            onClick={applyFilter}
                            disabled={Boolean(dateError)}
                        >
                            Apply Filters
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="outlined"
                            onClick={clearAllFilters}
                            disabled={!hasActiveFilters}
                        >
                            Clear All
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
}, (prevProps, nextProps) => JSON.stringify(prevProps.defaultFilter) !== JSON.stringify(nextProps.defaultFilter));

export default Filter;
