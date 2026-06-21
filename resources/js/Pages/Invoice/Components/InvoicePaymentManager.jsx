import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
    mockInvoice,
    mockAcceptanceItems,
    mockPayers,
    formatCurrency,
    sumAcceptanceItems,
    sumPayments,
} from './InvoicePaymentManager/constants.jsx';
import PaymentDialog from './InvoicePaymentManager/PaymentDialog.jsx';
import PaymentSummary from './InvoicePaymentManager/PaymentSummary.jsx';
import PaymentsTable from './InvoicePaymentManager/PaymentsTable.jsx';

/**
 * Invoice Payment Manager Component
 */
const InvoicePaymentManager = ({
    invoice = mockInvoice,
    acceptanceItems = mockAcceptanceItems,
    payers = mockPayers,
    onPaymentChange,
}) => {
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Calculations
    const totalSum = useMemo(() => {
        const itemsTotal = sumAcceptanceItems(acceptanceItems, 'price');
        const itemsDiscount = sumAcceptanceItems(acceptanceItems, 'discount');
        const invoiceDiscount = invoice?.discount || 0;
        return itemsTotal - itemsDiscount - invoiceDiscount;
    }, [acceptanceItems, invoice?.discount]);

    const totalPayments = useMemo(() => {
        return invoice?.payments ? sumPayments(invoice.payments, 'price') : 0;
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
        // Mock success
        if (onPaymentChange) {
            onPaymentChange(paymentData);
        }

        setPaymentDialogOpen(false);
        setSelectedPayment(null);
    };

    const handleDeletePayment = async (paymentId) => {
        // Mock success
        if (onPaymentChange) {
            onPaymentChange({ id: paymentId, _method: 'delete' });
        }

        setPaymentDialogOpen(false);
        setSelectedPayment(null);
    };

    return (
        <Box>
            <PaymentSummary
                totalSum={totalSum}
                totalPayments={totalPayments}
                payableAmount={payableAmount}
                paymentProgress={paymentProgress}
            />

            {/* Add Payment Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddPayment}
                    disabled={payableAmount <= 0}
                >
                    Add Payment
                </Button>
            </Box>

            <PaymentsTable
                payments={invoice?.payments}
                totalPayments={totalPayments}
                payableAmount={payableAmount}
                onEditPayment={handleEditPayment}
            />

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
