import React, {useState} from "react";
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    Tooltip,
    Card,
    CardContent,
    CardActions,
    Grid2 as Grid,
    Divider,
    useTheme,
    useMediaQuery,
    TextField,
    InputAdornment
} from "@mui/material";
import {
    Add,
    Edit,
    Delete,
    CheckCircle,
    Cancel,
    Search,
    ViewList,
    ViewModule
} from "@mui/icons-material";

const MethodsList = ({
                         methodTests = [],
                         onStatusChange,
                         handleAdd,
                         handleDelete,
                         handleEdit,
                         type = '1'
                     }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(isMobile ? 'grid' : 'table');
    const [filters, setFilters] = useState({showActive: true, showInactive: true});

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Filter and search methods
    const filteredMethods = methodTests.filter(item => {
        // Apply status filter
        if ((!filters.showActive && item.status) || (!filters.showInactive && !item.status)) {
            return false;
        }

        // Apply search term
        const method = item.method;
        if (searchTerm && method) {
            const searchLower = searchTerm.toLowerCase();
            return (
                (method.name && method.name.toLowerCase().includes(searchLower)) ||
                (method.price && method.price.toString().includes(searchLower)) ||
                (type === '1' && method.turnaround_time &&
                    method.turnaround_time.toString().includes(searchLower)) ||
                (type === '1' && method.workflow &&
                    method.workflow.name && method.workflow.name.toLowerCase().includes(searchLower))
            );
        }

        return true;
    });

    // Paginate methods
    const paginatedMethods = filteredMethods.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Toggle filter for active/inactive methods
    const toggleFilter = (filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName]
        }));
        setPage(0);
    };

    // Toggle view mode between table and grid
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'table' ? 'grid' : 'table');
    };

    // Render method as a table row
    const renderTableRow = (methodTest) => {
        const {id, method, status, acceptance_items_count} = methodTest;
        return (
            <TableRow key={id} hover>
                <TableCell>{method?.name || "—"}</TableCell>
                {type === 'TEST' && (
                    <>
                        <TableCell>{method?.workflow?.name || "—"}</TableCell>
                        <TableCell>{method?.barcode_group?.name || "—"}</TableCell>
                        <TableCell align="right">{method?.turnaround_time || "—"}</TableCell>
                    </>
                )}
                {type !== "PANEL" && <>
                    <TableCell align="right">
                        {method?.price && method.price_type === "Fix" ? (
                            <Typography fontWeight="medium">
                                {method.price} <small>OMR</small>
                            </Typography>
                        ) : method.price_type}
                    </TableCell>
                    <TableCell align="right">
                        {method?.referrer_price && method.referrer_price_type === "Fix" ? (
                            <Typography fontWeight="medium">
                                {method.referrer_price} <small>OMR</small>
                            </Typography>
                        ) : method.referrer_price_type}
                    </TableCell>
                </>}
                <TableCell align="right">{acceptance_items_count || "—"}</TableCell>
                <TableCell align="center">
                    <Tooltip title={status ? "Active" : "Inactive"}>
                        <Switch
                            checked={status}
                            onChange={onStatusChange(id)}
                            color="primary"
                            size="small"
                        />
                    </Tooltip>
                </TableCell>
                <TableCell align="right">
                    <Box>
                        <Tooltip title="Edit">
                            <IconButton onClick={handleEdit(id)} size="small" color="primary">
                                <Edit fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        {!acceptance_items_count && <Tooltip title="Delete">
                            <IconButton onClick={handleDelete(id)} size="small" color="error">
                                <Delete fontSize="small"/>
                            </IconButton>
                        </Tooltip>}
                    </Box>
                </TableCell>
            </TableRow>
        );
    };

    // Render method as a grid card
    const renderGridCard = (methodTest) => {
        const {id, method, status, acceptance_items_count} = methodTest;
        return (
            <Grid size={{xs: 12, sm: 6, md: 6}} key={id}>
                <Card
                    variant="outlined"
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderColor: status ? theme.palette.divider : theme.palette.error.light,
                        borderWidth: status ? 1 : 2,
                        opacity: status ? 1 : 0.8,
                        transition: 'all 0.2s'
                    }}
                >
                    <CardContent sx={{flexGrow: 1}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                            <Typography variant="h6" noWrap sx={{maxWidth: '80%'}}>
                                {method?.name || "Unnamed Method"}
                            </Typography>
                            <Chip
                                size="small"
                                color={status ? "success" : "default"}
                                label={status ? "Active" : "Inactive"}
                                sx={{height: 20}}
                            />
                        </Box>

                        <Divider sx={{my: 1}}/>
                        {type !== "PANEL" && <>
                            <Box sx={{mb: 2}}>
                                <Typography variant="body2" color="text.secondary">
                                    Price:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {method?.price_type === "FIX" && method?.price ? `${method.price.toFixed(3)} OMR` : "—"}
                                </Typography>
                            </Box>
                            <Box sx={{mb: 2}}>
                                <Typography variant="body2" color="text.secondary">
                                    Referrer Price:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {method?.referrer_price_type === "FIX" && method?.referrer_price ? `${method.referrer_price.toFixed(3)} OMR` : "—"}
                                </Typography>
                            </Box>
                        </>}
                        {type === 'TEST' && (
                            <>
                                <Box sx={{mb: 1}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Workflow:
                                    </Typography>
                                    <Typography variant="body2" noWrap>
                                        {method?.workflow?.name || "—"}
                                    </Typography>
                                </Box>

                                <Box sx={{mb: 1}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Barcode Group:
                                    </Typography>
                                    <Typography variant="body2" noWrap>
                                        {method?.barcode_group?.name || "—"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Turnaround Time:
                                    </Typography>
                                    <Typography variant="body2">
                                        {method?.turnaround_time ? `${method.turnaround_time} days` : "—"}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </CardContent>
                    <CardActions sx={{justifyContent: 'space-between', px: 2, pb: 2}}>
                        <Switch
                            checked={status}
                            onChange={onStatusChange(id)}
                            color="primary"
                            size="small"
                        />
                        <Box>
                            <Tooltip title="Edit">
                                <IconButton onClick={handleEdit(id)} size="small" color="primary">
                                    <Edit fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                            {!acceptance_items_count && <Tooltip title="Delete">
                                <IconButton onClick={handleDelete(id)} size="small" color="error">
                                    <Delete fontSize="small"/>
                                </IconButton>
                            </Tooltip>}
                        </Box>
                    </CardActions>
                </Card>
            </Grid>
        );
    };

    // Render empty state
    const renderEmptyState = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                bgcolor: theme.palette.grey[50],
                borderRadius: 1
            }}
        >
            <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
                No methods added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{mb: 2}}>
                {type === '3'
                    ? "Select an existing method to add to this test"
                    : "Add your first method by clicking the button below"}
            </Typography>
            <Button
                variant="contained"
                color="primary"
                startIcon={<Add/>}
                onClick={handleAdd}
            >
                {type === '3' ? "Select Method" : "Add Method"}
            </Button>
        </Box>
    );

    // Render toolbar with actions
    const renderToolbar = () => (
        <Box sx={{mb: 2}}>
            <Grid container spacing={2} alignItems="center">
                <Grid size={{xs: 12, md: 6}}>
                    <TextField
                        placeholder="Search methods..."
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                        slotProps={{
                            Input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small"/>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
                    <Box sx={{display: 'flex', justifyContent: {xs: 'space-between', md: 'flex-end'}, gap: 1}}>
                        <Box>
                            <Tooltip title="Show/Hide Active Methods">
                                <Chip
                                    icon={<CheckCircle fontSize="small"/>}
                                    label="Active"
                                    clickable
                                    color={filters.showActive ? "primary" : "default"}
                                    onClick={() => toggleFilter('showActive')}
                                    variant={filters.showActive ? "filled" : "outlined"}
                                    size="small"
                                />
                            </Tooltip>
                            <Tooltip title="Show/Hide Inactive Methods">
                                <Chip
                                    icon={<Cancel fontSize="small"/>}
                                    label="Inactive"
                                    clickable
                                    color={filters.showInactive ? "primary" : "default"}
                                    onClick={() => toggleFilter('showInactive')}
                                    variant={filters.showInactive ? "filled" : "outlined"}
                                    size="small"
                                    sx={{ml: 1}}
                                />
                            </Tooltip>
                        </Box>
                        <Tooltip title={viewMode === 'table' ? "Switch to Grid View" : "Switch to Table View"}>
                            <IconButton onClick={toggleViewMode} color="primary" size="small">
                                {viewMode === 'table' ? <ViewModule/> : <ViewList/>}
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add/>}
                            onClick={handleAdd}
                            size={isTablet ? "small" : "medium"}
                        >
                            {type === '3' ? "Select Method" : "Add Method"}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );

    // Render table view
    const renderTableView = () => (
        <TableContainer component={Paper} variant="outlined" sx={{mb: 2}}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{backgroundColor: theme.palette.action.hover}}>
                        <TableCell>Method Name</TableCell>
                        {type === 'TEST' && (
                            <>
                                <TableCell>Workflow</TableCell>
                                <TableCell>Barcode Group</TableCell>
                                <TableCell align="right">Turnaround (days)</TableCell>
                            </>
                        )}
                        {type !== "PANEL" && (<>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Referrer Price</TableCell>
                        </>)}
                        <TableCell align="right">No. Acceptance Items</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedMethods.length ? (
                        paginatedMethods.map(renderTableRow)
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={type === '1' ? 7 : 4}
                                align="center"
                                sx={{py: 3}}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    No methods found
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )


    // Render grid view
    const renderGridView = () => (
        <Grid container spacing={2} sx={{mb: 2}}>
            {paginatedMethods.length ? (
                paginatedMethods.map(renderGridCard)
            ) : (
                <Grid size={{xs: 12}}>
                    <Box
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            bgcolor: theme.palette.action.hover,
                            borderRadius: 1
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            No methods found
                        </Typography>
                    </Box>
                </Grid>
            )}
        </Grid>
    );

    // Render pagination
    const renderPagination = () => (
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredMethods.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
    );

    return (
        <Box sx={{mb: 2}}>
            {methodTests.length > 0 ? (
                <>
                    {renderToolbar()}
                    {viewMode === 'table' ? renderTableView() : renderGridView()}
                    {filteredMethods.length > rowsPerPage && renderPagination()}
                </>
            ) : (
                renderEmptyState()
            )}
        </Box>
    );
};

export default MethodsList;
