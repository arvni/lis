import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import { Business, Close, Person, ReceiptLong, Save } from '@mui/icons-material';
import { router } from '@inertiajs/react';
import InvoiceItemsField from '@/Pages/Invoice/Components/InvoiceItemsField.jsx';
import InvoicePaymentManager from '@/Pages/Invoice/Components/InvoicePaymentManager.jsx';
import { STATUS_OPTIONS, num, statusMeta } from './InvoiceEditForm/constants';
import SubjectEditor from './InvoiceEditForm/SubjectEditor';
import PartyCard from './InvoiceEditForm/PartyCard';
import QuickControls from './InvoiceEditForm/QuickControls';
import TotalsSummary from './InvoiceEditForm/TotalsSummary';

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
                    <QuickControls
                        formData={formData}
                        errors={errors}
                        ownerAvailable={ownerAvailable}
                        onOwnerChange={handleOwnerChange}
                        onStatusChange={(value) => handleChange('status', value)}
                    />

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
                    <TotalsSummary totals={totals} paidSum={paidSum} balance={balance} />

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
