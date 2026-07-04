import React, { useEffect, useState, useMemo } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { SnackbarProvider } from 'notistack';
import AlertComponent from '@/Components/AlertComponent';
import AddButton from '@/Components/AddButton';
import { Box, Paper, useTheme, Fade } from '@mui/material';
import { CustomNoRowsOverlay, CustomLoadingOverlay } from './TableLayout/Overlays';
import { buildDataGridSx } from './TableLayout/dataGridStyles';
import FilterPanel from './TableLayout/FilterPanel';
import TableHeader from './TableLayout/TableHeader';

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
    data = { data: [], total: 0, current_page: 1 },
    children,
    loading = false,
    status,
    addNew = false,
    onClickAddNew,
    addNewTitle = 'Add New',
    errors,
    processing = false,
    defaultValues = {
        filters: {},
        sort: { field: 'id', sort: 'desc' },
        pageSize: 10,
        page: 1,
    },
    showToolbar = false,
    onExport,
    refreshData,
    headerActions,
    customProps = {},
    ...props
}) => {
    const theme = useTheme();
    const [success, setSuccess] = useState(null);

    // Merge caller-supplied defaultValues with safe fallbacks
    defaultValues = {
        filters: {},
        sort: { field: 'id', sort: 'desc' },
        pageSize: 10,
        page: 1,
        ...defaultValues,
    };

    const [filterOpen, setFilterOpen] = useState(Object.keys(defaultValues.filters).length > 0);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: Number(defaultValues.pageSize) || 10,
        page: Number(data.current_page || defaultValues.page || 1) - 1,
    });

    // Process columns to ensure they're formatted correctly
    const processedColumns = useMemo(() => {
        return columns.map((column) => ({
            ...column,
            flex: column.flex !== undefined ? column.flex : 1,
            minWidth: column.minWidth || 100,
            headerClassName: 'table-header-cell',
        }));
    }, [columns]);

    // Depend on the primitive sort values, not the `sort` object itself: the
    // server returns a fresh `requestInputs.sort` object on every paginated
    // reload, so depending on the object would hand DataGrid a new sortModel
    // reference each time, firing onSortModelChange -> reload(1) and snapping
    // the grid back to the first page.
    const sortField = defaultValues.sort?.field;
    const sortDirection = defaultValues.sort?.sort;
    const sortModel = useMemo(
        () => (sortField ? [{ field: sortField, sort: sortDirection }] : []),
        [sortField, sortDirection],
    );

    // Effect to handle success message
    useEffect(() => {
        if (props.success && !processing) {
            setSuccess(true);
            resetSuccess();
        }
    }, [processing, props.success]);

    useEffect(() => {
        const nextPaginationModel = {
            pageSize: Number(defaultValues.pageSize) || 10,
            page: Number(data.current_page || defaultValues.page || 1) - 1,
        };

        setPaginationModel((currentPaginationModel) => {
            if (
                currentPaginationModel.page === nextPaginationModel.page &&
                currentPaginationModel.pageSize === nextPaginationModel.pageSize
            ) {
                return currentPaginationModel;
            }

            return nextPaginationModel;
        });
    }, [data.current_page, defaultValues.page, defaultValues.pageSize]);

    const resetSuccess = () =>
        setTimeout(() => {
            setSuccess(null);
        }, 3000);

    // Handlers for pagination and filtering
    const handlePaginationChange = (pModel) => {
        if (pModel.page === paginationModel.page && pModel.pageSize === paginationModel.pageSize) {
            return;
        }

        setPaginationModel(pModel);

        if (pModel.pageSize !== paginationModel.pageSize) {
            reload(1, defaultValues.filters, defaultValues.sort, pModel.pageSize);
        } else {
            reload(
                pModel.page + 1,
                defaultValues.filters,
                defaultValues.sort,
                paginationModel.pageSize,
            );
        }
    };

    const handleFilterChange = (filter) => () =>
        reload(1, filter, defaultValues.sort, defaultValues.pageSize);

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
                defaultValues.pageSize,
            );
        }
    };

    const toggleFilter = () => {
        setFilterOpen(!filterOpen);
    };

    // Format display values
    const formattedTotal = data?.total ? data.total.toLocaleString() : '0';
    const currentPage = data?.current_page || 1;
    const pageSize = defaultValues?.pageSize || 10;
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + pageSize - 1, data?.total || 0);
    const recordRange =
        data?.total > 0 ? `${startRecord.toLocaleString()}–${endRecord.toLocaleString()}` : '0';
    const activeFilterCount = Object.values(defaultValues.filters || {}).filter(
        (v) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
    ).length;

    return (
        <Fade in={true} timeout={300}>
            <Box sx={{ position: 'relative' }}>
                {/* Filter Area - Only rendered when open */}
                {filterOpen && Filter && (
                    <FilterPanel
                        Filter={Filter}
                        defaultFilter={defaultValues.filters}
                        onFilter={handleFilterChange}
                        onToggle={toggleFilter}
                    />
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
                        ...customProps.containerSx,
                    }}
                >
                    <TableHeader
                        Filter={Filter}
                        filterOpen={filterOpen}
                        activeFilterCount={activeFilterCount}
                        onToggleFilter={toggleFilter}
                        recordRange={recordRange}
                        formattedTotal={formattedTotal}
                        headerActions={headerActions}
                        onRefresh={handleRefresh}
                        loading={loading}
                        onExport={onExport}
                        dataTotal={data.total}
                        addNew={addNew}
                        onClickAddNew={onClickAddNew}
                        addNewTitle={addNewTitle}
                    />

                    {/* DataGrid */}
                    <DataGrid
                        rows={data.data || []}
                        columns={processedColumns}
                        filterMode="server"
                        disableColumnFilter
                        sortingMode="server"
                        sortModel={sortModel}
                        pagination
                        paginationMode="server"
                        pageSizeOptions={[10, 20, 50, 100]}
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationChange}
                        rowCount={data.total || 0}
                        loading={loading}
                        autosizeOnMount
                        onSortModelChange={handleSortChange}
                        components={{
                            NoRowsOverlay: CustomNoRowsOverlay,
                            LoadingOverlay: CustomLoadingOverlay,
                            Toolbar: showToolbar ? GridToolbar : null,
                        }}
                        getRowClassName={(params) =>
                            params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
                        }
                        sx={buildDataGridSx(theme, customProps.sx)}
                        {...props}
                    />
                </Paper>

                {children}

                {/* Only show floating add button if not showing it in the header */}
                {addNew && !onClickAddNew && (
                    <AddButton onClick={onClickAddNew} title={addNewTitle} />
                )}

                <SnackbarProvider maxSnack={3}>
                    <AlertComponent status={status} errors={errors} success={success} />
                </SnackbarProvider>
            </Box>
        </Fade>
    );
};

export default TableLayout;
