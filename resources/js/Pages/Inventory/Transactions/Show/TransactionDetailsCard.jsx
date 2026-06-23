import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid, Typography } from '@mui/material';
import { STATUS_COLORS, TYPE_COLORS, InfoRow } from './constants';

const TransactionDetailsCard = ({ transaction, txStatus }) => (
    <Card sx={{ mb: 3 }}>
        <CardHeader
            title="Transaction Details"
            action={
                <Box sx={{ pt: 1, pr: 1, display: 'flex', gap: 0.5 }}>
                    <Chip
                        label={transaction.transaction_type?.replace('_', ' ')}
                        color={TYPE_COLORS[transaction.transaction_type] || 'default'}
                        size="small"
                        variant="outlined"
                    />
                    <Chip
                        label={txStatus?.replace('_', ' ')}
                        color={STATUS_COLORS[txStatus] || 'default'}
                        size="small"
                    />
                </Box>
            }
        />
        <CardContent>
            <Grid container spacing={0}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow label="Reference">{transaction.reference_number}</InfoRow>
                    <InfoRow label="Date">{transaction.transaction_date}</InfoRow>
                    <InfoRow label="Source Store">{transaction.store?.name}</InfoRow>
                    {transaction.destination_store && (
                        <InfoRow label="Destination">
                            {transaction.destination_store.name}
                        </InfoRow>
                    )}
                    {transaction.supplier && (
                        <InfoRow label="Supplier">{transaction.supplier.name}</InfoRow>
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow label="Requested By">{transaction.requested_by?.name}</InfoRow>
                    <InfoRow label="Approved By">{transaction.approved_by?.name}</InfoRow>
                    <InfoRow label="Total Value">
                        {transaction.total_value != null
                            ? Number(transaction.total_value).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                              })
                            : null}
                    </InfoRow>
                </Grid>
            </Grid>
            {transaction.notes && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                    >
                        Notes
                    </Typography>
                    <Typography variant="body2">{transaction.notes}</Typography>
                </>
            )}
        </CardContent>
    </Card>
);

export default TransactionDetailsCard;
