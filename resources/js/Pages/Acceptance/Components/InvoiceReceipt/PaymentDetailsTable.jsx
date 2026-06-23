import { Box, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Payments } from '@mui/icons-material';
import { SectionHeading, StyledTable, HeaderCell, SmallChip } from './styled';

const PaymentDetailsTable = ({ acceptance }) => {
    const payments = acceptance?.invoice?.payments || [];

    return (
        <>
            <SectionHeading>
                <Payments sx={{ mr: 0.5, fontSize: '0.75rem' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    Payment Details
                </Typography>
            </SectionHeading>

            <TableContainer component={Box} sx={{ mb: 1 }}>
                <StyledTable size="small" padding="none">
                    <TableHead>
                        <TableRow>
                            <HeaderCell>Method</HeaderCell>
                            <HeaderCell>Cashier</HeaderCell>
                            <HeaderCell align="right">Amount</HeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.length > 0 ? (
                            payments.map((payment, index) => (
                                <TableRow key={`payment-${payment.id}-${index}`}>
                                    <TableCell>
                                        <SmallChip
                                            label={payment.paymentMethod || ''}
                                            size="small"
                                            color={
                                                payment.paymentMethod === 'card'
                                                    ? 'info'
                                                    : 'default'
                                            }
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{payment.cashier?.name || ''}</TableCell>
                                    <TableCell align="right">
                                        {parseFloat(payment.price || 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No payment records
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </StyledTable>
            </TableContainer>
        </>
    );
};

export default PaymentDetailsTable;
