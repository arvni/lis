import React, { useEffect, useRef } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import ReportDaysInput from '@/Pages/Acceptance/Components/ReportDaysInput.jsx';
import { InvoiceContainer, ReceiptBadge, InvoiceFooter } from './InvoiceReceipt/styled';
import { computeTotals, computeReportDays } from './InvoiceReceipt/helpers';
import ReceiptHeader from './InvoiceReceipt/ReceiptHeader';
import PatientInfo from './InvoiceReceipt/PatientInfo';
import TestDetailsTable from './InvoiceReceipt/TestDetailsTable';
import PaymentDetailsTable from './InvoiceReceipt/PaymentDetailsTable';
import TotalsTable from './InvoiceReceipt/TotalsTable';

const OptimizedInvoiceReceipt = ({ acceptance, onPrint, showLogo }) => {
    const printRef = useRef(null);

    const { subtotal, totalDiscount, totalPayment, finalTotal } = computeTotals(acceptance);
    const reportDays = computeReportDays(acceptance);

    // Print functionality
    useEffect(() => {
        if (onPrint) {
            window.print();
        }
    }, [onPrint]);

    return (
        <>
            <Box sx={{ position: 'relative' }}>
                <ReceiptBadge>Receipt</ReceiptBadge>

                <InvoiceContainer elevation={3} ref={printRef}>
                    <ReceiptHeader acceptance={acceptance} showLogo={showLogo} />

                    <Divider sx={{ my: 0.5 }} />

                    <PatientInfo acceptance={acceptance} />

                    <TestDetailsTable acceptance={acceptance} />

                    <PaymentDetailsTable acceptance={acceptance} />

                    <TotalsTable
                        subtotal={subtotal}
                        totalDiscount={totalDiscount}
                        totalPayment={totalPayment}
                        finalTotal={finalTotal}
                    />

                    <Box
                        sx={{
                            mt: 1,
                            p: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <AccessTime color="primary" sx={{ mr: 1, fontSize: '0.75rem' }} />
                        <ReportDaysInput initialDays={reportDays} />
                    </Box>

                    <InvoiceFooter>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                            Thank you for choosing Bion Genetic Laboratory.
                        </Typography>
                    </InvoiceFooter>
                </InvoiceContainer>
            </Box>
        </>
    );
};

export default OptimizedInvoiceReceipt;
