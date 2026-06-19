import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    AccountBalance,
    AddCircle as AddCircleOutline,
    Business,
    CheckCircle,
    Close,
    CreditScore,
    Delete as DeleteOutline,
    PaymentRounded,
    Person,
    ReceiptLong,
    Save,
} from '@mui/icons-material';
import { router } from '@inertiajs/react';
import InvoiceItemsField from '@/Pages/Invoice/Components/InvoiceItemsField.jsx';
import InvoicePaymentManager from '@/Pages/Invoice/Components/InvoicePaymentManager.jsx';

// Backend enum values — must match App\Domains\Billing\Enums\InvoiceStatus.
const STATUS_OPTIONS = [
    {
        value: 'Waiting',
        label: 'Waiting for Payment',
        color: 'info',
        icon: <AccountBalance fontSize="small" />,
    },
    { value: 'Paid', label: 'Paid', color: 'success', icon: <CheckCircle fontSize="small" /> },
    {
        value: 'Partially Paid',
        label: 'Partially Paid',
        color: 'warning',
        icon: <PaymentRounded fontSize="small" />,
    },
    {
        value: 'Credit Paid',
        label: 'Credit Paid',
        color: 'warning',
        icon: <CreditScore fontSize="small" />,
    },
    { value: 'Canceled', label: 'Canceled', color: 'error', icon: <Close fontSize="small" /> },
];

const statusMeta = (status) => STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

const formatMoney = (v) => num(v).toFixed(3);

const SubjectEditor = ({ subject, onChange }) => {
    const enabled = Boolean(subject);

    const handleToggle = (e) => {
        if (e.target.checked) {
            onChange({ title: '', lines: [{ label: '', value: '' }] });
        } else {
            onChange(null);
        }
    };

    const updateField = (patch) => onChange({ ...subject, ...patch });

    const updateLine = (idx, patch) => {
        const lines = [...(subject?.lines || [])];
        lines[idx] = { ...lines[idx], ...patch };
        updateField({ lines });
    };

    const addLine = () =>
        updateField({ lines: [...(subject?.lines || []), { label: '', value: '' }] });

    const removeLine = (idx) => {
        const lines = [...(subject?.lines || [])];
        lines.splice(idx, 1);
        updateField({ lines });
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: enabled ? 2 : 0 }}
            >
                <Box>
                    <Typography variant="subtitle2">Subject / For</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Defaults to patient info on the printed invoice. Override here to show a
                        project or custom block.
                    </Typography>
                </Box>
                <FormControlLabel
                    control={<Switch checked={enabled} onChange={handleToggle} />}
                    label={enabled ? 'Custom' : 'Patient info'}
                />
            </Stack>

            {enabled && (
                <Stack spacing={1.5}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Title"
                        placeholder="e.g. Project Name"
                        value={subject?.title || ''}
                        onChange={(e) => updateField({ title: e.target.value })}
                    />
                    <Box>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Fields
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddCircleOutline fontSize="small" />}
                                onClick={addLine}
                            >
                                Add field
                            </Button>
                        </Stack>
                        <Stack spacing={1}>
                            {(subject?.lines || []).map((line, idx) => (
                                <Grid key={idx} container spacing={1} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Label (e.g. Reference)"
                                            value={line.label || ''}
                                            onChange={(e) =>
                                                updateLine(idx, { label: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 11, sm: 7 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Value"
                                            value={line.value || ''}
                                            onChange={(e) =>
                                                updateLine(idx, { value: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 1, sm: 1 }}>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeLine(idx)}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            )}
        </Paper>
    );
};

const SummaryRow = ({ label, value, valueColor = 'text.primary', strong }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            py: 0.5,
        }}
    >
        <Typography
            variant={strong ? 'subtitle2' : 'body2'}
            color={strong ? 'text.primary' : 'text.secondary'}
        >
            {label}
        </Typography>
        <Typography
            variant={strong ? 'subtitle2' : 'body2'}
            color={valueColor}
            sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
            {value}
        </Typography>
    </Box>
);

const PartyCard = ({
    title,
    icon,
    color = 'primary',
    name,
    lines = [],
    selected,
    onSelect,
    selectable,
}) => {
    const theme = useTheme();
    const borderColor = selected ? `${color}.main` : 'divider';
    const bg = selected ? alpha(theme.palette[color].main, 0.06) : 'background.paper';

    return (
        <Paper
            variant="outlined"
            onClick={selectable ? onSelect : undefined}
            sx={{
                p: 2,
                borderRadius: 2,
                borderColor,
                backgroundColor: bg,
                cursor: selectable ? 'pointer' : 'default',
                position: 'relative',
                transition: 'all 0.15s',
                height: '100%',
                '&:hover': selectable ? { borderColor: `${color}.main` } : {},
            }}
        >
            {selected && selectable && (
                <Chip
                    icon={<CheckCircle fontSize="small" />}
                    label="Owner"
                    color={color}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>{icon}</Avatar>
                <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                        {name || '—'}
                    </Typography>
                </Box>
            </Stack>
            <Stack spacing={0.5}>
                {lines
                    .filter((l) => l && l.value)
                    .map((l) => (
                        <Box
                            key={l.label}
                            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {l.label}
                            </Typography>
                            <Typography
                                variant="caption"
                                fontWeight="medium"
                                sx={{ textAlign: 'right' }}
                            >
                                {l.value}
                            </Typography>
                        </Box>
                    ))}
            </Stack>
        </Paper>
    );
};

const InvoiceEditForm = ({ invoice, open, onClose, onSubmit, onChange }) => {
    const theme = useTheme();
    const [formData, setFormData] = useState(invoice || {});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (invoice) {
            setFormData(invoice);
            setErrors({});
        }
    }, [invoice]);

    const status = formData.status || STATUS_OPTIONS[0].value;
    const meta = statusMeta(status);

    const items = useMemo(
        () => (Array.isArray(formData.invoice_items) ? formData.invoice_items : []),
        [formData.invoice_items],
    );
    const activeItems = useMemo(() => items.filter((it) => !it._destroy), [items]);

    const totals = useMemo(() => {
        return activeItems.reduce(
            (acc, item) => {
                const price = num(item.price);
                const discount = num(item.discount);
                acc.subtotal += price;
                acc.discount += discount;
                acc.net += price - discount;
                return acc;
            },
            { subtotal: 0, discount: 0, net: 0 },
        );
    }, [activeItems]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (onChange) onChange(field, value);
        if (errors[field] && value) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!formData.status) newErrors.status = 'Status is required';
        if (!formData.owner_type) newErrors.owner_type = 'Owner is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (onSubmit) {
            onSubmit(formData);
        } else {
            router.put(route('invoices.update', invoice.id), formData, {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => setErrors(errs),
            });
        }
    };

    const handleOwnerChange = (_, value) => {
        if (!value) return;
        const ownerId = formData[value]?.id;
        handleChange('owner_type', value);
        handleChange('owner_id', ownerId);
    };

    const handlePaymentChange = (paymentData) => {
        if (paymentData._method === 'delete') {
            handleChange(
                'payments',
                (formData.payments || []).filter((p) => p.id !== paymentData.id),
            );
            return;
        }
        const payments = [...(formData.payments || [])];
        if (paymentData.id) {
            const i = payments.findIndex((p) => p.id === paymentData.id);
            if (i >= 0) payments[i] = paymentData;
            else payments.push(paymentData);
        } else {
            payments.push(paymentData);
        }
        handleChange('payments', payments);
    };

    const paidSum = useMemo(
        () => (formData.payments || []).reduce((a, p) => a + num(p.price), 0),
        [formData.payments],
    );
    const balance = totals.net - paidSum;

    const patient = formData.acceptance?.patient || formData.patient;
    const referrer = formData.referrer;
    const ownerAvailable = {
        patient: Boolean(formData.patient),
        referrer: Boolean(formData.referrer),
    };

    const payers = useMemo(() => {
        const list = [];
        if (formData.patient) {
            list.push({
                type: 'patient',
                id: formData.patient.id,
                name: formData.patient.fullName,
                fullName: formData.patient.fullName,
            });
        }
        if (formData.referrer) {
            list.push({
                type: 'referrer',
                id: formData.referrer.id,
                name: formData.referrer.fullName || formData.referrer.name,
                fullName: formData.referrer.fullName || formData.referrer.name,
            });
        }
        return list;
    }, [formData.patient, formData.referrer]);

    if (!formData) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden' } } }}
        >
            <DialogTitle
                sx={{
                    p: 2.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ReceiptLong />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
                            {formData.id
                                ? `Invoice #${formData.invoiceNo || formData.id}`
                                : 'New Invoice'}
                        </Typography>
                        {formData.acceptance?.id && (
                            <Typography variant="caption" color="text.secondary">
                                Acceptance #{formData.acceptance.id}
                                {formData.created_at &&
                                    ` • ${new Date(formData.created_at).toLocaleDateString()}`}
                            </Typography>
                        )}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        icon={meta.icon}
                        label={meta.label}
                        color={meta.color}
                        size="small"
                        variant="filled"
                    />
                    <IconButton onClick={onClose} aria-label="Close">
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <Divider />

            <DialogContent
                dividers
                sx={{ p: 0, backgroundColor: alpha(theme.palette.background.default, 0.3) }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Parties */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <PartyCard
                                title="Bill To"
                                icon={
                                    formData.owner_type === 'referrer' ? <Business /> : <Person />
                                }
                                color={formData.owner_type === 'referrer' ? 'secondary' : 'primary'}
                                name={
                                    formData.owner_type === 'referrer'
                                        ? referrer?.fullName || referrer?.name
                                        : patient?.fullName
                                }
                                lines={[
                                    {
                                        label: 'Type',
                                        value:
                                            formData.owner_type === 'referrer'
                                                ? 'Referrer'
                                                : 'Patient',
                                    },
                                    {
                                        label: 'ID',
                                        value:
                                            formData.owner_type === 'referrer'
                                                ? referrer?.id
                                                : patient?.idNo,
                                    },
                                    { label: 'Phone', value: patient?.phone },
                                ]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <PartyCard
                                title="Patient"
                                icon={<Person />}
                                color="primary"
                                name={patient?.fullName}
                                lines={[
                                    { label: 'ID', value: patient?.idNo },
                                    { label: 'Phone', value: patient?.phone },
                                    { label: 'Nationality', value: patient?.nationality },
                                ]}
                            />
                        </Grid>
                    </Grid>

                    {/* Quick controls — owner switch + status */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: 'block' }}
                                >
                                    Bill to
                                </Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    size="small"
                                    value={formData.owner_type || ''}
                                    onChange={handleOwnerChange}
                                    color="primary"
                                >
                                    <ToggleButton
                                        value="patient"
                                        disabled={!ownerAvailable.patient}
                                    >
                                        <Person fontSize="small" sx={{ mr: 1 }} />
                                        Patient
                                    </ToggleButton>
                                    <ToggleButton
                                        value="referrer"
                                        disabled={!ownerAvailable.referrer}
                                    >
                                        <Business fontSize="small" sx={{ mr: 1 }} />
                                        Referrer
                                    </ToggleButton>
                                </ToggleButtonGroup>
                                {errors.owner_type && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ mt: 0.5, display: 'block' }}
                                    >
                                        {errors.owner_type}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth error={!!errors.status} size="small">
                                    <InputLabel id="status-label">Status</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        label="Status"
                                        value={formData.status || ''}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    {opt.icon}
                                                    <span>{opt.label}</span>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.status && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {errors.status}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Subject / For */}
                    <SubjectEditor
                        subject={formData.subject}
                        onChange={(value) => handleChange('subject', value)}
                    />

                    {/* Items */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <InvoiceItemsField
                            items={items}
                            onChange={handleChange}
                            invoiceId={formData.id}
                        />
                    </Paper>

                    {/* Totals summary mirroring the print invoice footer */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Alert
                                severity={balance > 0 ? 'warning' : 'success'}
                                variant="outlined"
                                sx={{ borderRadius: 2, height: '100%' }}
                            >
                                <Typography variant="body2">
                                    {balance > 0
                                        ? `Outstanding balance: ${formatMoney(balance)} OMR`
                                        : 'Invoice fully paid.'}
                                </Typography>
                            </Alert>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <SummaryRow
                                    label="Subtotal"
                                    value={`${formatMoney(totals.subtotal)} OMR`}
                                />
                                <SummaryRow
                                    label="Discount"
                                    value={`−${formatMoney(totals.discount)} OMR`}
                                    valueColor="success.main"
                                />
                                <Divider sx={{ my: 1 }} />
                                <SummaryRow
                                    label="Net Amount"
                                    value={`${formatMoney(totals.net)} OMR`}
                                    valueColor="primary.main"
                                    strong
                                />
                                <SummaryRow label="Paid" value={`${formatMoney(paidSum)} OMR`} />
                                <SummaryRow
                                    label="Balance"
                                    value={`${formatMoney(balance)} OMR`}
                                    valueColor={balance > 0 ? 'warning.main' : 'success.main'}
                                    strong
                                />
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Payments */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <InvoicePaymentManager
                            invoice={formData}
                            acceptanceItems={items}
                            payers={payers}
                            onPaymentChange={handlePaymentChange}
                        />
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{ p: 2, backgroundColor: alpha(theme.palette.background.default, 0.5) }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    startIcon={<Close />}
                    sx={{ borderRadius: 2 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={<Save />}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    {formData.id ? 'Save Changes' : 'Create Invoice'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InvoiceEditForm;
