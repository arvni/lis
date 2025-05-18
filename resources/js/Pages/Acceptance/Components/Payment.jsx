import React, {useMemo, useState, useCallback, useEffect} from "react";
import {
    Accordion,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    Input,
    Stack,
    Typography,
    Paper,
    Button,
    IconButton,
    Box,
    Chip,
    Divider,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import Grid from "@mui/material/Grid2";
import {
    ExpandMore as ExpandMoreIcon,
    Remove as RemoveIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Add as AddIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    AttachMoney as AttachMoneyIcon,
    CreditCard as CreditCardIcon,
    AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import {useSnackbar} from "notistack";
import {sum} from "@/Services/helper";
import AddPayment from "@/Pages/Acceptance/Components/AddPayment";
import CreateInvoiceForm from "@/Pages/Acceptance/Components/CreateInvoiceForm";
import DeleteForm from "@/Components/DeleteForm.jsx";
import {router} from "@inertiajs/react";

// Utility functions
const formatCurrency = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

// Payment method icons mapper
const PAYMENT_METHOD_ICONS = {
    cash: <AttachMoneyIcon color="success"/>,
    card: <CreditCardIcon color="primary"/>,
    credit: <AccountBalanceIcon color="warning"/>
};

/**
 * Improved Payment Component
 */
const PaymentComponent = ({
                              patient,
                              invoice,
                              acceptance,
                              acceptanceItems,
                              status,
                              minAllowablePayment = 0,
                              handleChange,
                              data,
                              defaultExpanded = true
                          }) => {
    const {enqueueSnackbar} = useSnackbar();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State
    const [openAdd, setOpenAdd] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openCreateInvoice, setOpenCreateInvoice] = useState(false);

    // Memoized calculations
    const totalSum = useMemo(() => {
        const itemsTotal = sum(acceptanceItems, "price");
        const itemsDiscount = sum(acceptanceItems, "discount");
        const invoiceDiscount = invoice ? invoice.discount * 1 : 0;

        return itemsTotal - itemsDiscount - invoiceDiscount;
    }, [invoice, acceptanceItems]);

    const totalPayments = useMemo(() => {
        return invoice?.payments ? sum(invoice.payments, "price") : 0;
    }, [invoice]);

    const payableAmount = useMemo(() => {
        return formatCurrency(totalSum - totalPayments);
    }, [totalSum, totalPayments]);

    const payers = useMemo(() => {
        const patientPayer = {
            type: "patient",
            id: patient?.id,
            name: patient?.fullName
        };

        if (invoice?.owner_id !== patient?.id && invoice?.owner_type !== "patient") {
            return [
                patientPayer,
                {
                    type: "referrer",
                    id: invoice?.owner_id,
                    name: invoice?.owner?.fullName
                }
            ];
        }

        return [patientPayer];
    }, [patient, invoice]);

    const isMinPaymentMet = useMemo(() => {
        if (!invoice) return false;
        return totalPayments >= (minAllowablePayment * totalSum * 0.01);
    }, [invoice, totalPayments, totalSum, minAllowablePayment]);

    const isPendingPayment = useMemo(() => {
        return invoice && totalPayments < totalSum;
    }, [invoice, totalPayments, totalSum]);

    // Payment progress percentage
    const paymentProgress = useMemo(() => {
        if (!totalSum) return 0;
        return Math.min(100, (totalPayments / totalSum) * 100);
    }, [totalSum, totalPayments]);

    // Initial payment data with default values
    const getInitialPaymentState = useCallback(() => ({
        price: invoice ? totalSum - (invoice?.payments ? sum(invoice.payments, "price") : 0) : 0,
        information: {},
        invoice,
        payer: {
            type: acceptance.referrer ? "referrer" : "patient",
            id: acceptance.referrer ? acceptance.referrer.id : patient?.id,
            name: acceptance.referrer ? acceptance?.referrer?.fullName : patient?.fullName,
        }
    }), [invoice, totalSum, acceptance.referrer, patient]);


    const [payment, setPayment] = useState(getInitialPaymentState());

    useEffect(() => {
        setPayment(getInitialPaymentState())
    }, [acceptance.referrer, invoice]);

    const maxPaymentAmount = useMemo(() => {
        if (!invoice) return 0;
        return payment?.id ? totalSum : totalSum - totalPayments;
    }, [invoice, payment?.id, totalSum, totalPayments]);

    // Modal handlers
    const handleCreateInvoice = useCallback(() => setOpenCreateInvoice(true), []);
    const handleCreateInvoiceClose = useCallback(() => setOpenCreateInvoice(false), []);
    const handleAddPaymentClose = useCallback(() => setOpenAdd(false), []);
    const handleOpenAddPayment = useCallback(() => setOpenAdd(true), []);

    const handlePrintReceipt = useCallback(() => {
        try {
            window.open(route("acceptances.print", acceptance.id), "_blank");
        } catch (error) {
            enqueueSnackbar("Failed to open print window", {variant: "error"});
            console.error("Print error:", error);
        }
    }, [acceptance, enqueueSnackbar]);

    const handleEditPayment = useCallback((paymentItem) => () => {
        setPayment({
            ...paymentItem,
            _method: "put",
            invoice,
            payer: {
                type: paymentItem.payer_type || (acceptance.referrer ? "referrer" : "patient"),
                id: paymentItem.payer_id || (acceptance.referrer ? acceptance.referrer.id : patient?.id),
                name: paymentItem.payer_name || (acceptance.referrer ? acceptance.referrer?.fullName : patient?.fullName),
            }
        });
        setOpenAdd(true);
    }, [invoice, acceptance.referrer, patient]);

    const handleDelPayment = useCallback((paymentItem) => () => {
        setPayment({
            ...paymentItem,
            _method: "delete",
        });
        setOpenDelete(true);
    }, []);

    const handleDeleteClose = useCallback(() => {
        setOpenDelete(false);
        setPayment(getInitialPaymentState());
    }, [getInitialPaymentState]);

    const handleDeleteSuccess = useCallback(() => {
        router.post(route("payments.destroy", payment.id),
            {_method: "delete"},
            {onFinish: handleDeleteClose}
        );
    }, [payment.id, handleDeleteClose]);

    const handlePaymentSuccess = useCallback(() => {
        setOpenAdd(false);
        enqueueSnackbar(
            status || "Payment processed successfully",
            {variant: "success"}
        );
    }, [status, enqueueSnackbar]);

    // Payment Summary Component
    const PaymentSummary = () => (
        <Box sx={{mb: 3}}>
            <Grid container spacing={2}>
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Amount</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {totalSum.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Amount Paid</Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                {totalPayments.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Amount Due</Typography>
                            <Typography variant="h5" fontWeight="bold"
                                        color={payableAmount > 0 ? "error.main" : "success.main"}>
                                {payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Card elevation={1} sx={{borderRadius: 2}}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Payment Status</Typography>
                            <Chip
                                label={payableAmount > 0 ? "Pending" : "Paid"}
                                color={payableAmount > 0 ? "warning" : "success"}
                                sx={{fontWeight: 'bold'}}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {invoice && (
                <Box sx={{mt: 3}}>
                    <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1}}>
                        <Typography>Payment Progress</Typography>
                        <Typography fontWeight="medium">{paymentProgress.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={paymentProgress}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 1
                        }}
                    />
                </Box>
            )}
        </Box>
    );

    // Table components
    const PaymentTableHeader = () => (
        <TableHead>
            <TableRow>
                <TableCell align="center" width="5%">
                    <Typography fontWeight="bold">#</Typography>
                </TableCell>
                <TableCell width="20%">
                    <Typography fontWeight="bold">Payment Method</Typography>
                </TableCell>
                <TableCell align="right" width="15%">
                    <Typography fontWeight="bold">Amount</Typography>
                </TableCell>
                <TableCell width="20%">
                    <Typography fontWeight="bold">Cashier</Typography>
                </TableCell>
                <TableCell width="25%">
                    <Typography fontWeight="bold">Date</Typography>
                </TableCell>
                <TableCell align="center" width="15%" aria-label="Actions">Actions</TableCell>
            </TableRow>
        </TableHead>
    );

    const PaymentTableBody = () => (
        <TableBody>
            {invoice.payments?.length > 0 ? (
                invoice.payments.map((item, index) => (
                    <TableRow
                        key={`payment-${item.id}`}
                        sx={{
                            '&:nth-of-type(odd)': {
                                backgroundColor: 'rgba(0, 0, 0, 0.03)'
                            },
                        }}
                    >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                {PAYMENT_METHOD_ICONS[item.paymentMethod] || <PaymentIcon/>}
                                <Typography sx={{ml: 1}}>
                                    {item.paymentMethod === 'cash' ? 'Cash' :
                                        item.paymentMethod === 'card' ? 'Card' :
                                            item.paymentMethod === 'credit' ? 'Credit' :
                                                item.paymentMethod}
                                </Typography>
                            </Box>
                        </TableCell>
                        <TableCell align="right">
                            <Typography fontWeight="bold">
                                {parseFloat(item.price).toFixed(2)}
                            </Typography>
                        </TableCell>
                        <TableCell>{item.cashier.name}</TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                        <TableCell align="center">
                            <IconButton
                                onClick={handleEditPayment(item)}
                                aria-label={`Edit payment ${index + 1}`}
                                size="small"
                            >
                                <EditIcon color="warning"/>
                            </IconButton>
                            <IconButton
                                onClick={handleDelPayment(item)}
                                aria-label={`Delete payment ${index + 1}`}
                                size="small"
                            >
                                <DeleteIcon color="error"/>
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{py: 3}}>
                        <Typography color="text.secondary">No payments recorded yet</Typography>
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    );

    const PaymentTableFooter = () => (
        <TableFooter>
            <TableRow>
                <TableCell colSpan={2}/>
                <TableCell align="left">
                    <Typography fontWeight="bold">Total:</Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography fontWeight="bold">
                        {sum(acceptanceItems, "price").toFixed(2)}
                    </Typography>
                </TableCell>
                <TableCell align="left">
                    <Typography variant="caption">OMR</Typography>
                </TableCell>
                <TableCell/>
            </TableRow>
            <TableRow>
                <TableCell colSpan={2}/>
                <TableCell align="left">
                    <Typography fontWeight="bold">Item Discounts:</Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography fontWeight="bold" color="error">
                        <RemoveIcon fontSize="small"/>
                        {sum(acceptanceItems, "discount").toFixed(2)}
                    </Typography>
                </TableCell>
                <TableCell align="left">
                    <Typography variant="caption">OMR</Typography>
                </TableCell>
                <TableCell/>
            </TableRow>
            <TableRow>
                <TableCell colSpan={2}/>
                <TableCell align="left">
                    <Typography fontWeight="bold">Additional Discount:</Typography>
                </TableCell>
                <TableCell align="right">
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                        <RemoveIcon fontSize="small" color="error"/>
                        {invoice ? (
                            <Typography fontWeight="bold" color="error">
                                {invoice.discount}
                            </Typography>
                        ) : (
                            <Input
                                type="number"
                                min={0}
                                value={data?.discount || 0}
                                onChange={handleChange}
                                name="discount"
                                max={sum(acceptanceItems, "price") - sum(acceptanceItems, "discount")}
                                inputProps={{style: {textAlign: 'right'}}}
                                sx={{width: 80}}
                            />
                        )}
                    </Box>
                </TableCell>
                <TableCell align="left">
                    <Typography variant="caption">OMR</Typography>
                </TableCell>
                <TableCell/>
            </TableRow>
            <TableRow>
                <TableCell colSpan={2}/>
                <TableCell align="left">
                    <Typography fontWeight="bold">Total Payments:</Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography fontWeight="bold" color="success.main">
                        {totalPayments.toFixed(2)}
                    </Typography>
                </TableCell>
                <TableCell align="left">
                    <Typography variant="caption">OMR</Typography>
                </TableCell>
                <TableCell/>
            </TableRow>
            <TableRow sx={{backgroundColor: '#f5f5f5'}}>
                <TableCell colSpan={2}/>
                <TableCell align="left">
                    <Typography variant="h6" fontWeight="bold">
                        Payable Amount:
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        color={payableAmount > 0 ? "error.main" : "success.main"}
                    >
                        {payableAmount.toFixed(2)}
                    </Typography>
                </TableCell>
                <TableCell align="left">
                    <Typography variant="caption">OMR</Typography>
                </TableCell>
                <TableCell/>
            </TableRow>
        </TableFooter>
    );

    const ActionButtons = () => (
        <Stack direction="row" spacing={2} sx={{mt: 3}}>
            {isPendingPayment && (
                <Button
                    variant="contained"
                    onClick={handleOpenAddPayment}
                    disabled={!invoice}
                    startIcon={<AddIcon/>}
                    color="primary"
                    sx={{borderRadius: 1}}
                >
                    Add Payment
                </Button>
            )}
            {isMinPaymentMet && (
                <Button
                    variant="outlined"
                    onClick={handlePrintReceipt}
                    startIcon={<PrintIcon/>}
                    color="secondary"
                    sx={{borderRadius: 1}}
                >
                    Print Receipt
                </Button>
            )}
        </Stack>
    );

    const NoInvoiceView = () => (
        <Box sx={{py: 2}}>
            <Alert
                severity="info"
                sx={{mb: 3}}
            >
                No invoice has been created for this acceptance yet.
            </Alert>

            <Card variant="outlined" sx={{mb: 3}}>
                <CardContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2}}>
                        <ReceiptIcon color="primary" sx={{fontSize: 48, mb: 2}}/>
                        <Typography variant="h6" gutterBottom>
                            Items Summary
                        </Typography>
                        <Box sx={{width: '100%', maxWidth: 500, mt: 2}}>
                            <Stack spacing={1.5}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography>Total Items:</Typography>
                                    <Typography fontWeight="bold">{acceptanceItems.length}</Typography>
                                </Box>
                                <Divider/>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography>Subtotal:</Typography>
                                    <Typography>{sum(acceptanceItems, "price").toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography>Item Discounts:</Typography>
                                    <Typography color="error">
                                        - {sum(acceptanceItems, "discount").toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography>Additional Discount:</Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <RemoveIcon fontSize="small" sx={{color: 'error.main'}}/>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={data?.discount || 0}
                                            onChange={handleChange}
                                            name="discount"
                                            size="small"
                                            sx={{width: 80}}
                                            inputProps={{
                                                min: 0,
                                                max: sum(acceptanceItems, "price") - sum(acceptanceItems, "discount"),
                                                step: 0.01,
                                                style: {textAlign: 'right'}
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Divider/>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography fontWeight="bold">Net Total:</Typography>
                                    <Typography fontWeight="bold">{totalSum.toFixed(2)}</Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <Button
                    variant="contained"
                    onClick={handleCreateInvoice}
                    startIcon={<ReceiptIcon/>}
                    size="large"
                >
                    Create Invoice
                </Button>
            </Box>
        </Box>
    );

    return (
        <>
            <Accordion defaultExpanded={defaultExpanded}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="payment-information"
                    id="payment"
                >
                    <Box sx={{display: 'flex', alignItems: 'center', width: '100%'}}>
                        <PaymentIcon sx={{mr: 1, color: 'primary.main'}}/>
                        <Typography variant="h5" sx={{flexGrow: 1}}>
                            Payment Information
                        </Typography>

                        {invoice && (
                            <Chip
                                label={payableAmount > 0 ? "Payment Pending" : "Fully Paid"}
                                color={payableAmount > 0 ? "warning" : "success"}
                                size="small"
                                sx={{mr: 2}}
                            />
                        )}
                    </Box>
                </AccordionSummary>

                <Divider/>

                <AccordionDetails>
                    {invoice ? (
                        <>
                            <PaymentSummary/>

                            {invoice.payments?.length > 0 && (
                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{mb: 3}}
                                >
                                    <Table sx={{minWidth: 700}} aria-label="payments table"
                                           size={isMobile ? "small" : "medium"}>
                                        <PaymentTableHeader/>
                                        <PaymentTableBody/>
                                        {!acceptance.referrer && <PaymentTableFooter/>}
                                    </Table>
                                </TableContainer>
                            )}

                            <ActionButtons/>
                        </>
                    ) : (
                        <NoInvoiceView/>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Modals */}
            {openAdd && (
                <AddPayment
                    open={openAdd}
                    onClose={handleAddPaymentClose}
                    initialData={payment}
                    max={maxPaymentAmount}
                    payers={payers}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {openCreateInvoice && (
                <CreateInvoiceForm
                    open={openCreateInvoice}
                    onClose={handleCreateInvoiceClose}
                    initialData={{
                        acceptance_id: acceptance.id,
                        owner_type: "patient",
                        owner_id: patient.id,
                        patient,
                        referrer: acceptance.referrer
                    }}
                />
            )}

            {openDelete && (
                <DeleteForm
                    title="Delete Payment"
                    openDelete={openDelete}
                    disAgreeCB={handleDeleteClose}
                    agreeCB={handleDeleteSuccess}
                />
            )}
        </>
    );
};

export default PaymentComponent;
