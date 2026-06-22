import { Alert, Divider, Grid, Paper, Typography } from '@mui/material';
import { formatMoney } from './constants';
import SummaryRow from './SummaryRow';

const TotalsSummary = ({ totals, paidSum, balance }) => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
            <Alert
                severity={balance > 0 ? 'warning' : 'success'}
                variant="outlined"
                sx={{ borderRadius: 2, height: '100%' }}
            >
                <Typography variant="body2">
                    {balance > 0
                        ? `Outstanding balance: ${formatMoney(balance)} OMR`
                        : 'Invoice fully paid.'}
                </Typography>
            </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <SummaryRow label="Subtotal" value={`${formatMoney(totals.subtotal)} OMR`} />
                <SummaryRow
                    label="Discount"
                    value={`−${formatMoney(totals.discount)} OMR`}
                    valueColor="success.main"
                />
                <Divider sx={{ my: 1 }} />
                <SummaryRow
                    label="Net Amount"
                    value={`${formatMoney(totals.net)} OMR`}
                    valueColor="primary.main"
                    strong
                />
                <SummaryRow label="Paid" value={`${formatMoney(paidSum)} OMR`} />
                <SummaryRow
                    label="Balance"
                    value={`${formatMoney(balance)} OMR`}
                    valueColor={balance > 0 ? 'warning.main' : 'success.main'}
                    strong
                />
            </Paper>
        </Grid>
    </Grid>
);

export default TotalsSummary;
