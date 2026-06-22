import { useMemo, useState, useCallback, useEffect } from 'react';
import {
    Accordion,
    AccordionDetails,
    Typography,
    Box,
    Chip,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import {
    ExpandMore as ExpandMoreIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { sum } from '@/Services/helper';
import AddPayment from '@/Pages/Acceptance/Components/AddPayment';
import CreateInvoiceForm from '@/Pages/Acceptance/Components/CreateInvoiceForm';
import DeleteForm from '@/Components/DeleteForm.jsx';
import { router } from '@inertiajs/react';
import { formatCurrency } from './Payment/constants';
import PaymentSummary from './Payment/PaymentSummary';
import PaymentsTable from './Payment/PaymentsTable';
import NoInvoiceView from './Payment/NoInvoiceView';
import ActionButtons from './Payment/ActionButtons';

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
    defaultExpanded = true,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State
    const [openAdd, setOpenAdd] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openCreateInvoice, setOpenCreateInvoice] = useState(false);

    // Memoized calculations
    const totalSum = useMemo(() => {
        const itemsTotal = sum(acceptanceItems, 'price');
        const itemsDiscount = sum(acceptanceItems, 'discount');
        const invoiceDiscount = invoice ? invoice.discount * 1 : 0;

        return itemsTotal - itemsDiscount - invoiceDiscount;
    }, [invoice, acceptanceItems]);

    const totalPayments = useMemo(() => {
        return invoice?.payments ? sum(invoice.payments, 'price') : 0;
    }, [invoice]);

    const payableAmount = useMemo(() => {
        return formatCurrency(totalSum - totalPayments);
    }, [totalSum, totalPayments]);

    const payers = useMemo(() => {
        const patientPayer = {
            type: 'patient',
            id: patient?.id,
            name: patient?.fullName,
        };

        if (invoice?.owner_id !== patient?.id && invoice?.owner_type !== 'patient') {
            return [
                patientPayer,
                {
                    type: 'referrer',
                    id: invoice?.owner_id,
                    name: invoice?.owner?.fullName,
                },
            ];
        }

        return [patientPayer];
    }, [patient, invoice]);

    const isMinPaymentMet = useMemo(() => {
        if (!invoice) return false;
        return totalPayments >= minAllowablePayment * totalSum * 0.01;
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
    const getInitialPaymentState = useCallback(
        () => ({
            price: invoice
                ? totalSum - (invoice?.payments ? sum(invoice.payments, 'price') : 0)
                : 0,
            information: {},
            invoice,
            payer: {
                type: acceptance.referrer ? 'referrer' : 'patient',
                id: acceptance.referrer ? acceptance.referrer.id : patient?.id,
                name: acceptance.referrer ? acceptance?.referrer?.fullName : patient?.fullName,
            },
        }),
        [invoice, totalSum, acceptance.referrer, patient],
    );

    const [payment, setPayment] = useState(getInitialPaymentState());

    useEffect(() => {
        setPayment(getInitialPaymentState());
    }, [getInitialPaymentState]);

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
            window.open(route('acceptances.print', acceptance.id), '_blank');
        } catch (error) {
            enqueueSnackbar('Failed to open print window', { variant: 'error' });
            console.error('Print error:', error);
        }
    }, [acceptance, enqueueSnackbar]);

    const handleEditPayment = useCallback(
        (paymentItem) => () => {
            setPayment({
                ...paymentItem,
                _method: 'put',
                invoice,
                payer: {
                    type: paymentItem.payer_type || (acceptance.referrer ? 'referrer' : 'patient'),
                    id:
                        paymentItem.payer_id ||
                        (acceptance.referrer ? acceptance.referrer.id : patient?.id),
                    name:
                        paymentItem.payer_name ||
                        (acceptance.referrer ? acceptance.referrer?.fullName : patient?.fullName),
                },
            });
            setOpenAdd(true);
        },
        [invoice, acceptance.referrer, patient],
    );

    const handleDelPayment = useCallback(
        (paymentItem) => () => {
            setPayment({
                ...paymentItem,
                _method: 'delete',
            });
            setOpenDelete(true);
        },
        [],
    );

    const handleDeleteClose = useCallback(() => {
        setOpenDelete(false);
        setPayment(getInitialPaymentState());
    }, [getInitialPaymentState]);

    const handleDeleteSuccess = useCallback(() => {
        router.post(
            route('payments.destroy', payment.id),
            { _method: 'delete' },
            { onFinish: handleDeleteClose },
        );
    }, [payment.id, handleDeleteClose]);

    const handlePaymentSuccess = useCallback(() => {
        setOpenAdd(false);
        enqueueSnackbar(status || 'Payment processed successfully', { variant: 'success' });
    }, [status, enqueueSnackbar]);

    return (
        <>
            <Accordion defaultExpanded={defaultExpanded}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="payment-information"
                    id="payment"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h5" sx={{ flexGrow: 1 }}>
                            Payment Information
                        </Typography>

                        {invoice && (
                            <Chip
                                label={payableAmount > 0 ? 'Payment Pending' : 'Fully Paid'}
                                color={payableAmount > 0 ? 'warning' : 'success'}
                                size="small"
                                sx={{ mr: 2 }}
                            />
                        )}
                    </Box>
                </AccordionSummary>

                <Divider />

                <AccordionDetails>
                    {invoice ? (
                        <>
                            <PaymentSummary
                                totalSum={totalSum}
                                totalPayments={totalPayments}
                                payableAmount={payableAmount}
                                invoice={invoice}
                                paymentProgress={paymentProgress}
                            />

                            {invoice.payments?.length > 0 && (
                                <PaymentsTable
                                    invoice={invoice}
                                    acceptance={acceptance}
                                    acceptanceItems={acceptanceItems}
                                    data={data}
                                    handleChange={handleChange}
                                    totalPayments={totalPayments}
                                    payableAmount={payableAmount}
                                    isMobile={isMobile}
                                    onEdit={handleEditPayment}
                                    onDelete={handleDelPayment}
                                />
                            )}

                            <ActionButtons
                                isPendingPayment={isPendingPayment}
                                isMinPaymentMet={isMinPaymentMet}
                                invoice={invoice}
                                onAddPayment={handleOpenAddPayment}
                                onPrintReceipt={handlePrintReceipt}
                            />
                        </>
                    ) : (
                        <NoInvoiceView
                            acceptanceItems={acceptanceItems}
                            data={data}
                            handleChange={handleChange}
                            totalSum={totalSum}
                            onCreateInvoice={handleCreateInvoice}
                        />
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
                        owner_type: 'patient',
                        owner_id: patient.id,
                        patient,
                        referrer: acceptance.referrer,
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
