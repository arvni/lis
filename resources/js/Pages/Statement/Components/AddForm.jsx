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
    SelectAll,
    Deselect as DeselectAll,
    Search,
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
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const {data, setData, reset, errors, clearErrors, post, processing, transform} = useForm({
        referrer: defaultValue.referrer || "",
        month: defaultValue.month || currentMonth,
        invoices: defaultValue.invoices || [],
        _method: editMode ? "put" : "post"
    });

    // Enhanced state management
    const [invoiceList, setInvoiceList] = useState(defaultValue?.invoices?.map(inv => ({
        id: inv.id, invoice_no: inv.invoice_no, created_at: inv.created_at,
        patient_name: inv.patient_name, payable_amount: inv.payable_amount,
    })) || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSummary, setShowSummary] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});
    const [filterStatus, setFilterStatus] = useState("all");

    // Initialize form data when defaultValue changes
    useEffect(() => {
        if (open) {
            setData({
                referrer: defaultValue.referrer || "",
                month: defaultValue.month || new Date().toISOString().slice(0, 7),
                invoices: defaultValue.invoices || [],
                _method: editMode ? "put" : "post"
            });
            setInvoiceList([]);
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

if (data.invoices.length === 0 && invoiceList.length > 0) {
            newErrors.invoices = "Please select at least one invoice";
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [data, invoiceList]);

    // Debounced fetch function with better error handling
    const fetchData = useCallback(async () => {
        if (!data.referrer || !data.month) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(route("api.invoices.forStatement"), {
                params: {
                    referrer_id: data.referrer?.id ?? data.referrer,
                    month: data.month,
                }
            });

            const invoices = response.data.data || [];
            setInvoiceList(invoices);

            if (invoices.length === 0) {
                setSuccess("No uninvoiced statements found for this referrer up to the selected date.");
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError("Failed to fetch invoices. Please check your connection and try again.");
            setInvoiceList([]);
        } finally {
            setLoading(false);
        }
    }, [data.referrer, data.month]);

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

        // Reset invoices when referrer or month changes
        if (name === 'referrer' || name === 'month') {
            setData(prevData => ({...prevData, invoices: []}));
            setSuccess(null);
        }
    };

    // Enhanced invoice toggle with validation
    const handleInvoiceToggle = useCallback((invoice) => {
        setData(prevData => {
            const existingIndex = prevData.invoices.findIndex(item => item.id === invoice.id);
            const newInvoices = existingIndex >= 0
                ? prevData.invoices.filter(item => item.id !== invoice.id)
                : [...prevData.invoices, {id: invoice.id}];

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
        const allIds = filteredInvoices.map(inv => ({id: inv.id}));
        setData(prevData => ({...prevData, invoices: allIds}));
    };

    const handleDeselectAll = () => {
        setData(prevData => ({...prevData, invoices: []}));
    };

    const handleClose = () => {
        reset();
        setInvoiceList([]);
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

        // `month` is only a UI filter — strip it before sending; issue_date is set server-side
        transform(d => {
            const {month, issue_date, ...rest} = d;
            return {...rest, _method: defaultValue.id ? "PUT" : "POST"};
        });

        post(url, {
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

    // Filtering and search
    const filteredInvoices = useMemo(() => {
        return invoiceList.filter(inv => {
            return searchTerm === "" ||
                inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [invoiceList, searchTerm]);

    // Computed values
    const selectedCount = data.invoices.length;
    const totalAmount = useMemo(() => {
        return invoiceList
            .filter(inv => data.invoices.some(i => i.id === inv.id))
            .reduce((sum, inv) => sum + parseFloat(inv.payable_amount || 0), 0);
    }, [invoiceList, data.invoices]);

    const allSelected = filteredInvoices.length > 0 &&
        filteredInvoices.every(inv => data.invoices.some(i => i.id === inv.id));
    const someSelected = selectedCount > 0 && !allSelected;

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
                                            label="Month"
                                            type="month"
                                            name="month"
                                            value={data.month}
                                            onChange={handleChange}
                                            error={Boolean(errors?.month)}
                                            helperText={errors?.month || "Filter invoices by month"}
                                            disabled={processing}
                                            required
                                            slotProps={{
                                                inputLabel: {shrink: true},
                                                input: {
                                                    startAdornment: <CalendarToday sx={{mr: 1, color: 'action.active'}}/>,
                                                    inputProps: {max: new Date().toISOString().slice(0, 7)}
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
                                                    {invoiceList.length > 0 && (
                                                        <Badge badgeContent={invoiceList.length} color="primary"
                                                               sx={{ml: 1}}>
                                                            <Chip size="small" label="Total" variant="outlined"/>
                                                        </Badge>
                                                    )}
                                                </Typography>
                                                {filteredInvoices.length !== invoiceList.length && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Showing {filteredInvoices.length} of {invoiceList.length} invoices
                                                    </Typography>
                                                )}
                                            </Box>

                                            {invoiceList.length > 0 && (
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

                                        {/* Search */}
                                        {invoiceList.length > 0 && (
                                            <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                                                <TextField
                                                    placeholder="Search by invoice number or patient name..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                    InputProps={{
                                                        startAdornment: <Search sx={{mr: 1, color: 'action.active'}}/>
                                                    }}
                                                />
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

                                    {/* Invoice Table */}
                                    {!loading && filteredInvoices.length > 0 && (
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
                                                        <TableCell align="right"><strong>Amount (OMR)</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredInvoices.map((inv) => {
                                                        const isSelected = data.invoices.some(i => i.id === inv.id);
                                                        return (
                                                            <TableRow
                                                                key={inv.id}
                                                                hover
                                                                selected={isSelected}
                                                                sx={{cursor: 'pointer'}}
                                                                onClick={() => handleInvoiceToggle(inv)}
                                                            >
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox checked={isSelected} disabled={processing} color="primary"/>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {inv.invoice_no || '—'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {new Date(inv.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" noWrap>
                                                                        {inv.patient_name || '—'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {parseFloat(inv.payable_amount || 0).toFixed(2)}
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
                                    {!loading && invoiceList.length === 0 && data.referrer && data.month && (
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

                                    {!loading && (!data.referrer || !data.month) && (
                                        <Box sx={{textAlign: 'center', py: 6}}>
                                            <Info sx={{fontSize: 64, color: 'text.disabled', mb: 2}}/>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Ready to Get Started
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Please select a referrer and month to load available invoices.
                                            </Typography>
                                        </Box>
                                    )}

                                    {!loading && filteredInvoices.length === 0 && invoiceList.length > 0 && (
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
