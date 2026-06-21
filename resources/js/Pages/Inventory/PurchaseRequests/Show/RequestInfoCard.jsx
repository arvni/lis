import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid, Typography } from '@mui/material';
import { InfoRow, FileChip } from './InfoRow';
import { STATUS_COLORS } from './constants';

const RequestInfoCard = ({ pr, poDocument, paymentDocument, onViewDoc }) => (
    <Card sx={{ mb: 3 }}>
        <CardHeader
            title="Request Info"
            action={
                <Box sx={{ pt: 1, pr: 1, display: 'flex', gap: 0.5 }}>
                    <Chip
                        label={pr.urgency}
                        size="small"
                        color={pr.urgency === 'URGENT' ? 'error' : 'default'}
                        variant="outlined"
                    />
                    <Chip
                        label={(pr.status ?? '').replace(/_/g, ' ')}
                        size="small"
                        color={STATUS_COLORS[pr.status] || 'default'}
                    />
                </Box>
            }
        />
        <CardContent>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow label="Requested By">{pr.requested_by?.name}</InfoRow>
                    <InfoRow label="Approved By">{pr.approved_by?.name}</InfoRow>
                    <InfoRow label="Workflow">{pr.workflow_template?.name ?? '— none —'}</InfoRow>
                    <InfoRow label="Supplier">{pr.supplier?.name}</InfoRow>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow label="PO Number">{pr.po_number}</InfoRow>
                    <InfoRow
                        label="PO File"
                        chipContent={
                            poDocument ? (
                                <FileChip document={poDocument} onClick={() => onViewDoc(poDocument)} />
                            ) : null
                        }
                    />
                    <InfoRow label="Payment Date">{pr.payment_date}</InfoRow>
                    <InfoRow label="Payment Ref">{pr.payment_reference}</InfoRow>
                    <InfoRow
                        label="Payment File"
                        chipContent={
                            paymentDocument ? (
                                <FileChip
                                    document={paymentDocument}
                                    onClick={() => onViewDoc(paymentDocument)}
                                />
                            ) : null
                        }
                    />
                    <InfoRow label="Shipment Date">{pr.shipment_date}</InfoRow>
                    <InfoRow label="Tracking #">{pr.tracking_number}</InfoRow>
                    <InfoRow label="Expected ETA">{pr.expected_delivery_date}</InfoRow>
                </Grid>
            </Grid>
            {pr.notes && (
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
                    <Typography variant="body2">{pr.notes}</Typography>
                </>
            )}
        </CardContent>
    </Card>
);

export default RequestInfoCard;
