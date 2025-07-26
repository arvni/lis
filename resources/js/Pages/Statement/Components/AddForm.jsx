import {useForm} from "@inertiajs/react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid2 as Grid,
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Checkbox,
    Button,
    LinearProgress,
    TextField,
    Typography,
    Box,
    Chip,
    Alert,
    IconButton,
    Tooltip,
    TableContainer,
    Paper,
    Card,
    CardContent,
    Badge,
    Collapse,
    Fade,
    Zoom,
    Snackbar
} from "@mui/material";
import {
    CalendarToday,
    Person,
    CheckCircle,
    Schedule,
    SelectAll,
    Deselect as DeselectAll,
    Search,
    FilterList,
    MonetizationOn,
    Receipt,
    Close,
    Info,
    Warning,
    CheckCircleOutline,
    ExpandMore,
    ExpandLess
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch.jsx";
import {useState, useEffect, useCallback, useMemo} from "react";
import axios from "axios";

const AddForm = ({open, defaultValue = {}, onClose, editMode = false, title}) => {
    const {data, setData, reset, errors, clearErrors, post, processing} = useForm({
        referrer: defaultValue.referrer || "",
        issue_date: defaultValue.issue_date || new Date().toISOString().split('T')[0],
        invoices: defaultValue.invoices || [],
        _method: editMode ? "put" : "post"
    });

    // Enhanced state management
    const [acceptanceList, setAcceptanceList] = useState(defaultValue?.acceptances || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showSummary, setShowSummary] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});

    // Initialize form data when defaultValue changes
    useEffect(() => {
        if (open) {
            setData({
                referrer: defaultValue.referrer || "",
                issue_date: defaultValue.issue_date || new Date().toISOString().split('T')[0],
                invoices: defaultValue.invoices || [],
                _method: editMode ? "put" : "post"
            });
            setAcceptanceList(defaultValue.acceptances || []);
            setError(null);
            setSuccess(null);
            setValidationErrors({});
        }
    }, [defaultValue, open]);

    // Enhanced validation
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!data.referrer) {
            newErrors.referrer = "Please select a referrer";
        }

        if (!data.issue_date) {
            newErrors.issue_date = "Please select an issue date";
        }

        if (data.issue_date && new Date(data.issue_date) > new Date()) {
            newErrors.issue_date = "Issue date cannot be in the future";
        }

        if (data.invoices.length === 0 && acceptanceList.length > 0) {
            newErrors.invoices = "Please select at least one invoice";
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [data, acceptanceList]);

    // Debounced fetch function with better error handling
    const fetchData = useCallback(async () => {
        if (!data.referrer || !data.issue_date) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                route("api.acceptances.reported", {
                    referrer: data.referrer,
                    date: data.issue_date
                })
            );

            const acceptances = [
                ...(response.data.data || []),
                ...acceptanceList.filter(item =>
                    data.invoices.some(invoice => invoice.id === item.invoice_id)
                )
            ];

            setAcceptanceList(acceptances);

            if (acceptances.length === 0) {
                setSuccess("No invoices found for the selected criteria. Try adjusting the referrer or date.");
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError("Failed to fetch invoice data. Please check your connection and try again.");
            setAcceptanceList([]);
        } finally {
            setLoading(false);
        }
    }, [data.referrer, data.issue_date]);

    // Enhanced debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchData]);

    // Enhanced form change handler
    const handleChange = (e) => {
        const {name, value} = e.target;
        setData(prevData => ({...prevData, [name]: value}));
        clearErrors(name);

        // Clear validation errors for the field being changed
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }

        // Reset invoices when referrer or date changes
        if (name === 'referrer') {
            setData(prevData => ({...prevData, invoices: []}));
            setSuccess(null);
        }
    };

    // Enhanced invoice toggle with validation
    const handleInvoiceToggle = useCallback((acceptance) => {
        setData(prevData => {
            const existingIndex = prevData.invoices.findIndex(item => item.id === acceptance.invoice_id);
            const newInvoices = existingIndex >= 0
                ? prevData.invoices.filter(item => item.id !== acceptance.invoice_id)
                : [...prevData.invoices, {id: acceptance.invoice_id}];

            return {...prevData, invoices: newInvoices};
        });

        // Clear invoice validation error when selecting items
        if (validationErrors.invoices) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.invoices;
                return newErrors;
            });
        }
    }, [setData, validationErrors]);

    const handleSelectAll = () => {
        const allIds = filteredAcceptances.map(acceptance => ({id: acceptance.invoice_id}));
        setData(prevData => ({...prevData, invoices: allIds}));
    };

    const handleDeselectAll = () => {
        setData(prevData => ({...prevData, invoices: []}));
    };

    const handleClose = () => {
        reset();
        setAcceptanceList([]);
        setError(null);
        setSuccess(null);
        setValidationErrors({});
        setSearchTerm("");
        setFilterStatus("all");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setError("Please correct the errors below before submitting.");
            return;
        }

        const url = defaultValue.id
            ? route("statements.update", defaultValue.id)
            : route("statements.store");

        const requestData = {
            ...data,
            _method: defaultValue.id ? "PUT" : "POST"
        };

        post(url, {
            data: requestData,
            onSuccess: () => {
                setSuccess(editMode ? "Statement updated successfully!" : "Statement created successfully!");
                setTimeout(handleClose, 1500);
            },
            onError: (errors) => {
                setError("Failed to save statement. Please check the form and try again.");
                console.error('Submit errors:', errors);
            }
        });
    };

    // Enhanced filtering and search
    const filteredAcceptances = useMemo(() => {
        return acceptanceList.filter(acceptance => {
            const matchesSearch = searchTerm === "" ||
                acceptance.invoice?.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acceptance.patient_fullname?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterStatus === "all" ||
                acceptance.status === filterStatus;

            return matchesSearch && matchesFilter;
        });
    }, [acceptanceList, searchTerm, filterStatus]);

    // Enhanced computed values
    const selectedCount = data.invoices.length;
    const totalAmount = useMemo(() => {
        return acceptanceList
            .filter(acceptance => data.invoices.some(invoice => invoice.id === acceptance.invoice_id))
            .reduce((sum, acceptance) => sum + parseFloat(acceptance.payable_amount || 0), 0);
    }, [acceptanceList, data.invoices]);

    const allSelected = filteredAcceptances.length > 0 &&
        filteredAcceptances.every(acceptance =>
            data.invoices.some(invoice => invoice.id === acceptance.invoice_id)
        );
    const someSelected = selectedCount > 0 && !allSelected;

    // Status statistics
    const statusStats = useMemo(() => {
        const stats = acceptanceList.reduce((acc, acceptance) => {
            acc[acceptance.status] = (acc[acceptance.status] || 0) + 1;
            return acc;
        }, {});
        return stats;
    }, [acceptanceList]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        minHeight: '85vh',
                        maxHeight: '95vh'
                    }
                }
            }}
        >
            <DialogTitle sx={{pb: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Box>
                        <Typography variant="h5" component="div" fontWeight="bold">
                            {title || (editMode ? "Edit Statement" : "Create New Statement")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {editMode ? "Update statement details and invoice selection" : "Select referrer, date, and invoices to create a new statement"}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} disabled={processing}>
                        <Close/>
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{p: 0}}>
                <Box sx={{p: 3}}>
                    <Grid container spacing={3}>
                        {/* Enhanced Form Fields Section */}
                        <Grid size={{md: 4, sm: 12, xs: 12}}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center'}}>
                                        <Info sx={{mr: 1}} color="primary"/>
                                        Statement Details
                                    </Typography>

                                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                                        <SelectSearch
                                            label="Select Referrer"
                                            fullWidth
                                            error={Boolean(errors?.referrer || validationErrors?.referrer)}
                                            disabled={editMode || processing}
                                            onChange={handleChange}
                                            helperText={errors?.referrer || validationErrors?.referrer || "Choose the referring doctor or entity"}
                                            url={route("api.referrers.list")}
                                            value={data.referrer}
                                            name="referrer"
                                            required
                                            InputProps={{
                                                startAdornment: <Person sx={{mr: 1, color: 'action.active'}}/>
                                            }}
                                        />

                                        <TextField
                                            label="Issue Date"
                                            type="date"
                                            name="issue_date"
                                            value={data.issue_date}
                                            onChange={handleChange}
                                            error={Boolean(errors?.issue_date || validationErrors?.issue_date)}
                                            helperText={errors?.issue_date || validationErrors?.issue_date || "Date when the statement is issued"}
                                            disabled={processing}
                                            required
                                            slotProps={{
                                                inputLabel: {shrink: true},
                                                input: {
                                                    startAdornment: <CalendarToday
                                                        sx={{mr: 1, color: 'action.active'}}/>,
                                                    inputProps: {max: new Date().toISOString().split('T')[0]}
                                                }
                                            }}
                                        />

                                        {/* Enhanced Summary */}
                                        <Fade in={selectedCount > 0}>
                                            <Card variant="outlined" sx={{bgcolor: 'primary.50'}}>
                                                <CardContent sx={{p: 2, '&:last-child': {pb: 2}}}>
                                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                                        <CheckCircleOutline color="primary" sx={{mr: 1}}/>
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            Selection Summary
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setShowSummary(!showSummary)}
                                                            sx={{ml: 'auto'}}
                                                        >
                                                            {showSummary ? <ExpandLess/> : <ExpandMore/>}
                                                        </IconButton>
                                                    </Box>

                                                    <Collapse in={showSummary}>
                                                        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1}}>
                                                            <Chip
                                                                label={`${selectedCount} Invoice${selectedCount !== 1 ? 's' : ''}`}
                                                                color="primary"
                                                                size="small"
                                                                icon={<Receipt/>}
                                                            />
                                                            <Chip
                                                                label={`OMR ${totalAmount.toFixed(2)}`}
                                                                color="success"
                                                                size="small"
                                                                icon={<MonetizationOn/>}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Average:
                                                            OMR {selectedCount > 0 ? (totalAmount / selectedCount).toFixed(2) : '0.00'} per
                                                            invoice
                                                        </Typography>
                                                    </Collapse>
                                                </CardContent>
                                            </Card>
                                        </Fade>

                                        {/* Status Statistics */}
                                        {Object.keys(statusStats).length > 0 && (
                                            <Card variant="outlined">
                                                <CardContent sx={{p: 2, '&:last-child': {pb: 2}}}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Invoice Status Overview
                                                    </Typography>
                                                    <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                        {Object.entries(statusStats).map(([status, count]) => (
                                                            <Chip
                                                                key={status}
                                                                label={`${status}: ${count}`}
                                                                size="small"
                                                                color={status === 'reported' ? 'success' : 'warning'}
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Enhanced Table Section */}
                        <Grid size={{md: 8, sm: 12, xs: 12}}>
                            <Card elevation={2} sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                                <CardContent sx={{flex: 1, display: 'flex', flexDirection: 'column', p: 2}}>
                                    {/* Enhanced Header with Search and Filters */}
                                    <Box sx={{mb: 2}}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2
                                        }}>
                                            <Box>
                                                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Receipt sx={{mr: 1}} color="primary"/>
                                                    Available Invoices
                                                    {acceptanceList.length > 0 && (
                                                        <Badge badgeContent={acceptanceList.length} color="primary"
                                                               sx={{ml: 1}}>
                                                            <Chip size="small" label="Total" variant="outlined"/>
                                                        </Badge>
                                                    )}
                                                </Typography>
                                                {filteredAcceptances.length !== acceptanceList.length && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Showing {filteredAcceptances.length} of {acceptanceList.length} invoices
                                                    </Typography>
                                                )}
                                            </Box>

                                            {acceptanceList.length > 0 && (
                                                <Box sx={{display: 'flex', gap: 1}}>
                                                    <Tooltip title="Select All Visible">
                                                        <IconButton
                                                            onClick={handleSelectAll}
                                                            disabled={allSelected || processing}
                                                            size="small"
                                                            color="primary"
                                                        >
                                                            <SelectAll/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Deselect All">
                                                        <IconButton
                                                            onClick={handleDeselectAll}
                                                            disabled={selectedCount === 0 || processing}
                                                            size="small"
                                                            color="secondary"
                                                        >
                                                            <DeselectAll/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Search and Filter Controls */}
                                        {acceptanceList.length > 0 && (
                                            <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                                                <TextField
                                                    placeholder="Search by invoice number or patient name..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    size="small"
                                                    sx={{flex: 1}}
                                                    InputProps={{
                                                        startAdornment: <Search sx={{mr: 1, color: 'action.active'}}/>
                                                    }}
                                                />
                                                <TextField
                                                    select
                                                    label="Status Filter"
                                                    value={filterStatus}
                                                    onChange={(e) => setFilterStatus(e.target.value)}
                                                    size="small"
                                                    sx={{minWidth: 120}}
                                                    SelectProps={{native: true}}
                                                    InputProps={{
                                                        startAdornment: <FilterList
                                                            sx={{mr: 1, color: 'action.active'}}/>
                                                    }}
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="reported">Reported</option>
                                                    <option value="pending">Pending</option>
                                                </TextField>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Enhanced Error/Success Display */}
                                    {error && (
                                        <Zoom in={Boolean(error)}>
                                            <Alert
                                                severity="error"
                                                sx={{mb: 2}}
                                                onClose={() => setError(null)}
                                                icon={<Warning/>}
                                            >
                                                {error}
                                            </Alert>
                                        </Zoom>
                                    )}

                                    {success && (
                                        <Zoom in={Boolean(success)}>
                                            <Alert
                                                severity="info"
                                                sx={{mb: 2}}
                                                onClose={() => setSuccess(null)}
                                            >
                                                {success}
                                            </Alert>
                                        </Zoom>
                                    )}

                                    {validationErrors.invoices && (
                                        <Alert severity="warning" sx={{mb: 2}}>
                                            {validationErrors.invoices}
                                        </Alert>
                                    )}

                                    {/* Enhanced Loading State */}
                                    {loading && (
                                        <Box sx={{mb: 2}}>
                                            <LinearProgress/>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                py: 2
                                            }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Loading invoices...
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Enhanced Table */}
                                    {!loading && filteredAcceptances.length > 0 && (
                                        <TableContainer component={Paper} sx={{maxHeight: 450, flex: 1}}>
                                            <Table stickyHeader size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                indeterminate={someSelected}
                                                                checked={allSelected}
                                                                onChange={allSelected ? handleDeselectAll : handleSelectAll}
                                                                disabled={processing}
                                                                color="primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell><strong>Invoice No</strong></TableCell>
                                                        <TableCell><strong>Date</strong></TableCell>
                                                        <TableCell><strong>Patient</strong></TableCell>
                                                        <TableCell><strong>Tests</strong></TableCell>
                                                        <TableCell align="right"><strong>Amount
                                                            (OMR)</strong></TableCell>
                                                        <TableCell><strong>Status</strong></TableCell>
                                                        <TableCell><strong>Report Date</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredAcceptances.map((acceptance) => {
                                                        const isSelected = data.invoices.some(item => item.id === acceptance.invoice_id);
                                                        const testNames = acceptance?.acceptance_items
                                                            ?.map(item => item.test?.fullName)
                                                            ?.filter(Boolean)
                                                            ?.join(", ") || "N/A";

                                                        return (
                                                            <TableRow
                                                                key={acceptance.invoice_id}
                                                                hover
                                                                selected={isSelected}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    '&:hover': {backgroundColor: 'action.hover'}
                                                                }}
                                                                onClick={() => handleInvoiceToggle(acceptance)}
                                                            >
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        disabled={processing}
                                                                        color="primary"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {acceptance.invoice?.invoice_no || 'N/A'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {new Date(acceptance.created_at).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" noWrap>
                                                                        {acceptance.patient_fullname || 'N/A'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Tooltip title={testNames} arrow>
                                                                        <Typography
                                                                            variant="body2"
                                                                            noWrap
                                                                            sx={{maxWidth: 200}}
                                                                        >
                                                                            {testNames}
                                                                        </Typography>
                                                                    </Tooltip>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {parseFloat(acceptance.payable_amount || 0).toFixed(2)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={acceptance.status}
                                                                        color={acceptance.status === 'reported' ? 'success' : 'warning'}
                                                                        size="small"
                                                                        icon={acceptance.status === 'reported' ?
                                                                            <CheckCircle/> : <Schedule/>}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {acceptance.status === "reported"
                                                                            ? new Date(acceptance.updated_at).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })
                                                                            : new Date(acceptance.report_date).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })
                                                                        }
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    {/* Enhanced Empty States */}
                                    {!loading && acceptanceList.length === 0 && data.referrer && data.issue_date && (
                                        <Box sx={{textAlign: 'center', py: 6}}>
                                            <Receipt sx={{fontSize: 64, color: 'text.disabled', mb: 2}}/>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                No Invoices Found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                No invoices were found for the selected referrer and date.
                                                <br/>
                                                Try selecting a different referrer or date range.
                                            </Typography>
                                        </Box>
                                    )}

                                    {!loading && (!data.referrer || !data.issue_date) && (
                                        <Box sx={{textAlign: 'center', py: 6}}>
                                            <Info sx={{fontSize: 64, color: 'text.disabled', mb: 2}}/>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Ready to Get Started
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Please select a referrer and issue date to load available invoices.
                                            </Typography>
                                        </Box>
                                    )}

                                    {!loading && filteredAcceptances.length === 0 && acceptanceList.length > 0 && (
                                        <Box sx={{textAlign: 'center', py: 4}}>
                                            <Search sx={{fontSize: 48, color: 'text.disabled', mb: 1}}/>
                                            <Typography variant="body1" color="text.secondary">
                                                No invoices match your current search and filter criteria.
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setFilterStatus("all");
                                                }}
                                                sx={{mt: 1}}
                                            >
                                                Clear Filters
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2, backgroundColor: 'grey.50'}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                    <Typography variant="body2" color="text.secondary">
                        {selectedCount > 0 && `${selectedCount} invoice${selectedCount !== 1 ? 's' : ''} selected`}
                    </Typography>

                    <Box sx={{display: 'flex', gap: 2}}>
                        <Button
                            onClick={handleClose}
                            disabled={processing}
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={processing || Object.keys(validationErrors).length > 0}
                            sx={{minWidth: 120}}
                        >
                            {processing ? (
                                <>
                                    <LinearProgress size={16} sx={{mr: 1}}/>
                                    {editMode ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                editMode ? 'Update Statement' : 'Create Statement'
                            )}
                        </Button>
                    </Box>
                </Box>
            </DialogActions>

            {/* Success Snackbar */}
            <Snackbar
                open={Boolean(success)}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert severity="success" variant="filled">
                    {success}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default AddForm;
