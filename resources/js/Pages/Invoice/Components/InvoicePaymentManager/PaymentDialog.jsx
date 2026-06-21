import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Alert,
    Divider,
    useTheme,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    OutlinedInput,
    FormHelperText,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    AttachMoney,
    AccountBalance,
    Save,
    Person,
    Business,
    Receipt,
    ErrorOutlined as ErrorOutline,
} from '@mui/icons-material';
import { PAYMENT_METHODS } from './constants.jsx';

/**
 * Add/Edit Payment Dialog Component
 */
const PaymentDialog = ({ open, onClose, payment, maxAmount, payers, onSave, onDelete }) => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        price: payment?.price || 0,
        paymentMethod: payment?.paymentMethod || '',
        information: payment?.information || {},
        payer_type: payment?.payer_type,
        payer_id: payment?.payer_id,
        payer: payment
            ? {
                  type: payment.payer_type,
                  id: payment.payer_id,
                  name: payment?.payer?.fullName,
                  fullName: payment?.payer?.fullName,
              }
            : payers[0] || null,
    });
    useEffect(() => {
        setFormData({
            price: payment?.price || 0,
            paymentMethod: payment?.paymentMethod || '',
            information: payment?.information || {},
            payer_type: payment?.payer_type,
            payer_id: payment?.payer_id,
            payer: payment
                ? {
                      type: payment?.payer_type,
                      id: payment.payer_id,
                      name: payment.payer.fullName,
                      fullName: payment.payer.fullName,
                  }
                : payers[0] || null,
        });
    }, [payment, payers]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEditing = !!payment?.id;

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when field is updated
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleInformationChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            information: {
                ...prev.information,
                [field]: value,
            },
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Amount must be greater than 0';
        } else if (formData.price > maxAmount) {
            newErrors.price = `Amount exceeds maximum allowed (${maxAmount.toFixed(2)} OMR)`;
        }

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = 'Please select a payment method';
        }

        if (!formData.payer?.id) {
            newErrors.payer = 'Please select a payer';
        }

        if (formData.paymentMethod === 'card' && !formData.information.receiptReferenceCode) {
            newErrors.receiptReferenceCode = 'Receipt reference code is required for card payments';
        }

        if (formData.paymentMethod === 'transfer' && !formData.information.transferReference) {
            newErrors.transferReference = 'Transfer reference is required for bank transfers';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSave({
                ...formData,
                id: payment?.id,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!payment?.id) return;

        setLoading(true);
        try {
            await onDelete(payment.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: { borderRadius: 2 },
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography
                    variant="h6"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    component="span"
                >
                    {isEditing ? <EditIcon /> : <AddIcon />}
                    {isEditing ? 'Edit Payment' : 'Add Payment'}
                </Typography>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Maximum payment amount: <strong>{maxAmount.toFixed(2)} OMR</strong>
                </Alert>

                <Grid container spacing={3}>
                    {/* Payer Selection */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth error={!!errors.payer}>
                            <InputLabel>Payer</InputLabel>
                            <Select
                                value={
                                    formData.payer
                                        ? `${formData.payer.type}-${formData.payer.id}`
                                        : ''
                                }
                                label="Payer"
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    const payer = payers.find(
                                        (p) => `${p.type}-${p.id}` === selectedValue,
                                    );
                                    handleChange('payer', payer);
                                    handleChange('payer_id', payer.id);
                                    handleChange('payer_type', payer.type);
                                }}
                            >
                                {payers.map((payer) => (
                                    <MenuItem
                                        key={`${payer.type}-${payer.id}`}
                                        value={`${payer.type}-${payer.id}`}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {payer.type === 'patient' ? <Person /> : <Business />}
                                            {payer.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.payer && <FormHelperText>{errors.payer}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    {/* Payment Amount */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth error={!!errors.price}>
                            <InputLabel>Payment Amount</InputLabel>
                            <OutlinedInput
                                type="number"
                                label="Payment Amount"
                                value={formData.price}
                                onChange={(e) =>
                                    handleChange('price', parseFloat(e.target.value) || 0)
                                }
                                startAdornment={
                                    <InputAdornment position="start">
                                        <AttachMoney color="success" />
                                    </InputAdornment>
                                }
                                endAdornment={<InputAdornment position="end">OMR</InputAdornment>}
                                slotProps={{ htmlInput: { min: 0, max: maxAmount, step: 0.01 } }}
                            />
                            {errors.price && <FormHelperText>{errors.price}</FormHelperText>}
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Payment Method Selection */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                        Payment Method
                        {errors.paymentMethod && (
                            <Chip
                                icon={<ErrorOutline fontSize="small" />}
                                label="Required"
                                color="error"
                                size="small"
                                variant="outlined"
                                sx={{ ml: 2 }}
                            />
                        )}
                    </Typography>

                    <RadioGroup
                        value={formData.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    >
                        <Grid container spacing={2}>
                            {PAYMENT_METHODS.map((method) => {
                                const disabled =
                                    method.value === 'credit' &&
                                    formData.payer?.type !== 'referrer';

                                return (
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={method.value}>
                                        <Paper
                                            variant={
                                                formData.paymentMethod === method.value
                                                    ? 'elevation'
                                                    : 'outlined'
                                            }
                                            elevation={
                                                formData.paymentMethod === method.value ? 4 : 0
                                            }
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                borderColor:
                                                    formData.paymentMethod === method.value
                                                        ? `${method.color}.main`
                                                        : 'divider',
                                                bgcolor:
                                                    formData.paymentMethod === method.value
                                                        ? alpha(
                                                              theme.palette[method.color].main,
                                                              0.1,
                                                          )
                                                        : 'transparent',
                                                opacity: disabled ? 0.6 : 1,
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() =>
                                                !disabled &&
                                                handleChange('paymentMethod', method.value)
                                            }
                                        >
                                            <FormControlLabel
                                                value={method.value}
                                                control={
                                                    <Radio
                                                        color={method.color}
                                                        disabled={disabled}
                                                        checked={
                                                            formData.paymentMethod === method.value
                                                        }
                                                    />
                                                }
                                                label=""
                                                sx={{ m: 0, width: '100%' }}
                                            />

                                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                                <Box
                                                    sx={{
                                                        display: 'inline-flex',
                                                        p: 1.5,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha(
                                                            theme.palette[method.color].main,
                                                            0.15,
                                                        ),
                                                        color: `${method.color}.main`,
                                                        mb: 1,
                                                    }}
                                                >
                                                    {React.cloneElement(method.icon, {
                                                        fontSize: 'large',
                                                    })}
                                                </Box>
                                                <Typography variant="subtitle2" fontWeight="medium">
                                                    {method.label}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {method.description}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </RadioGroup>
                </Box>

                {/* Method-specific fields */}
                {formData.paymentMethod && (
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 2,
                        }}
                    >
                        {formData.paymentMethod === 'card' && (
                            <TextField
                                fullWidth
                                label="Receipt Reference Code"
                                value={formData.information.receiptReferenceCode || ''}
                                onChange={(e) =>
                                    handleInformationChange('receiptReferenceCode', e.target.value)
                                }
                                error={!!errors.receiptReferenceCode}
                                helperText={
                                    errors.receiptReferenceCode ||
                                    'Enter the reference code from the card machine receipt'
                                }
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Receipt color="primary" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        {formData.paymentMethod === 'transfer' && (
                            <TextField
                                fullWidth
                                label="Transfer Reference"
                                value={formData.information.transferReference || ''}
                                onChange={(e) =>
                                    handleInformationChange('transferReference', e.target.value)
                                }
                                error={!!errors.transferReference}
                                helperText={
                                    errors.transferReference ||
                                    'Enter the transaction ID from the bank transfer'
                                }
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalance color="info" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ mb: 2 }}
                            />
                        )}

                        <TextField
                            fullWidth
                            label="Payment Notes (Optional)"
                            value={formData.information.notes || ''}
                            onChange={(e) => handleInformationChange('notes', e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Add any additional notes about this payment"
                        />
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Box>
                    {isEditing && (
                        <Button
                            onClick={handleDelete}
                            disabled={loading}
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                        >
                            Delete
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} disabled={loading} color="inherit" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                        {loading ? 'Processing...' : isEditing ? 'Update Payment' : 'Add Payment'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDialog;
