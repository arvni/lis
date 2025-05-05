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
    Radio
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
} from "@mui/icons-material";
import { useForm } from "@inertiajs/react";
import React, {useEffect, useState} from "react";

/**
 * Improved AddPayment Component
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
    const defaultValues = {
        price: initialData?.price || 0,
        paymentMethod: initialData?.paymentMethod || "",
        information: initialData?.information || {},
        payer: initialData?.payer || (payers[0] || null),
        _method: initialData?._method || "post",
        id: initialData?.id || null,
        invoice_id: initialData?.invoice?.id || initialData?.invoice_id || null
    };

    const {
        data,
        setData,
        post,
        clearErrors,
        errors,
        processing: loading
    } = useForm(defaultValues);

    // Form validation errors separate from form data
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        setData(defaultValues);
    }, [initialData]);


    /**
     * Handle form submission
     */
    const handleSubmit = () => {
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
        if (!(data.price >= 0) || (data.price > max)) {
            newErrors.price = `Amount must be greater than or equal to 0 and less than ${max}`;
            isValid = false;
        }

        // Validate payment method
        if (!["cash", "card", "credit"].includes(data.paymentMethod)) {
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

        setValidationErrors(newErrors);
        return isValid;
    };

    /**
     * Handle price input change
     */
    const handlePriceChange = (e) => {
        const value = parseFloat(e.target.value);
        setData("price", isNaN(value) ? 0 : value);

        // Clear error if value is now valid
        if (value >= 0 && value <= max) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.price;
                return newErrors;
            });
        }
    };

    /**
     * Handle payment method change
     */
    const handlePaymentMethodChange = (e) => {
        setData(prevData => ({
            ...prevData,
            paymentMethod: e.target.value,
            information: {} // Reset additional information when method changes
        }));

        // Clear error if a valid method is selected
        if (["cash", "card", "credit"].includes(e.target.value)) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.paymentMethod;
                return newErrors;
            });
        }
    };

    /**
     * Handle payer selection change
     */
    const handlePayerChange = (e) => {
        const selectedValue = e.target.value;
        const payer = payers.find(item => `${item.type}-${item.id}` === selectedValue);

        if (payer) {
            setData(prevData => ({
                ...prevData,
                payer,
                // Reset payment method when payer changes
                paymentMethod: "",
                information: {}
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
        const { name, value } = e.target;

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

    // Payment methods configuration
    const paymentMethods = [
        {
            value: "cash",
            label: "Cash",
            icon: <AttachMoney />,
            color: "success",
            description: "Pay with physical currency"
        },
        {
            value: "card",
            label: "Card",
            icon: <CreditCard />,
            color: "primary",
            description: "Pay with credit/debit card"
        }
    ];

    // Only show credit for referrers
    if (data.payer?.type === "referrer") {
        paymentMethods.push({
            value: "credit",
            label: "Credit",
            icon: <AccountBalance />,
            color: "warning",
            description: "Add to referrer's credit"
        });
    }

    // Combine backend errors with frontend validation errors
    const allErrors = {...errors, ...validationErrors};

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
                <Typography variant="h6">
                    {data.id ? "Edit Payment" : "Add New Payment"}
                </Typography>
                {!loading && (
                    <IconButton
                        onClick={onClose}
                        aria-label="close"
                        size="small"
                    >
                        <Close />
                    </IconButton>
                )}
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                        <CircularProgress size={50} thickness={4} />
                        <Typography sx={{ mt: 2 }}>
                            {data.id ? "Updating payment..." : "Processing payment..."}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Alert
                            severity="info"
                            sx={{ mb: 3, borderRadius: 1 }}
                            icon={<Info />}
                        >
                            <Typography>
                                Maximum payment amount: <strong>{max.toFixed(2)} OMR</strong>
                            </Typography>
                        </Alert>

                        <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                            <Grid container spacing={3}>
                                {/* Payer Selection */}
                                <Grid  size={{xs:12,sm:6}}>
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
                                        >
                                            {payers.map(payer => (
                                                <MenuItem
                                                    key={`${payer.type}-${payer.id}`}
                                                    value={`${payer.type}-${payer.id}`}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {payer.type === 'patient' ?
                                                            <Person color="primary" sx={{ mr: 1 }} /> :
                                                            <Business color="secondary" sx={{ mr: 1 }} />
                                                        }
                                                        <span>{payer.name}</span>
                                                        <Chip
                                                            label={payer.type}
                                                            size="small"
                                                            color={payer.type === 'patient' ? "primary" : "secondary"}
                                                            sx={{ ml: 1 }}
                                                        />
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {allErrors.payer && (
                                            <FormHelperText error>{allErrors.payer}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Payment Amount */}
                                <Grid item  size={{xs:12,sm:6}}>
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
                                            inputProps={{
                                                min: 0,
                                                max: max,
                                                step: 0.01
                                            }}
                                            onChange={handlePriceChange}
                                            endAdornment={
                                                <InputAdornment position="end">
                                                    OMR
                                                </InputAdornment>
                                            }
                                        />
                                        {allErrors.price && (
                                            <FormHelperText error>{allErrors.price}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Payment Method Selection */}
                        <Typography
                            variant="subtitle1"
                            sx={{ mb: 2, fontWeight: 500 }}
                        >
                            Payment Method
                        </Typography>

                        <RadioGroup
                            aria-label="payment-method"
                            name="paymentMethod"
                            value={data.paymentMethod}
                            onChange={handlePaymentMethodChange}
                        >
                            <Grid container spacing={2}>
                                {paymentMethods.map((method) => (
                                    <Grid item size={{xs:12,sm:4}} key={method.value}>
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
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    borderColor: `${method.color}.main`,
                                                    bgcolor: alpha(theme.palette[method.color].main, 0.05)
                                                }
                                            }}
                                            onClick={() => handlePaymentMethodChange({ target: { value: method.value } })}
                                        >
                                            <FormControlLabel
                                                value={method.value}
                                                control={<Radio color={method.color} checked={data.paymentMethod === method.value} />}
                                                label=""
                                                sx={{
                                                    m: 0,
                                                    width: '100%',
                                                    '& .MuiRadio-root': { p: 0, mr: 1 }
                                                }}
                                            />

                                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                                <Box
                                                    sx={{
                                                        display: 'inline-flex',
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        bgcolor: alpha(theme.palette[method.color].main, 0.15),
                                                        color: `${method.color}.main`,
                                                        mb: 1
                                                    }}
                                                >
                                                    {React.cloneElement(method.icon, { fontSize: 'large' })}
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
                                    </Grid>
                                ))}
                            </Grid>
                        </RadioGroup>

                        {allErrors.paymentMethod && (
                            <FormHelperText error sx={{ mt: 1 }}>
                                {allErrors.paymentMethod}
                            </FormHelperText>
                        )}

                        {/* Card Receipt Reference Code */}
                        {data.paymentMethod === "card" && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
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
                                        Input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CreditCard color="primary"/>
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        )}
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
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    variant="contained"
                    color="primary"
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
