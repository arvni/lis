import { Box, Typography, Chip, Card, CardContent, LinearProgress } from '@mui/material';
import Grid from '@mui/material/Grid';

/**
 * Payment summary cards + progress bar
 */
const PaymentSummary = ({ totalSum, totalPayments, payableAmount, paymentProgress }) => {
    return (
        <>
            {/* Payment Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Total Amount
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {totalSum.toFixed(2)} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Amount Paid
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                {totalPayments.toFixed(2)} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Amount Due
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                color={payableAmount > 0 ? 'error.main' : 'success.main'}
                            >
                                {payableAmount > 0 ? payableAmount.toFixed(2) : '0.00'} OMR
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={1}>
                        <CardContent>
                            <Typography color="text.secondary" variant="body2">
                                Payment Status
                            </Typography>
                            <Chip
                                label={payableAmount > 0 ? 'Pending' : 'Paid'}
                                color={payableAmount > 0 ? 'warning' : 'success'}
                                sx={{ fontWeight: 'bold' }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Payment Progress */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Payment Progress</Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {paymentProgress.toFixed(0)}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={paymentProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                />
            </Box>
        </>
    );
};

export default PaymentSummary;
