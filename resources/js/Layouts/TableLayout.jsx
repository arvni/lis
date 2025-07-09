import React, {useEffect, useState, useMemo} from "react";
import {DataGrid, GridToolbar} from "@mui/x-data-grid";
import {SnackbarProvider} from "notistack";
import AlertComponent from "@/Components/AlertComponent";
import AddButton from "@/Components/AddButton";
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    useTheme,
    Stack,
    Chip,
    IconButton,
    Tooltip,
    Button,
    alpha,
    Skeleton,
    Fade,
} from "@mui/material";
import {
    TableRows as TableRowsIcon,
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    Download as DownloadIcon
} from "@mui/icons-material";

/**
 * Enhanced empty data overlay with better visuals and clearer messaging
 */
const CustomNoRowsOverlay = () => {
    return (
        <Stack height="100%" alignItems="center" justifyContent="center" sx={{py: 5}}>
            <TableRowsIcon sx={{fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2}}/>
            <Typography variant="h6" color="text.secondary" gutterBottom>No Records Found</Typography>
            <Typography variant="body2" color="text.disabled" align="center" sx={{maxWidth: 300, mx: 'auto'}}>
                Try adjusting your search or filter criteria to find what you're looking for
            </Typography>
        </Stack>
    );
};

/**
 * Improved loading overlay with better visual feedback
 */
const CustomLoadingOverlay = () => {
    return (
        <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: alpha('#fff', 0.7), zIndex: 2}}>
            <Box sx={{position: 'sticky', top: 0, width: '100%'}}>
                <LinearProgress color="primary"/>
            </Box>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 3,
                    borderRadius: 2,
                    minWidth: 200
                }}>
                    <Box sx={{mb: 2}}>
                        <Skeleton variant="circular" width={40} height={40}/>
                    </Box>
                    <Skeleton variant="text" width={120} height={24}/>
                    <Skeleton variant="text" width={160} height={18}/>
                </Box>
            </Box>
        </Box>
    );
};

/**
 * Enhanced TableLayout Component with improved visuals and functionality
 *
 * Features:
 * - Improved loading states and empty states
 * - Better header with more controls and information
 * - Enhanced visual feedback for user actions
 * - More efficient prop handling and memoization
 * - Support for dark mode
 * - Better mobile responsiveness
 *
 * @param Filter
 * @param columns
 * @param reload
 * @param data
 * @param children
 * @param loading
 * @param status
 * @param addNew
 * @param onClickAddNew
 * @param addNewTitle
 * @param errors
 * @param processing
 * @param defaultValues
 * @param showToolbar
 * @param onExport
 * @param refreshData
 * @param customProps
 * @param {Object} props - Component props
 */
const TableLayout = ({
                         Filter,
                         columns,
                         reload,
                         data = {data: [], total: 0, current_page: 1},
                         children,
                         loading = false,
                         status,
                         addNew = false,
                         onClickAddNew,
                         addNewTitle = "Add New",
                         errors,
                         processing = false,
                         defaultValues = {
                             filters: {},
                             sort: {field: 'id', sort: 'desc'},
                             pageSize: 10,
                             page: 1
                         },
                         showToolbar = false,
                         onExport,
                         refreshData,
                         customProps = {},
                         ...props
                     }) => {
    const theme = useTheme();
    const [success, setSuccess] = useState(null);
    const [filterOpen, setFilterOpen] = useState(Object.keys(defaultValues?.filters).length > 0);

    // Process columns to ensure they're formatted correctly
    const processedColumns = useMemo(() => {
        return columns.map(column => ({
            ...column,
            flex: column.flex || 1,
            minWidth: column.minWidth || 100,
            headerClassName: 'table-header-cell',
        }));
    }, [columns]);

    // Effect to handle success message
    useEffect(() => {
        if (props.success && !processing) {
            setSuccess(true);
            resetSuccess();
        }
    }, [processing, props.success]);

    const resetSuccess = () => setTimeout(() => {
        setSuccess(null);
    }, 3000);

    // Handlers for pagination and filtering
    const handlePaginationChange = (pModel) => {
        if (pModel.pageSize !== Number(defaultValues.pageSize)) {
            reload(1, defaultValues.filters, defaultValues.sort, pModel.pageSize);
        } else if (pModel.page !== Number(defaultValues.page) - 1) {
            reload(pModel.page + 1, defaultValues.filters, defaultValues.sort, defaultValues.pageSize);
        }
    };

    const handleFilterChange = (filter) => () => reload(1, filter, defaultValues.sort, defaultValues.pageSize);

    const handleSortChange = (sortModel) => {
        if (sortModel && sortModel.length > 0) {
            reload(1, defaultValues.filters, sortModel[0], defaultValues.pageSize);
        }
    };

    const handleRefresh = () => {
        if (refreshData) {
            refreshData();
        } else {
            reload(
                defaultValues.page,
                defaultValues.filters,
                defaultValues.sort,
                defaultValues.pageSize
            );
        }
    };

    const handleExport = () => {
        if (onExport) {
            onExport();
        }
    };

    const toggleFilter = () => {
        setFilterOpen(!filterOpen);
    };

    // Format display values
    const formattedTotal = data?.total ? data.total.toLocaleString() : '0';
    const currentPage = data?.current_page || 1;
    const pageSize = defaultValues?.pageSize || 10;
    const startRecord = ((currentPage - 1) * pageSize) + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, data?.total || 0);
    const recordRange = data?.total > 0 ? `${startRecord.toLocaleString()}-${endRecord.toLocaleString()}` : '0';

    return (
        <Fade in={true} timeout={300}>
            <Box sx={{position: 'relative'}}>
                {/* Filter Area - Only rendered when open */}
                {filterOpen && Filter && (
                    <Fade in={true} timeout={300}>
                        <Paper
                            elevation={0}
                            variant="outlined"
                            sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                borderColor: theme.palette.divider,
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                            }}
                        >
                            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                                <Typography variant="subtitle1" fontWeight={500}>
                                    <FilterListIcon fontSize="small" sx={{mr: 1, verticalAlign: 'middle'}}/>
                                    Filter Records
                                </Typography>
                                <IconButton size="small" onClick={toggleFilter}>
                                    <FilterListIcon fontSize="small"/>
                                </IconButton>
                            </Box>

                            <Filter defaultFilter={defaultValues.filters} onFilter={handleFilterChange}/>
                        </Paper>
                    </Fade>
                )}

                {/* Main Table Container */}
                <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 3,
                        transition: 'all 0.2s ease-in-out',
                        ...customProps.containerSx
                    }}
                >
                    {/* Table Header */}
                    <Box
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : alpha(theme.palette.background.default, 0.5),
                            flexWrap: {xs: 'wrap', md: 'nowrap'},
                            gap: {xs: 1, md: 0}
                        }}
                    >
                        <Box display="flex" alignItems="center" sx={{mb: {xs: 1, md: 0}}}>
                            <TableRowsIcon sx={{mr: 1, color: 'text.secondary'}}/>
                            <Typography variant="subtitle1" fontWeight={500}>
                                Records
                            </Typography>
                            <Chip
                                label={formattedTotal}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ml: 1, fontWeight: 500}}
                            />
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{flexGrow: 1}}>
                            <Typography variant="body2" color="text.secondary" sx={{mr: 2}}>
                                Showing {recordRange} of {formattedTotal} records
                            </Typography>

                            {/* Actions */}
                            <Box sx={{display: 'flex', gap: 1}}>
                                {!filterOpen && Filter && (
                                    <Tooltip title="Filter data">
                                        <IconButton
                                            size="small"
                                            onClick={toggleFilter}
                                            color={Object.keys(defaultValues.filters).length > 0 ? "primary" : "default"}
                                        >
                                            <FilterListIcon fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                )}

                                <Tooltip title="Refresh data">
                                    <IconButton
                                        size="small"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                    >
                                        <RefreshIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                {onExport && (
                                    <Tooltip title="Export data">
                                        <IconButton
                                            size="small"
                                            onClick={handleExport}
                                            disabled={loading || !data.total}
                                        >
                                            <DownloadIcon fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {addNew && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={onClickAddNew}
                                        sx={{ml: 1}}
                                    >
                                        {addNewTitle}
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        onColumnVisibilityModelChange={console.log}
                        rows={data.data || []}
                        columns={processedColumns}
                        filterMode="server"
                        disableColumnFilter
                        sortingMode="server"
                        sortModel={[defaultValues.sort]}
                        paginationMode="server"
                        pageSizeOptions={[10, 20, 50, 100]}
                        paginationModel={{
                            pageSize: Number(defaultValues.pageSize) || 10,
                            page: Number(data.current_page || 1) - 1,
                        }}
                        onPaginationModelChange={handlePaginationChange}
                        rowCount={data.total || 0}
                        loading={loading}
                        onSortModelChange={handleSortChange}
                        components={{
                            NoRowsOverlay: CustomNoRowsOverlay,
                            LoadingOverlay: CustomLoadingOverlay,
                            Toolbar: showToolbar ? GridToolbar : null,
                        }}
                        getRowClassName={(params) =>
                            params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
                        }
                        sx={{
                            border: 'none',
                            '.MuiDataGrid-columnSeparator': {
                                display: 'none',
                            },
                            '.MuiDataGrid-columnHeader': {
                                backgroundColor: theme.palette.mode === 'light'
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
                                backgroundColor: theme.palette.mode === 'light'
                                    ? alpha(theme.palette.background.default, 0.4)
                                    : alpha(theme.palette.background.paper, 0.2),
                            },
                            '.MuiDataGrid-row.odd-row': {
                                backgroundColor: theme.palette.mode === 'light'
                                    ? theme.palette.background.paper
                                    : theme.palette.background.paper,
                            },
                            '.MuiDataGrid-row:hover': {
                                backgroundColor: theme.palette.mode === 'light'
                                    ? alpha(theme.palette.primary.main, 0.04)
                                    : alpha(theme.palette.primary.main, 0.12),
                            },
                            '.MuiDataGrid-row.Mui-selected': {
                                backgroundColor: theme.palette.mode === 'light'
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : alpha(theme.palette.primary.main, 0.16),
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'light'
                                        ? alpha(theme.palette.primary.main, 0.12)
                                        : alpha(theme.palette.primary.main, 0.24),
                                },
                            },
                            '.MuiDataGrid-footerContainer': {
                                borderTop: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.mode === 'light'
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
                            ...customProps.sx
                        }}
                    />
                </Paper>

                {children}

                {/* Only show floating add button if not showing it in the header */}
                {addNew && !onClickAddNew && (
                    <AddButton onClick={onClickAddNew} title={addNewTitle}/>
                )}

                <SnackbarProvider maxSnack={3}>
                    <AlertComponent status={status} errors={errors} success={success}/>
                </SnackbarProvider>
            </Box>
        </Fade>
    );
};

export default TableLayout;
