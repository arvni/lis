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
    useTheme,
    alpha,
    TableFooter,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Person,
    Business,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import { PAYMENT_METHOD_ICONS } from './constants.jsx';

/**
 * Payments table with totals footer
 */
const PaymentsTable = ({ payments, totalPayments, payableAmount, onEditPayment }) => {
    const theme = useTheme();

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
                    {payments?.length > 0 ? (
                        payments.map((payment, index) => (
                            <TableRow
                                key={payment.id}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                    },
                                }}
                            >
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {PAYMENT_METHOD_ICONS[payment.paymentMethod] || (
                                            <PaymentIcon />
                                        )}
                                        <Typography variant="body2">
                                            {payment.paymentMethod.charAt(0).toUpperCase() +
                                                payment.paymentMethod.slice(1)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight="medium">
                                        {parseFloat(payment.price).toFixed(2)} OMR
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {payment?.payer_type === 'patient' ? (
                                            <Person fontSize="small" />
                                        ) : (
                                            <Business fontSize="small" />
                                        )}
                                        <Typography variant="body2">
                                            {payment.payer.fullName || payment.payer.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{payment?.cashier?.name}</Typography>
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
                                            onClick={() => onEditPayment(payment)}
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">
                                    No payments recorded yet
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
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
                        <TableCell colSpan={4} />
                    </TableRow>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                        <TableCell colSpan={2}>
                            <Typography variant="h6" fontWeight="bold">
                                Remaining Balance:
                            </Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={payableAmount > 0 ? 'error.main' : 'success.main'}
                            >
                                {payableAmount.toFixed(2)} OMR
                            </Typography>
                        </TableCell>
                        <TableCell colSpan={4} />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
};

export default PaymentsTable;
