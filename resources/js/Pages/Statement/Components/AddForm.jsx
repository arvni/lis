import { useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
    Snackbar,
    Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { buildInitialDetails } from './AddForm/helpers';
import StatementDetailsPanel from './AddForm/StatementDetailsPanel';
import InvoiceSelectionPanel from './AddForm/InvoiceSelectionPanel';

const AddForm = ({ open, defaultValue = {}, onClose, editMode = false, title }) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data, setData, reset, errors, clearErrors, post, processing, transform } = useForm({
        referrer: defaultValue.referrer || '',
        month: defaultValue.month || currentMonth,
        invoices: defaultValue.invoices?.map((i) => ({ id: i.id })) || [],
        _method: editMode ? 'put' : 'post',
    });

    // Full invoice details keyed by id — persists across month changes
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(() =>
        buildInitialDetails(defaultValue.invoices),
    );

    const [invoiceList, setInvoiceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [, setFilterStatus] = useState('all');

    // Re-initialise when dialog opens / defaultValue changes
    useEffect(() => {
        if (open) {
            setData({
                referrer: defaultValue.referrer || '',
                month: defaultValue.month || currentMonth,
                invoices: defaultValue.invoices?.map((i) => ({ id: i.id })) || [],
                _method: editMode ? 'put' : 'post',
            });
            setSelectedInvoiceDetails(buildInitialDetails(defaultValue.invoices));
            setInvoiceList([]);
            setError(null);
            setSuccess(null);
            setSearchTerm('');
            setValidationErrors({});
        }
    }, [defaultValue, open, currentMonth, editMode, setData]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = useCallback(() => {
        const errs = {};
        if (!data.referrer) errs.referrer = 'Please select a referrer';
        setValidationErrors(errs);
        return Object.keys(errs).length === 0;
    }, [data.referrer]);

    // ── Fetch invoices for current month ──────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!data.referrer || !data.month) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(route('api.invoices.forStatement'), {
                params: {
                    referrer_id: data.referrer?.id ?? data.referrer,
                    month: data.month,
                },
            });
            setInvoiceList(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch invoices. Please check your connection.');
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
        const { name, value } = e.target;
        clearErrors(name);
        setValidationErrors((prev) => {
            const n = { ...prev };
            delete n[name];
            return n;
        });

        if (name === 'referrer') {
            // Referrer change → clear all selections
            setData((prev) => ({ ...prev, referrer: value, invoices: [] }));
            setSelectedInvoiceDetails({});
            setSuccess(null);
        } else {
            // Month change (or any other field) → keep selections
            setData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // ── Toggle a single invoice from the table ────────────────────────────────
    const handleInvoiceToggle = useCallback(
        (invoice) => {
            setData((prev) => {
                const exists = prev.invoices.some((i) => i.id === invoice.id);
                return {
                    ...prev,
                    invoices: exists
                        ? prev.invoices.filter((i) => i.id !== invoice.id)
                        : [...prev.invoices, { id: invoice.id }],
                };
            });
            setSelectedInvoiceDetails((prev) => {
                if (prev[invoice.id]) {
                    const n = { ...prev };
                    delete n[invoice.id];
                    return n;
                }
                return { ...prev, [invoice.id]: invoice };
            });
            setValidationErrors((prev) => {
                const n = { ...prev };
                delete n.invoices;
                return n;
            });
        },
        [setData],
    );

    // ── Remove a chip from the selected list ──────────────────────────────────
    const handleRemoveSelected = useCallback(
        (id) => {
            setData((prev) => ({ ...prev, invoices: prev.invoices.filter((i) => i.id !== id) }));
            setSelectedInvoiceDetails((prev) => {
                const n = { ...prev };
                delete n[id];
                return n;
            });
        },
        [setData],
    );

    // ── Derived values ────────────────────────────────────────────────────────
    const filteredInvoices = useMemo(
        () =>
            invoiceList.filter(
                (inv) =>
                    !searchTerm ||
                    inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        [invoiceList, searchTerm],
    );

    const selectedIds = useMemo(() => new Set(data.invoices.map((i) => i.id)), [data.invoices]);
    const selectedCount = data.invoices.length;

    const totalAmount = useMemo(
        () =>
            Object.values(selectedInvoiceDetails).reduce(
                (s, inv) => s + parseFloat(inv.payable_amount || 0),
                0,
            ),
        [selectedInvoiceDetails],
    );

    const allSelected =
        filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedIds.has(inv.id));
    const someSelected = selectedCount > 0 && !allSelected;

    // Chips to display (all selected invoices, sorted by id desc)
    const selectedChips = useMemo(
        () => Object.values(selectedInvoiceDetails).sort((a, b) => b.id - a.id),
        [selectedInvoiceDetails],
    );

    // ── Select / deselect all visible ─────────────────────────────────────────
    const handleSelectAll = () => {
        setData((prev) => {
            const existing = new Set(prev.invoices.map((i) => i.id));
            const toAdd = filteredInvoices.filter((inv) => !existing.has(inv.id));
            return {
                ...prev,
                invoices: [...prev.invoices, ...toAdd.map((inv) => ({ id: inv.id }))],
            };
        });
        setSelectedInvoiceDetails((prev) => {
            const n = { ...prev };
            filteredInvoices.forEach((inv) => {
                n[inv.id] = inv;
            });
            return n;
        });
    };

    const handleDeselectAll = () => {
        const visibleIds = new Set(filteredInvoices.map((inv) => inv.id));
        setData((prev) => ({
            ...prev,
            invoices: prev.invoices.filter((i) => !visibleIds.has(i.id)),
        }));
        setSelectedInvoiceDetails((prev) => {
            const n = { ...prev };
            visibleIds.forEach((id) => delete n[id]);
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
        setSearchTerm('');
        setFilterStatus('all');
        setValidationErrors({});
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setError('Please correct the errors below before submitting.');
            return;
        }
        const url = defaultValue.id
            ? route('statements.update', defaultValue.id)
            : route('statements.store');

        transform((d) => {
            const { month: _month, issue_date: _issue_date, ...rest } = d;
            return { ...rest, _method: defaultValue.id ? 'PUT' : 'POST' };
        });

        post(url, {
            onSuccess: () => {
                setSuccess(
                    editMode
                        ? 'Statement updated successfully!'
                        : 'Statement created successfully!',
                );
                setTimeout(handleClose, 1500);
            },
            onError: () =>
                setError('Failed to save statement. Please check the form and try again.'),
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            slotProps={{ paper: { sx: { minHeight: '85vh', maxHeight: '95vh' } } }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" component="span">
                            {title || (editMode ? 'Edit Statement' : 'Create New Statement')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {editMode
                                ? 'Update statement details and invoice selection'
                                : 'Select referrer, month, and invoices to create a new statement'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} disabled={processing}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* ── Left panel ── */}
                        <Grid size={{ md: 4, sm: 12, xs: 12 }}>
                            <StatementDetailsPanel
                                data={data}
                                errors={errors}
                                validationErrors={validationErrors}
                                editMode={editMode}
                                processing={processing}
                                currentMonth={currentMonth}
                                onChange={handleChange}
                                selectedChips={selectedChips}
                                selectedCount={selectedCount}
                                totalAmount={totalAmount}
                                onRemoveSelected={handleRemoveSelected}
                            />
                        </Grid>

                        {/* ── Right panel (invoice table) ── */}
                        <Grid size={{ md: 8, sm: 12, xs: 12 }}>
                            <InvoiceSelectionPanel
                                data={data}
                                invoiceList={invoiceList}
                                filteredInvoices={filteredInvoices}
                                loading={loading}
                                error={error}
                                success={success}
                                validationErrors={validationErrors}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                setError={setError}
                                setSuccess={setSuccess}
                                processing={processing}
                                selectedIds={selectedIds}
                                selectedCount={selectedCount}
                                allSelected={allSelected}
                                someSelected={someSelected}
                                onSelectAll={handleSelectAll}
                                onDeselectAll={handleDeselectAll}
                                onInvoiceToggle={handleInvoiceToggle}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {selectedCount > 0 &&
                            `${selectedCount} invoice${selectedCount !== 1 ? 's' : ''} selected — OMR ${totalAmount.toFixed(2)}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button onClick={handleClose} disabled={processing} variant="outlined">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={processing || Object.keys(validationErrors).length > 0}
                            sx={{ minWidth: 120 }}
                        >
                            {processing ? (
                                <>
                                    {<LinearProgress size={16} sx={{ mr: 1 }} />}
                                    {editMode ? 'Updating…' : 'Creating…'}
                                </>
                            ) : editMode ? (
                                'Update Statement'
                            ) : (
                                'Create Statement'
                            )}
                        </Button>
                    </Box>
                </Box>
            </DialogActions>

            <Snackbar
                open={Boolean(success)}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled">
                    {success}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default AddForm;
