import React, {useState} from 'react';
import {
    Box,
    Button,
    Stack,
    Paper,
    Typography,
    Grid2 as Grid,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SelectSearch from "@/Components/SelectSearch.jsx";

const Filter = ({onFilter, defaultFilter: defaultValues = {}}) => {
    const [filters, setFilters] = useState({
        sampleType: defaultValues.sampleType || null,
        referrer: defaultValues.referrer || null,
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleApplyFilters = () => {
        // Clean up filters before sending
        const cleanedFilters = {
            ...filters,
        };

        // Remove null values
        Object.keys(cleanedFilters).forEach(key => {
            if (cleanedFilters[key] === null || cleanedFilters[key] === '') {
                delete cleanedFilters[key];
            }
        });

        onFilter(cleanedFilters)();
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            sampleType: null,
            referrer: null,
            status: ""
        };
        setFilters(clearedFilters);
        onFilter({})();
    };

    const hasActiveFilters = () => {
        return filters.sampleType ||
        filters.referrer ||
        filters.status;
    };

    return (
            <Paper elevation={1} sx={{p: 2, mb: 2}}>
                <Box
                    sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <FilterListIcon color="action"/>
                        <Typography variant="h6">Filters</Typography>
                        {hasActiveFilters() && (
                            <Typography variant="caption" color="primary" sx={{ml: 1}}>
                                ({Object.keys(filters).filter(key => {
                                if (key === 'expire_date' || key === 'assigned_at') {
                                    return filters[key].from || filters[key].to;
                                }
                                return filters[key];
                            }).length} active)
                            </Typography>
                        )}
                    </Box>
                    <Box>

                    </Box>
                </Box>
                <Grid container spacing={2}>
                    {/* Sample Type Filter */}
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <SelectSearch
                            size="small"
                            value={filters.sampleType}
                            onChange={(e) => handleFilterChange('sampleType', e.target.value)}
                            label="Sample Type"
                            fullWidth
                            url={route("api.sampleTypes.list")}
                            name="sampleType"
                        />
                    </Grid>

                    {/* Referrer Filter */}
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <SelectSearch
                            size="small"
                            value={filters.referrer}
                            onChange={(e) => handleFilterChange('referrer', e.target.value)}
                            label="Referrer"
                            fullWidth
                            url={route("api.referrers.list")}
                            name="referrer"
                        />
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<ClearIcon/>}
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters()}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApplyFilters}
                            >
                                Apply Filters
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
    );
};

export default Filter;
