import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import {
    CircularProgress,
    DialogActions,
    DialogContent,
    Button,
    Box,
    Typography,
    Divider,
    IconButton,
    Alert,
    Tooltip,
} from '@mui/material';
import { Close, Info, Save } from '@mui/icons-material';
import { useForm } from '@inertiajs/react';
import React, { useEffect, useState, useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { PAYMENT_METHOD_VALUES, buildPaymentMethods } from './AddPayment/constants';
import { validatePaymentForm } from './AddPayment/validation';
import PayerAmountSection from './AddPayment/PayerAmountSection';
import PaymentMethodSelector from './AddPayment/PaymentMethodSelector';
import MethodDetailsFields from './AddPayment/MethodDetailsFields';

/**
 * Enhanced AddPayment Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Function to close the dialog
 * @param {number} props.max - Maximum allowed payment amount
 * @param {Array} props.payers - List of available payers
 * @param {Object} props.initialData - Initial payment data
 * @param {Function} props.onSuccess - Callback function on successful submission
 */
const AddPayment = ({ open, onClose, max, payers = [], initialData = {}, onSuccess }) => {
    // Initialize form with default values if not provided
    const defaultValues = useMemo(
        () => ({
            price: initialData?.price || 0,
            paymentMethod: initialData?.paymentMethod || '',
            information: initialData?.information || {},
            payer: initialData?.payer || payers[0] || null,
            _method: initialData?._method || 'post',
            id: initialData?.id || null,
            invoice_id: initialData?.invoice?.id || initialData?.invoice_id || null,
        }),
        [initialData, payers],
    );

    const {
        data,
        setData,
        post,
        clearErrors,
        errors,
        processing: loading,
        reset,
    } = useForm(defaultValues);

    // Form validation errors separate from form data
    const [validationErrors, setValidationErrors] = useState({});
    const [formTouched, setFormTouched] = useState(false);

    // Reset form when dialog opens with new data
    useEffect(() => {
        if (open) {
            setData(defaultValues);
            setValidationErrors({});
            setFormTouched(false);
        }
    }, [open, initialData, setData, defaultValues]);

    // Auto-focus amount field when payment method changes
    const [shouldFocusAmount, setShouldFocusAmount] = useState(false);
    useEffect(() => {
        if (data.paymentMethod && !data.id) {
            setShouldFocusAmount(true);
        }
    }, [data.paymentMethod, data.id]);

    /**
     * Handle form submission
     */
    const handleSubmit = () => {
        setFormTouched(true);
        clearErrors();
        const newErrors = validatePaymentForm(data, max);
        setValidationErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            const url = data.id ? route('payments.update', data.id) : route('payments.store');

            post(url, {
                onSuccess: () => {
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                    reset();
                    onClose();
                },
            });
        }
    };

    /**
     * Handle price input change with smarter formatting
     */
    const handlePriceChange = (e) => {
        const rawValue = e.target.value;
        const value = parseFloat(rawValue);

        // Allow empty input (will be validated on submission)
        if (rawValue === '') {
            setData('price', '');
            return;
        }

        // Handle valid numbers with up to 2 decimal places
        if (!isNaN(value)) {
            setData('price', Math.min(value, max));

            // Clear error if value is now valid
            if (value > 0 && value <= max) {
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.price;
                    return newErrors;
                });
            }
        }
    };

    /**
     * Handle payment method change
     */
    const handlePaymentMethodChange = (e) => {
        const newMethod = e.target.value;

        setData((prevData) => ({
            ...prevData,
            paymentMethod: newMethod,
            // Only reset information if changing methods
            information: prevData.paymentMethod !== newMethod ? {} : prevData.information,
        }));

        // Clear error if a valid method is selected
        if (PAYMENT_METHOD_VALUES.includes(newMethod)) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.paymentMethod;
                return newErrors;
            });
        }
    };

    /**
     * Handle payer selection change with confirmation if changing
     */
    const handlePayerChange = (e) => {
        const selectedValue = e.target.value;
        const payer = payers.find((item) => `${item.type}-${item.id}` === selectedValue);

        if (payer) {
            // Only reset payment method if payer type changes
            const shouldResetPayment = data.payer?.type !== payer.type;

            setData((prevData) => ({
                ...prevData,
                payer,
                // Reset payment method only if payer type changes
                ...(shouldResetPayment
                    ? {
                          paymentMethod: '',
                          information: {},
                      }
                    : {}),
            }));

            // Clear payer error
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.payer;
                return newErrors;
            });
        }
    };

    /**
     * Handle additional information field changes
     */
    const handleInformationChange = (e) => {
        const { name, value } = e.target;

        setData((prevData) => ({
            ...prevData,
            information: {
                ...prevData.information,
                [name]: value,
            },
        }));

        // Clear error for this field if it exists
        if (validationErrors[`information.${name}`]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[`information.${name}`];
                return newErrors;
            });
        }
    };

    // Payment methods configuration with enhanced visual cues
    const paymentMethods = useMemo(
        () => buildPaymentMethods(data.payer?.type),
        [data.payer?.type],
    );

    // Combine backend errors with frontend validation errors
    const allErrors = { ...errors, ...validationErrors };

    // Determine if form has been modified
    const isFormModified =
        data.price !== defaultValues.price ||
        data.paymentMethod !== defaultValues.paymentMethod ||
        data.payer?.id !== defaultValues.payer?.id;

    // Check if form can be submitted
    const canSubmit = !loading && (isFormModified || formTouched);

    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit();
        } else if (e.key === 'Escape' && !loading) {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? onClose : undefined}
            fullWidth
            maxWidth="md"
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                },
            }}
            onKeyDown={handleKeyDown}
        >
            <DialogTitle
                sx={{
                    p: 2.5,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    {data.id ? (
                        <>
                            <EditIcon fontSize="small" />
                            Edit Payment
                        </>
                    ) : (
                        <>
                            <AddIcon fontSize="small" />
                            Add New Payment
                        </>
                    )}
                    {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                </Typography>
                {!loading && (
                    <Tooltip title="Cancel (Esc)">
                        <IconButton onClick={onClose} aria-label="close" size="small">
                            <Close />
                        </IconButton>
                    </Tooltip>
                )}
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 5,
                        }}
                    >
                        <CircularProgress size={50} thickness={4} />
                        <Typography sx={{ mt: 2 }}>
                            {data.id ? 'Updating payment...' : 'Processing payment...'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Alert
                            severity="info"
                            icon={<Info />}
                            sx={{
                                mb: 3,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Typography>
                                Maximum payment amount: <strong>{max.toFixed(2)} OMR</strong>
                                <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ ml: 1, color: 'text.secondary' }}
                                >
                                    (Ctrl+Enter to save quickly)
                                </Typography>
                            </Typography>
                        </Alert>

                        <PayerAmountSection
                            data={data}
                            allErrors={allErrors}
                            payers={payers}
                            max={max}
                            shouldFocusAmount={shouldFocusAmount}
                            onPayerChange={handlePayerChange}
                            onPriceChange={handlePriceChange}
                        />

                        <PaymentMethodSelector
                            data={data}
                            allErrors={allErrors}
                            paymentMethods={paymentMethods}
                            onMethodChange={handlePaymentMethodChange}
                        />

                        <MethodDetailsFields
                            data={data}
                            allErrors={allErrors}
                            onInformationChange={handleInformationChange}
                        />
                    </>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    startIcon={<Close />}
                    variant="outlined"
                    color="inherit"
                    size="large"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !canSubmit}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    variant="contained"
                    color="primary"
                    size="large"
                >
                    {loading ? 'Processing...' : data.id ? 'Update Payment' : 'Save Payment'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPayment;
