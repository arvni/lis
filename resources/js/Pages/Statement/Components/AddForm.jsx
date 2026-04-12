import {useForm} from "@inertiajs/react";
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    Grid2 as Grid, Table, TableBody, TableHead, TableRow, TableCell,
    Checkbox, Button, LinearProgress, TextField, Typography, Box,
    Chip, Alert, IconButton, Tooltip, TableContainer, Paper, Card,
    CardContent, Badge, Fade, Zoom, Snackbar, Divider,
} from "@mui/material";
import {
    CalendarToday, Person, SelectAll, Deselect as DeselectAll,
    Search, MonetizationOn, Receipt, Close, Info, Warning,
    CheckCircleOutline,
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch.jsx";
import {useState, useEffect, useCallback, useMemo} from "react";
import axios from "axios";

// Build initial selectedInvoiceDetails from defaultValue.invoices (edit mode)
function buildInitialDetails(invoices) {
    if (!invoices?.length) return {};
    return Object.fromEntries(
        invoices.map(inv => [inv.id, inv])
    );
}

const AddForm = ({open, defaultValue = {}, onClose, editMode = false, title}) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const {data, setData, reset, errors, clearErrors, post, processing, transform} = useForm({
        referrer: defaultValue.referrer || "",
        month:    defaultValue.month    || currentMonth,
        invoices: defaultValue.invoices?.map(i => ({id: i.id})) || [],
        _method:  editMode ? "put" : "post",
    });

    // Full invoice details keyed by id — persists across month changes
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(
        () => buildInitialDetails(defaultValue.invoices)
    );

    const [invoiceList,       setInvoiceList]       = useState([]);
    const [loading,           setLoading]           = useState(false);
    const [error,             setError]             = useState(null);
    const [success,           setSuccess]           = useState(null);
    const [searchTerm,        setSearchTerm]        = useState("");
    const [validationErrors,  setValidationErrors]  = useState({});
    const [filterStatus,      setFilterStatus]      = useState("all");

    // Re-initialise when dialog opens / defaultValue changes
    useEffect(() => {
        if (open) {
            setData({
                referrer: defaultValue.referrer || "",
                month:    defaultValue.month    || currentMonth,
                invoices: defaultValue.invoices?.map(i => ({id: i.id})) || [],
                _method:  editMode ? "put" : "post",
            });
            setSelectedInvoiceDetails(buildInitialDetails(defaultValue.invoices));
            setInvoiceList([]);
            setError(null);
            setSuccess(null);
            setSearchTerm("");
            setValidationErrors({});
        }
    }, [defaultValue, open]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = useCallback(() => {
        const errs = {};
        if (!data.referrer) errs.referrer = "Please select a referrer";
        setValidationErrors(errs);
        return Object.keys(errs).length === 0;
    }, [data.referrer]);

    // ── Fetch invoices for current month ──────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!data.referrer || !data.month) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(route("api.invoices.forStatement"), {
                params: {
                    referrer_id: data.referrer?.id ?? data.referrer,
                    month:       data.month,
                },
            });
            setInvoiceList(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch invoices. Please check your connection.");
            setInvoiceList([]);
        } finally {
            setLoading(false);
        }
    }, [data.referrer, data.month]);

    useEffect(() => {
        const t = setTimeout(fetchData, 500);
        return () => clearTimeout(t);
    }, [fetchData]);

    // ── Field changes ─────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const {name, value} = e.target;
        clearErrors(name);
        setValidationErrors(prev => {
            const n = {...prev}; delete n[name]; return n;
        });

        if (name === 'referrer') {
            // Referrer change → clear all selections
            setData(prev => ({...prev, referrer: value, invoices: []}));
            setSelectedInvoiceDetails({});
            setSuccess(null);
        } else {
            // Month change (or any other field) → keep selections
            setData(prev => ({...prev, [name]: value}));
        }
    };

    // ── Toggle a single invoice from the table ────────────────────────────────
    const handleInvoiceToggle = useCallback((invoice) => {
        setData(prev => {
            const exists = prev.invoices.some(i => i.id === invoice.id);
            return {
                ...prev,
                invoices: exists
                    ? prev.invoices.filter(i => i.id !== invoice.id)
                    : [...prev.invoices, {id: invoice.id}],
            };
        });
        setSelectedInvoiceDetails(prev => {
            if (prev[invoice.id]) {
                const n = {...prev}; delete n[invoice.id]; return n;
            }
            return {...prev, [invoice.id]: invoice};
        });
        setValidationErrors(prev => {
            const n = {...prev}; delete n.invoices; return n;
        });
    }, [setData]);

    // ── Remove a chip from the selected list ──────────────────────────────────
    const handleRemoveSelected = useCallback((id) => {
        setData(prev => ({...prev, invoices: prev.invoices.filter(i => i.id !== id)}));
        setSelectedInvoiceDetails(prev => {
            const n = {...prev}; delete n[id]; return n;
        });
    }, [setData]);

    // ── Select / deselect all visible ─────────────────────────────────────────
    const handleSelectAll = () => {
        setData(prev => {
            const existing = new Set(prev.invoices.map(i => i.id));
            const toAdd    = filteredInvoices.filter(inv => !existing.has(inv.id));
            return {...prev, invoices: [...prev.invoices, ...toAdd.map(inv => ({id: inv.id}))]};
        });
        setSelectedInvoiceDetails(prev => {
            const n = {...prev};
            filteredInvoices.forEach(inv => { n[inv.id] = inv; });
            return n;
        });
    };

    const handleDeselectAll = () => {
        const visibleIds = new Set(filteredInvoices.map(inv => inv.id));
        setData(prev => ({...prev, invoices: prev.invoices.filter(i => !visibleIds.has(i.id))}));
        setSelectedInvoiceDetails(prev => {
            const n = {...prev};
            visibleIds.forEach(id => delete n[id]);
            return n;
        });
    };

    // ── Close / submit ────────────────────────────────────────────────────────
    const handleClose = () => {
        reset();
        setSelectedInvoiceDetails({});
        setInvoiceList([]);
        setError(null);
        setSuccess(null);
        setSearchTerm("");
        setFilterStatus("all");
        setValidationErrors({});
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

        transform(d => {
            const {month, issue_date, ...rest} = d;
            return {...rest, _method: defaultValue.id ? "PUT" : "POST"};
        });

        post(url, {
            onSuccess: () => {
                setSuccess(editMode ? "Statement updated successfully!" : "Statement created successfully!");
                setTimeout(handleClose, 1500);
            },
            onError: () => setError("Failed to save statement. Please check the form and try again."),
        });
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const filteredInvoices = useMemo(() => invoiceList.filter(inv =>
        !searchTerm ||
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [invoiceList, searchTerm]);

    const selectedIds  = useMemo(() => new Set(data.invoices.map(i => i.id)), [data.invoices]);
    const selectedCount = data.invoices.length;

    const totalAmount = useMemo(() =>
        Object.values(selectedInvoiceDetails)
              .reduce((s, inv) => s + parseFloat(inv.payable_amount || 0), 0)
    , [selectedInvoiceDetails]);

    const allSelected  = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.has(inv.id));
    const someSelected = selectedCount > 0 && !allSelected;

    // Chips to display (all selected invoices, sorted by id desc)
    const selectedChips = useMemo(() =>
        Object.values(selectedInvoiceDetails).sort((a, b) => b.id - a.id)
    , [selectedInvoiceDetails]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth
            slotProps={{paper: {sx: {minHeight: '85vh', maxHeight: '95vh'}}}}>

            <DialogTitle sx={{pb: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {title || (editMode ? "Edit Statement" : "Create New Statement")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {editMode
                                ? "Update statement details and invoice selection"
                                : "Select referrer, month, and invoices to create a new statement"}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} disabled={processing}><Close/></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{p: 0}}>
                <Box sx={{p: 3}}>
                    <Grid container spacing={3}>

                        {/* ── Left panel ── */}
                        <Grid size={{md: 4, sm: 12, xs: 12}}>
                            <Card elevation={2} sx={{height: '100%'}}>
                                <CardContent sx={{display: 'flex', flexDirection: 'column', gap: 2.5}}>
                                    <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                        <Info sx={{mr: 1}} color="primary"/>
                                        Statement Details
                                    </Typography>

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
                                        InputProps={{startAdornment: <Person sx={{mr: 1, color: 'action.active'}}/>}}
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
                                                inputProps: {max: currentMonth},
                                            },
                                        }}
                                    />

                                    {/* ── Selected invoices chips ── */}
                                    {selectedChips.length > 0 && (
                                        <>
                                            <Divider/>
                                            <Box>
                                                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
                                                    <Typography variant="subtitle2" sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                                        <CheckCircleOutline fontSize="small" color="primary"/>
                                                        Selected
                                                        <Chip label={selectedCount} size="small" color="primary" sx={{ml: 0.5}}/>
                                                    </Typography>
                                                    <Chip
                                                        label={`OMR ${totalAmount.toFixed(2)}`}
                                                        size="small"
                                                        color="success"
                                                        icon={<MonetizationOn/>}
                                                    />
                                                </Box>

                                                <Box sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.75,
                                                    maxHeight: 220,
                                                    overflowY: 'auto',
                                                    p: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    bgcolor: 'action.hover',
                                                }}>
                                                    {selectedChips.map(inv => (
                                                        <Chip
                                                            key={inv.id}
                                                            label={inv.invoice_no || `#${inv.id}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            onDelete={() => handleRemoveSelected(inv.id)}
                                                            title={inv.patient_name || ''}
                                                            sx={{maxWidth: 140}}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* ── Right panel (invoice table) ── */}
                        <Grid size={{md: 8, sm: 12, xs: 12}}>
                            <Card elevation={2} sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                                <CardContent sx={{flex: 1, display: 'flex', flexDirection: 'column', p: 2}}>

                                    {/* Header */}
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                                        <Box>
                                            <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                                <Receipt sx={{mr: 1}} color="primary"/>
                                                Available Invoices
                                                {invoiceList.length > 0 && (
                                                    <Badge badgeContent={invoiceList.length} color="primary" sx={{ml: 1.5}}>
                                                        <Chip size="small" label="Total" variant="outlined"/>
                                                    </Badge>
                                                )}
                                            </Typography>
                                            {filteredInvoices.length !== invoiceList.length && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Showing {filteredInvoices.length} of {invoiceList.length}
                                                </Typography>
                                            )}
                                        </Box>

                                        {invoiceList.length > 0 && (
                                            <Box sx={{display: 'flex', gap: 1}}>
                                                <Tooltip title="Select All Visible">
                                                    <span>
                                                        <IconButton onClick={handleSelectAll} disabled={allSelected || processing} size="small" color="primary">
                                                            <SelectAll/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Deselect All Visible">
                                                    <span>
                                                        <IconButton onClick={handleDeselectAll} disabled={selectedCount === 0 || processing} size="small" color="secondary">
                                                            <DeselectAll/>
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Search */}
                                    {invoiceList.length > 0 && (
                                        <TextField
                                            placeholder="Search by invoice number or patient name…"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            size="small"
                                            fullWidth
                                            sx={{mb: 2}}
                                            InputProps={{startAdornment: <Search sx={{mr: 1, color: 'action.active'}}/>}}
                                        />
                                    )}

                                    {/* Alerts */}
                                    {error && (
                                        <Zoom in><Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)} icon={<Warning/>}>{error}</Alert></Zoom>
                                    )}
                                    {success && (
                                        <Zoom in><Alert severity="info" sx={{mb: 2}} onClose={() => setSuccess(null)}>{success}</Alert></Zoom>
                                    )}
                                    {validationErrors.invoices && (
                                        <Alert severity="warning" sx={{mb: 2}}>{validationErrors.invoices}</Alert>
                                    )}

                                    {/* Loading */}
                                    {loading && (
                                        <Box sx={{mb: 2}}>
                                            <LinearProgress/>
                                            <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', mt: 1}}>
                                                Loading invoices…
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Table */}
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
                                                    {filteredInvoices.map(inv => {
                                                        const isSelected = selectedIds.has(inv.id);
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
                                                                    <Typography variant="body2" noWrap>{inv.patient_name || '—'}</Typography>
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

                                    {/* Empty states */}
                                    {!loading && invoiceList.length === 0 && data.referrer && data.month && (
                                        <Box sx={{textAlign: 'center', py: 6}}>
                                            <Receipt sx={{fontSize: 64, color: 'text.disabled', mb: 2}}/>
                                            <Typography variant="h6" color="text.secondary">No Invoices Found</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                No unassigned invoices for this referrer in the selected month.
                                            </Typography>
                                        </Box>
                                    )}
                                    {!loading && (!data.referrer || !data.month) && (
                                        <Box sx={{textAlign: 'center', py: 6}}>
                                            <Info sx={{fontSize: 64, color: 'text.disabled', mb: 2}}/>
                                            <Typography variant="h6" color="text.secondary">Ready to Get Started</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Select a referrer and month to load available invoices.
                                            </Typography>
                                        </Box>
                                    )}
                                    {!loading && filteredInvoices.length === 0 && invoiceList.length > 0 && (
                                        <Box sx={{textAlign: 'center', py: 4}}>
                                            <Search sx={{fontSize: 48, color: 'text.disabled', mb: 1}}/>
                                            <Typography variant="body1" color="text.secondary">
                                                No invoices match your search.
                                            </Typography>
                                            <Button size="small" onClick={() => setSearchTerm("")} sx={{mt: 1}}>
                                                Clear Search
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2, bgcolor: 'grey.50'}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                    <Typography variant="body2" color="text.secondary">
                        {selectedCount > 0 && `${selectedCount} invoice${selectedCount !== 1 ? 's' : ''} selected — OMR ${totalAmount.toFixed(2)}`}
                    </Typography>
                    <Box sx={{display: 'flex', gap: 2}}>
                        <Button onClick={handleClose} disabled={processing} variant="outlined">Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={processing || Object.keys(validationErrors).length > 0}
                            sx={{minWidth: 120}}
                        >
                            {processing
                                ? <>{<LinearProgress size={16} sx={{mr: 1}}/>}{editMode ? 'Updating…' : 'Creating…'}</>
                                : editMode ? 'Update Statement' : 'Create Statement'}
                        </Button>
                    </Box>
                </Box>
            </DialogActions>

            <Snackbar
                open={Boolean(success)}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert severity="success" variant="filled">{success}</Alert>
            </Snackbar>
        </Dialog>
    );
};

export default AddForm;
