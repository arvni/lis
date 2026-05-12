import React, { useCallback, useEffect, useState } from "react";
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
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { usePage } from "@inertiajs/react";

const formatDateForBackend = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const Filter = ({ onFilter, defaultFilter: defaultValues = {} }) => {
    const { consultants = [] } = usePage().props;

    const [filters, setFilters] = useState({
        search: defaultValues.search || "",
        consultant_id: defaultValues.consultant_id || "",
        from_date: defaultValues.from_date ? new Date(defaultValues.from_date) : null,
        date: defaultValues.date ? new Date(defaultValues.date) : null,
    });

    const [activeFilters, setActiveFilters] = useState(0);

    useEffect(() => {
        const count = Object.values({
            search: filters.search,
            consultant_id: filters.consultant_id,
            from_date: filters.from_date,
            date: filters.date,
        }).filter((v) => v !== "" && v !== null && v !== undefined).length;
        setActiveFilters(count);
    }, [filters]);

    const handleChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleApply = useCallback(() => {
        const cleaned = {
            search: filters.search || undefined,
            consultant_id: filters.consultant_id || undefined,
            from_date: formatDateForBackend(filters.from_date) || undefined,
            date: formatDateForBackend(filters.date) || undefined,
        };
        Object.keys(cleaned).forEach((k) => {
            if (cleaned[k] === undefined) delete cleaned[k];
        });
        onFilter(cleaned)();
    }, [filters, onFilter]);

    const handleClear = useCallback(() => {
        setFilters({ search: "", consultant_id: "", from_date: null, date: null });
        onFilter({})();
    }, [onFilter]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") handleApply();
        },
        [handleApply]
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "background.paper" }}>
                <Stack spacing={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FilterListIcon color="action" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                            Filter Waiting Consultations
                        </Typography>
                        {activeFilters > 0 && (
                            <Chip
                                label={`${activeFilters} active`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    <Grid container spacing={2}>
                        {/* Patient Search */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                name="search"
                                label="Search Patient"
                                placeholder="Search by name or phone..."
                                value={filters.search}
                                onChange={(e) => handleChange("search", e.target.value)}
                                onKeyDown={handleKeyDown}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: filters.search && (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleChange("search", "")}
                                                    edge="end"
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        {/* Consultant Filter */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="consultant-label">Consultant</InputLabel>
                                <Select
                                    labelId="consultant-label"
                                    value={filters.consultant_id}
                                    label="Consultant"
                                    onChange={(e) => handleChange("consultant_id", e.target.value)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PersonIcon color="action" />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>All Consultants</em>
                                    </MenuItem>
                                    {consultants.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}{c.title ? ` — ${c.title}` : ""}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Due Date From */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DatePicker
                                label="Due Date (from)"
                                value={filters.from_date}
                                onChange={(value) => handleChange("from_date", value)}
                                clearable
                                slotProps={{
                                    textField: { fullWidth: true },
                                }}
                            />
                        </Grid>

                        {/* Created Date */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DatePicker
                                label="Appointment Date"
                                value={filters.date}
                                onChange={(value) => handleChange("date", value)}
                                clearable
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        helperText: "Filter by the date the appointment was created",
                                    },
                                }}
                            />
                        </Grid>

                        {/* Action Buttons */}
                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={handleClear}
                                    disabled={activeFilters === 0}
                                >
                                    Clear All
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FilterListIcon />}
                                    onClick={handleApply}
                                >
                                    Apply Filters
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Paper>
        </LocalizationProvider>
    );
};

export default Filter;
