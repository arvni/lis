import {
    Box,
    IconButton,
    Input,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {
    Remove as RemoveIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import { sum } from '@/Services/helper';
import { PAYMENT_METHOD_ICONS, PAYMENT_METHOD_LABELS } from './constants';

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
            <TableCell align="center" width="15%" aria-label="Actions">
                Actions
            </TableCell>
        </TableRow>
    </TableHead>
);

const PaymentTableBody = ({ invoice, onEdit, onDelete }) => (
    <TableBody>
        {invoice.payments?.length > 0 ? (
            invoice.payments.map((item, index) => (
                <TableRow
                    key={`payment-${item.id}`}
                    sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' } }}
                >
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {PAYMENT_METHOD_ICONS[item.paymentMethod] || <PaymentIcon />}
                            <Typography sx={{ ml: 1 }}>
                                {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod}
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
                            onClick={onEdit(item)}
                            aria-label={`Edit payment ${index + 1}`}
                            size="small"
                        >
                            <EditIcon color="warning" />
                        </IconButton>
                        <IconButton
                            onClick={onDelete(item)}
                            aria-label={`Delete payment ${index + 1}`}
                            size="small"
                        >
                            <DeleteIcon color="error" />
                        </IconButton>
                    </TableCell>
                </TableRow>
            ))
        ) : (
            <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No payments recorded yet</Typography>
                </TableCell>
            </TableRow>
        )}
    </TableBody>
);

const PaymentTableFooter = ({
    acceptanceItems,
    invoice,
    data,
    handleChange,
    totalPayments,
    payableAmount,
}) => (
    <TableFooter>
        <TableRow>
            <TableCell colSpan={2} />
            <TableCell align="left">
                <Typography fontWeight="bold">Total:</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography fontWeight="bold">{sum(acceptanceItems, 'price').toFixed(2)}</Typography>
            </TableCell>
            <TableCell align="left">
                <Typography variant="caption">OMR</Typography>
            </TableCell>
            <TableCell />
        </TableRow>
        <TableRow>
            <TableCell colSpan={2} />
            <TableCell align="left">
                <Typography fontWeight="bold">Item Discounts:</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography fontWeight="bold" color="error">
                    <RemoveIcon fontSize="small" />
                    {sum(acceptanceItems, 'discount').toFixed(2)}
                </Typography>
            </TableCell>
            <TableCell align="left">
                <Typography variant="caption">OMR</Typography>
            </TableCell>
            <TableCell />
        </TableRow>
        <TableRow>
            <TableCell colSpan={2} />
            <TableCell align="left">
                <Typography fontWeight="bold">Additional Discount:</Typography>
            </TableCell>
            <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <RemoveIcon fontSize="small" color="error" />
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
                            max={sum(acceptanceItems, 'price') - sum(acceptanceItems, 'discount')}
                            slotProps={{ htmlInput: { style: { textAlign: 'right' } } }}
                            sx={{ width: 80 }}
                        />
                    )}
                </Box>
            </TableCell>
            <TableCell align="left">
                <Typography variant="caption">OMR</Typography>
            </TableCell>
            <TableCell />
        </TableRow>
        <TableRow>
            <TableCell colSpan={2} />
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
            <TableCell />
        </TableRow>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell colSpan={2} />
            <TableCell align="left">
                <Typography variant="h6" fontWeight="bold">
                    Payable Amount:
                </Typography>
            </TableCell>
            <TableCell align="right">
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={payableAmount > 0 ? 'error.main' : 'success.main'}
                >
                    {payableAmount.toFixed(2)}
                </Typography>
            </TableCell>
            <TableCell align="left">
                <Typography variant="caption">OMR</Typography>
            </TableCell>
            <TableCell />
        </TableRow>
    </TableFooter>
);

const PaymentsTable = ({
    invoice,
    acceptance,
    acceptanceItems,
    data,
    handleChange,
    totalPayments,
    payableAmount,
    isMobile,
    onEdit,
    onDelete,
}) => (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table
            sx={{ minWidth: 700 }}
            aria-label="payments table"
            size={isMobile ? 'small' : 'medium'}
        >
            <PaymentTableHeader />
            <PaymentTableBody invoice={invoice} onEdit={onEdit} onDelete={onDelete} />
            {!acceptance.referrer && (
                <PaymentTableFooter
                    acceptanceItems={acceptanceItems}
                    invoice={invoice}
                    data={data}
                    handleChange={handleChange}
                    totalPayments={totalPayments}
                    payableAmount={payableAmount}
                />
            )}
        </Table>
    </TableContainer>
);

export default PaymentsTable;
