import React from 'react';
import { Box, Typography, IconButton, Tooltip, Button, useTheme, alpha } from '@mui/material';
import {
    TableRows as TableRowsIcon,
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    Download as DownloadIcon,
    FilterListOff as FilterListOffIcon,
} from '@mui/icons-material';

/**
 * Table header: record-range summary on the left, action controls on the right.
 */
const TableHeader = ({
    Filter,
    filterOpen,
    activeFilterCount,
    onToggleFilter,
    recordRange,
    formattedTotal,
    headerActions,
    onRefresh,
    loading,
    onExport,
    dataTotal,
    addNew,
    onClickAddNew,
    addNewTitle,
}) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor:
                    theme.palette.mode === 'light'
                        ? 'grey.50'
                        : alpha(theme.palette.background.default, 0.5),
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                gap: 1,
            }}
        >
            {/* Left: record count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <TableRowsIcon sx={{ color: 'text.disabled', fontSize: 18, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                    Showing <strong>{recordRange}</strong> of <strong>{formattedTotal}</strong>{' '}
                    records
                </Typography>
            </Box>

            {/* Right: actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                {Filter && (
                    <Button
                        size="small"
                        variant={
                            filterOpen ? 'contained' : activeFilterCount > 0 ? 'outlined' : 'text'
                        }
                        color={activeFilterCount > 0 ? 'primary' : 'inherit'}
                        onClick={onToggleFilter}
                        startIcon={
                            filterOpen ? (
                                <FilterListOffIcon fontSize="small" />
                            ) : (
                                <FilterListIcon fontSize="small" />
                            )
                        }
                        sx={{ textTransform: 'none', fontWeight: 500, minWidth: 90 }}
                    >
                        {filterOpen
                            ? 'Hide'
                            : activeFilterCount > 0
                              ? `Filters (${activeFilterCount})`
                              : 'Filters'}
                    </Button>
                )}

                {headerActions}
                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={onRefresh} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {onExport && (
                    <Tooltip title="Export">
                        <IconButton
                            size="small"
                            onClick={onExport}
                            disabled={loading || !dataTotal}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}

                {addNew && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={onClickAddNew}
                    >
                        {addNewTitle}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default TableHeader;
