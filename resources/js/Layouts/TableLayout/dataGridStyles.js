import { alpha } from '@mui/material';

/**
 * Build the DataGrid `sx` object for the given theme, merging any caller-supplied overrides.
 *
 * @param {import('@mui/material').Theme} theme
 * @param {object} [customSx]
 */
export const buildDataGridSx = (theme, customSx = {}) => ({
    border: 'none',
    '.MuiDataGrid-columnSeparator': {
        display: 'none',
    },
    '.MuiDataGrid-columnHeader': {
        backgroundColor:
            theme.palette.mode === 'light'
                ? theme.palette.grey[50]
                : alpha(theme.palette.background.default, 0.5),
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: '1.5',
        color: theme.palette.text.primary,
    },
    '.MuiDataGrid-cell': {
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.875rem',
        padding: '10px 16px',
    },
    '.MuiDataGrid-row': {
        transition: 'background-color 0.2s ease',
    },
    '.MuiDataGrid-row.even-row': {
        backgroundColor:
            theme.palette.mode === 'light'
                ? alpha(theme.palette.background.default, 0.4)
                : alpha(theme.palette.background.paper, 0.2),
    },
    '.MuiDataGrid-row.odd-row': {
        backgroundColor:
            theme.palette.mode === 'light'
                ? theme.palette.background.paper
                : theme.palette.background.paper,
    },
    '.MuiDataGrid-row:hover': {
        backgroundColor:
            theme.palette.mode === 'light'
                ? alpha(theme.palette.primary.main, 0.04)
                : alpha(theme.palette.primary.main, 0.12),
    },
    '.MuiDataGrid-row.Mui-selected': {
        backgroundColor:
            theme.palette.mode === 'light'
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.16),
        '&:hover': {
            backgroundColor:
                theme.palette.mode === 'light'
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.main, 0.24),
        },
    },
    '.MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor:
            theme.palette.mode === 'light'
                ? theme.palette.grey[50]
                : alpha(theme.palette.background.default, 0.5),
    },
    '.MuiTablePagination-root': {
        color: theme.palette.text.secondary,
    },
    '.MuiDataGrid-virtualScroller': {
        bgcolor: 'background.paper',
        minHeight: '300px', // Set minimum height so empty states look better
    },
    '.table-header-cell': {
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.5px',
    },
    ...customSx,
});
