import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

const SummaryCard = ({ label, children }) => (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography color="text.secondary" gutterBottom>
                    {label}
                </Typography>
                {children}
            </CardContent>
        </Card>
    </Grid>
);

const PaymentSummary = ({ totalSum, totalPayments, payableAmount, invoice, paymentProgress }) => (
    <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
            <SummaryCard label="Total Amount">
                <Typography variant="h5" fontWeight="bold">
                    {totalSum.toFixed(2)}
                </Typography>
            </SummaryCard>

            <SummaryCard label="Amount Paid">
                <Typography variant="h5" fontWeight="bold" color="success.main">
                    {totalPayments.toFixed(2)}
                </Typography>
            </SummaryCard>

            <SummaryCard label="Amount Due">
                <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={payableAmount > 0 ? 'error.main' : 'success.main'}
                >
                    {payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'}
                </Typography>
            </SummaryCard>

            <SummaryCard label="Payment Status">
                <Chip
                    label={payableAmount > 0 ? 'Pending' : 'Paid'}
                    color={payableAmount > 0 ? 'warning' : 'success'}
                    sx={{ fontWeight: 'bold' }}
                />
            </SummaryCard>
        </Grid>

        {invoice && (
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Payment Progress</Typography>
                    <Typography fontWeight="medium">{paymentProgress.toFixed(0)}%</Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={paymentProgress}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
            </Box>
        )}
    </Box>
);

export default PaymentSummary;
