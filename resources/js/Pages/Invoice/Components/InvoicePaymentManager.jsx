import React, {useState, useMemo, useEffect} from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Button,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    Divider,
    useTheme,
    alpha,
    TableFooter,
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
    Tooltip,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    AttachMoney,
    CreditCard,
    AccountBalance,
    SwapHoriz,
    Save,
    Person,
    Business,
    Receipt,
    ErrorOutline,
    Payment as PaymentIcon,
} from "@mui/icons-material";

// Mock data for demonstration
const mockInvoice = {
    id: 1,
    status: "Partially Paid",
    discount: 10,
    payments: [
        {
            id: 1,
            price: 150.00,
            paymentMethod: "cash",
            cashier: {name: "John Doe"},
            created_at: "2024-01-15T10:30:00Z",
            payer_type: "patient",
            payer_id: 1,
            payer_name: "Alice Johnson",
            information: {}
        },
        {
            id: 2,
            price: 75.50,
            paymentMethod: "card",
            cashier: {name: "Jane Smith"},
            created_at: "2024-01-16T14:20:00Z",
            payer_type: "patient",
            payer_id: 1,
            payer_name: "Alice Johnson",
            information: {receiptReferenceCode: "REF123456"}
        }
    ]
};

const mockAcceptanceItems = [
    {id: 1, name: "Consultation", price: 100, discount: 0},
    {id: 2, name: "X-Ray", price: 150, discount: 10},
    {id: 3, name: "Lab Test", price: 75, discount: 5}
];

const mockPayers = [
    {type: "patient", id: 1, name: "Alice Johnson"},
    {type: "referrer", id: 2, name: "Dr. Smith Clinic"}
];

// Utility functions
const formatCurrency = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

const sumAcceptanceItems = (items, field) => {
    if (Array.isArray(items))
        return items.reduce((total, item) => {
            return total + (parseFloat(item[field]) || 0);
        }, 0);
    return Object.keys(items).reduce((total, item) => {
        const itemTotal = items[item]?.reduce((a, b) => a + (parseFloat(b[field])||0), 0);

        return total + itemTotal;
    }, 0)
};

const sumPayments = (items, field) => {
    return items.reduce((total, item) => total + (parseFloat(item[field]) || 0), 0);
};

// Payment method icons mapper
const PAYMENT_METHOD_ICONS = {
    cash: <AttachMoney color="success"/>,
    card: <CreditCard color="primary"/>,
    credit: <AccountBalance color="warning"/>,
    transfer: <SwapHoriz color="info"/>
};

// Payment method configuration
const PAYMENT_METHODS = [
    {
        value: "cash",
        label: "Cash",
        icon: <AttachMoney/>,
        color: "success",
        description: "Pay with physical currency"
    },
    {
        value: "card",
        label: "Card",
        icon: <CreditCard/>,
        color: "primary",
        description: "Pay with credit/debit card"
    },
    {
        value: "transfer",
        label: "Bank Transfer",
        icon: <SwapHoriz/>,
        color: "info",
        description: "Pay via bank transfer"
    },
    {
        value: "credit",
        label: "Credit",
        icon: <AccountBalance/>,
        color: "warning",
        description: "Add to referrer's credit balance"
    }
];

/**
 * Add/Edit Payment Dialog Component
 */
const PaymentDialog = ({
                           open,
                           onClose,
                           payment,
                           maxAmount,
                           payers,
                           onSave,
                           onDelete
                       }) => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        price: payment?.price || 0,
        paymentMethod: payment?.paymentMethod || "",
        information: payment?.information || {},
        payer_type: payment?.payer_type,
        payer_id: payment?.payer_id,
        payer: payment ? {
            type: payment.payer_type,
            id: payment.payer_id,
            name: payment?.payer?.fullName,
            fullName: payment?.payer?.fullName,
        } : (payers[0] || null)
    });
    useEffect(() => {
        setFormData({
            price: payment?.price || 0,
            paymentMethod: payment?.paymentMethod || "",
            information: payment?.information || {},
            payer_type: payment?.payer_type,
            payer_id: payment?.payer_id,
            payer: payment ? {
                type: payment?.payer_type,
                id: payment.payer_id,
                name: payment.payer.fullName,
                fullName: payment.payer.fullName,
            } : (payers[0] || null)
        });
    }, [payment]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEditing = !!payment?.id;

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleInformationChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            information: {
                ...prev.information,
                [field]: value
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.price || formData.price <= 0) {
            newErrors.price = "Amount must be greater than 0";
        } else if (formData.price > maxAmount) {
            newErrors.price = `Amount exceeds maximum allowed (${maxAmount.toFixed(2)} OMR)`;
        }

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = "Please select a payment method";
        }

        if (!formData.payer?.id) {
            newErrors.payer = "Please select a payer";
        }

        if (formData.paymentMethod === "card" && !formData.information.receiptReferenceCode) {
            newErrors.receiptReferenceCode = "Receipt reference code is required for card payments";
        }

        if (formData.paymentMethod === "transfer" && !formData.information.transferReference) {
            newErrors.transferReference = "Transfer reference is required for bank transfers";
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
                id: payment?.id
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
                    sx: {borderRadius: 2}
                }
            }}
        >
            <DialogTitle sx={{pb: 1}}>
                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {isEditing ? <EditIcon/> : <AddIcon/>}
                    {isEditing ? 'Edit Payment' : 'Add Payment'}
                </Typography>
            </DialogTitle>

            <Divider/>

            <DialogContent sx={{py: 3}}>
                <Alert severity="info" sx={{mb: 3}}>
                    Maximum payment amount: <strong>{maxAmount.toFixed(2)} OMR</strong>
                </Alert>

                <Grid container spacing={3}>
                    {/* Payer Selection */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <FormControl fullWidth error={!!errors.payer}>
                            <InputLabel>Payer</InputLabel>
                            <Select
                                value={formData.payer ? `${formData.payer.type}-${formData.payer.id}` : ""}
                                label="Payer"
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    const payer = payers.find(p => `${p.type}-${p.id}` === selectedValue);
                                    handleChange('payer', payer);
                                    handleChange('payer_id', payer.id);
                                    handleChange('payer_type', payer.type);
                                }}
                            >
                                {payers.map(payer => (
                                    <MenuItem key={`${payer.type}-${payer.id}`} value={`${payer.type}-${payer.id}`}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            {payer.type === 'patient' ? <Person/> : <Business/>}
                                            {payer.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.payer && <FormHelperText>{errors.payer}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    {/* Payment Amount */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <FormControl fullWidth error={!!errors.price}>
                            <InputLabel>Payment Amount</InputLabel>
                            <OutlinedInput
                                type="number"
                                label="Payment Amount"
                                value={formData.price}
                                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <AttachMoney color="success"/>
                                    </InputAdornment>
                                }
                                endAdornment={
                                    <InputAdornment position="end">OMR</InputAdornment>
                                }
                                inputProps={{min: 0, max: maxAmount, step: 0.01}}
                            />
                            {errors.price && <FormHelperText>{errors.price}</FormHelperText>}
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Payment Method Selection */}
                <Box sx={{mt: 3}}>
                    <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 500}}>
                        Payment Method
                        {errors.paymentMethod && (
                            <Chip
                                icon={<ErrorOutline fontSize="small"/>}
                                label="Required"
                                color="error"
                                size="small"
                                variant="outlined"
                                sx={{ml: 2}}
                            />
                        )}
                    </Typography>

                    <RadioGroup
                        value={formData.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    >
                        <Grid container spacing={2}>
                            {PAYMENT_METHODS.map((method) => {
                                const disabled = method.value === "credit" && formData.payer?.type !== "referrer";

                                return (
                                    <Grid size={{xs: 12, sm: 6, md: 3}} key={method.value}>
                                        <Paper
                                            variant={formData.paymentMethod === method.value ? "elevation" : "outlined"}
                                            elevation={formData.paymentMethod === method.value ? 4 : 0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                borderColor: formData.paymentMethod === method.value
                                                    ? `${method.color}.main`
                                                    : 'divider',
                                                bgcolor: formData.paymentMethod === method.value
                                                    ? alpha(theme.palette[method.color].main, 0.1)
                                                    : 'transparent',
                                                opacity: disabled ? 0.6 : 1,
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => !disabled && handleChange('paymentMethod', method.value)}
                                        >
                                            <FormControlLabel
                                                value={method.value}
                                                control={
                                                    <Radio
                                                        color={method.color}
                                                        disabled={disabled}
                                                        checked={formData.paymentMethod === method.value}
                                                    />
                                                }
                                                label=""
                                                sx={{m: 0, width: '100%'}}
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
                    <Box sx={{mt: 3, p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2}}>
                        {formData.paymentMethod === "card" && (
                            <TextField
                                fullWidth
                                label="Receipt Reference Code"
                                value={formData.information.receiptReferenceCode || ""}
                                onChange={(e) => handleInformationChange('receiptReferenceCode', e.target.value)}
                                error={!!errors.receiptReferenceCode}
                                helperText={errors.receiptReferenceCode || "Enter the reference code from the card machine receipt"}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Receipt color="primary"/>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{mb: 2}}
                            />
                        )}

                        {formData.paymentMethod === "transfer" && (
                            <TextField
                                fullWidth
                                label="Transfer Reference"
                                value={formData.information.transferReference || ""}
                                onChange={(e) => handleInformationChange('transferReference', e.target.value)}
                                error={!!errors.transferReference}
                                helperText={errors.transferReference || "Enter the transaction ID from the bank transfer"}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountBalance color="info"/>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{mb: 2}}
                            />
                        )}

                        <TextField
                            fullWidth
                            label="Payment Notes (Optional)"
                            value={formData.information.notes || ""}
                            onChange={(e) => handleInformationChange('notes', e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Add any additional notes about this payment"
                        />
                    </Box>
                )}
            </DialogContent>

            <Divider/>

            <DialogActions sx={{p: 2, justifyContent: 'space-between'}}>
                <Box>
                    {isEditing && (
                        <Button
                            onClick={handleDelete}
                            disabled={loading}
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon/>}
                        >
                            Delete
                        </Button>
                    )}
                </Box>

                <Box sx={{display: 'flex', gap: 1}}>
                    <Button
                        onClick={onClose}
                        disabled={loading}
                        color="inherit"
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20}/> : <Save/>}
                    >
                        {loading ? "Processing..." : isEditing ? "Update Payment" : "Add Payment"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

/**
 * Invoice Payment Manager Component
 */
const InvoicePaymentManager = ({
                                   invoice = mockInvoice,
                                   acceptanceItems = mockAcceptanceItems,
                                   payers = mockPayers,
                                   onPaymentChange
                               }) => {
    const theme = useTheme();
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Calculations
    const totalSum = useMemo(() => {
        const itemsTotal = sumAcceptanceItems(acceptanceItems, "price");
        const itemsDiscount = sumAcceptanceItems(acceptanceItems, "discount");
        const invoiceDiscount = invoice?.discount || 0;
        return itemsTotal - itemsDiscount - invoiceDiscount;
    }, [acceptanceItems, invoice?.discount]);

    const totalPayments = useMemo(() => {
        return invoice?.payments ? sumPayments(invoice.payments, "price") : 0;
    }, [invoice?.payments]);

    const payableAmount = useMemo(() => {
        return formatCurrency(totalSum - totalPayments);
    }, [totalSum, totalPayments]);

    const paymentProgress = useMemo(() => {
        if (!totalSum) return 0;
        return Math.min(100, (totalPayments / totalSum) * 100);
    }, [totalSum, totalPayments]);

    const maxPaymentAmount = useMemo(() => {
        return selectedPayment?.id ? totalSum : totalSum - totalPayments;
    }, [selectedPayment?.id, totalSum, totalPayments]);

    // Handlers
    const handleAddPayment = () => {
        setSelectedPayment(null);
        setPaymentDialogOpen(true);
    };

    const handleEditPayment = (payment) => {
        setSelectedPayment(payment);
        setPaymentDialogOpen(true);
    };

    const handleSavePayment = async (paymentData) => {
        // Simulate API call
        console.log("Saving payment:", paymentData);

        // Mock success
        if (onPaymentChange) {
            onPaymentChange(paymentData);
        }

        setPaymentDialogOpen(false);
        setSelectedPayment(null);
    };

    const handleDeletePayment = async (paymentId) => {
        // Simulate API call
        console.log("Deleting payment:", paymentId);

        // Mock success
        if (onPaymentChange) {
            onPaymentChange({id: paymentId, _method: 'delete'});
        }

        setPaymentDialogOpen(false);
        setSelectedPayment(null);
    };

    return (
        <Box>
            {/* Payment Summary */}
            <Grid container spacing={2} sx={{mb: 3}}>
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">Total Amount</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {totalSum.toFixed(2)} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">Amount Paid</Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                {totalPayments.toFixed(2)} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">Amount Due</Typography>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                color={payableAmount > 0 ? "error.main" : "success.main"}
                            >
                                {payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">Payment Status</Typography>
                            <Chip
                                label={payableAmount > 0 ? "Pending" : "Paid"}
                                color={payableAmount > 0 ? "warning" : "success"}
                                sx={{fontWeight: 'bold'}}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Payment Progress */}
            <Box sx={{mb: 3}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                    <Typography variant="body2">Payment Progress</Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {paymentProgress.toFixed(0)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={paymentProgress}
                    sx={{height: 8, borderRadius: 4}}
                />
            </Box>

            {/* Add Payment Button */}
            <Box sx={{mb: 3, display: 'flex', justifyContent: 'flex-end'}}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    onClick={handleAddPayment}
                    disabled={payableAmount <= 0}
                >
                    Add Payment
                </Button>
            </Box>

            {/* Payments Table */}
            <TableContainer component={Paper} variant="outlined" sx={{borderRadius: 2}}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Payment Method</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Payer</TableCell>
                            <TableCell>Cashier</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {invoice?.payments?.length > 0 ? (
                            invoice.payments.map((payment, index) => (
                                <TableRow
                                    key={payment.id}
                                    sx={{
                                        '&:nth-of-type(odd)': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.03)'
                                        }
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            {PAYMENT_METHOD_ICONS[payment.paymentMethod] || <PaymentIcon/>}
                                            <Typography variant="body2">
                                                {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="medium">
                                            {parseFloat(payment.price).toFixed(2)} OMR
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {console.log(payment.payer)}
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            {payment?.payer_type === 'patient' ? <Person fontSize="small"/> :
                                                <Business fontSize="small"/>}
                                            <Typography variant="body2">
                                                {payment.payer.fullName || payment.payer.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {payment?.cashier?.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit Payment">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditPayment(payment)}
                                                color="primary"
                                            >
                                                <EditIcon fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{py: 4}}>
                                    <Typography color="text.secondary">
                                        No payments recorded yet
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow sx={{bgcolor: alpha(theme.palette.primary.main, 0.05)}}>
                            <TableCell colSpan={2}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Total Payments:
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                                    {totalPayments.toFixed(2)} OMR
                                </Typography>
                            </TableCell>
                            <TableCell colSpan={4}/>
                        </TableRow>
                        <TableRow sx={{bgcolor: alpha(theme.palette.background.default, 0.8)}}>
                            <TableCell colSpan={2}>
                                <Typography variant="h6" fontWeight="bold">
                                    Remaining Balance:
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color={payableAmount > 0 ? "error.main" : "success.main"}
                                >
                                    {payableAmount.toFixed(2)} OMR
                                </Typography>
                            </TableCell>
                            <TableCell colSpan={4}/>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {/* Payment Dialog */}
            <PaymentDialog
                open={paymentDialogOpen}
                onClose={() => {
                    setPaymentDialogOpen(false);
                    setSelectedPayment(null);
                }}
                payment={selectedPayment}
                maxAmount={maxPaymentAmount}
                payers={payers}
                onSave={handleSavePayment}
                onDelete={handleDeletePayment}
            />
        </Box>
    );
};

export default InvoicePaymentManager;
