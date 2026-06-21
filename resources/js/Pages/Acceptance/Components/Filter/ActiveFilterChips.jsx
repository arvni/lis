import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';

const ActiveFilterChips = ({
    filter,
    activeFilters,
    onClearSearch,
    onClearStatus,
    onClearPriority,
    onClearTags,
    onClearHowFoundUs,
    onClearWaitingPooling,
    onClearOutPatient,
    onClearRegistered,
    onClearReportDate,
    onClearPublished,
    onClearAll,
}) => (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <FilterListIcon color="primary" fontSize="small" />
        <Chip
            label={`${activeFilters} filter${activeFilters > 1 ? 's' : ''} active`}
            size="small"
            color="primary"
            variant="outlined"
        />
        {filter?.search && (
            <Chip
                label={`Search: ${filter.search}`}
                size="small"
                onDelete={onClearSearch}
                variant="outlined"
            />
        )}
        {filter?.status && filter.status.length > 0 && (
            <Chip
                label={`Status: ${filter.status.length} selected`}
                size="small"
                onDelete={onClearStatus}
                variant="outlined"
            />
        )}
        {filter?.priority && (
            <Chip
                label={`Priority: ${filter.priority}`}
                size="small"
                onDelete={onClearPriority}
                variant="outlined"
            />
        )}
        {filter?.tags && filter.tags.length > 0 && (
            <Chip
                label={`Tags: ${filter.tags.length} selected`}
                size="small"
                onDelete={onClearTags}
                variant="outlined"
            />
        )}
        {filter?.how_found_us && filter.how_found_us.length > 0 && (
            <Chip
                label={`How Found: ${filter.how_found_us.length} selected`}
                size="small"
                onDelete={onClearHowFoundUs}
                variant="outlined"
            />
        )}
        {filter?.waiting_for_pooling && (
            <Chip
                label="Waiting for Pooling"
                size="small"
                onDelete={onClearWaitingPooling}
                variant="outlined"
            />
        )}
        {filter?.out_patient !== undefined && filter?.out_patient !== '' && (
            <Chip
                label={filter.out_patient === '1' ? 'Out Patient' : 'In Patient'}
                size="small"
                onDelete={onClearOutPatient}
                variant="outlined"
            />
        )}
        {(filter?.from_date || filter?.to_date) && (
            <Chip
                label={`Registered: ${filter.from_date || '...'} - ${filter.to_date || '...'}`}
                size="small"
                onDelete={onClearRegistered}
                variant="outlined"
            />
        )}
        {(filter?.report_date_from || filter?.report_date_to) && (
            <Chip
                label={`Report Date: ${filter.report_date_from || '...'} - ${filter.report_date_to || '...'}`}
                size="small"
                onDelete={onClearReportDate}
                variant="outlined"
            />
        )}
        {(filter?.published_at_from || filter?.published_at_to) && (
            <Chip
                label={`Published: ${filter.published_at_from || '...'} - ${filter.published_at_to || '...'}`}
                size="small"
                onDelete={onClearPublished}
                variant="outlined"
            />
        )}
        <Button size="small" onClick={onClearAll} startIcon={<ClearIcon />} sx={{ ml: 1 }}>
            Clear All
        </Button>
    </Box>
);

export default ActiveFilterChips;
