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

const STATUSES = [
    { value: "waiting",  label: "Waiting",  color: "#ed6c02" },
    { value: "booked",   label: "Booked",   color: "#0288d1" },
    { value: "started",  label: "Started",  color: "#1976d2" },
    { value: "done",     label: "Done",     color: "#2e7d32" },
];

const formatDateForBackend = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const IndexFilter = ({ onFilter, defaultFilter: defaultValues = {} }) => {
    const { consultants = [] } = usePage().props;

    const [filters, setFilters] = useState({
        search:        defaultValues.search        || "",
        status:        defaultValues.status        || [],
        consultant_id: defaultValues.consultant_id || "",
        from_date:     defaultValues.from_date ? new Date(defaultValues.from_date) : null,
    });

    const [activeFilters, setActiveFilters] = useState(0);

    useEffect(() => {
        const count = [
            filters.search,
            filters.status?.length > 0 ? filters.status : null,
            filters.consultant_id,
            filters.from_date,
        ].filter((v) => v !== "" && v !== null && v !== undefined).length;
        setActiveFilters(count);
    }, [filters]);

    const handleChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleStatus = useCallback((value) => {
        setFilters((prev) => {
            const current = prev.status || [];
            return {
                ...prev,
                status: current.includes(value)
                    ? current.filter((s) => s !== value)
                    : [...current, value],
            };
        });
    }, []);

    const handleApply = useCallback(() => {
        const cleaned = {
            search:        filters.search        || undefined,
            status:        filters.status?.length ? filters.status : undefined,
            consultant_id: filters.consultant_id || undefined,
            from_date:     formatDateForBackend(filters.from_date) || undefined,
        };
        Object.keys(cleaned).forEach((k) => {
            if (cleaned[k] === undefined) delete cleaned[k];
        });
        onFilter(cleaned)();
    }, [filters, onFilter]);

    const handleClear = useCallback(() => {
        setFilters({ search: "", status: [], consultant_id: "", from_date: null });
        onFilter({})();
    }, [onFilter]);

    const handleKeyDown = useCallback(
        (e) => { if (e.key === "Enter") handleApply(); },
        [handleApply]
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: "background.paper" }}>
                <Stack spacing={2}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FilterListIcon color="action" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">
                            Filter Consultations
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
                        {/* Search */}
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

                        {/* Consultant */}
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
                                    <MenuItem value=""><em>All Consultants</em></MenuItem>
                                    {consultants.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}{c.title ? ` — ${c.title}` : ""}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Status chips */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                                Status
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {STATUSES.map(({ value, label, color }) => {
                                    const selected = filters.status?.includes(value);
                                    return (
                                        <Chip
                                            key={value}
                                            label={label}
                                            onClick={() => toggleStatus(value)}
                                            size="small"
                                            variant={selected ? "filled" : "outlined"}
                                            sx={{
                                                borderColor: color,
                                                color: selected ? "#fff" : color,
                                                bgcolor: selected ? color : "transparent",
                                                "&:hover": { bgcolor: selected ? color : `${color}18` },
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        </Grid>

                        {/* Due Date From */}
                        <Grid size={{ xs: 12, md: 6 }}>
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

export default IndexFilter;
