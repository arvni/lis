import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {
    CircularProgress,
    DialogActions,
    DialogContent,
    FormHelperText,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    TextField,
    Button,
    Box,
    Grid2 as Grid,
    FormControl,
    Typography,
    InputAdornment,
    Divider,
    Paper,
    Chip,
    useTheme,
    alpha,
    IconButton,
    Alert,
    RadioGroup,
    FormControlLabel,
    Radio,
    Tooltip,
    Zoom
} from "@mui/material";
import {
    AttachMoney,
    CreditCard,
    AccountBalance,
    Close,
    Person,
    Business,
    Save,
    Info,
    ErrorOutline,
    Receipt,
    SwapHoriz
} from "@mui/icons-material";
import {useForm} from "@inertiajs/react";
import React, {useEffect, useState, useMemo} from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

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
const AddPayment = ({
                        open,
                        onClose,
                        max,
                        payers = [],
                        initialData = {},
                        onSuccess
                    }) => {
    const theme = useTheme();

    // Initialize form with default values if not provided
    const defaultValues = useMemo(() => ({
        price: initialData?.price || 0,
        paymentMethod: initialData?.paymentMethod || "",
        information: initialData?.information || {},
        payer: initialData?.payer || (payers[0] || null),
        _method: initialData?._method || "post",
        id: initialData?.id || null,
        invoice_id: initialData?.invoice?.id || initialData?.invoice_id || null
    }), [initialData, payers]);

    const {
        data,
        setData,
        post,
        clearErrors,
        errors,
        processing: loading,
        reset
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
        if (validateForm()) {
            const url = data.id
                ? route("payments.update", data.id)
                : route("payments.store");

            post(url, {
                onSuccess: () => {
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                    reset();
                    onClose();
                }
            });
        }
    };

    /**
     * Validate form fields
     * @returns {boolean} - Whether the form is valid
     */
    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        // Validate price
        if (!(data.price > 0)) {
            newErrors.price = "Amount must be greater than 0";
            isValid = false;
        } else if (data.price > max) {
            newErrors.price = `Amount exceeds the maximum allowed (${max.toFixed(2)} OMR)`;
            isValid = false;
        }

        // Validate payment method
        if (!["cash", "card", "credit", "transfer"].includes(data.paymentMethod)) {
            newErrors.paymentMethod = "Please select a payment method";
            isValid = false;
        }

        // Validate payer
        if (!data.payer || !data.payer.id) {
            newErrors.payer = "Please select a payer";
            isValid = false;
        }

        // Card payment validation
        if (data.paymentMethod === "card" && (!data.information?.receiptReferenceCode)) {
            newErrors["information.receiptReferenceCode"] = "Receipt reference code is required for card payments";
            isValid = false;
        }

        // Transfer payment validation
        if (data.paymentMethod === "transfer" && (!data.information?.transferReference)) {
            newErrors["information.transferReference"] = "Transaction reference is required for bank transfers";
            isValid = false;
        }

        setValidationErrors(newErrors);
        return isValid;
    };

    /**
     * Handle price input change with smarter formatting
     */
    const handlePriceChange = (e) => {
        const rawValue = e.target.value;
        const value = parseFloat(rawValue);

        // Allow empty input (will be validated on submission)
        if (rawValue === "") {
            setData("price", "");
            return;
        }

        // Handle valid numbers with up to 2 decimal places
        if (!isNaN(value)) {
            setData("price", Math.min(value, max));

            // Clear error if value is now valid
            if (value > 0 && value <= max) {
                setValidationErrors(prev => {
                    const newErrors = {...prev};
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

        setData(prevData => ({
            ...prevData,
            paymentMethod: newMethod,
            // Only reset information if changing methods
            information: prevData.paymentMethod !== newMethod ? {} : prevData.information
        }));

        // Clear error if a valid method is selected
        if (["cash", "card", "credit", "transfer"].includes(newMethod)) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
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
        const payer = payers.find(item => `${item.type}-${item.id}` === selectedValue);

        if (payer) {
            // Only reset payment method if payer type changes
            const shouldResetPayment = data.payer?.type !== payer.type;

            setData(prevData => ({
                ...prevData,
                payer,
                // Reset payment method only if payer type changes
                ...(shouldResetPayment ? {
                    paymentMethod: "",
                    information: {}
                } : {})
            }));

            // Clear payer error
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.payer;
                return newErrors;
            });
        }
    };

    /**
     * Handle additional information field changes
     */
    const handleInformationChange = (e) => {
        const {name, value} = e.target;

        setData(prevData => ({
            ...prevData,
            information: {
                ...prevData.information,
                [name]: value
            }
        }));

        // Clear error for this field if it exists
        if (validationErrors[`information.${name}`]) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[`information.${name}`];
                return newErrors;
            });
        }
    };

    // Payment methods configuration with enhanced visual cues
    const paymentMethods = useMemo(() => [
        {
            value: "cash",
            label: "Cash",
            icon: <AttachMoney/>,
            color: "success",
            description: "Pay with physical currency",
            disabled: false
        },
        {
            value: "card",
            label: "Card",
            icon: <CreditCard/>,
            color: "primary",
            description: "Pay with credit/debit card",
            disabled: false
        },
        {
            value: "transfer",
            label: "Bank Transfer",
            icon: <SwapHoriz/>,
            color: "info",
            description: "Pay via bank transfer",
            disabled: false
        },
        {
            value: "credit",
            label: "Credit",
            icon: <AccountBalance/>,
            color: "warning",
            description: "Add to referrer's credit balance",
            disabled: data.payer?.type !== "referrer"
        }
    ], [data.payer?.type]);

    // Combine backend errors with frontend validation errors
    const allErrors = {...errors, ...validationErrors};

    // Determine if form has been modified
    const isFormModified = data.price !== defaultValues.price ||
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
                        overflow: 'hidden'
                    }
                }
            }}
            onKeyDown={handleKeyDown}
        >
            <DialogTitle
                sx={{
                    p: 2.5,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {data.id ? (
                        <>
                            <EditIcon fontSize="small"/>
                            Edit Payment
                        </>
                    ) : (
                        <>
                            <AddIcon fontSize="small"/>
                            Add New Payment
                        </>
                    )}
                    {loading && <CircularProgress size={20} sx={{ml: 1}}/>}
                </Typography>
                {!loading && (
                    <Tooltip title="Cancel (Esc)">
                        <IconButton
                            onClick={onClose}
                            aria-label="close"
                            size="small"
                        >
                            <Close/>
                        </IconButton>
                    </Tooltip>
                )}
            </DialogTitle>

            <Divider/>

            <DialogContent sx={{p: 3}}>
                {loading ? (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5}}>
                        <CircularProgress size={50} thickness={4}/>
                        <Typography sx={{mt: 2}}>
                            {data.id ? "Updating payment..." : "Processing payment..."}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Alert
                            severity="info"
                            icon={<Info/>}
                            sx={{
                                mb: 3,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Typography>
                                Maximum payment amount: <strong>{max.toFixed(2)} OMR</strong>
                                <Typography component="span" variant="body2" sx={{ml: 1, color: 'text.secondary'}}>
                                    (Ctrl+Enter to save quickly)
                                </Typography>
                            </Typography>
                        </Alert>

                        <Box component={Paper}
                             variant="outlined"
                             sx={{
                                 p: 3,
                                 mb: 4,
                                 borderRadius: 2,
                                 transition: 'all 0.2s',
                                 borderColor: Object.keys(allErrors).length > 0 ? 'error.light' : 'divider'
                             }}
                        >
                            <Grid container spacing={3}>
                                {/* Payer Selection */}
                                <Grid size={{xs: 12, sm: 6}}>
                                    <FormControl fullWidth error={!!allErrors.payer}>
                                        <InputLabel
                                            id="payer-select-label"
                                            required
                                        >
                                            Payer
                                        </InputLabel>
                                        <Select
                                            labelId="payer-select-label"
                                            label="Payer"
                                            name="payer"
                                            required
                                            value={data.payer ? `${data.payer.type}-${data.payer.id}` : ""}
                                            onChange={handlePayerChange}
                                            startAdornment={
                                                data.payer && (
                                                    <InputAdornment position="start">
                                                        {data.payer.type === 'patient' ?
                                                            <Person color="primary"/> :
                                                            <Business color="secondary"/>
                                                        }
                                                    </InputAdornment>
                                                )
                                            }
                                        >
                                            {payers.length === 0 ? (
                                                <MenuItem disabled>
                                                    <Typography color="text.secondary">
                                                        No payers available
                                                    </Typography>
                                                </MenuItem>
                                            ) : payers.map(payer => (
                                                <MenuItem
                                                    key={`${payer.type}-${payer.id}`}
                                                    value={`${payer.type}-${payer.id}`}
                                                >
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <span>{payer.name}</span>
                                                    </Box>
                                                </MenuItem>
                                            ))
                                            }
                                        </Select>
                                        {allErrors.payer && (
                                            <FormHelperText error>{allErrors.payer}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Payment Amount */}
                                <Grid size={{xs: 12, sm: 6}}>
                                    <FormControl fullWidth error={!!allErrors.price}>
                                        <InputLabel
                                            id="amount-input-label"
                                            required
                                        >
                                            Payment Amount
                                        </InputLabel>
                                        <OutlinedInput
                                            labelId="amount-input-label"
                                            type="number"
                                            name="price"
                                            label="Payment Amount"
                                            value={data.price}
                                            required
                                            autoFocus={shouldFocusAmount}
                                            inputProps={{
                                                min: 0,
                                                max: max,
                                                step: 0.01
                                            }}
                                            onChange={handlePriceChange}
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <AttachMoney color={data.price > 0 ? "success" : "action"}/>
                                                </InputAdornment>
                                            }
                                            endAdornment={
                                                <InputAdornment position="end">
                                                    OMR
                                                </InputAdornment>
                                            }
                                        />
                                        {allErrors.price ? (
                                            <FormHelperText error>{allErrors.price}</FormHelperText>
                                        ) : (
                                            <FormHelperText>
                                                Enter amount up to {max.toFixed(2)} OMR
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Payment Method Selection */}
                        <Box sx={{mb: 2, display: 'flex', alignItems: 'center'}}>
                            <Typography
                                variant="subtitle1"
                                sx={{fontWeight: 500}}
                            >
                                Payment Method
                            </Typography>
                            {allErrors.paymentMethod && (
                                <Chip
                                    icon={<ErrorOutline fontSize="small"/>}
                                    label="Required"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                    sx={{ml: 2}}
                                />
                            )}
                        </Box>

                        <RadioGroup
                            aria-label="payment-method"
                            name="paymentMethod"
                            value={data.paymentMethod}
                            onChange={handlePaymentMethodChange}
                        >
                            <Grid container spacing={2}>
                                {paymentMethods.map((method) => {
                                    // Skip credit payment method if not applicable
                                    if (method.value === "credit" && data.payer?.type !== "referrer") {
                                        return null;
                                    }

                                    return (
                                        <Grid i size={{xs: 12, sm: 6, md: 3}} key={method.value}>
                                            <Tooltip
                                                title={method.disabled ? "Not available for this payer type" : ""}
                                                placement="top"
                                                slots={{
                                                    transition: Zoom
                                                }}
                                            >
                                                <Paper
                                                    variant={data.paymentMethod === method.value ? "elevation" : "outlined"}
                                                    elevation={data.paymentMethod === method.value ? 4 : 0}
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        borderColor: data.paymentMethod === method.value
                                                            ? `${method.color}.main`
                                                            : 'divider',
                                                        bgcolor: data.paymentMethod === method.value
                                                            ? alpha(theme.palette[method.color].main, 0.1)
                                                            : 'transparent',
                                                        transition: 'all 0.2s',
                                                        cursor: method.disabled ? 'not-allowed' : 'pointer',
                                                        opacity: method.disabled ? 0.6 : 1,
                                                        '&:hover': !method.disabled ? {
                                                            borderColor: `${method.color}.main`,
                                                            bgcolor: alpha(theme.palette[method.color].main, 0.05)
                                                        } : {}
                                                    }}
                                                    onClick={() => {
                                                        if (!method.disabled) {
                                                            handlePaymentMethodChange({target: {value: method.value}});
                                                        }
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value={method.value}
                                                        control={
                                                            <Radio
                                                                color={method.color}
                                                                checked={data.paymentMethod === method.value}
                                                                disabled={method.disabled}
                                                            />
                                                        }
                                                        label=""
                                                        sx={{
                                                            m: 0,
                                                            width: '100%',
                                                            '& .MuiRadio-root': {p: 0, mr: 1}
                                                        }}
                                                    />

                                                    <Box sx={{textAlign: 'center', mt: 1}}>
                                                        <Box
                                                            sx={{
                                                                display: 'inline-flex',
                                                                p: 1.5,
                                                                borderRadius: '50%',
                                                                bgcolor: alpha(theme.palette[method.color].main, 0.15),
                                                                color: `${method.color}.main`,
                                                                mb: 1
                                                            }}
                                                        >
                                                            {React.cloneElement(method.icon, {fontSize: 'large'})}
                                                        </Box>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: data.paymentMethod === method.value ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {method.label}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {method.description}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            </Tooltip>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </RadioGroup>

                        {/* Method-specific fields */}
                        {data.paymentMethod && (
                            <Box sx={{
                                mt: 3,
                                p: 2,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                borderRadius: 2
                            }}>
                                {/* Card Payment Details */}
                                {data.paymentMethod === "card" && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom
                                                    sx={{display: 'flex', alignItems: 'center'}}>
                                            <CreditCard fontSize="small" sx={{mr: 1}}/>
                                            Card Payment Details
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            name="receiptReferenceCode"
                                            label="Receipt Reference Code"
                                            placeholder="Enter the transaction reference number"
                                            value={data.information?.receiptReferenceCode || ""}
                                            error={!!allErrors["information.receiptReferenceCode"]}
                                            required
                                            helperText={allErrors["information.receiptReferenceCode"] || "Enter the reference code from the card machine receipt"}
                                            onChange={handleInformationChange}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Receipt color="primary"/>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                            sx={{mt: 1}}
                                            autoFocus
                                        />
                                    </Box>
                                )}

                                {/* Bank Transfer Details */}
                                {data.paymentMethod === "transfer" && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom
                                                    sx={{display: 'flex', alignItems: 'center'}}>
                                            <SwapHoriz fontSize="small" sx={{mr: 1}}/>
                                            Bank Transfer Details
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            name="transferReference"
                                            label="Transfer Reference"
                                            placeholder="Enter the bank transfer reference number"
                                            value={data.information?.transferReference || ""}
                                            error={!!allErrors["information.transferReference"]}
                                            required
                                            helperText={allErrors["information.transferReference"] || "Enter the transaction ID or reference from the bank transfer"}
                                            onChange={handleInformationChange}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <AccountBalance color="info"/>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                            sx={{mt: 1}}
                                            autoFocus
                                        />
                                    </Box>
                                )}

                                {/* Notes Field for All Payment Methods */}
                                <TextField
                                    fullWidth
                                    name="notes"
                                    label="Payment Notes (Optional)"
                                    placeholder="Add any additional notes about this payment"
                                    value={data.information?.notes || ""}
                                    multiline
                                    rows={2}
                                    onChange={handleInformationChange}
                                    sx={{mt: 2}}
                                />
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <Divider/>

            <DialogActions sx={{p: 2, justifyContent: 'space-between'}}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    startIcon={<Close/>}
                    variant="outlined"
                    color="inherit"
                    size="large"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !canSubmit}
                    startIcon={loading ? <CircularProgress size={20}/> : <Save/>}
                    variant="contained"
                    color="primary"
                    size="large"
                >
                    {loading
                        ? "Processing..."
                        : data.id
                            ? "Update Payment"
                            : "Save Payment"
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPayment;
